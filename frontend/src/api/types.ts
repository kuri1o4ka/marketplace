export type Role = 'user' | 'shop' | 'moderator' | 'admin';

export interface User {
  id: number;
  email: string;
  display_name: string;
  email_verified: boolean;
  balance: string;
  role: Role;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface RegisterPayload {
  email: string;
  password: string;
  display_name: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface ListingSummary {
  id: number;
  title: string;
  price: number;
  sale_type: string;
  category: string;
  brand: string;
  cover_image: string;
  seller_id: number;
  seller_name: string;
  seller_role: Role;
  images: string[];
}

export interface ListingDetail extends ListingSummary {
  description: string;
  size: string;
  color: string;
  condition: string;
  status: string;
}

export interface MyListing {
  id: number;
  title: string;
  price: number;
  sale_type: string;
  category: string;
  brand: string;
  cover_image: string;
  status: string;
  created_at: string;
}

export interface CatalogParams {
  q?: string;
  category_id?: number;
  brand_id?: number;
  condition?: string;
  min_price?: number;
  max_price?: number;
  sale_type?: string;
  sort?: string;
  page?: number;
  limit?: number;
}

export interface CatalogPage {
  items: ListingSummary[];
  total: number;
  page: number;
  limit: number;
}

export interface Category {
  id: number;
  name: string;
}

export interface Brand {
  id: number;
  name: string;
}

export interface CreateListingPayload {
  title: string;
  description: string | null;
  price: number;
  category_id: number | null;
  brand_id: number | null;
  collection_id: number | null;
  size: string | null;
  color: string | null;
  condition: string | null;
  sale_type: string;
  image_urls: string[];
}

export interface AICheckResult {
  condition: string;
  confidence: number;
  model_version: string;
}

export interface UploadedImage {
  key: string;
  url: string;
}

export interface Bid {
  id: number;
  auction_id: number;
  bidder_id: number;
  amount: number;
  idempotency_key: string | null;
  created_at: string;
}

export interface Auction {
  id: number;
  listing_id: number;
  start_price: number;
  current_price: number;
  minimum_bid_increment: number;
  leader_id: number | null;
  bids_count: number;
  start_at: string;
  end_at: string;
  status: string;
  winner_id: number | null;
  title: string;
  cover_image: string;
  seller_id: number;
}

export interface AuctionDetail extends Auction {
  bids: Bid[];
}

export interface CreateAuctionPayload {
  listing_id: number;
  start_price: number;
  minimum_bid_increment: number;
  start_at: string;
  end_at: string;
}

export interface CartItem {
  item_id: number;
  listing_id: number;
  title: string;
  price: number;
  cover_image: string;
}

export interface Cart {
  cart_id: number;
  items: CartItem[];
  total: number;
}

export interface CheckoutResult {
  order_ids: number[];
  message: string;
}

export interface OrderItem {
  listing_id: number;
  title: string;
  price: number;
  cover_image: string;
}

export interface Order {
  id: number;
  seller_id: number;
  total: number;
  status: string;
  created_at: string;
  items: OrderItem[];
}

export interface WalletTransaction {
  id: number;
  order_id: number | null;
  kind: string;
  amount: number;
  created_at: string;
}

export interface Wallet {
  balance: number;
  transactions: WalletTransaction[];
}

export interface PendingListing {
  id: number;
  title: string;
  price: number;
  seller_name: string;
  cover_image: string;
  images: string[];
  created_at: string;
}
