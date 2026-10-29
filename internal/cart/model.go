package cart

type CartItemResponse struct {
	ItemID     int64   `json:"item_id"`
	ListingID  int64   `json:"listing_id"`
	Title      string  `json:"title"`
	Price      float64 `json:"price"`
	CoverImage string  `json:"cover_image"`
}

type CartResponse struct {
	CartID int64              `json:"cart_id"`
	Items  []CartItemResponse `json:"items"`
	Total  float64            `json:"total"`
}

type AddItemRequest struct {
	ListingID int64 `json:"listing_id"`
}
