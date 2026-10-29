package order

import "context"

type Service interface {
	Checkout(ctx context.Context, buyerID int64) (*CheckoutResponse, error)
	GetMyOrders(ctx context.Context, buyerID int64) ([]OrderResponse, error)
	GetOrder(ctx context.Context, orderID, userID int64) (*OrderResponse, error)
}

type service struct {
	repo Repository
}

func NewService(repo Repository) Service {
	return &service{repo: repo}
}

func (s *service) Checkout(ctx context.Context, buyerID int64) (*CheckoutResponse, error) {
	orderIDs, err := s.repo.Checkout(ctx, buyerID)
	if err != nil {
		return nil, err
	}
	return &CheckoutResponse{
		OrderIDs: orderIDs,
		Message:  "success",
	}, nil
}

func (s *service) GetMyOrders(ctx context.Context, buyerID int64) ([]OrderResponse, error) {
	return s.repo.GetOrdersByBuyer(ctx, buyerID)
}

func (s *service) GetOrder(ctx context.Context, orderID, userID int64) (*OrderResponse, error) {
	return s.repo.GetOrderByID(ctx, orderID, userID)
}
