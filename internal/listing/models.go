package listing

import "time"

type Listing struct {
	ID           int64      `json:"id"`
	SellerID     int64      `json:"seller_id"`
	Title        string     `json:"title"`
	Description  *string    `json:"description"`
	CategoryID   *int       `json:"category_id"`
	BrandID      *int       `json:"brand_id"`
	CollectionID *int       `json:"collection_id"`
	Size         *string    `json:"size"`
	Color        *string    `json:"color"`
	Condition    *string    `json:"condition"`
	SaleType     string     `json:"sale_type"`
	Price        float64    `json:"price"`
	Status       string     `json:"status"`
	PublishedAt  *time.Time `json:"published_at"`
	CreatedAt    time.Time  `json:"created_at"`
	UpdatedAt    time.Time  `json:"updated_at"`
}

type CreateListingRequest struct {
	Title        string   `json:"title"`
	Description  *string  `json:"description"`
	Price        float64  `json:"price"`
	CategoryID   *int     `json:"category_id"`
	BrandID      *int     `json:"brand_id"`
	CollectionID *int     `json:"collection_id"`
	Size         *string  `json:"size"`
	Color        *string  `json:"color"`
	Condition    *string  `json:"condition"`
	SaleType     string   `json:"sale_type"`
	ImageURLs    []string `json:"image_urls"`
}

type ListingResponse struct {
	ID         int64   `json:"id"`
	Title      string  `json:"title"`
	Price      float64 `json:"price"`
	SaleType   string  `json:"sale_type"`
	Category   string  `json:"category"`
	Brand      string  `json:"brand"`
	CoverImage string  `json:"cover_image"`
	SellerName string  `json:"seller_name"`
}

type MyListingResponse struct {
	ID         int64     `json:"id"`
	Title      string    `json:"title"`
	Price      float64   `json:"price"`
	SaleType   string    `json:"sale_type"`
	Category   string    `json:"category"`
	Brand      string    `json:"brand"`
	CoverImage string    `json:"cover_image"`
	Status     string    `json:"status"`
	CreatedAt  time.Time `json:"created_at"`
}

type ListingDetailResponse struct {
	ListingResponse
	Description string   `json:"description"`
	Size        string   `json:"size"`
	Color       string   `json:"color"`
	Condition   string   `json:"condition"`
	Images      []string `json:"images"`
}

type Category struct {
	ID   int    `json:"id"`
	Name string `json:"name"`
}

type Brand struct {
	ID   int    `json:"id"`
	Name string `json:"name"`
}

type Collection struct {
	ID      int    `json:"id"`
	BrandID int    `json:"brand_id"`
	Name    string `json:"name"`
	Year    *int   `json:"year"`
}

type CatalogFilter struct {
	Query      string
	CategoryID *int
	BrandID    *int
	Condition  string
	MinPrice   *float64
	MaxPrice   *float64
	SaleType   string
	Sort       string
	Page       int
	Limit      int
}

type CatalogPage struct {
	Items []ListingResponse `json:"items"`
	Total int               `json:"total"`
	Page  int               `json:"page"`
	Limit int               `json:"limit"`
}

type AICheckRequest struct {
	Images []string `json:"images"`
}

type AICheckResponse struct {
	Condition    string  `json:"condition"`
	Confidence   float64 `json:"confidence"`
	ModelVersion string  `json:"model_version"`
}
