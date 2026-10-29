package cart

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"
)

type Repository interface {
	GetOrCreateCart(ctx context.Context, userID int64) (int64, error)
	GetCartItems(ctx context.Context, cartID int64) ([]CartItemResponse, error)
	AddItem(ctx context.Context, cartID, listingID int64) error
	RemoveItem(ctx context.Context, cartID, listingID int64) error
	ClearCart(ctx context.Context, cartID int64) error
	CheckListing(ctx context.Context, listingID int64) (int64, string, error)
}

type pgRepository struct {
	db *pgxpool.Pool
}

func NewRepository(db *pgxpool.Pool) Repository {
	return &pgRepository{db: db}
}

func (r *pgRepository) GetOrCreateCart(ctx context.Context, userID int64) (int64, error) {
	var cartID int64
	err := r.db.QueryRow(ctx, "SELECT id FROM carts WHERE user_id = $1", userID).Scan(&cartID)
	if err == nil {
		return cartID, nil
	}

	err = r.db.QueryRow(ctx, "INSERT INTO carts (user_id) VALUES ($1) RETURNING id", userID).Scan(&cartID)
	return cartID, err
}

func (r *pgRepository) GetCartItems(ctx context.Context, cartID int64) ([]CartItemResponse, error) {
	query := `
		SELECT 
			ci.id, l.id, l.title, l.price,
			COALESCE(img.storage_key, '') as cover_image
		FROM cart_items ci
		JOIN listings l ON ci.listing_id = l.id
		LEFT JOIN LATERAL (
			SELECT storage_key FROM listing_images 
			WHERE listing_id = l.id ORDER BY position ASC LIMIT 1
		) img ON true
		WHERE ci.cart_id = $1
		ORDER BY ci.added_at DESC
	`
	rows, err := r.db.Query(ctx, query, cartID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []CartItemResponse
	for rows.Next() {
		var i CartItemResponse
		err := rows.Scan(&i.ItemID, &i.ListingID, &i.Title, &i.Price, &i.CoverImage)
		if err != nil {
			return nil, err
		}
		items = append(items, i)
	}
	return items, nil
}

func (r *pgRepository) AddItem(ctx context.Context, cartID, listingID int64) error {
	_, err := r.db.Exec(ctx, `
		INSERT INTO cart_items (cart_id, listing_id) 
		VALUES ($1, $2)
		ON CONFLICT (cart_id, listing_id) DO NOTHING
	`, cartID, listingID)
	return err
}

func (r *pgRepository) RemoveItem(ctx context.Context, cartID, listingID int64) error {
	_, err := r.db.Exec(ctx, "DELETE FROM cart_items WHERE cart_id = $1 AND listing_id = $2", cartID, listingID)
	return err
}

func (r *pgRepository) ClearCart(ctx context.Context, cartID int64) error {
	_, err := r.db.Exec(ctx, "DELETE FROM cart_items WHERE cart_id = $1", cartID)
	return err
}

func (r *pgRepository) CheckListing(ctx context.Context, listingID int64) (int64, string, error) {
	var sellerID int64
	var status string
	err := r.db.QueryRow(ctx, "SELECT seller_id, status FROM listings WHERE id = $1", listingID).Scan(&sellerID, &status)
	return sellerID, status, err
}
