package moderation

import (
	"context"

	"github.com/falsefeelings/internal/media"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Repository interface {
	GetPending(ctx context.Context) ([]PendingListingResponse, error)
	Approve(ctx context.Context, listingID, moderatorID int64) error
	Reject(ctx context.Context, listingID, moderatorID int64, comment string) error
}

type pgRepository struct {
	db   *pgxpool.Pool
	base *media.Resolver
}

func NewRepository(db *pgxpool.Pool, base *media.Resolver) Repository {
	return &pgRepository{db: db, base: base}
}

func (r *pgRepository) GetPending(ctx context.Context) ([]PendingListingResponse, error) {
	query := `
		SELECT l.id, l.title, l.price, u.display_name,
		       COALESCE(img.storage_key, ''), COALESCE(imgs.keys, '{}'::text[]), l.created_at
		FROM listings l
		JOIN users u ON l.seller_id = u.id
		LEFT JOIN LATERAL (
			SELECT storage_key FROM listing_images
			WHERE listing_id = l.id ORDER BY position ASC LIMIT 1
		) img ON true
		LEFT JOIN LATERAL (
			SELECT array_agg(storage_key ORDER BY position) AS keys
			FROM listing_images WHERE listing_id = l.id
		) imgs ON true
		WHERE l.status = 'on_moderation'
		ORDER BY l.created_at ASC
	`
	rows, err := r.db.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	result := make([]PendingListingResponse, 0)
	for rows.Next() {
		var p PendingListingResponse
		var images []string
		err := rows.Scan(&p.ID, &p.Title, &p.Price, &p.SellerName, &p.CoverImage, &images, &p.CreatedAt)
		if err != nil {
			return nil, err
		}
		p.CoverImage = r.base.URL(p.CoverImage)
		p.Images = make([]string, 0, len(images))
		for _, key := range images {
			p.Images = append(p.Images, r.base.URL(key))
		}
		result = append(result, p)
	}
	return result, rows.Err()
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
