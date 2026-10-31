import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Gavel, RefreshCw, Timer } from 'lucide-react';
import { auctionsApi } from '../api/endpoints';
import { SmartImage } from '../components/SmartImage';
import { Badge, Button, EmptyState, PageHeader, Skeleton } from '../components/ui';
import { useNow } from '../hooks/useNow';
import { formatCountdown, formatMoney } from '../lib/format';
import { cn } from '../lib/cn';

export default function Auctions() {
  const now = useNow();
  const auctions = useQuery({
    queryKey: ['auctions'],
    queryFn: auctionsApi.list,
  });

  const items = auctions.data ?? [];

  return (
    <div className="container-luxe py-10 md:py-14">
      <PageHeader
        eyebrow="Аукционы"
        title="Редкие лоты уходят с молотка"
        description="Ставки принимаются онлайн. Шаг фиксирован, деньги резервируются только после подтверждения сделки."
        actions={
          <Link to="/" className="btn-ghost">
            В каталог
            <ArrowRight size={15} />
          </Link>
        }
      />

      <div className="pt-10">
        {auctions.isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }, (_, index) => (
              <div key={index} className="overflow-hidden rounded-xl border border-night-600">
                <Skeleton className="aspect-[4/3] w-full" />
                <div className="space-y-3 p-5">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </div>
            ))}
          </div>
        ) : auctions.isError ? (
          <EmptyState
            icon={RefreshCw}
            title="Не удалось загрузить аукционы"
            description="Проверьте соединение с API и попробуйте ещё раз."
            action={
              <Button variant="ghost" onClick={() => auctions.refetch()} loading={auctions.isFetching}>
                Повторить
              </Button>
            }
          />
        ) : items.length === 0 ? (
          <EmptyState
            icon={Gavel}
            title="Активных аукционов пока нет"
            description="Скоро появятся новые лоты. А пока загляните в каталог — там есть вещи с фиксированной ценой."
            action={
              <Link to="/" className="btn-primary">
                Смотреть каталог
              </Link>
            }
          />
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {items.map((auction, index) => {
              const remaining = new Date(auction.end_at).getTime() - now;
              const ended = remaining <= 0;
              return (
                <Link
                  key={auction.id}
                  to={`/auctions/${auction.id}`}
                  className="group flex flex-col border border-night-600 bg-night-900/60 rounded-xl transition hover:border-accent/60 hover:bg-night-900 animate-fadeUp"
                  style={{ animationDelay: `${index * 60}ms` }}
                >
                  <div className="relative">
                    <SmartImage
                      src={auction.cover_image}
                      alt={auction.title}
                      className="aspect-[4/3] w-full"
                      imgClassName="group-hover:scale-[1.03]"
                    />
                    <div className="absolute left-3 top-3">
                      <Badge tone={ended ? 'danger' : 'muted'}>
                        <Timer size={11} />
                        {ended ? 'Завершён' : formatCountdown(remaining)}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col gap-3 p-5">
                    <div className="space-y-1.5">
                      <p className="text-[10px] uppercase tracking-[0.18em] text-muted">
                        {auction.bids_count} ставок · шаг {formatMoney(auction.minimum_bid_increment)}
                      </p>
                      <h3 className="line-clamp-2 font-display text-2xl leading-snug text-cream transition group-hover:text-cream">
                        {auction.title}
                      </h3>
                    </div>

                    <div className="mt-auto flex items-end justify-between border-t border-night-700 pt-4">
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.16em] text-muted">Текущая ставка</p>
                        <p className={cn('mt-1 font-display text-2xl', ended ? 'text-muted' : 'text-cream')}>
                          {formatMoney(auction.current_price)}
                        </p>
                      </div>
                      <span className="flex items-center gap-1 text-[10px] uppercase tracking-[0.16em] text-muted transition group-hover:text-cream">
                        Смотреть
                        <ArrowRight size={13} />
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
