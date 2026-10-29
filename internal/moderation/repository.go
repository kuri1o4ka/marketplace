package moderation

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"
)

type Repository interface {
	GetPending(ctx context.Context) ([]PendingListingResponse, error)
	Approve(ctx context.Context, listingID, moderatorID int64) error
	Reject(ctx context.Context, listingID, moderatorID int64, comment string) error
}

type pgRepository struct {
	db *pgxpool.Pool
}

func NewRepository(db *pgxpool.Pool) Repository {
	return &pgRepository{db: db}
}

func (r *pgRepository) GetPending(ctx context.Context) ([]PendingListingResponse, error) {
	query := `
		SELECT l.id, l.title, l.price, u.display_name, l.created_at
		FROM listings l
		JOIN users u ON l.seller_id = u.id
		WHERE l.status = 'on_moderation'
		ORDER BY l.created_at ASC
	`
	rows, err := r.db.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var result []PendingListingResponse
	for rows.Next() {
		var p PendingListingResponse
		err := rows.Scan(&p.ID, &p.Title, &p.Price, &p.SellerName, &p.CreatedAt)
		if err != nil {
			return nil, err
		}
		result = append(result, p)
	}
	return result, nil
}

func (r *pgRepository) Approve(ctx context.Context, listingID, moderatorID int64) error {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	_, err = tx.Exec(ctx, `
		UPDATE listings 
		SET status = 'active', published_at = now(), updated_at = now()
		WHERE id = $1 AND status = 'on_moderation'
	`, listingID)
	if err != nil {
		return err
	}

	_, err = tx.Exec(ctx, `
		INSERT INTO moderation_reviews (listing_id, moderator_id, decision)
		VALUES ($1, $2, 'approved')
	`, listingID, moderatorID)
	if err != nil {
		return err
	}

	return tx.Commit(ctx)
}

func (r *pgRepository) Reject(ctx context.Context, listingID, moderatorID int64, comment string) error {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	_, err = tx.Exec(ctx, `
		UPDATE listings 
		SET status = 'rejected', updated_at = now()
		WHERE id = $1 AND status = 'on_moderation'
	`, listingID)
	if err != nil {
		return err
	}

	_, err = tx.Exec(ctx, `
		INSERT INTO moderation_reviews (listing_id, moderator_id, decision, comment)
		VALUES ($1, $2, 'rejected', $3)
	`, listingID, moderatorID, comment)
	if err != nil {
		return err
	}

	return tx.Commit(ctx)
}
