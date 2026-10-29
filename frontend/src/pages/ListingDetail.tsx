import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Check,
  Gavel,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  ShoppingBag,
  Truck,
} from 'lucide-react';
import { auctionsApi, cartApi, listingsApi } from '../api/endpoints';
import { getErrorMessage } from '../api/client';
import { useAuth } from '../context/auth';
import { useToast } from '../context/toast';
import { SmartImage } from '../components/SmartImage';
import { Badge, Button, EmptyState, Skeleton } from '../components/ui';
import { conditionLabel, formatMoney } from '../lib/format';
import { cn } from '../lib/cn';

export default function ListingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();
  const toast = useToast();
  const [activeImage, setActiveImage] = useState(0);
  const [trackedId, setTrackedId] = useState(id);

  // Reset the gallery when moving to another listing.
  if (trackedId !== id) {
    setTrackedId(id);
    setActiveImage(0);
  }

  const listing = useQuery({
    queryKey: ['listing', id],
    queryFn: () => listingsApi.get(id!),
    enabled: Boolean(id),
  });

  const isAuction = listing.data?.sale_type === 'auction';

  const auctions = useQuery({
    queryKey: ['auctions'],
    queryFn: auctionsApi.list,
    enabled: isAuction,
  });

  const auction = auctions.data?.find((item) => item.listing_id === listing.data?.id);

  const addToCart = useMutation({
    mutationFn: () => cartApi.add(Number(id)),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['cart'] });
      toast.success('Вещь добавлена в корзину');
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const requireAuth = (): boolean => {
    if (isAuthenticated) return true;
    navigate('/login', { state: { from: `/listing/${id}` } });
    return false;
  };

  const handleBuyNow = async () => {
    if (!requireAuth()) return;
    try {
      await addToCart.mutateAsync();
      navigate('/cart');
    } catch {
      // Error toast is shown by the mutation callback.
    }
  };

  if (listing.isLoading) {
    return (
      <div className="container-luxe grid gap-10 py-12 lg:grid-cols-[1.1fr_0.9fr]">
        <Skeleton className="aspect-[4/5] w-full" />
        <div className="space-y-5">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    );
  }

  if (listing.isError || !listing.data) {
    return (
      <div className="container-luxe py-20">
        <EmptyState
          icon={RefreshCw}
          title="Объявление не найдено"
          description="Возможно, вещь уже продана или снята с публикации."
          action={
            <Link to="/" className="btn-ghost">
              Вернуться в каталог
            </Link>
          }
        />
      </div>
    );
  }

  const item = listing.data;
  const images = item.images.length > 0 ? item.images : [item.cover_image].filter(Boolean);

  return (
    <div className="container-luxe py-8 md:py-12">
      <div className="mb-6 flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.16em] text-muted">
        <Link to="/" className="transition hover:text-accent">
          Каталог
        </Link>
        <span>/</span>
        <span>{item.category}</span>
        <span>/</span>
        <span className="text-cream">{item.brand}</span>
      </div>

      <button
        type="button"
        onClick={() => navigate(-1)}
        className="mb-8 flex items-center gap-2 text-xs text-muted transition hover:text-accent"
      >
        <ArrowLeft size={14} />
        Назад
      </button>

      <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14">
        <div className="space-y-4">
          <SmartImage
            src={images[activeImage]}
            alt={item.title}
            className="aspect-[4/5] w-full border border-night-600"
            eager
          />

          {images.length > 1 ? (
            <div className="grid grid-cols-4 gap-3">
              {images.map((image, index) => (
                <button
                  key={`${image}-${index}`}
                  type="button"
                  onClick={() => setActiveImage(index)}
                  className={cn(
                    'border transition',
                    activeImage === index ? 'border-accent' : 'border-night-600 hover:border-night-500',
                  )}
                  aria-label={`Фото ${index + 1}`}
                >
                  <SmartImage src={image} alt="" className="aspect-[3/4] w-full" />
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="lg:sticky lg:top-28 lg:self-start">
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="muted">{item.category}</Badge>
              <Badge tone="muted">{item.brand || 'Без бренда'}</Badge>
              {item.condition ? <Badge tone="success">{conditionLabel(item.condition)}</Badge> : null}
              {isAuction ? (
                <Badge tone="muted">
                  <Gavel size={11} />
                  Аукцион
                </Badge>
              ) : null}
            </div>

            <div className="space-y-3">
              <p className="label">{item.seller_name}</p>
              <h1 className="font-display text-4xl leading-[1.02] text-cream sm:text-5xl">{item.title}</h1>
            </div>

            <div className="border-y border-night-600 py-5">
              <p className="text-[10px] uppercase tracking-[0.2em] text-muted">
                {isAuction ? 'Текущая ставка' : 'Цена'}
              </p>
              <p className="mt-2 font-display text-4xl text-cream">
                {formatMoney(auction?.current_price ?? item.price)}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="border border-night-600 bg-night-900/60 p-4">
                <p className="label">Размер</p>
                <p className="mt-2 text-sm text-cream">{item.size || 'Не указан'}</p>
              </div>
              <div className="border border-night-600 bg-night-900/60 p-4">
                <p className="label">Цвет</p>
                <p className="mt-2 text-sm text-cream">{item.color || 'Не указан'}</p>
              </div>
              <div className="border border-night-600 bg-night-900/60 p-4">
                <p className="label">Состояние</p>
                <p className="mt-2 text-sm text-cream">{conditionLabel(item.condition)}</p>
              </div>
              <div className="border border-night-600 bg-night-900/60 p-4">
                <p className="label">Продавец</p>
                <p className="mt-2 truncate text-sm text-cream">{item.seller_name}</p>
              </div>
            </div>

            {item.description ? (
              <div className="space-y-2">
                <p className="label">Описание</p>
                <p className="whitespace-pre-line text-sm leading-relaxed text-muted">{item.description}</p>
              </div>
            ) : null}

            {isAuction ? (
              <div className="space-y-3">
                {auction ? (
                  <Link to={`/auctions/${auction.id}`} className="btn-primary w-full">
                    <Gavel size={16} />
                    Перейти к аукциону
                  </Link>
                ) : (
                  <Button disabled className="w-full">
                    Аукцион скоро откроется
                  </Button>
                )}
                <p className="text-center text-[11px] text-muted">
                  {auction
                    ? `${auction.bids_count} ${auction.bids_count === 1 ? 'ставка' : 'ставок'} · шаг ${formatMoney(auction.minimum_bid_increment)}`
                    : 'Лот готовится к торгам'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <Button
                  className="w-full"
                  icon={ShoppingBag}
                  onClick={() => {
                    if (requireAuth()) addToCart.mutate();
                  }}
                  loading={addToCart.isPending}
                >
                  В корзину
                </Button>
                <Button variant="ghost" className="w-full" onClick={handleBuyNow} disabled={addToCart.isPending}>
                  Купить сейчас
                </Button>
              </div>
            )}

            <div className="space-y-3 border-t border-night-600 pt-5">
              {[
                { icon: ShieldCheck, title: 'Проверка подлинности', text: 'Эксперт и AI проверяют каждую вещь' },
                { icon: Truck, title: 'Доставка по России', text: 'Отправка в течение 2 рабочих дней' },
                { icon: RotateCcw, title: 'Безопасная сделка', text: 'Деньги перечисляются после получения' },
              ].map((row) => (
                <div key={row.title} className="flex items-start gap-3">
                  <row.icon size={17} className="mt-0.5 shrink-0 text-muted" />
                  <div>
                    <p className="text-xs text-cream">{row.title}</p>
                    <p className="text-[11px] text-muted">{row.text}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.16em] text-success">
              <Check size={13} />
              Проверено Polyclothes
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
