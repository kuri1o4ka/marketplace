import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Check, RefreshCw, ShieldCheck, X } from 'lucide-react';
import { listingsApi, moderationApi } from '../api/endpoints';
import { getErrorMessage } from '../api/client';
import { useToast } from '../context/toast';
import { SmartImage } from '../components/SmartImage';
import { Badge, Button, EmptyState, Skeleton, Textarea } from '../components/ui';
import { conditionLabel, formatMoney, listingStatusLabel } from '../lib/format';

export default function ModerationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [rejecting, setRejecting] = useState(false);
  const [comment, setComment] = useState('');

  const listing = useQuery({
    queryKey: ['listing', id],
    queryFn: () => listingsApi.get(id!),
    enabled: Boolean(id),
  });

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ['moderation', 'pending'] });
    await queryClient.invalidateQueries({ queryKey: ['catalog'] });
    await queryClient.invalidateQueries({ queryKey: ['listing', id] });
    await queryClient.invalidateQueries({ queryKey: ['my-listings'] });
  };

  const approve = useMutation({
    mutationFn: () => moderationApi.approve(Number(id)),
    onSuccess: async () => {
      await refresh();
      toast.success('Лот одобрен и опубликован');
      navigate('/moderation');
    },
    onError: (error) => toast.error(getErrorMessage(error, 'Не удалось одобрить лот')),
  });

  const reject = useMutation({
    mutationFn: () => moderationApi.reject(Number(id), comment.trim()),
    onSuccess: async () => {
      await refresh();
      toast.info('Лот отклонён');
      navigate('/moderation');
    },
    onError: (error) => toast.error(getErrorMessage(error, 'Не удалось отклонить лот')),
  });

  if (listing.isLoading) {
    return (
      <div className="container-luxe grid gap-8 py-10 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="aspect-[3/4] w-full rounded-xl" />
          ))}
        </div>
        <div className="space-y-4">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  if (listing.isError || !listing.data) {
    return (
      <div className="container-luxe py-20">
        <EmptyState
          icon={RefreshCw}
          title="Лот не найден"
          description="Возможно, он уже проверен или удалён."
          action={
            <Link to="/moderation" className="btn-ghost">
              Назад в очередь
            </Link>
          }
        />
      </div>
    );
  }

  const item = listing.data;
  const images = item.images.length > 0 ? item.images : [item.cover_image].filter(Boolean);
  const isPending = item.status === 'on_moderation';

  return (
    <div className="container-luxe py-8 md:py-12">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link to="/moderation" className="flex items-center gap-2 text-xs text-muted transition hover:text-accent">
          <ArrowLeft size={14} />
          Очередь модерации
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="muted">
            <ShieldCheck size={11} />
            Лот #{item.id}
          </Badge>
          <Badge tone={isPending ? 'accent' : item.status === 'rejected' ? 'danger' : 'success'}>
            {listingStatusLabel(item.status)}
          </Badge>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:gap-12">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {images.map((image, index) => (
              <a
                key={`${image}-${index}`}
                href={image}
                target="_blank"
                rel="noreferrer"
                className="overflow-hidden rounded-xl border border-night-600 transition hover:border-accent"
              >
                <SmartImage src={image} alt={`Фото ${index + 1}`} className="aspect-[3/4] w-full" eager />
              </a>
            ))}
          </div>
          <p className="text-[11px] text-muted">
            Все фото лота · {images.length} шт. Нажмите на фото, чтобы открыть в полном размере.
          </p>
        </div>

        <div className="space-y-6 lg:sticky lg:top-28 lg:self-start">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="muted">{item.category}</Badge>
            <Badge tone="muted">{item.brand || 'Без бренда'}</Badge>
            {item.condition ? <Badge tone="success">{conditionLabel(item.condition)}</Badge> : null}
          </div>

          <div className="space-y-2">
            <p className="label">{item.seller_name}</p>
            <h1 className="font-display text-3xl leading-tight text-cream sm:text-4xl">{item.title}</h1>
            <p className="text-[11px] text-muted">Отправлено на проверку</p>
          </div>

          <div className="rounded-xl border-y border-night-600 py-5">
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted">Цена</p>
            <p className="mt-2 font-display text-4xl text-cream">{formatMoney(item.price)}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Размер', value: item.size || 'Не указан' },
              { label: 'Цвет', value: item.color || 'Не указан' },
              { label: 'Состояние', value: conditionLabel(item.condition) },
              { label: 'Тип', value: item.sale_type === 'auction' ? 'Аукцион' : 'Фикс. цена' },
            ].map((row) => (
              <div key={row.label} className="rounded-xl border border-night-600 bg-night-900/60 p-4">
                <p className="label">{row.label}</p>
                <p className="mt-2 text-sm text-cream">{row.value}</p>
              </div>
            ))}
          </div>

          {item.description ? (
            <div className="space-y-2">
              <p className="label">Описание</p>
              <p className="whitespace-pre-line text-sm leading-relaxed text-muted">{item.description}</p>
            </div>
          ) : null}

          {isPending ? (
            <div className="space-y-3 rounded-xl border border-night-600 bg-night-900/60 p-4">
              <p className="label">Решение</p>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  icon={Check}
                  loading={approve.isPending}
                  onClick={() => approve.mutate()}
                  disabled={reject.isPending}
                >
                  Принять
                </Button>
                <Button
                  variant="danger"
                  icon={X}
                  onClick={() => setRejecting((open) => !open)}
                  disabled={approve.isPending}
                >
                  Отклонить
                </Button>
              </div>

              {rejecting ? (
                <div className="space-y-3 border-t border-night-700 pt-3 animate-fadeUp">
                  <p className="text-xs text-muted">Укажите причину — продавец увидит её и сможет исправить лот.</p>
                  <Textarea
                    value={comment}
                    onChange={(event) => setComment(event.target.value)}
                    placeholder="Например: недостаточно фото, не указаны дефекты, сомнительная подлинность…"
                    maxLength={500}
                  />
                  <Button
                    variant="danger"
                    icon={X}
                    className="w-full"
                    disabled={!comment.trim()}
                    loading={reject.isPending}
                    onClick={() => reject.mutate()}
                  >
                    Подтвердить отклонение
                  </Button>
                </div>
              ) : null}
            </div>
          ) : (
            <p className="rounded-xl border border-night-600 bg-night-900/60 p-4 text-xs text-muted">
              Этот лот уже проверен. Решение по нему принято ранее.
            </p>
          )}

          <Link to={`/listing/${item.id}`} className="btn-quiet w-full">
            Открыть как покупатель
          </Link>
        </div>
      </div>
    </div>
  );
}
