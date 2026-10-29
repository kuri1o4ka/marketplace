package moderation

import "time"

type ModerationReview struct {
	ID          int64     `json:"id"`
	ListingID   int64     `json:"listing_id"`
	ModeratorID int64     `json:"moderator_id"`
	Decision    string    `json:"decision"`
	Comment     *string   `json:"comment"`
	CreatedAt   time.Time `json:"created_at"`
}

type PendingListingResponse struct {
	ID         int64     `json:"id"`
	Title      string    `json:"title"`
	Price      float64   `json:"price"`
	SellerName string    `json:"seller_name"`
	CreatedAt  time.Time `json:"created_at"`
}

type RejectRequest struct {
	Comment string `json:"comment"`
}
