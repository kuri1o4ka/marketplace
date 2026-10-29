package wallet

import (
	"context"
	"errors"
)

type Service interface {
	GetWallet(ctx context.Context, userID int64) (*WalletResponse, error)
	Deposit(ctx context.Context, userID int64, req DepositRequest) error
}

type service struct {
	repo Repository
}

func NewService(repo Repository) Service {
	return &service{repo: repo}
}

func (s *service) GetWallet(ctx context.Context, userID int64) (*WalletResponse, error) {
	balance, err := s.repo.GetBalance(ctx, userID)
	if err != nil {
		return nil, err
	}

	txs, err := s.repo.GetTransactions(ctx, userID)
	if err != nil {
		return nil, err
	}
	if txs == nil {
		txs = []TransactionResponse{}
	}

	return &WalletResponse{
		Balance:      balance,
		Transactions: txs,
	}, nil
}

func (s *service) Deposit(ctx context.Context, userID int64, req DepositRequest) error {
	if req.Amount <= 0 {
		return errors.New("amount must be positive")
	}
	if req.Amount > 1000000 {
		return errors.New("max deposit is 1,000,000")
	}
	return s.repo.Deposit(ctx, userID, req.Amount)
}
