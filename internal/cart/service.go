package cart

import (
	"context"
	"errors"
)

type Service interface {
	GetCart(ctx context.Context, userID int64) (*CartResponse, error)
	AddItem(ctx context.Context, userID int64, listingID int64) error
	RemoveItem(ctx context.Context, userID int64, listingID int64) error
	Clear(ctx context.Context, userID int64) error
}

type service struct {
	repo Repository
}

func NewService(repo Repository) Service {
	return &service{repo: repo}
}

func (s *service) GetCart(ctx context.Context, userID int64) (*CartResponse, error) {
	cartID, err := s.repo.GetOrCreateCart(ctx, userID)
	if err != nil {
		return nil, err
	}

	items, err := s.repo.GetCartItems(ctx, cartID)
	if err != nil {
		return nil, err
	}

	var total float64
	for _, item := range items {
		total += item.Price
	}

	if items == nil {
		items = []CartItemResponse{}
	}

	return &CartResponse{
		CartID: cartID,
		Items:  items,
		Total:  total,
	}, nil
}

func (s *service) AddItem(ctx context.Context, userID int64, listingID int64) error {
	sellerID, status, err := s.repo.CheckListing(ctx, listingID)
	if err != nil {
		return errors.New("listing not found")
	}
	if status != "active" {
		return errors.New("listing is not available")
	}
	if sellerID == userID {
		return errors.New("cannot add your own listing to cart")
	}

	cartID, err := s.repo.GetOrCreateCart(ctx, userID)
	if err != nil {
		return err
	}

	return s.repo.AddItem(ctx, cartID, listingID)
}

func (s *service) RemoveItem(ctx context.Context, userID int64, listingID int64) error {
	cartID, err := s.repo.GetOrCreateCart(ctx, userID)
	if err != nil {
		return err
	}
	return s.repo.RemoveItem(ctx, cartID, listingID)
}

func (s *service) Clear(ctx context.Context, userID int64) error {
	cartID, err := s.repo.GetOrCreateCart(ctx, userID)
	if err != nil {
		return err
	}
	return s.repo.ClearCart(ctx, cartID)
}
