import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Clock3, Gavel, RefreshCw, Trophy, UserRound } from 'lucide-react';
import { auctionsApi } from '../api/endpoints';
import { getErrorMessage } from '../api/client';
import { useAuth } from '../context/auth';
import { useToast } from '../context/toast';
import { SmartImage } from '../components/SmartImage';
import { Badge, Button, EmptyState, Field, Input, Skeleton } from '../components/ui';
import { useNow } from '../hooks/useNow';
import { formatCountdown, formatDate, formatMoney } from '../lib/format';
import { cn } from '../lib/cn';

export default function AuctionDetail() {
  const { id } = useParams();
  const now = useNow();
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuth();
  const toast = useToast();
  const [amount, setAmount] = useState('');

  const auction = useQuery({
    queryKey: ['auction', id],
    queryFn: () => auctionsApi.get(id!),
    enabled: Boolean(id),
    refetchInterval: 15_000,
  });

  const minimumBid = auction.data
    ? auction.data.current_price + auction.data.minimum_bid_increment
    : 0;

  // Keep the input in sync with the current minimum without an effect:
  // after every accepted bid the minimum changes and the field is refreshed.
  const [suggestedFor, setSuggestedFor] = useState(0);
  if (minimumBid > 0 && suggestedFor !== minimumBid) {
    setSuggestedFor(minimumBid);
    setAmount(String(minimumBid));
  }

  const placeBid = useMutation({
    mutationFn: async () => {
      const value = Number(amount);
      if (!Number.isFinite(value) || value < minimumBid) {
        throw new Error(`Минимальная ставка — ${formatMoney(minimumBid)}`);
      }
      const key = crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      await auctionsApi.placeBid(Number(id), value, key);
    },
    onSuccess: async () => {
      toast.success('Ставка принята');
      await queryClient.invalidateQueries({ queryKey: ['auction', id] });
      await queryClient.invalidateQueries({ queryKey: ['auctions'] });
    },
    onError: (error) => toast.error(getErrorMessage(error, 'Не удалось сделать ставку')),
  });

  if (auction.isLoading) {
    return (
      <div className="container-luxe grid gap-10 py-12 lg:grid-cols-[1fr_0.9fr]">
        <Skeleton className="aspect-[4/3] w-full" />
        <div className="space-y-4">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-16 w-48" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    );
  }

  if (auction.isError || !auction.data) {
    return (
      <div className="container-luxe py-20">
        <EmptyState
          icon={RefreshCw}
          title="Аукцион не найден"
          description="Возможно, лот уже завершён или снят с торгов."
          action={
            <Link to="/auctions" className="btn-ghost">
              Все аукционы
            </Link>
          }
        />
      </div>
    );
  }

  const item = auction.data;
  const remaining = new Date(item.end_at).getTime() - now;
  const ended = remaining <= 0 || item.status !== 'active';
  const isLeader = Boolean(user && item.leader_id === user.id);
  const isOwner = Boolean(user && item.seller_id === user.id);

  return (
    <div className="container-luxe py-8 md:py-12">
      <div className="mb-6 flex items-center gap-2 text-[10px] uppercase tracking-[0.16em] text-muted">
        <Link to="/auctions" className="transition hover:text-accent">
          Аукционы
        </Link>
        <span>/</span>
        <span className="text-cream">Лот #{item.id}</span>
      </div>

      <button
        type="button"
        onClick={() => window.history.back()}
        className="mb-8 flex items-center gap-2 text-xs text-muted transition hover:text-accent"
      >
        <ArrowLeft size={14} />
        Назад
      </button>

      <div className="grid gap-10 lg:grid-cols-[1fr_0.85fr] lg:gap-14">
        <div className="space-y-5">
          <SmartImage
            src={item.cover_image}
            alt={item.title}
            className="aspect-[4/3] w-full border border-night-600"
            eager
          />
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={ended ? 'danger' : 'muted'}>
              <Gavel size={11} />
              {ended ? 'Торги завершены' : 'Идут торги'}
            </Badge>
            <Badge tone="muted">{item.bids_count} ставок</Badge>
            {isLeader ? (
              <Badge tone="success">
                <Trophy size={11} />
                Вы лидируете
              </Badge>
            ) : null}
          </div>
          <h1 className="font-display text-4xl leading-[1.02] text-cream sm:text-5xl">{item.title}</h1>
          <p className="text-sm leading-relaxed text-muted">
            Лот выставлен продавцом #{item.seller_id}. Ставка принимается до окончания таймера. Побеждает
            предложение с максимальной суммой.
          </p>
          <Link to={`/listing/${item.listing_id}`} className="btn-ghost">
            Посмотреть карточку вещи
          </Link>
        </div>

        <div className="space-y-6 lg:sticky lg:top-28 lg:self-start">
          <div className="border border-night-600 bg-night-900/60 p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="label">Текущая ставка</p>
                <p className="mt-2 font-display text-5xl text-cream">{formatMoney(item.current_price)}</p>
              </div>
              <div className="text-right">
                <p className="label">Осталось</p>
                <p className={cn('mt-2 flex items-center gap-2 font-display text-2xl', ended ? 'text-danger' : 'text-cream')}>
                  <Clock3 size={18} />
                  {formatCountdown(remaining)}
                </p>
              </div>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-4 border-t border-night-600 pt-4 text-xs">
              <div>
                <p className="text-muted">Стартовая цена</p>
                <p className="mt-1 text-cream">{formatMoney(item.start_price)}</p>
              </div>
              <div>
                <p className="text-muted">Шаг ставки</p>
                <p className="mt-1 text-cream">{formatMoney(item.minimum_bid_increment)}</p>
              </div>
              <div>
                <p className="text-muted">Начало</p>
                <p className="mt-1 text-cream">{formatDate(item.start_at)}</p>
              </div>
              <div>
                <p className="text-muted">Окончание</p>
                <p className="mt-1 text-cream">{formatDate(item.end_at)}</p>
              </div>
            </div>
          </div>

          <div className="border border-night-600 bg-night-900/60 p-6">
            <p className="font-display text-2xl text-cream">Сделать ставку</p>
            <p className="mt-1 text-xs text-muted">
              Минимальная ставка — {formatMoney(minimumBid)}
            </p>

            {!isAuthenticated ? (
              <Link to="/login" state={{ from: `/auctions/${item.id}` }} className="btn-primary mt-4 w-full">
                Войти, чтобы участвовать
              </Link>
            ) : isOwner ? (
              <p className="mt-4 border border-night-600 bg-night-850 px-4 py-3 text-xs text-muted">
                Нельзя делать ставки на собственный лот.
              </p>
            ) : (
              <form
                className="mt-4 space-y-3"
                onSubmit={(event) => {
                  event.preventDefault();
                  placeBid.mutate();
                }}
              >
                <Field label="Ваша ставка, ₽" htmlFor="bid-amount">
                  <Input
                    id="bid-amount"
                    type="number"
                    min={minimumBid}
                    step={item.minimum_bid_increment}
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                    disabled={ended}
                  />
                </Field>
                <Button
                  type="submit"
                  className="w-full"
                  icon={Gavel}
                  loading={placeBid.isPending}
                  disabled={ended}
                >
                  {ended ? 'Торги завершены' : 'Поставить'}
                </Button>
                <div className="flex gap-2">
                  {[0, 1, 2].map((step) => {
                    const value = minimumBid + item.minimum_bid_increment * step;
                    return (
                      <button
                        key={step}
                        type="button"
                        onClick={() => setAmount(String(value))}
                        disabled={ended}
                        className="flex-1 border border-night-600 py-2 text-[10px] uppercase tracking-[0.12em] text-muted transition hover:border-night-500 hover:text-night-500 disabled:opacity-40"
                      >
                        {formatMoney(value)}
                      </button>
                    );
                  })}
                </div>
              </form>
            )}
          </div>

          <div className="space-y-3">
            <p className="label">История ставок</p>
            {item.bids.length === 0 ? (
              <p className="border border-dashed border-night-600 px-4 py-6 text-center text-xs text-muted">
                Пока нет ставок. Станьте первым.
              </p>
            ) : (
              <div className="divide-y divide-night-700 border border-night-600">
                {item.bids.map((bid, index) => (
                  <div key={bid.id} className="flex items-center justify-between gap-4 px-4 py-3">
                    <div className="flex items-center gap-3">
                      <UserRound size={15} className="text-muted" />
                      <div>
                        <p className="text-xs text-cream">
                          {user && bid.bidder_id === user.id ? 'Вы' : `Участник #${bid.bidder_id}`}
                        </p>
                        <p className="text-[10px] text-muted">{formatDate(bid.created_at)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-cream">{formatMoney(bid.amount)}</p>
                      {index === 0 ? <p className="text-[10px] uppercase tracking-[0.14em] text-muted">лидер</p> : null}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
