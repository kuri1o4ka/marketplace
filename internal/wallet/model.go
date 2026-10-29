package wallet

import "time"

type TransactionResponse struct {
	ID        int64     `json:"id"`
	OrderID   *int64    `json:"order_id"`
	Kind      string    `json:"kind"`
	Amount    float64   `json:"amount"`
	CreatedAt time.Time `json:"created_at"`
}

type WalletResponse struct {
	Balance      float64               `json:"balance"`
	Transactions []TransactionResponse `json:"transactions"`
}

type DepositRequest struct {
	Amount float64 `json:"amount"`
}
