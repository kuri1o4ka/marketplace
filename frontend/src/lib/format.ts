export function cn(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(' ');
}

const money = new Intl.NumberFormat('ru-RU', {
  style: 'currency',
  currency: 'RUB',
  maximumFractionDigits: 0,
});

const moneyExact = new Intl.NumberFormat('ru-RU', {
  style: 'currency',
  currency: 'RUB',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatMoney(value: number, exact = false): string {
  return (exact ? moneyExact : money).format(Number.isFinite(value) ? value : 0);
}

export function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function formatCountdown(ms: number): string {
  if (ms <= 0) return 'Завершён';
  const total = Math.floor(ms / 1000);
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;

  const pad = (n: number) => String(n).padStart(2, '0');
  if (days > 0) return `${days}д ${pad(hours)}ч ${pad(minutes)}м`;
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

export const CONDITIONS: Record<string, string> = {
  new: 'Новое',
  excellent: 'Отличное',
  good: 'Хорошее',
  fair: 'Удовлетворительное',
};

export function conditionLabel(value: string): string {
  return CONDITIONS[value] ?? value ?? 'Не указано';
}

export const SALE_TYPES: Record<string, string> = {
  fixed_price: 'Фиксированная цена',
  auction: 'Аукцион',
};

export function saleTypeLabel(value: string): string {
  return SALE_TYPES[value] ?? value;
}

export const LISTING_STATUSES: Record<string, string> = {
  active: 'Активен',
  on_moderation: 'На модерации',
  rejected: 'Отклонён',
  sold: 'Продан',
  draft: 'Черновик',
};

export function listingStatusLabel(value: string): string {
  return LISTING_STATUSES[value] ?? value;
}

export const ORDER_STATUSES: Record<string, string> = {
  escrow_held: 'Оплачен, деньги в escrow',
  paid: 'Оплачен',
  shipped: 'Отправлен',
  completed: 'Завершён',
  cancelled: 'Отменён',
  refunded: 'Возврат',
};

export function orderStatusLabel(value: string): string {
  return ORDER_STATUSES[value] ?? value;
}

export const TRANSACTION_KINDS: Record<string, string> = {
  deposit: 'Пополнение',
  escrow_hold: 'Оплата заказа',
  escrow_release: 'Выплата продавцу',
  refund: 'Возврат',
};

export function transactionLabel(value: string): string {
  return TRANSACTION_KINDS[value] ?? value;
}
