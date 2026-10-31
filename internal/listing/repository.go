package listing

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"github.com/falsefeelings/internal/media"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Repository interface {
	GetAll(ctx context.Context, f CatalogFilter) ([]ListingResponse, int, error)
	GetByID(ctx context.Context, id int64) (*ListingDetailResponse, error)
	GetBySeller(ctx context.Context, sellerID int64) ([]MyListingResponse, error)
	Create(ctx context.Context, listing *Listing, imageURLs []string) (int64, error)
	Update(ctx context.Context, listingID, sellerID int64, listing *Listing, imageURLs []string) error
	GetCategories(ctx context.Context) ([]Category, error)
	GetBrands(ctx context.Context) ([]Brand, error)
}

type pgRepository struct {
	db   *pgxpool.Pool
	base *media.Resolver
}

func NewRepository(db *pgxpool.Pool, base *media.Resolver) Repository {
	return &pgRepository{db: db, base: base}
}

func (r *pgRepository) GetAll(ctx context.Context, f CatalogFilter) ([]ListingResponse, int, error) {
	var (
		where []string
		args  []any
	)
	where = append(where, "l.status = 'active'")

	add := func(cond string, v any) {
		args = append(args, v)
		where = append(where, fmt.Sprintf(cond, len(args)))
	}

	if f.Query != "" {
		args = append(args, "%"+f.Query+"%")
		where = append(where, fmt.Sprintf(
			"(l.title ILIKE $%d OR COALESCE(l.description, '') ILIKE $%d OR b.name ILIKE $%d OR c.name ILIKE $%d)",
			len(args), len(args), len(args), len(args),
		))
	}
	if f.CategoryID != nil {
		add("l.category_id = $%d", *f.CategoryID)
	}
	if f.BrandID != nil {
		add("l.brand_id = $%d", *f.BrandID)
	}
	if f.Condition != "" {
		add("l.condition = $%d", f.Condition)
	}
	if f.MinPrice != nil {
		add("l.price >= $%d", *f.MinPrice)
	}
	if f.MaxPrice != nil {
		add("l.price <= $%d", *f.MaxPrice)
	}
	if f.SaleType != "" {
		add("l.sale_type = $%d", f.SaleType)
	}

	orderBy := "l.id DESC"
	switch f.Sort {
	case "price_asc":
		orderBy = "l.price ASC, l.id DESC"
	case "price_desc":
		orderBy = "l.price DESC, l.id DESC"
	case "oldest":
		orderBy = "l.id ASC"
	}

	baseQuery := `
		FROM listings l
		LEFT JOIN categories c ON l.category_id = c.id
		LEFT JOIN brands b ON l.brand_id = b.id
		JOIN users u ON l.seller_id = u.id
		JOIN roles r ON r.id = u.role_id
		LEFT JOIN LATERAL (
			SELECT storage_key FROM listing_images 
			WHERE listing_id = l.id ORDER BY position ASC LIMIT 1
		) img ON true
		LEFT JOIN LATERAL (
			SELECT array_agg(storage_key ORDER BY position) AS keys
			FROM listing_images WHERE listing_id = l.id
		) imgs ON true
		WHERE ` + strings.Join(where, " AND ")

	var total int
	if err := r.db.QueryRow(ctx, "SELECT count(*) "+baseQuery, args...).Scan(&total); err != nil {
		return nil, 0, err
	}

	offset := (f.Page - 1) * f.Limit
	args = append(args, f.Limit, offset)
	query := `
		SELECT 
			l.id, l.title, l.price, l.sale_type,
			COALESCE(c.name, 'Без категории') as category,
			COALESCE(b.name, 'No Brand') as brand,
			COALESCE(img.storage_key, '') as cover_image,
			u.id, u.display_name, r.name as seller_role,
			COALESCE(imgs.keys, '{}'::text[]) as images
		` + baseQuery + fmt.Sprintf(`
		ORDER BY %s LIMIT $%d OFFSET $%d`, orderBy, len(args)-1, len(args))

	rows, err := r.db.Query(ctx, query, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var result []ListingResponse
	for rows.Next() {
		var l ListingResponse
		var images []string
		err := rows.Scan(
			&l.ID, &l.Title, &l.Price, &l.SaleType,
			&l.Category, &l.Brand, &l.CoverImage,
			&l.SellerID, &l.SellerName, &l.SellerRole, &images,
		)
		if err != nil {
			return nil, 0, err
		}
		l.CoverImage = r.base.URL(l.CoverImage)
		l.Images = make([]string, 0, len(images))
		for _, key := range images {
			l.Images = append(l.Images, r.base.URL(key))
		}
		result = append(result, l)
	}
	return result, total, rows.Err()
}

func (r *pgRepository) GetByID(ctx context.Context, id int64) (*ListingDetailResponse, error) {
	query := `
		SELECT 
			l.id, l.title, COALESCE(l.description, ''), l.price, l.sale_type,
			COALESCE(c.name, ''), COALESCE(b.name, ''),
			COALESCE(l.size, ''), COALESCE(l.color, ''), COALESCE(l.condition, ''),
			u.id, u.display_name, r.name, l.status, COALESCE(img.storage_key, '')
		FROM listings l
		LEFT JOIN categories c ON l.category_id = c.id
		LEFT JOIN brands b ON l.brand_id = b.id
		JOIN users u ON l.seller_id = u.id
		JOIN roles r ON r.id = u.role_id
		LEFT JOIN LATERAL (
			SELECT storage_key FROM listing_images
			WHERE listing_id = l.id ORDER BY position ASC LIMIT 1
		) img ON true
		WHERE l.id = $1
	`
	var l ListingDetailResponse
	err := r.db.QueryRow(ctx, query, id).Scan(
		&l.ID, &l.Title, &l.Description, &l.Price, &l.SaleType,
		&l.Category, &l.Brand, &l.Size, &l.Color, &l.Condition,
		&l.SellerID, &l.SellerName, &l.SellerRole, &l.Status, &l.CoverImage,
	)
	if err != nil {
		return nil, err
	}
	l.CoverImage = r.base.URL(l.CoverImage)
	l.Images = []string{}

	rows, err := r.db.Query(ctx, "SELECT storage_key FROM listing_images WHERE listing_id = $1 ORDER BY position ASC", id)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	for rows.Next() {
		var img string
		if err := rows.Scan(&img); err != nil {
			return nil, err
		}
		l.Images = append(l.Images, r.base.URL(img))
	}
	if len(l.Images) > 0 {
		l.CoverImage = l.Images[0]
	}
	return &l, rows.Err()
}

func (r *pgRepository) GetBySeller(ctx context.Context, sellerID int64) ([]MyListingResponse, error) {
	rows, err := r.db.Query(ctx, `
		SELECT
			l.id, l.title, l.price, l.sale_type,
			COALESCE(c.name, 'Без категории'),
			COALESCE(b.name, 'No Brand'),
			COALESCE(img.storage_key, ''),
			l.status, l.created_at
		FROM listings l
		LEFT JOIN categories c ON l.category_id = c.id
		LEFT JOIN brands b ON l.brand_id = b.id
		LEFT JOIN LATERAL (
			SELECT storage_key FROM listing_images
			WHERE listing_id = l.id ORDER BY position ASC LIMIT 1
		) img ON true
		WHERE l.seller_id = $1
		ORDER BY l.created_at DESC, l.id DESC
	`, sellerID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	result := make([]MyListingResponse, 0)
	for rows.Next() {
		var l MyListingResponse
		if err := rows.Scan(
			&l.ID, &l.Title, &l.Price, &l.SaleType,
			&l.Category, &l.Brand, &l.CoverImage, &l.Status, &l.CreatedAt,
		); err != nil {
			return nil, err
		}
		l.CoverImage = r.base.URL(l.CoverImage)
		result = append(result, l)
	}
	return result, rows.Err()
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

func (r *pgRepository) Update(ctx context.Context, listingID, sellerID int64, listing *Listing, imageURLs []string) error {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	var ownerID int64
	var status, saleType string
	err = tx.QueryRow(ctx, `
		SELECT seller_id, status, sale_type FROM listings WHERE id = $1 FOR UPDATE
	`, listingID).Scan(&ownerID, &status, &saleType)
	if err != nil {
		return errors.New("listing not found")
	}
	if ownerID != sellerID {
		return errors.New("not your listing")
	}
	if status == "sold" {
		return errors.New("cannot edit sold listing")
	}
	if saleType == "auction" {
		return errors.New("cannot edit auction listing")
	}

	_, err = tx.Exec(ctx, `
		UPDATE listings
		SET title = $2, description = $3, price = $4, category_id = $5, brand_id = $6,
		    size = $7, color = $8, condition = $9, status = 'on_moderation',
		    published_at = NULL, updated_at = now()
		WHERE id = $1
	`, listingID, listing.Title, listing.Description, listing.Price, listing.CategoryID,
		listing.BrandID, listing.Size, listing.Color, listing.Condition)
	if err != nil {
		return err
	}

	if len(imageURLs) > 0 {
		if _, err := tx.Exec(ctx, "DELETE FROM listing_images WHERE listing_id = $1", listingID); err != nil {
			return err
		}
		for i, url := range imageURLs {
			if _, err := tx.Exec(ctx, `
				INSERT INTO listing_images (listing_id, storage_key, position)
				VALUES ($1, $2, $3)
			`, listingID, url, i); err != nil {
				return err
			}
		}
	}

	return tx.Commit(ctx)
}

func (r *pgRepository) GetCategories(ctx context.Context) ([]Category, error) {
	rows, err := r.db.Query(ctx, "SELECT id, name FROM categories ORDER BY name")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	result := make([]Category, 0)
	for rows.Next() {
		var c Category
		if err := rows.Scan(&c.ID, &c.Name); err != nil {
			return nil, err
		}
		result = append(result, c)
	}
	return result, rows.Err()
}

func (r *pgRepository) GetBrands(ctx context.Context) ([]Brand, error) {
	rows, err := r.db.Query(ctx, "SELECT id, name FROM brands ORDER BY name")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	result := make([]Brand, 0)
	for rows.Next() {
		var b Brand
		if err := rows.Scan(&b.ID, &b.Name); err != nil {
			return nil, err
		}
		result = append(result, b)
	}
	return result, rows.Err()
}
