import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, PencilLine, PlusSquare, RefreshCw, Tags } from 'lucide-react';
import { listingsApi } from '../api/endpoints';
import { SmartImage } from '../components/SmartImage';
import { Badge, Button, EmptyState, PageHeader, Skeleton } from '../components/ui';
import { formatDate, formatMoney, listingStatusLabel, saleTypeLabel } from '../lib/format';

const statusTone = (status: string) => {
  switch (status) {
    case 'rejected':
      return 'danger' as const;
    case 'on_moderation':
    case 'sold':
      return 'muted' as const;
    default:
      return 'default' as const;
  }
};

export default function MyListings() {
  const listings = useQuery({
    queryKey: ['my-listings'],
    queryFn: listingsApi.mine,
  });

  const items = listings.data ?? [];

  return (
    <div className="container-luxe py-10 md:py-14">
      <PageHeader
        eyebrow="Мои лоты"
        title="Мои лоты"
        description="Вещи, которые вы выставили на продажу. Здесь видны все статусы: модерация, публикация и продажа."
        actions={
          <Link to="/sell" className="btn-primary">
            <PlusSquare size={15} />
            Продать вещь
          </Link>
        }
      />

      <div className="pt-8">
        {listings.isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }, (_, index) => (
              <Skeleton key={index} className="h-28 w-full" />
            ))}
          </div>
        ) : listings.isError ? (
          <EmptyState
            icon={RefreshCw}
            title="Лоты не загрузились"
            description="Попробуйте обновить страницу или проверить соединение с API."
            action={
              <Button variant="ghost" onClick={() => listings.refetch()} loading={listings.isFetching}>
                Повторить
              </Button>
            }
          />
        ) : items.length === 0 ? (
          <EmptyState
            icon={Tags}
            title="Пока нет лотов"
            description="Выставьте первую вещь — после проверки модератором она появится в каталоге."
            action={
              <Link to="/sell" className="btn-primary">
                Выставить вещь
                <ArrowRight size={15} />
              </Link>
            }
          />
        ) : (
          <div className="divide-y divide-night-600 overflow-hidden rounded-xl border border-night-600">
            {items.map((listing) => (
              <article
                key={listing.id}
                className="flex flex-col gap-4 p-4 transition hover:bg-night-900/40 sm:flex-row sm:items-center sm:p-5"
              >
                <SmartImage
                  src={listing.cover_image}
                  alt={listing.title}
                  className="aspect-[4/5] w-20 shrink-0 rounded-lg"
                />

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={statusTone(listing.status)}>{listingStatusLabel(listing.status)}</Badge>
                    <span className="text-[10px] uppercase tracking-[0.14em] text-muted">
                      {saleTypeLabel(listing.sale_type)}
                    </span>
                  </div>
                  <Link
                    to={`/listing/${listing.id}`}
                    className="mt-2 block truncate font-display text-xl text-cream transition hover:text-accent"
                  >
                    {listing.title}
                  </Link>
                  <p className="mt-1 text-[10px] uppercase tracking-[0.14em] text-muted">
                    {listing.brand || 'Без бренда'} · {listing.category} · {formatDate(listing.created_at)}
                  </p>
                </div>

                <div className="flex items-center justify-between gap-6 sm:flex-col sm:items-end sm:gap-2">
                  <span className="text-sm font-semibold text-cream">{formatMoney(listing.price)}</span>
                  <div className="flex items-center gap-3">
                    {listing.status !== 'sold' && listing.sale_type !== 'auction' ? (
                      <Link
                        to={`/listing/${listing.id}/edit`}
                        className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.14em] text-muted transition hover:text-accent"
                      >
                        <PencilLine size={13} />
                        Изменить
                      </Link>
                    ) : null}
                    <Link
                      to={`/listing/${listing.id}`}
                      className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.14em] text-muted transition hover:text-accent"
                    >
                      Открыть
                      <ArrowRight size={13} />
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
