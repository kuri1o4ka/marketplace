package listing

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"
)

type Repository interface {
	GetAll(ctx context.Context, limit, offset int) ([]ListingResponse, error)
	GetByID(ctx context.Context, id int64) (*ListingDetailResponse, error)
	Create(ctx context.Context, listing *Listing, imageURLs []string) (int64, error)
}

type pgRepository struct {
	db *pgxpool.Pool
}

func NewRepository(db *pgxpool.Pool) Repository {
	return &pgRepository{db: db}
}

func (r *pgRepository) GetAll(ctx context.Context, limit, offset int) ([]ListingResponse, error) {
	query := `
		SELECT 
			l.id, l.title, l.price, l.sale_type,
			COALESCE(c.name, 'Без категории') as category,
			COALESCE(b.name, 'No Brand') as brand,
			COALESCE(img.storage_key, '') as cover_image,
			u.display_name as seller
		FROM listings l
		LEFT JOIN categories c ON l.category_id = c.id
		LEFT JOIN brands b ON l.brand_id = b.id
		JOIN users u ON l.seller_id = u.id
		-- Магия Postgres: берем только 1 картинку с position = 0
		LEFT JOIN LATERAL (
			SELECT storage_key FROM listing_images 
			WHERE listing_id = l.id ORDER BY position ASC LIMIT 1
		) img ON true
		WHERE l.status = 'active'
		ORDER BY l.id DESC LIMIT $1 OFFSET $2
	`
	rows, err := r.db.Query(ctx, query, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var result []ListingResponse
	for rows.Next() {
		var l ListingResponse
		err := rows.Scan(
			&l.ID, &l.Title, &l.Price, &l.SaleType,
			&l.Category, &l.Brand, &l.CoverImage, &l.SellerName,
		)
		if err != nil {
			return nil, err
		}
		result = append(result, l)
	}
	return result, nil
}

func (r *pgRepository) GetByID(ctx context.Context, id int64) (*ListingDetailResponse, error) {
	query := `
		SELECT 
			l.id, l.title, COALESCE(l.description, ''), l.price, l.sale_type,
			COALESCE(c.name, ''), COALESCE(b.name, ''),
			COALESCE(l.size, ''), COALESCE(l.color, ''), COALESCE(l.condition, ''),
			u.display_name
		FROM listings l
		LEFT JOIN categories c ON l.category_id = c.id
		LEFT JOIN brands b ON l.brand_id = b.id
		JOIN users u ON l.seller_id = u.id
		WHERE l.id = $1
	`
	var l ListingDetailResponse
	err := r.db.QueryRow(ctx, query, id).Scan(
		&l.ID, &l.Title, &l.Description, &l.Price, &l.SaleType,
		&l.Category, &l.Brand, &l.Size, &l.Color, &l.Condition, &l.SellerName,
	)
	if err != nil {
		return nil, err
	}

	rows, _ := r.db.Query(ctx, "SELECT storage_key FROM listing_images WHERE listing_id = $1 ORDER BY position ASC", id)
	defer rows.Close()
	for rows.Next() {
		var img string
		rows.Scan(&img)
		l.Images = append(l.Images, img)
	}

	return &l, nil
}

func (r *pgRepository) Create(ctx context.Context, l *Listing, imageURLs []string) (int64, error) {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return 0, err
	}
	defer tx.Rollback(ctx)

	var id int64
	query := `
		INSERT INTO listings (
			seller_id, title, description, price, 
			category_id, brand_id, collection_id, 
			size, color, condition, sale_type, status
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'on_moderation'
		) RETURNING id
	`
	err = tx.QueryRow(ctx, query,
		l.SellerID, l.Title, l.Description, l.Price,
		l.CategoryID, l.BrandID, l.CollectionID,
		l.Size, l.Color, l.Condition, l.SaleType,
	).Scan(&id)

	if err != nil {
		return 0, err
	}

	for i, url := range imageURLs {
		_, err = tx.Exec(ctx, `
			INSERT INTO listing_images (listing_id, storage_key, position) 
			VALUES ($1, $2, $3)
		`, id, url, i)

		if err != nil {
			return 0, err
		}
	}

	if err := tx.Commit(ctx); err != nil {
		return 0, err
	}

	return id, nil
}
