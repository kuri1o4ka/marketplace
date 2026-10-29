package order

import "time"

type CheckoutResponse struct {
	OrderIDs []int64 `json:"order_ids"`
	Message  string  `json:"message"`
}

type OrderItemResponse struct {
	ListingID int64   `json:"listing_id"`
	Title     string  `json:"title"`
	Price     float64 `json:"price"`
}

type OrderResponse struct {
	ID        int64               `json:"id"`
	SellerID  int64               `json:"seller_id"`
	Total     float64             `json:"total"`
	Status    string              `json:"status"`
	CreatedAt time.Time           `json:"created_at"`
	Items     []OrderItemResponse `json:"items"`
}
