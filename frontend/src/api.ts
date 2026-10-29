import axios from 'axios';
import { useQuery } from '@tanstack/react-query';
import type { Listing, ListingDetail } from './types';

export const api = axios.create({
  baseURL: 'http://localhost:8080/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const useListings = () => {
  return useQuery({
    queryKey: ['listings'],
    queryFn: async () => {
      const { data } = await api.get<Listing[]>('/listings');
      return data;
    },
  });
};

export const useListingDetail = (id: string) => {
  return useQuery({
    queryKey: ['listing', id],
    queryFn: async () => {
      const { data } = await api.get<ListingDetail>(`/listings/${id}`);
      return data;
    },
    enabled: !!id,
  });
};