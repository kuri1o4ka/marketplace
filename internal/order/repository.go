package order

import (
	"context"
	"errors"

	"github.com/jackc/pgx/v5/pgxpool"
)

type Repository interface {
	Checkout(ctx context.Context, buyerID int64) ([]int64, error)
	GetOrdersByBuyer(ctx context.Context, buyerID int64) ([]OrderResponse, error)
	GetOrderByID(ctx context.Context, orderID, userID int64) (*OrderResponse, error)
}

type pgRepository struct {
	db *pgxpool.Pool
}

func NewRepository(db *pgxpool.Pool) Repository {
	return &pgRepository{db: db}
}

func (r *pgRepository) Checkout(ctx context.Context, buyerID int64) ([]int64, error) {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)

	var balance float64
	err = tx.QueryRow(ctx, "SELECT balance FROM users WHERE id = $1 FOR UPDATE", buyerID).Scan(&balance)
	if err != nil {
		return nil, errors.New("user not found")
	}

	rows, err := tx.Query(ctx, `
		SELECT ci.listing_id, l.price, l.seller_id 
		FROM cart_items ci
		JOIN carts c ON ci.cart_id = c.id
		JOIN listings l ON ci.listing_id = l.id
		WHERE c.user_id = $1 AND l.status = 'active'
		FOR UPDATE OF l
	`, buyerID)
	if err != nil {
		return nil, err
	}

	type cartItem struct {
		ListingID int64
		Price     float64
		SellerID  int64
	}
	var items []cartItem
	totalSum := 0.0

	for rows.Next() {
		var i cartItem
		if err := rows.Scan(&i.ListingID, &i.Price, &i.SellerID); err != nil {
			rows.Close()
			return nil, err
		}
		items = append(items, i)
		totalSum += i.Price
	}
	rows.Close()

	if len(items) == 0 {
		return nil, errors.New("cart is empty or items unavailable")
	}
	if balance < totalSum {
		return nil, errors.New("insufficient funds")
	}

	sellersMap := make(map[int64][]cartItem)
	for _, item := range items {
		sellersMap[item.SellerID] = append(sellersMap[item.SellerID], item)
	}

	var orderIDs []int64

	for sellerID, sellerItems := range sellersMap {
		sellerTotal := 0.0
		for _, it := range sellerItems {
			sellerTotal += it.Price
		}

		var orderID int64
		err = tx.QueryRow(ctx, `
			INSERT INTO orders (buyer_id, seller_id, total, status) 
			VALUES ($1, $2, $3, 'escrow_held') RETURNING id
		`, buyerID, sellerID, sellerTotal).Scan(&orderID)
		if err != nil {
			return nil, err
		}
		orderIDs = append(orderIDs, orderID)

		for _, it := range sellerItems {
			_, err = tx.Exec(ctx, `
				INSERT INTO order_items (order_id, listing_id, price) 
				VALUES ($1, $2, $3)
			`, orderID, it.ListingID, it.Price)
			if err != nil {
				return nil, err
			}

			_, err = tx.Exec(ctx, "UPDATE listings SET status = 'sold' WHERE id = $1", it.ListingID)
			if err != nil {
				return nil, err
			}
		}

		_, err = tx.Exec(ctx, `
			INSERT INTO order_events (order_id, to_status) 
			VALUES ($1, 'escrow_held')
		`, orderID)
		if err != nil {
			return nil, err
		}
	}

	_, err = tx.Exec(ctx, "UPDATE users SET balance = balance - $1 WHERE id = $2", totalSum, buyerID)
	if err != nil {
		return nil, err
	}

	_, err = tx.Exec(ctx, `
		INSERT INTO wallet_transactions (user_id, order_id, kind, amount) 
		VALUES ($1, $2, 'escrow_hold', $3)
	`, buyerID, orderIDs[0], -totalSum)
	if err != nil {
		return nil, err
	}

	_, err = tx.Exec(ctx, "DELETE FROM cart_items WHERE cart_id = (SELECT id FROM carts WHERE user_id = $1)", buyerID)
	if err != nil {
		return nil, err
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}

	return orderIDs, nil
}

func (r *pgRepository) GetOrdersByBuyer(ctx context.Context, buyerID int64) ([]OrderResponse, error) {
	query := `
		SELECT id, seller_id, total, status, created_at 
		FROM orders 
		WHERE buyer_id = $1 
		ORDER BY created_at DESC
	`
	rows, err := r.db.Query(ctx, query, buyerID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var orders []OrderResponse
	for rows.Next() {
		var o OrderResponse
		err := rows.Scan(&o.ID, &o.SellerID, &o.Total, &o.Status, &o.CreatedAt)
		if err != nil {
			return nil, err
		}
		orders = append(orders, o)
	}
	return orders, nil
}

func (r *pgRepository) GetOrderByID(ctx context.Context, orderID, userID int64) (*OrderResponse, error) {
	var o OrderResponse
	err := r.db.QueryRow(ctx, `
		SELECT id, seller_id, total, status, created_at 
		FROM orders 
		WHERE id = $1 AND (buyer_id = $2 OR seller_id = $2)
	`, orderID, userID).Scan(&o.ID, &o.SellerID, &o.Total, &o.Status, &o.CreatedAt)

	if err != nil {
		return nil, err
	}

	rows, _ := r.db.Query(ctx, `
		SELECT oi.listing_id, l.title, oi.price 
		FROM order_items oi
		JOIN listings l ON oi.listing_id = l.id
		WHERE oi.order_id = $1
	`, orderID)
	defer rows.Close()

	for rows.Next() {
		var item OrderItemResponse
		rows.Scan(&item.ListingID, &item.Title, &item.Price)
		o.Items = append(o.Items, item)
	}

	return &o, nil
}
