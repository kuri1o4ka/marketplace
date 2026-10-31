import { useCallback, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useDropzone } from 'react-dropzone';
import type { FileRejection } from 'react-dropzone';
import { ArrowLeft, CheckCircle2, RefreshCw, Save, Trash2, UploadCloud } from 'lucide-react';
import { listingsApi, uploadsApi } from '../api/endpoints';
import { getErrorMessage } from '../api/client';
import type { ListingDetail } from '../api/types';
import { SmartImage } from '../components/SmartImage';
import { Badge, Button, EmptyState, Field, Input, PageHeader, Select, Skeleton, Textarea } from '../components/ui';
import { useToast } from '../context/toast';
import { CONDITIONS, conditionLabel, formatMoney } from '../lib/format';
import { cn } from '../lib/cn';

const MAX_PHOTOS = 3;
const MAX_SIZE = 10 * 1024 * 1024;

const conditionOptions = Object.entries(CONDITIONS).map(([value, label]) => ({ value, label }));

interface Photo {
  id: string;
  preview: string;
  key?: string;
  file?: File;
}

function newPhotoId(): string {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export default function EditListing() {
  const { id } = useParams();

  const listing = useQuery({
    queryKey: ['listing', id],
    queryFn: () => listingsApi.get(id!),
    enabled: Boolean(id),
  });

  if (listing.isLoading) {
    return (
      <div className="container-luxe space-y-6 py-10 md:py-14">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
          <Skeleton className="h-[520px] w-full rounded-xl" />
          <Skeleton className="h-72 w-full rounded-xl" />
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
          description="Возможно, оно уже продано или снято с публикации."
          action={
            <Link to="/my-listings" className="btn-ghost">
              Мои лоты
            </Link>
          }
        />
      </div>
    );
  }

  return <EditForm listing={listing.data} />;
}

function EditForm({ listing }: { listing: ListingDetail }) {
  const navigate = useNavigate();
  const toast = useToast();

  const [photos, setPhotos] = useState<Photo[]>(() =>
    (listing.images.length > 0 ? listing.images : [listing.cover_image])
      .filter(Boolean)
      .slice(0, MAX_PHOTOS)
      .map((url) => ({ id: newPhotoId(), preview: url, key: url })),
  );
  const [details, setDetails] = useState({
    title: listing.title,
    description: listing.description ?? '',
    price: String(listing.price),
    category_id: '',
    brand_id: '',
    size: listing.size ?? '',
    color: listing.color ?? '',
    condition: listing.condition ?? '',
  });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const categories = useQuery({
    queryKey: ['categories'],
    queryFn: listingsApi.categories,
    staleTime: 5 * 60_000,
  });
  const brands = useQuery({
    queryKey: ['brands'],
    queryFn: listingsApi.brands,
    staleTime: 5 * 60_000,
  });

  const categoryId = useMemo(() => {
    if (details.category_id) return details.category_id;
    return categories.data?.find((category) => category.name === listing.category)?.id;
  }, [categories.data, details.category_id, listing.category]);

  const brandId = useMemo(() => {
    if (details.brand_id) return details.brand_id;
    return brands.data?.find((brand) => brand.name === listing.brand)?.id;
  }, [brands.data, details.brand_id, listing.brand]);

  const updateDetail = (key: keyof typeof details, value: string) => {
    setDetails((current) => ({ ...current, [key]: value }));
  };

  const addPhotos = useCallback(
    (accepted: File[]) => {
      setPhotos((current) => {
        const room = MAX_PHOTOS - current.length;
        if (room <= 0) {
          toast.error(`Можно загрузить не более ${MAX_PHOTOS} фото`);
          return current;
        }
        const next = accepted.slice(0, room).map((file) => ({
          id: newPhotoId(),
          file,
          preview: URL.createObjectURL(file),
        }));
        return [...current, ...next];
      });
    },
    [toast],
  );

  const onDrop = useCallback(
    (accepted: File[], rejections: FileRejection[]) => {
      if (rejections.length > 0) {
        const code = rejections[0]?.errors[0]?.code;
        if (code === 'file-too-large') {
          toast.error('Файл больше 10 МБ');
        } else if (code === 'file-invalid-type') {
          toast.error('Поддерживаются только JPG, PNG и WebP');
        } else if (code === 'too-many-files') {
          toast.error(`Можно загрузить не более ${MAX_PHOTOS} фото`);
        } else {
          toast.error('Не удалось добавить фото');
        }
      }
      if (accepted.length > 0) addPhotos(accepted);
    },
    [addPhotos, toast],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
    },
    maxSize: MAX_SIZE,
    multiple: true,
    disabled: photos.length >= MAX_PHOTOS,
  });

  const removePhoto = (photoId: string) => {
    setPhotos((current) => {
      const target = current.find((photo) => photo.id === photoId);
      if (target?.file) URL.revokeObjectURL(target.preview);
      return current.filter((photo) => photo.id !== photoId);
    });
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (details.title.trim().length < 5) {
      toast.error('Название должно быть не короче 5 символов');
      return;
    }
    const price = Number(details.price);
    if (!Number.isFinite(price) || price <= 0) {
      toast.error('Укажите корректную цену');
      return;
    }
    if (!categoryId) {
      toast.error('Выберите категорию');
      return;
    }
    if (!details.condition) {
      toast.error('Укажите состояние вещи');
      return;
    }
    if (photos.length < 1) {
      toast.error('Оставьте хотя бы одно фото');
      return;
    }

    setSaving(true);
    try {
      setUploading(true);
      const pending = photos.filter((photo) => !photo.key && photo.file);
      let nextPhotos = photos;

      if (pending.length > 0) {
        const uploaded = await uploadsApi.upload(pending.map((photo) => photo.file!));
        const byId = new Map(pending.map((photo, index) => [photo.id, uploaded[index]]));
        nextPhotos = photos.map((photo) => {
          const image = byId.get(photo.id);
          return image ? { ...photo, key: image.key } : photo;
        });
        setPhotos(nextPhotos);
      }
      setUploading(false);

      const imageUrls = nextPhotos
        .map((photo) => photo.key)
        .filter((key): key is string => Boolean(key));

      await listingsApi.update(listing.id, {
        title: details.title.trim(),
        description: details.description.trim() || null,
        price,
        category_id: Number(categoryId),
        brand_id: brandId ? Number(brandId) : null,
        collection_id: null,
        size: details.size.trim() || null,
        color: details.color.trim() || null,
        condition: details.condition,
        sale_type: listing.sale_type,
        image_urls: imageUrls,
      });

      toast.success('Изменения отправлены на модерацию');
      navigate(`/listing/${listing.id}`);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Не удалось сохранить изменения'));
    } finally {
      setUploading(false);
      setSaving(false);
    }
  };

  const categoryName = categories.data?.find((category) => String(category.id) === String(categoryId))?.name ?? '—';
  const brandName = brands.data?.find((brand) => String(brand.id) === String(brandId))?.name ?? 'Без бренда';

  return (
    <div className="container-luxe py-10 md:py-14">
      <PageHeader
        eyebrow="Редактирование"
        title="Обновите объявление"
        description="После сохранения лот снова уйдёт на проверку модератору. До одобрения он не показывается в каталоге."
        actions={
          <Link to={`/listing/${listing.id}`} className="btn-ghost">
            <ArrowLeft size={15} />
            К лоту
          </Link>
        }
      />

      <form onSubmit={handleSubmit} className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6 rounded-xl border border-night-600 bg-night-900/40 p-5 sm:p-8">
          <div className="space-y-2">
            <h2 className="font-display text-3xl text-cream">Фотографии</h2>
            <p className="text-sm text-muted">До 3 фото. Новые файлы загрузятся при сохранении.</p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {photos.map((photo) => (
              <div key={photo.id} className="group relative overflow-hidden rounded-xl border border-night-600">
                <SmartImage src={photo.preview} alt="" className="aspect-[3/4] w-full" />
                {!photo.file ? (
                  <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-night-950/85 px-2 py-1 text-[9px] uppercase tracking-[0.14em] text-success">
                    <CheckCircle2 size={10} />
                    Сохранено
                  </span>
                ) : null}
                <button
                  type="button"
                  onClick={() => removePhoto(photo.id)}
                  className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-night-950/85 text-muted transition hover:text-danger"
                  aria-label="Удалить фото"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}

            {photos.length < MAX_PHOTOS ? (
              <div
                {...getRootProps()}
                className={cn(
                  'flex aspect-[3/4] cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border border-dashed p-4 text-center transition',
                  isDragActive
                    ? 'border-accent bg-accent/5 text-accent'
                    : 'border-night-500 text-muted hover:border-night-500 hover:text-night-500',
                )}
              >
                <input {...getInputProps()} />
                <UploadCloud size={26} />
                <div>
                  <p className="text-xs font-medium">Добавить фото</p>
                  <p className="mt-1 text-[10px] leading-relaxed text-muted">Перетащите или нажмите</p>
                </div>
              </div>
            ) : null}
          </div>

          <div className="space-y-2 border-t border-night-700 pt-5">
            <h2 className="font-display text-3xl text-cream">Детали</h2>
            <p className="text-sm text-muted">Чем точнее описание, тем быстрее вещь найдёт покупателя.</p>
          </div>

          <Field label="Название" htmlFor="title" required>
            <Input
              id="title"
              value={details.title}
              onChange={(event) => updateDetail('title', event.target.value)}
              maxLength={120}
            />
          </Field>

          <Field label="Описание" htmlFor="description">
            <Textarea
              id="description"
              value={details.description}
              onChange={(event) => updateDetail('description', event.target.value)}
              maxLength={2000}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Цена, ₽" htmlFor="price" required>
              <Input
                id="price"
                type="number"
                min={1}
                inputMode="numeric"
                value={details.price}
                onChange={(event) => updateDetail('price', event.target.value)}
              />
            </Field>
            <Field label="Категория" htmlFor="category_id" required>
              <Select
                id="category_id"
                value={String(categoryId ?? '')}
                onChange={(event) => updateDetail('category_id', event.target.value)}
                options={(categories.data ?? []).map((category) => ({
                  value: String(category.id),
                  label: category.name,
                }))}
                placeholder="Выберите категорию"
              />
            </Field>
            <Field label="Бренд" htmlFor="brand_id">
              <Select
                id="brand_id"
                value={String(brandId ?? '')}
                onChange={(event) => updateDetail('brand_id', event.target.value)}
                options={(brands.data ?? []).map((brand) => ({
                  value: String(brand.id),
                  label: brand.name,
                }))}
                placeholder="Без бренда / не знаю"
              />
            </Field>
            <Field label="Состояние" htmlFor="condition" required>
              <Select
                id="condition"
                value={details.condition}
                onChange={(event) => updateDetail('condition', event.target.value)}
                options={conditionOptions}
                placeholder="Выберите состояние"
              />
            </Field>
            <Field label="Размер" htmlFor="size">
              <Input
                id="size"
                value={details.size}
                onChange={(event) => updateDetail('size', event.target.value)}
                placeholder="M / 48 / 32"
              />
            </Field>
            <Field label="Цвет" htmlFor="color">
              <Input
                id="color"
                value={details.color}
                onChange={(event) => updateDetail('color', event.target.value)}
                placeholder="Чёрный"
              />
            </Field>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-night-700 pt-5">
            <p className="text-[11px] text-muted">
              Тип продажи: {listing.sale_type === 'auction' ? 'Аукцион' : 'Фиксированная цена'}
            </p>
            <div className="flex gap-3">
              <Link to={`/listing/${listing.id}`} className="btn-quiet">
                Отмена
              </Link>
              <Button type="submit" icon={Save} loading={saving || uploading}>
                Сохранить и отправить
              </Button>
            </div>
          </div>
        </div>

        <aside className="space-y-5">
          <div className="rounded-xl border border-night-600 bg-night-900/60 p-5">
            <p className="label text-muted">Превью</p>
            <SmartImage
              src={photos[0]?.preview}
              alt=""
              className="mt-3 aspect-[3/4] w-full rounded-lg border border-night-700"
            />
            <p className="mt-3 line-clamp-2 font-display text-xl text-cream">
              {details.title || 'Название вещи'}
            </p>
            <p className="mt-1 text-sm text-cream">
              {details.price ? formatMoney(Number(details.price)) : 'Цена не указана'}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge tone="muted">{categoryName}</Badge>
              <Badge tone="muted">{brandName}</Badge>
              {details.condition ? <Badge tone="success">{conditionLabel(details.condition)}</Badge> : null}
            </div>
          </div>

          <div className="rounded-xl border border-accent/30 bg-accent/[0.06] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">Повторная модерация</p>
            <p className="mt-2 text-xs leading-relaxed text-muted">
              Изменения не появятся в каталоге сразу: лот проверит модератор. Пока идёт проверка, покупатели
              видят прежнюю версию или лот скрыт.
            </p>
          </div>
        </aside>
      </form>
    </div>
  );
}
