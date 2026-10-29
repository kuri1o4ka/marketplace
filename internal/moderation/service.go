package moderation

import (
	"context"
	"errors"
)

type Service interface {
	GetPending(ctx context.Context) ([]PendingListingResponse, error)
	Approve(ctx context.Context, listingID, moderatorID int64) error
	Reject(ctx context.Context, listingID, moderatorID int64, req RejectRequest) error
}

type service struct {
	repo Repository
}

func NewService(repo Repository) Service {
	return &service{repo: repo}
}

func (s *service) GetPending(ctx context.Context) ([]PendingListingResponse, error) {
	return s.repo.GetPending(ctx)
}

func (s *service) Approve(ctx context.Context, listingID, moderatorID int64) error {
	return s.repo.Approve(ctx, listingID, moderatorID)
}

func (s *service) Reject(ctx context.Context, listingID, moderatorID int64, req RejectRequest) error {
	if req.Comment == "" {
		return errors.New("comment is required for rejection")
	}
	return s.repo.Reject(ctx, listingID, moderatorID, req.Comment)
}
