package auction

import (
	"context"
	"errors"
	"time"
)

type Service interface {
	Create(ctx context.Context, sellerID int64, req CreateAuctionRequest) (int64, error)
	GetAll(ctx context.Context) ([]AuctionResponse, error)
	GetByID(ctx context.Context, id int64) (*AuctionDetailResponse, error)
	PlaceBid(ctx context.Context, auctionID, bidderID int64, req PlaceBidRequest) error
}

type service struct {
	repo Repository
}

func NewService(repo Repository) Service {
	return &service{repo: repo}
}

func (s *service) Create(ctx context.Context, sellerID int64, req CreateAuctionRequest) (int64, error) {
	if req.StartPrice <= 0 {
		return 0, errors.New("start_price must be positive")
	}
	if req.MinimumBidIncrement <= 0 {
		return 0, errors.New("minimum_bid_increment must be positive")
	}
	if req.StartAt.IsZero() || req.EndAt.IsZero() {
		return 0, errors.New("start_at and end_at are required")
	}
	if time.Now().After(req.StartAt) {
		return 0, errors.New("start_at must be in the future")
	}
	if req.EndAt.Before(req.StartAt) {
		return 0, errors.New("end_at must be after start_at")
	}
	return s.repo.Create(ctx, sellerID, req)
}

func (s *service) GetAll(ctx context.Context) ([]AuctionResponse, error) {
	return s.repo.GetAll(ctx)
}

func (s *service) GetByID(ctx context.Context, id int64) (*AuctionDetailResponse, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *service) PlaceBid(ctx context.Context, auctionID, bidderID int64, req PlaceBidRequest) error {
	if req.Amount <= 0 {
		return errors.New("amount must be positive")
	}
	if req.IdempotencyKey == "" {
		return errors.New("idempotency_key is required")
	}
	return s.repo.PlaceBid(ctx, auctionID, bidderID, req.Amount, req.IdempotencyKey)
}
