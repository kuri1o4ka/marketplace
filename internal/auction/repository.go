package auction

import (
	"context"
	"errors"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

type Repository interface {
	Create(ctx context.Context, sellerID int64, req CreateAuctionRequest) (int64, error)
	GetAll(ctx context.Context) ([]AuctionResponse, error)
	GetByID(ctx context.Context, id int64) (*AuctionDetailResponse, error)
	PlaceBid(ctx context.Context, auctionID, bidderID int64, amount float64, idempotencyKey string) error
}

type pgRepository struct {
	db *pgxpool.Pool
}

func NewRepository(db *pgxpool.Pool) Repository {
	return &pgRepository{db: db}
}

func (r *pgRepository) Create(ctx context.Context, sellerID int64, req CreateAuctionRequest) (int64, error) {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return 0, err
	}
	defer tx.Rollback(ctx)

	var realSellerID int64
	err = tx.QueryRow(ctx, "SELECT seller_id FROM listings WHERE id = $1 FOR UPDATE", req.ListingID).Scan(&realSellerID)
	if err != nil {
		return 0, errors.New("listing not found")
	}
	if realSellerID != sellerID {
		return 0, errors.New("not your listing")
	}

	_, err = tx.Exec(ctx, "UPDATE listings SET sale_type = 'auction' WHERE id = $1", req.ListingID)
	if err != nil {
		return 0, err
	}

	var id int64
	err = tx.QueryRow(ctx, `
		INSERT INTO auctions (listing_id, start_price, current_price, minimum_bid_increment, start_at, end_at, status)
		VALUES ($1, $2, $2, $3, $4, $5, 'active')
		RETURNING id
	`, req.ListingID, req.StartPrice, req.MinimumBidIncrement, req.StartAt, req.EndAt).Scan(&id)
	if err != nil {
		return 0, err
	}

	if err := tx.Commit(ctx); err != nil {
		return 0, err
	}
	return id, nil
}

func (r *pgRepository) GetAll(ctx context.Context) ([]AuctionResponse, error) {
	query := `
		SELECT 
			a.id, a.listing_id, a.start_price, a.current_price, a.minimum_bid_increment,
			a.leader_id, a.bids_count, a.start_at, a.end_at, a.status, a.winner_id,
			l.title, COALESCE(img.storage_key, ''), l.seller_id
		FROM auctions a
		JOIN listings l ON a.listing_id = l.id
		LEFT JOIN LATERAL (
			SELECT storage_key FROM listing_images WHERE listing_id = l.id ORDER BY position ASC LIMIT 1
		) img ON true
		WHERE a.status IN ('active', 'pending')
		ORDER BY a.end_at ASC
	`
	rows, err := r.db.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var result []AuctionResponse
	for rows.Next() {
		var a AuctionResponse
		err := rows.Scan(
			&a.ID, &a.ListingID, &a.StartPrice, &a.CurrentPrice, &a.MinimumBidIncrement,
			&a.LeaderID, &a.BidsCount, &a.StartAt, &a.EndAt, &a.Status, &a.WinnerID,
			&a.Title, &a.CoverImage, &a.SellerID,
		)
		if err != nil {
			return nil, err
		}
		result = append(result, a)
	}
	return result, nil
}

func (r *pgRepository) GetByID(ctx context.Context, id int64) (*AuctionDetailResponse, error) {
	var a AuctionDetailResponse
	query := `
		SELECT 
			a.id, a.listing_id, a.start_price, a.current_price, a.minimum_bid_increment,
			a.leader_id, a.bids_count, a.start_at, a.end_at, a.status, a.winner_id,
			l.title, COALESCE(img.storage_key, ''), l.seller_id
		FROM auctions a
		JOIN listings l ON a.listing_id = l.id
		LEFT JOIN LATERAL (
			SELECT storage_key FROM listing_images WHERE listing_id = l.id ORDER BY position ASC LIMIT 1
		) img ON true
		WHERE a.id = $1
	`
	err := r.db.QueryRow(ctx, query, id).Scan(
		&a.ID, &a.ListingID, &a.StartPrice, &a.CurrentPrice, &a.MinimumBidIncrement,
		&a.LeaderID, &a.BidsCount, &a.StartAt, &a.EndAt, &a.Status, &a.WinnerID,
		&a.Title, &a.CoverImage, &a.SellerID,
	)
	if err != nil {
		return nil, err
	}

	rows, _ := r.db.Query(ctx, "SELECT id, auction_id, bidder_id, amount, idempotency_key, created_at FROM bids WHERE auction_id = $1 ORDER BY amount DESC", id)
	defer rows.Close()

	for rows.Next() {
		var b Bid
		rows.Scan(&b.ID, &b.AuctionID, &b.BidderID, &b.Amount, &b.IdempotencyKey, &b.CreatedAt)
		a.Bids = append(a.Bids, b)
	}
	return &a, nil
}

func (r *pgRepository) PlaceBid(ctx context.Context, auctionID, bidderID int64, amount float64, idempotencyKey string) error {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	var currentPrice, minIncrement float64
	var status string
	var endAt time.Time
	var sellerID int64

	err = tx.QueryRow(ctx, `
		SELECT a.current_price, a.minimum_bid_increment, a.status, a.end_at, l.seller_id
		FROM auctions a
		JOIN listings l ON a.listing_id = l.id
		WHERE a.id = $1
		FOR UPDATE OF a
	`, auctionID).Scan(&currentPrice, &minIncrement, &status, &endAt, &sellerID)
	if err != nil {
		return errors.New("auction not found")
	}

	if sellerID == bidderID {
		return errors.New("cannot bid on your own auction")
	}
	if status != "active" {
		return errors.New("auction is not active")
	}
	if time.Now().After(endAt) {
		return errors.New("auction has ended")
	}
	if amount < currentPrice+minIncrement {
		return errors.New("bid too low")
	}

	var exists bool
	err = tx.QueryRow(ctx, "SELECT EXISTS(SELECT 1 FROM bids WHERE idempotency_key = $1)", idempotencyKey).Scan(&exists)
	if err != nil {
		return err
	}
	if exists {
		return nil
	}

	_, err = tx.Exec(ctx, `
		INSERT INTO bids (auction_id, bidder_id, amount, idempotency_key) 
		VALUES ($1, $2, $3, $4)
	`, auctionID, bidderID, amount, idempotencyKey)
	if err != nil {
		return err
	}

	_, err = tx.Exec(ctx, `
		UPDATE auctions 
		SET current_price = $1, leader_id = $2, bids_count = bids_count + 1, updated_at = now() 
		WHERE id = $3
	`, amount, bidderID, auctionID)
	if err != nil {
		return err
	}

	return tx.Commit(ctx)
}
