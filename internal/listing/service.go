package listing

import (
	"context"
	"errors"
	"strings"
)

type Service interface {
	GetCatalog(ctx context.Context, f CatalogFilter) (*CatalogPage, error)
	GetListing(ctx context.Context, id int64) (*ListingDetailResponse, error)
	GetMyListings(ctx context.Context, sellerID int64) ([]MyListingResponse, error)
	CreateListing(ctx context.Context, sellerID int64, req CreateListingRequest) (int64, error)
	UpdateListing(ctx context.Context, listingID, sellerID int64, req CreateListingRequest) error
	CheckAICondition(ctx context.Context, id int64) (map[string]any, error)
	CheckImages(ctx context.Context, images []string) (*AICheckResponse, error)
	GetCategories(ctx context.Context) ([]Category, error)
	GetBrands(ctx context.Context) ([]Brand, error)
}

type service struct {
	repo Repository
}

func NewService(repo Repository) Service {
	return &service{repo: repo}
}

func (s *service) GetCatalog(ctx context.Context, f CatalogFilter) (*CatalogPage, error) {
	if f.Page < 1 {
		f.Page = 1
	}
	if f.Limit <= 0 {
		f.Limit = 20
	}
	if f.Limit > 100 {
		f.Limit = 100
	}
	f.Query = strings.TrimSpace(f.Query)

	items, total, err := s.repo.GetAll(ctx, f)
	if err != nil {
		return nil, err
	}
	if items == nil {
		items = []ListingResponse{}
	}
	return &CatalogPage{Items: items, Total: total, Page: f.Page, Limit: f.Limit}, nil
}

func (s *service) GetListing(ctx context.Context, id int64) (*ListingDetailResponse, error) {
	if id <= 0 {
		return nil, errors.New("invalid listing id")
	}
	return s.repo.GetByID(ctx, id)
}

func (s *service) GetMyListings(ctx context.Context, sellerID int64) ([]MyListingResponse, error) {
	return s.repo.GetBySeller(ctx, sellerID)
}

func (s *service) CreateListing(ctx context.Context, sellerID int64, req CreateListingRequest) (int64, error) {
	l, err := buildListing(sellerID, req)
	if err != nil {
		return 0, err
	}
	return s.repo.Create(ctx, l, req.ImageURLs)
}

func (s *service) UpdateListing(ctx context.Context, listingID, sellerID int64, req CreateListingRequest) error {
	if listingID <= 0 {
		return errors.New("invalid listing id")
	}
	l, err := buildListing(sellerID, req)
	if err != nil {
		return err
	}
	return s.repo.Update(ctx, listingID, sellerID, l, req.ImageURLs)
}

func buildListing(sellerID int64, req CreateListingRequest) (*Listing, error) {
	if strings.TrimSpace(req.Title) == "" {
		return nil, errors.New("title is required")
	}
	if req.Price <= 0 {
		return nil, errors.New("price must be positive")
	}
	if len(req.ImageURLs) == 0 {
		return nil, errors.New("at least one photo is required")
	}
	if len(req.ImageURLs) > 10 {
		return nil, errors.New("max 10 images allowed")
	}

	saleType := req.SaleType
	if saleType == "" {
		saleType = "fixed_price"
	}
	if saleType != "fixed_price" && saleType != "auction" {
		return nil, errors.New("invalid sale_type")
	}

	return &Listing{
		SellerID:     sellerID,
		Title:        strings.TrimSpace(req.Title),
		Description:  req.Description,
		Price:        req.Price,
		CategoryID:   req.CategoryID,
		BrandID:      req.BrandID,
		CollectionID: req.CollectionID,
		Size:         req.Size,
		Color:        req.Color,
		Condition:    req.Condition,
		SaleType:     saleType,
		Status:       "on_moderation",
	}, nil
}

func (s *service) CheckAICondition(ctx context.Context, id int64) (map[string]any, error) {
	if id <= 0 {
		return nil, errors.New("invalid listing id")
	}
	return map[string]any{
		"condition":     "excellent",
		"confidence":    0.94,
		"model_version": "mock-v1.0",
	}, nil
}

func (s *service) CheckImages(ctx context.Context, images []string) (*AICheckResponse, error) {
	if len(images) == 0 {
		return nil, errors.New("at least one image is required")
	}
	if len(images) > 10 {
		return nil, errors.New("max 10 images allowed")
	}
	return &AICheckResponse{
		Condition:    "excellent",
		Confidence:   0.94,
		ModelVersion: "mock-v1.0",
	}, nil
}

func (s *service) GetCategories(ctx context.Context) ([]Category, error) {
	return s.repo.GetCategories(ctx)
}

func (s *service) GetBrands(ctx context.Context) ([]Brand, error) {
	return s.repo.GetBrands(ctx)
}
