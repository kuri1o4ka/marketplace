import axios from 'axios';
import type { AxiosError } from 'axios';

export const TOKEN_KEY = 'polyclothes.token';

export const tokenStore = {
  get(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set(token: string) {
    localStorage.setItem(TOKEN_KEY, token);
  },
  clear() {
    localStorage.removeItem(TOKEN_KEY);
  },
};

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

const errorTranslations: Record<string, string> = {
  'invalid credentials': 'Неверный email или пароль',
  'invalid email': 'Некорректный email',
  'email already taken': 'Этот email уже зарегистрирован',
  'weak password': 'Слишком слабый пароль',
  'user blocked': 'Аккаунт заблокирован',
  'insufficient funds': 'Недостаточно средств на балансе',
  'cart is empty or items unavailable': 'Корзина пуста или вещи уже недоступны',
  'bid too low': 'Ставка слишком низкая',
  'cannot bid on your own auction': 'Нельзя делать ставки на собственный лот',
  'auction has ended': 'Аукцион уже завершён',
  'auction is not active': 'Аукцион неактивен',
  'auction not found': 'Аукцион не найден',
  'not your listing': 'Это не ваше объявление',
  'listing not found': 'Объявление не найдено',
  'listing is not available': 'Объявление недоступно',
  'cannot add your own listing to cart': 'Нельзя добавить в корзину собственное объявление',
  'cannot buy your own listing': 'Нельзя купить собственное объявление',
  'cannot edit sold listing': 'Проданное объявление нельзя редактировать',
  'cannot edit auction listing': 'Объявление с аукционом нельзя редактировать',
  'title is required': 'Укажите название',
  'price must be positive': 'Укажите корректную цену',
  'invalid listing id': 'Некорректный номер объявления',
  'invalid sale_type': 'Некорректный тип продажи',
  'amount must be positive': 'Сумма должна быть больше нуля',
  'max deposit is 1,000,000': 'Максимальное пополнение — 1 000 000 ₽',
  'comment is required for rejection': 'Укажите причину отказа',
  'at least one photo is required': 'Добавьте хотя бы одно фото',
  'max 3 files allowed': 'Можно загрузить не более 3 фото',
  'no files provided': 'Файлы не выбраны',
  'invalid json': 'Некорректные данные запроса',
  'storage is not configured': 'Хранилище изображений не настроено',
  unauthorized: 'Нужно войти в аккаунт',
  forbidden: 'Недостаточно прав',
};

export function getErrorMessage(error: unknown, fallback = 'Что-то пошло не так'): string {
  if (error instanceof Error && error.message) {
    return errorTranslations[error.message] ?? error.message;
  }
  return fallback;
}

const baseURL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api';

export const api = axios.create({
  baseURL,
  timeout: 20000,
});

api.interceptors.request.use((config) => {
  const token = tokenStore.get();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

interface ErrorBody {
  error?: string;
  message?: string;
}

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ErrorBody | string>) => {
    const status = error.response?.status ?? 0;
    const body = error.response?.data;

    let message = 'Не удалось выполнить запрос';
    if (typeof body === 'string' && body.trim()) {
      message = body.trim();
    } else if (body && typeof body === 'object') {
      message = body.error ?? body.message ?? message;
    } else if (!error.response) {
      message = 'Сервер недоступен. Проверьте подключение.';
    }

    if (status === 401 && tokenStore.get() && !error.config?.url?.includes('/auth/login')) {
      window.dispatchEvent(new Event('polyclothes:unauthorized'));
    }

    return Promise.reject(new ApiError(message, status));
  },
);
