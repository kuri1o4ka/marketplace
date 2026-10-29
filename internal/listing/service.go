package listing

import (
	"context"
	"errors"
)

type Service interface {
	GetCatalog(ctx context.Context, limit, offset int) ([]ListingResponse, error)
	GetListing(ctx context.Context, id int64) (*ListingDetailResponse, error)
	CreateListing(ctx context.Context, sellerID int64, req CreateListingRequest) (int64, error)
	CheckAICondition(ctx context.Context, id int64) (map[string]any, error)
}

type service struct {
	repo Repository
}

func NewService(repo Repository) Service {
	return &service{repo: repo}
}

func (s *service) GetCatalog(ctx context.Context, limit, offset int) ([]ListingResponse, error) {
	if limit <= 0 {
		limit = 20
	}
	if limit > 100 {
		limit = 100
	}
	if offset < 0 {
		offset = 0
	}
	return s.repo.GetAll(ctx, limit, offset)
}

func (s *service) GetListing(ctx context.Context, id int64) (*ListingDetailResponse, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *service) CreateListing(ctx context.Context, sellerID int64, req CreateListingRequest) (int64, error) {
	if req.Title == "" {
		return 0, errors.New("title is required")
	}
	if req.Price <= 0 {
		return 0, errors.New("price must be positive")
	}
	if len(req.ImageURLs) > 10 {
		return 0, errors.New("max 10 images allowed")
	}

	saleType := req.SaleType
	if saleType == "" {
		saleType = "fixed_price"
	}
	if saleType != "fixed_price" && saleType != "auction" {
		return 0, errors.New("invalid sale_type")
	}

	l := &Listing{
		SellerID:     sellerID,
		Title:        req.Title,
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
	}

	return s.repo.Create(ctx, l, req.ImageURLs)
}

func (s *service) CheckAICondition(ctx context.Context, id int64) (map[string]any, error) {
	return map[string]any{
		"condition":     "excellent",
		"confidence":    0.94,
		"model_version": "mock-v1.0",
	}, nil
}
