package wallet

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"
)

type Repository interface {
	GetBalance(ctx context.Context, userID int64) (float64, error)
	GetTransactions(ctx context.Context, userID int64) ([]TransactionResponse, error)
	Deposit(ctx context.Context, userID int64, amount float64) error
}

type pgRepository struct {
	db *pgxpool.Pool
}

func NewRepository(db *pgxpool.Pool) Repository {
	return &pgRepository{db: db}
}

func (r *pgRepository) GetBalance(ctx context.Context, userID int64) (float64, error) {
	var balance float64
	err := r.db.QueryRow(ctx, "SELECT balance FROM users WHERE id = $1", userID).Scan(&balance)
	return balance, err
}

func (r *pgRepository) GetTransactions(ctx context.Context, userID int64) ([]TransactionResponse, error) {
	query := `
		SELECT id, order_id, kind, amount, created_at 
		FROM wallet_transactions 
		WHERE user_id = $1 
		ORDER BY created_at DESC
	`
	rows, err := r.db.Query(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var result []TransactionResponse
	for rows.Next() {
		var t TransactionResponse
		err := rows.Scan(&t.ID, &t.OrderID, &t.Kind, &t.Amount, &t.CreatedAt)
		if err != nil {
			return nil, err
		}
		result = append(result, t)
	}
	return result, nil
}

func (r *pgRepository) Deposit(ctx context.Context, userID int64, amount float64) error {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	_, err = tx.Exec(ctx, "UPDATE users SET balance = balance + $1 WHERE id = $2", amount, userID)
	if err != nil {
		return err
	}

	_, err = tx.Exec(ctx, `
		INSERT INTO wallet_transactions (user_id, kind, amount) 
		VALUES ($1, 'deposit', $2)
	`, userID, amount)
	if err != nil {
		return err
	}

	return tx.Commit(ctx)
}
