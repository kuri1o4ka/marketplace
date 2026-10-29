export interface Listing {
  id: number;
  title: string;
  price: number;
  sale_type: string;
  category: string;
  brand: string;
  cover_image: string;
  seller_name: string;
}

export interface ListingDetail extends Listing {
  description: string;
  size: string;
  color: string;
  condition: string;
  images: string[];
}