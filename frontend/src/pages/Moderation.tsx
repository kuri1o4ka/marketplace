import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Check, ExternalLink, RefreshCw, ShieldCheck } from 'lucide-react';
import { moderationApi } from '../api/endpoints';
import { SmartImage } from '../components/SmartImage';
import { Button, EmptyState, PageHeader, Skeleton } from '../components/ui';
import { formatDate, formatMoney } from '../lib/format';

export default function Moderation() {
  const pending = useQuery({
    queryKey: ['moderation', 'pending'],
    queryFn: moderationApi.pending,
  });

  const items = pending.data ?? [];

  return (
    <div className="container-luxe py-10 md:py-14">
      <PageHeader
        eyebrow="Модерация"
        title="Очередь на проверку"
        description="Откройте лот, изучите все фотографии и примите решение. После проверки лот сразу попадает в каталог или возвращается продавцу."
        actions={
          <span className="inline-flex items-center gap-2 rounded-full border border-night-600 bg-night-900 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-cream">
            <ShieldCheck size={14} />
            {items.length} в очереди
          </span>
        }
      />

      <div className="pt-8">
        {pending.isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }, (_, index) => (
              <Skeleton key={index} className="h-24 w-full rounded-xl" />
            ))}
          </div>
        ) : pending.isError ? (
          <EmptyState
            icon={RefreshCw}
            title="Очередь не загрузилась"
            description="Убедитесь, что вы вошли как модератор, и попробуйте снова."
            action={
              <Button variant="ghost" onClick={() => pending.refetch()} loading={pending.isFetching}>
                Повторить
              </Button>
            }
          />
        ) : items.length === 0 ? (
          <EmptyState
            icon={Check}
            title="Очередь пуста"
            description="Все объявления проверены. Новые появятся здесь после публикации продавцами."
            action={
              <Link to="/" className="btn-ghost">
                В каталог
              </Link>
            }
          />
        ) : (
          <div className="divide-y divide-night-600 overflow-hidden rounded-xl border border-night-600">
            {items.map((listing) => (
              <Link
                key={listing.id}
                to={`/moderation/${listing.id}`}
                className="group flex items-center gap-4 p-4 transition hover:bg-night-900/60 sm:p-5"
              >
                <SmartImage
                  src={listing.cover_image}
                  alt={listing.title}
                  className="h-16 w-14 shrink-0 rounded-lg"
                />

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <span className="rounded-full border border-night-600 px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] text-muted">
                      Лот #{listing.id}
                    </span>
                    <p className="truncate font-display text-lg text-cream transition group-hover:text-accent">
                      {listing.title}
                    </p>
                  </div>
                  <p className="mt-1 truncate text-[11px] text-muted">
                    {listing.seller_name} · {formatDate(listing.created_at)}
                  </p>
                </div>

                <div className="hidden text-right sm:block">
                  <p className="text-sm font-semibold text-cream">{formatMoney(listing.price)}</p>
                  <p className="text-[10px] uppercase tracking-[0.14em] text-muted">
                    {listing.images.length} фото
                  </p>
                </div>

                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-night-600 text-muted transition group-hover:border-accent group-hover:text-accent">
                  <ExternalLink size={15} />
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
