package auction

import "time"

type Auction struct {
	ID                  int64     `json:"id"`
	ListingID           int64     `json:"listing_id"`
	StartPrice          float64   `json:"start_price"`
	CurrentPrice        float64   `json:"current_price"`
	MinimumBidIncrement float64   `json:"minimum_bid_increment"`
	LeaderID            *int64    `json:"leader_id"`
	BidsCount           int       `json:"bids_count"`
	StartAt             time.Time `json:"start_at"`
	EndAt               time.Time `json:"end_at"`
	Status              string    `json:"status"`
	WinnerID            *int64    `json:"winner_id"`
}

type Bid struct {
	ID             int64     `json:"id"`
	AuctionID      int64     `json:"auction_id"`
	BidderID       int64     `json:"bidder_id"`
	Amount         float64   `json:"amount"`
	IdempotencyKey *string   `json:"idempotency_key"`
	CreatedAt      time.Time `json:"created_at"`
}

type CreateAuctionRequest struct {
	ListingID           int64     `json:"listing_id"`
	StartPrice          float64   `json:"start_price"`
	MinimumBidIncrement float64   `json:"minimum_bid_increment"`
	StartAt             time.Time `json:"start_at"`
	EndAt               time.Time `json:"end_at"`
}

type PlaceBidRequest struct {
	Amount         float64 `json:"amount"`
	IdempotencyKey string  `json:"idempotency_key"`
}

type AuctionResponse struct {
	Auction
	Title      string `json:"title"`
	CoverImage string `json:"cover_image"`
	SellerID   int64  `json:"seller_id"`
}

type AuctionDetailResponse struct {
	AuctionResponse
	Bids []Bid `json:"bids"`
}
