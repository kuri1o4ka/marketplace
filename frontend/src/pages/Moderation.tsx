import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, ExternalLink, RefreshCw, ShieldCheck, X } from 'lucide-react';
import { moderationApi } from '../api/endpoints';
import { getErrorMessage } from '../api/client';
import { useToast } from '../context/toast';
import { Button, EmptyState, PageHeader, Skeleton, Textarea } from '../components/ui';
import { formatDate, formatMoney } from '../lib/format';

export default function Moderation() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [comment, setComment] = useState('');

  const pending = useQuery({
    queryKey: ['moderation', 'pending'],
    queryFn: moderationApi.pending,
  });

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ['moderation', 'pending'] });
    await queryClient.invalidateQueries({ queryKey: ['catalog'] });
  };

  const approve = useMutation({
    mutationFn: (id: number) => moderationApi.approve(id),
    onSuccess: async () => {
      await refresh();
      toast.success('Объявление одобрено и опубликовано');
    },
    onError: (error) => toast.error(getErrorMessage(error, 'Не удалось одобрить объявление')),
  });

  const reject = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) => moderationApi.reject(id, reason),
    onSuccess: async () => {
      await refresh();
      setRejectingId(null);
      setComment('');
      toast.info('Объявление отклонено');
    },
    onError: (error) => toast.error(getErrorMessage(error, 'Не удалось отклонить объявление')),
  });

  const items = pending.data ?? [];

  return (
    <div className="container-luxe py-10 md:py-14">
      <PageHeader
        eyebrow="Модерация"
        title="Очередь на проверку"
        description="Проверяйте фото, описание и признаки подлинности. После одобрения вещь сразу появится в каталоге."
        actions={
          <span className="inline-flex items-center gap-2 border border-night-600 bg-night-900 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-cream">
            <ShieldCheck size={14} />
            {items.length} в очереди
          </span>
        }
      />

      <div className="pt-8">
        {pending.isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }, (_, index) => (
              <Skeleton key={index} className="h-36 w-full" />
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
          <div className="space-y-4">
            {items.map((listing) => {
              const isRejecting = rejectingId === listing.id;
              return (
                <article key={listing.id} className="border border-night-600 bg-night-900/40">
                  <div className="flex flex-col gap-5 p-5 lg:flex-row lg:items-center lg:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-3">
                        <p className="font-display text-2xl leading-tight text-cream">{listing.title}</p>
                        <span className="text-[10px] uppercase tracking-[0.14em] text-muted">
                          Лот #{listing.id}
                        </span>
                      </div>
                      <p className="text-sm text-cream">{formatMoney(listing.price)}</p>
                      <p className="text-[11px] text-muted">
                        {listing.seller_name} · отправлено {formatDate(listing.created_at)}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <Link to={`/listing/${listing.id}`} className="btn-quiet px-3 py-2">
                        <ExternalLink size={14} />
                        Открыть
                      </Link>
                      <Button
                        variant="ghost"
                        icon={X}
                        onClick={() => {
                          setRejectingId(isRejecting ? null : listing.id);
                          setComment('');
                        }}
                      >
                        Отклонить
                      </Button>
                      <Button
                        icon={Check}
                        loading={approve.isPending && approve.variables === listing.id}
                        onClick={() => approve.mutate(listing.id)}
                      >
                        Одобрить
                      </Button>
                    </div>
                  </div>

                  {isRejecting ? (
                    <div className="space-y-3 border-t border-night-700 bg-night-900/60 p-5 animate-fadeUp">
                      <p className="label">Причина отказа</p>
                      <Textarea
                        value={comment}
                        onChange={(event) => setComment(event.target.value)}
                        placeholder="Например: недостаточно фото, не указаны дефекты, сомнительная подлинность…"
                        maxLength={500}
                      />
                      <div className="flex justify-end gap-3">
                        <Button variant="quiet" onClick={() => setRejectingId(null)}>
                          Отмена
                        </Button>
                        <Button
                          variant="danger"
                          icon={X}
                          disabled={!comment.trim()}
                          loading={reject.isPending}
                          onClick={() => reject.mutate({ id: listing.id, reason: comment.trim() })}
                        >
                          Подтвердить отказ
                        </Button>
                      </div>
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
