import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Package, RefreshCw } from 'lucide-react';
import { ordersApi } from '../api/endpoints';
import { SmartImage } from '../components/SmartImage';
import { Badge, Button, EmptyState, PageHeader, Skeleton } from '../components/ui';
import { formatDate, formatMoney, orderStatusLabel } from '../lib/format';

const statusTone = (status: string) => {
  switch (status) {
    case 'completed':
      return 'success' as const;
    case 'cancelled':
    case 'refunded':
      return 'danger' as const;
    case 'shipped':
      return 'default' as const;
    default:
      return 'default' as const;
  }
};

export default function Orders() {
  const orders = useQuery({
    queryKey: ['orders'],
    queryFn: ordersApi.list,
  });

  const items = orders.data ?? [];

  return (
    <div className="container-luxe py-10 md:py-14">
      <PageHeader
        eyebrow="Заказы"
        title="История покупок"
        description="Все сделки и их статусы. Оплата проходит через escrow и переходит продавцу после получения вещи."
        actions={
          <Link to="/" className="btn-ghost">
            В каталог
            <ArrowRight size={15} />
          </Link>
        }
      />

      <div className="pt-8">
        {orders.isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }, (_, index) => (
              <Skeleton key={index} className="h-40 w-full" />
            ))}
          </div>
        ) : orders.isError ? (
          <EmptyState
            icon={RefreshCw}
            title="Заказы не загрузились"
            description="Попробуйте обновить страницу или проверить соединение с API."
            action={
              <Button variant="ghost" onClick={() => orders.refetch()} loading={orders.isFetching}>
                Повторить
              </Button>
            }
          />
        ) : items.length === 0 ? (
          <EmptyState
            icon={Package}
            title="Пока нет заказов"
            description="Когда вы оформите первую покупку, она появится здесь со всеми деталями и статусом."
            action={
              <Link to="/" className="btn-primary">
                Найти первую вещь
                <ArrowRight size={15} />
              </Link>
            }
          />
        ) : (
          <div className="space-y-5">
            {items.map((order, index) => (
              <article
                key={order.id}
                className="border border-night-600 bg-night-900/40 rounded-xl animate-fadeUp"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <header className="flex flex-col gap-3 border-b border-night-700 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="font-display text-2xl text-cream">Заказ #{order.id}</p>
                    <Badge tone={statusTone(order.status)}>{orderStatusLabel(order.status)}</Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-[10px] uppercase tracking-[0.14em] text-muted">
                    <span>{formatDate(order.created_at)}</span>
                    <span>Продавец #{order.seller_id}</span>
                  </div>
                </header>

                <div className="divide-y divide-night-800">
                  {order.items.length === 0 ? (
                    <p className="px-5 py-4 text-xs text-muted">Состав заказа недоступен.</p>
                  ) : (
                    order.items.map((item) => (
                      <div key={`${order.id}-${item.listing_id}`} className="flex items-center gap-4 p-4 sm:px-5">
                        <SmartImage
                          src={item.cover_image}
                          alt={item.title}
                          className="h-16 w-14 shrink-0 rounded-lg border border-night-700"
                        />
                        <div className="min-w-0 flex-1">
                          <Link
                            to={`/listing/${item.listing_id}`}
                            className="line-clamp-1 text-sm text-cream transition hover:text-accent"
                          >
                            {item.title}
                          </Link>
                          <p className="mt-1 text-[10px] uppercase tracking-[0.14em] text-muted">
                            Лот #{item.listing_id}
                          </p>
                        </div>
                        <span className="text-sm text-cream">{formatMoney(item.price)}</span>
                      </div>
                    ))
                  )}
                </div>

                <footer className="flex items-center justify-between border-t border-night-700 px-5 py-4">
                  <span className="text-[10px] uppercase tracking-[0.16em] text-muted">Сумма заказа</span>
                  <span className="font-display text-2xl text-cream">{formatMoney(order.total)}</span>
                </footer>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
