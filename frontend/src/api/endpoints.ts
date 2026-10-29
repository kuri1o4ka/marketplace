import { api } from './client';
import type {
  AICheckResult,
  Auction,
  AuctionDetail,
  AuthResponse,
  Brand,
  Cart,
  CatalogPage,
  CatalogParams,
  Category,
  CheckoutResult,
  CreateAuctionPayload,
  CreateListingPayload,
  ListingDetail,
  LoginPayload,
  MyListing,
  Order,
  PendingListing,
  RegisterPayload,
  UploadedImage,
  User,
  Wallet,
} from './types';

function queryString(params: object): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    search.set(key, String(value));
  }
  const result = search.toString();
  return result ? `?${result}` : '';
}

export const authApi = {
  async login(payload: LoginPayload): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>('/auth/login', payload);
    return data;
  },

  async register(payload: RegisterPayload): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>('/auth/register', payload);
    return data;
  },

  async me(): Promise<User> {
    const { data } = await api.get<User>('/auth/me');
    return data;
  },

  async logout(): Promise<void> {
    await api.post('/auth/logout');
  },
};

export const listingsApi = {
  async catalog(params: CatalogParams): Promise<CatalogPage> {
    const { data } = await api.get<CatalogPage>(`/listings${queryString(params)}`);
    return data;
  },

  async get(id: number | string): Promise<ListingDetail> {
    const { data } = await api.get<ListingDetail>(`/listings/${id}`);
    return data;
  },

  async mine(): Promise<MyListing[]> {
    const { data } = await api.get<MyListing[]>('/listings/mine');
    return data;
  },

  async create(payload: CreateListingPayload): Promise<number> {
    const { data } = await api.post<{ id: number }>('/listings', payload);
    return data.id;
  },

  async categories(): Promise<Category[]> {
    const { data } = await api.get<Category[]>('/categories');
    return data;
  },

  async brands(): Promise<Brand[]> {
    const { data } = await api.get<Brand[]>('/brands');
    return data;
  },

  async checkImages(images: string[]): Promise<AICheckResult> {
    const { data } = await api.post<AICheckResult>('/ai/check', { images });
    return data;
  },
};

export const uploadsApi = {
  async upload(files: File[], onProgress?: (percent: number) => void): Promise<UploadedImage[]> {
    const form = new FormData();
    for (const file of files) {
      form.append('files', file);
    }

    const { data } = await api.post<{ images: UploadedImage[] }>('/uploads', form, {
      onUploadProgress: (event) => {
        if (!event.total) return;
        onProgress?.(Math.round((event.loaded / event.total) * 100));
      },
    });
    return data.images;
  },
};

export const auctionsApi = {
  async list(): Promise<Auction[]> {
    const { data } = await api.get<Auction[]>('/auctions');
    return data;
  },

  async get(id: number | string): Promise<AuctionDetail> {
    const { data } = await api.get<AuctionDetail>(`/auctions/${id}`);
    return data;
  },

  async create(payload: CreateAuctionPayload): Promise<number> {
    const { data } = await api.post<{ id: number }>('/auctions', payload);
    return data.id;
  },

  async placeBid(id: number, amount: number, idempotencyKey: string): Promise<void> {
    await api.post(`/auctions/${id}/bids`, {
      amount,
      idempotency_key: idempotencyKey,
    });
  },
};

export const cartApi = {
  async get(): Promise<Cart> {
    const { data } = await api.get<Cart>('/cart');
    return data;
  },

  async add(listingId: number): Promise<void> {
    await api.post('/cart/items', { listing_id: listingId });
  },

  async remove(listingId: number): Promise<void> {
    await api.delete(`/cart/items/${listingId}`);
  },

  async clear(): Promise<void> {
    await api.delete('/cart');
  },
};

export const ordersApi = {
  async list(): Promise<Order[]> {
    const { data } = await api.get<Order[]>('/orders');
    return data;
  },

  async checkout(): Promise<CheckoutResult> {
    const { data } = await api.post<CheckoutResult>('/orders/checkout');
    return data;
  },
};

export const walletApi = {
  async get(): Promise<Wallet> {
    const { data } = await api.get<Wallet>('/wallet');
    return data;
  },

  async deposit(amount: number): Promise<void> {
    await api.post('/wallet/deposit', { amount });
  },
};

export const moderationApi = {
  async pending(): Promise<PendingListing[]> {
    const { data } = await api.get<PendingListing[]>('/moderation/pending');
    return data;
  },

  async approve(id: number): Promise<void> {
    await api.post(`/moderation/${id}/approve`);
  },

  async reject(id: number, comment: string): Promise<void> {
    await api.post(`/moderation/${id}/reject`, { comment });
  },
};
