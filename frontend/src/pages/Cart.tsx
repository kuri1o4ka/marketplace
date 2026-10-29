import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, Lock, RefreshCw, ShoppingBag, Trash2 } from 'lucide-react';
import { cartApi, ordersApi } from '../api/endpoints';
import { getErrorMessage } from '../api/client';
import { useAuth } from '../context/auth';
import { useToast } from '../context/toast';
import { SmartImage } from '../components/SmartImage';
import { Button, EmptyState, PageHeader, Skeleton } from '../components/ui';
import { formatMoney } from '../lib/format';

export default function Cart() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();
  const { user, refreshUser } = useAuth();

  const cart = useQuery({
    queryKey: ['cart'],
    queryFn: cartApi.get,
  });

  const removeItem = useMutation({
    mutationFn: (listingId: number) => cartApi.remove(listingId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['cart'] });
      toast.success('Удалено из корзины');
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const checkout = useMutation({
    mutationFn: ordersApi.checkout,
    onSuccess: async (result) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['cart'] }),
        queryClient.invalidateQueries({ queryKey: ['orders'] }),
        queryClient.invalidateQueries({ queryKey: ['wallet'] }),
      ]);
      await refreshUser();
      toast.success(
        result.order_ids.length > 1
          ? `Оформлено заказов: ${result.order_ids.length}. Деньги зарезервированы.`
          : 'Заказ оформлен. Деньги зарезервированы до получения вещи.',
      );
      navigate('/orders');
    },
    onError: (error) => toast.error(getErrorMessage(error, 'Не удалось оформить заказ')),
  });

  if (cart.isLoading) {
    return (
      <div className="container-luxe py-12">
        <Skeleton className="h-12 w-64" />
        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="space-y-4">
            {Array.from({ length: 3 }, (_, index) => (
              <Skeleton key={index} className="h-32 w-full" />
            ))}
          </div>
          <Skeleton className="h-72 w-full" />
        </div>
      </div>
    );
  }

  if (cart.isError) {
    return (
      <div className="container-luxe py-20">
        <EmptyState
          icon={RefreshCw}
          title="Корзина не загрузилась"
          description="Проверьте соединение с API или войдите заново."
          action={
            <Button variant="ghost" onClick={() => cart.refetch()} loading={cart.isFetching}>
              Повторить
            </Button>
          }
        />
      </div>
    );
  }

  const items = cart.data?.items ?? [];
  const total = cart.data?.total ?? 0;

  return (
    <div className="container-luxe py-10 md:py-14">
      <PageHeader
        eyebrow="Корзина"
        title="Ваша подборка"
        description="Проверьте вещи перед оформлением. Деньги резервируются на счёте и переходят продавцу после получения заказа."
        actions={
          items.length > 0 ? (
            <span className="text-xs text-muted">
              {items.length} {items.length === 1 ? 'вещь' : 'вещей'}
            </span>
          ) : null
        }
      />

      {items.length === 0 ? (
        <div className="pt-10">
          <EmptyState
            icon={ShoppingBag}
            title="Корзина пуста"
            description="Самое время найти что-то редкое. В каталоге есть архивные вещи с фиксированной ценой и аукционы."
            action={
              <div className="flex flex-wrap justify-center gap-3">
                <Link to="/" className="btn-primary">
                  В каталог
                  <ArrowRight size={15} />
                </Link>
                <Link to="/auctions" className="btn-ghost">
                  На аукционы
                </Link>
              </div>
            }
          />
        </div>
      ) : (
        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
          <div className="divide-y divide-night-700 border border-night-600 bg-night-900/40">
            {items.map((item) => (
              <div key={item.item_id} className="flex gap-4 p-4 sm:gap-5 sm:p-5">
                <Link to={`/listing/${item.listing_id}`} className="w-24 shrink-0 sm:w-28">
                  <SmartImage
                    src={item.cover_image}
                    alt={item.title}
                    className="aspect-[3/4] w-full border border-night-700"
                  />
                </Link>
                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link
                        to={`/listing/${item.listing_id}`}
                        className="line-clamp-2 font-display text-xl leading-snug text-cream transition hover:text-accent"
                      >
                        {item.title}
                      </Link>
                      <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-muted">
                        Лот #{item.listing_id}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem.mutate(item.listing_id)}
                      disabled={removeItem.isPending}
                      className="flex h-8 w-8 shrink-0 items-center justify-center text-muted transition hover:text-danger disabled:opacity-40"
                      aria-label="Удалить из корзины"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className="mt-auto flex items-end justify-between pt-4">
                    <span className="text-[10px] uppercase tracking-[0.16em] text-muted">Цена</span>
                    <span className="text-sm font-semibold text-cream">{formatMoney(item.price)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <aside className="lg:sticky lg:top-28 lg:self-start">
            <div className="border border-night-600 bg-night-900/70 p-6">
              <p className="font-display text-2xl text-cream">Итого</p>

              <div className="mt-5 space-y-3 border-b border-night-700 pb-5 text-sm">
                <div className="flex justify-between text-muted">
                  <span>Вещи</span>
                  <span className="text-cream">{formatMoney(total)}</span>
                </div>
                <div className="flex justify-between text-muted">
                  <span>Доставка</span>
                  <span className="text-cream">Рассчитывается</span>
                </div>
                <div className="flex justify-between text-muted">
                  <span>Комиссия</span>
                  <span className="text-cream">0 ₽</span>
                </div>
              </div>

              <div className="flex items-end justify-between py-5">
                <span className="text-[10px] uppercase tracking-[0.18em] text-muted">К оплате</span>
                <span className="font-display text-3xl text-cream">{formatMoney(total)}</span>
              </div>

              {user ? (
                <p className="mb-4 flex justify-between text-[11px] text-muted">
                  <span>Баланс</span>
                  <span className={Number(user.balance) < total ? 'text-danger' : 'text-cream'}>
                    {formatMoney(Number(user.balance), true)}
                  </span>
                </p>
              ) : null}

              <Button
                className="w-full"
                icon={Lock}
                loading={checkout.isPending}
                onClick={() => checkout.mutate()}
              >
                Оформить заказ
              </Button>

              <p className="mt-4 text-[11px] leading-relaxed text-muted">
                Оформляя заказ, вы соглашаетесь с правилами маркетплейса. Средства списываются с баланса
                кошелька.
              </p>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
