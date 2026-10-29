import { useCallback, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useDropzone } from 'react-dropzone';
import type { FileRejection } from 'react-dropzone';
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  Check,
  CheckCircle2,
  Sparkles,
  Trash2,
  UploadCloud,
  Wand2,
} from 'lucide-react';
import { auctionsApi, listingsApi, uploadsApi } from '../api/endpoints';
import { getErrorMessage } from '../api/client';
import type { AICheckResult } from '../api/types';
import { SmartImage } from '../components/SmartImage';
import { Badge, Button, Field, Input, PageHeader, Select, Textarea } from '../components/ui';
import { useToast } from '../context/toast';
import { CONDITIONS, conditionLabel, formatMoney } from '../lib/format';
import { cn } from '../lib/cn';

interface Photo {
  id: string;
  file: File;
  preview: string;
  key?: string;
}

const MAX_PHOTOS = 3;
const MAX_SIZE = 10 * 1024 * 1024;

const conditionOptions = Object.entries(CONDITIONS).map(([value, label]) => ({ value, label }));

interface DetailsState {
  title: string;
  description: string;
  price: string;
  category_id: string;
  brand_id: string;
  size: string;
  color: string;
  condition: string;
  sale_type: string;
  increment: string;
  duration: string;
}

const initialDetails: DetailsState = {
  title: '',
  description: '',
  price: '',
  category_id: '',
  brand_id: '',
  size: '',
  color: '',
  condition: '',
  sale_type: 'fixed_price',
  increment: '500',
  duration: '3',
};

function photoId(index: number): string {
  return `${Date.now()}-${index}-${Math.random().toString(16).slice(2)}`;
}

export default function Sell() {
  const navigate = useNavigate();
  const toast = useToast();

  const [step, setStep] = useState(1);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [details, setDetails] = useState<DetailsState>(initialDetails);
  const [aiResult, setAiResult] = useState<AICheckResult | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [publishing, setPublishing] = useState(false);

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

  const addPhotos = useCallback(
    (accepted: File[]) => {
      setPhotos((current) => {
        const room = MAX_PHOTOS - current.length;
        if (room <= 0) {
          toast.error(`Можно загрузить не более ${MAX_PHOTOS} фото`);
          return current;
        }
        const next = accepted.slice(0, room).map((file, index) => ({
          id: photoId(index),
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

  const removePhoto = (id: string) => {
    setPhotos((current) => {
      const target = current.find((photo) => photo.id === id);
      if (target) URL.revokeObjectURL(target.preview);
      return current.filter((photo) => photo.id !== id);
    });
  };

  const updateDetail = (key: keyof DetailsState, value: string) => {
    setDetails((current) => ({ ...current, [key]: value }));
  };

  const handlePhotosNext = async () => {
    if (photos.length < 2) {
      toast.error('Добавьте минимум 2 фото — так покупатели доверяют больше');
      return;
    }

    setUploading(true);
    setProgress(0);
    try {
      const pending = photos.filter((photo) => !photo.key);
      let nextPhotos = photos;

      if (pending.length > 0) {
        const uploaded = await uploadsApi.upload(
          pending.map((photo) => photo.file),
          setProgress,
        );
        const byId = new Map(pending.map((photo, index) => [photo.id, uploaded[index]]));
        nextPhotos = photos.map((photo) => {
          const image = byId.get(photo.id);
          return image ? { ...photo, key: image.key } : photo;
        });
        setPhotos(nextPhotos);
      }

      const keys = nextPhotos.map((photo) => photo.key).filter((key): key is string => Boolean(key));
      try {
        const result = await listingsApi.checkImages(keys);
        setAiResult(result);
      } catch {
        toast.info('AI-оценка недоступна, состояние можно указать вручную');
      }
      setStep(2);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Не удалось загрузить фото'));
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const handleDetailsNext = (event: FormEvent) => {
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
    if (!details.category_id) {
      toast.error('Выберите категорию');
      return;
    }
    if (!details.condition) {
      toast.error('Укажите состояние вещи');
      return;
    }
    if (details.sale_type === 'auction') {
      const increment = Number(details.increment);
      if (!Number.isFinite(increment) || increment <= 0) {
        toast.error('Укажите шаг аукциона');
        return;
      }
    }
    setStep(3);
  };

  const handlePublish = async () => {
    setPublishing(true);
    try {
      const price = Number(details.price);
      const listingId = await listingsApi.create({
        title: details.title.trim(),
        description: details.description.trim() || null,
        price,
        category_id: Number(details.category_id),
        brand_id: details.brand_id ? Number(details.brand_id) : null,
        collection_id: null,
        size: details.size.trim() || null,
        color: details.color.trim() || null,
        condition: details.condition,
        sale_type: details.sale_type,
        image_urls: photos.map((photo) => photo.key).filter((key): key is string => Boolean(key)),
      });

      if (details.sale_type === 'auction') {
        const start = new Date(Date.now() + 60_000);
        const end = new Date(start.getTime() + Number(details.duration) * 86_400_000);
        try {
          await auctionsApi.create({
            listing_id: listingId,
            start_price: price,
            minimum_bid_increment: Number(details.increment),
            start_at: start.toISOString(),
            end_at: end.toISOString(),
          });
        } catch (error) {
          toast.error(getErrorMessage(error, 'Лот создан, но аукцион не запустился'));
        }
      }

      toast.success('Объявление отправлено на модерацию');
      navigate(`/listing/${listingId}`);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Не удалось опубликовать объявление'));
    } finally {
      setPublishing(false);
    }
  };

  const categoryName = useMemo(
    () => categories.data?.find((category) => String(category.id) === details.category_id)?.name ?? '—',
    [categories.data, details.category_id],
  );
  const brandName = useMemo(
    () => brands.data?.find((brand) => String(brand.id) === details.brand_id)?.name ?? 'Без бренда',
    [brands.data, details.brand_id],
  );

  const steps = [
    { number: 1, label: 'Фото' },
    { number: 2, label: 'Детали' },
    { number: 3, label: 'Проверка' },
  ];

  return (
    <div className="container-luxe py-10 md:py-14">
      <PageHeader
        eyebrow="Продажа"
        title="Выставьте вещь на продажу"
        description="Два-три честных фото, точное описание и цена. После проверки модератором вещь появится в каталоге."
      />

      <div className="mt-8 flex items-center gap-2 sm:gap-4">
        {steps.map((item, index) => (
          <div key={item.number} className="flex flex-1 items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-2.5">
              <span
                className={cn(
                  'flex h-8 w-8 items-center justify-center border text-xs font-semibold transition',
                  step > item.number
                    ? 'border-accent bg-accent text-white'
                    : step === item.number
                      ? 'border-accent text-accent'
                      : 'border-night-600 text-muted',
                )}
              >
                {step > item.number ? <Check size={14} /> : item.number}
              </span>
              <span
                className={cn(
                  'text-[10px] font-semibold uppercase tracking-[0.16em]',
                  step >= item.number ? 'text-cream' : 'text-muted',
                )}
              >
                {item.label}
              </span>
            </div>
            {index < steps.length - 1 ? <span className="h-px flex-1 bg-night-600" /> : null}
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="border border-night-600 bg-night-900/40 p-5 sm:p-8">
          {step === 1 ? (
            <div className="space-y-6">
              <div className="space-y-2">
                <h2 className="font-display text-3xl text-cream">Фотографии вещи</h2>
                <p className="text-sm text-muted">
                  От 2 до 3 фото при хорошем свете: общий вид, детали и дефекты. JPG, PNG или WebP до 10 МБ.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {photos.map((photo) => (
                  <div key={photo.id} className="group relative border border-night-600">
                    <SmartImage src={photo.preview} alt="" className="aspect-[3/4] w-full" />
                    {photo.key ? (
                      <span className="absolute left-2 top-2 flex items-center gap-1 bg-night-950/85 px-2 py-1 text-[9px] uppercase tracking-[0.14em] text-success">
                        <CheckCircle2 size={10} />
                        Загружено
                      </span>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => removePhoto(photo.id)}
                      className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center bg-night-950/85 text-muted transition hover:text-danger"
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
                      'flex aspect-[3/4] cursor-pointer flex-col items-center justify-center gap-3 border border-dashed p-4 text-center transition',
                      isDragActive
                        ? 'border-accent bg-accent/5 text-accent'
                        : 'border-night-500 text-muted hover:border-night-500 hover:text-night-500',
                    )}
                  >
                    <input {...getInputProps()} />
                    <UploadCloud size={26} />
                    <div>
                      <p className="text-xs font-medium">Добавить фото</p>
                      <p className="mt-1 text-[10px] leading-relaxed text-muted">
                        Перетащите или нажмите
                      </p>
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="flex items-center justify-between gap-4 border-t border-night-700 pt-5">
                <p className="text-xs text-muted">
                  {photos.length} из {MAX_PHOTOS} · {photos.filter((photo) => photo.key).length} загружено
                </p>
                <Button
                  onClick={handlePhotosNext}
                  loading={uploading}
                  icon={ArrowRight}
                  disabled={photos.length < 2}
                >
                  Продолжить
                </Button>
              </div>

              {uploading ? (
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] uppercase tracking-[0.14em] text-muted">
                    <span>Загрузка в MinIO</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="h-1 w-full bg-night-700">
                    <div
                      className="h-full bg-cream transition-all duration-300"
                      style={{ width: `${Math.max(progress, 6)}%` }}
                    />
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}

          {step === 2 ? (
            <form onSubmit={handleDetailsNext} className="space-y-6">
              <div className="space-y-2">
                <h2 className="font-display text-3xl text-cream">Детали объявления</h2>
                <p className="text-sm text-muted">Чем точнее описание, тем быстрее вещь найдёт покупателя.</p>
              </div>

              {aiResult ? (
                <div className="flex flex-col gap-3 border border-night-600 bg-night-900/60 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3">
                    <Sparkles size={18} className="mt-0.5 text-muted" />
                    <div>
                      <p className="text-sm text-cream">
                        AI-оценка состояния: <span className="text-cream">{conditionLabel(aiResult.condition)}</span>
                      </p>
                      <p className="text-[11px] text-muted">
                        Уверенность {Math.round(aiResult.confidence * 100)}% · {aiResult.model_version}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={Wand2}
                    onClick={() => updateDetail('condition', aiResult.condition)}
                  >
                    Применить
                  </Button>
                </div>
              ) : null}

              <Field label="Название" htmlFor="title" required hint="Например: Винтажная куртка Carhartt Detroit 90-х">
                <Input
                  id="title"
                  value={details.title}
                  onChange={(event) => updateDetail('title', event.target.value)}
                  maxLength={120}
                  placeholder="Что это за вещь?"
                />
              </Field>

              <Field label="Описание" htmlFor="description" hint="Состояние, история, особенности кроя и дефекты">
                <Textarea
                  id="description"
                  value={details.description}
                  onChange={(event) => updateDetail('description', event.target.value)}
                  maxLength={2000}
                  placeholder="Расскажите о вещи: откуда она, как носилась, что стоит знать покупателю…"
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
                    placeholder="15 000"
                  />
                </Field>
                <Field label="Категория" htmlFor="category_id" required>
                  <Select
                    id="category_id"
                    value={details.category_id}
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
                    value={details.brand_id}
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

              <div className="space-y-3">
                <p className="label">Тип продажи</p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: 'fixed_price', label: 'Фиксированная цена', note: 'Покупатель оформляет сразу' },
                    { value: 'auction', label: 'Аукцион', note: 'Торги до 7 дней' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => updateDetail('sale_type', option.value)}
                      className={cn(
                        'border p-4 text-left transition',
                        details.sale_type === option.value
                          ? 'border-accent bg-accent/[0.06]'
                          : 'border-night-600 hover:border-night-500',
                      )}
                    >
                      <p className="text-sm text-cream">{option.label}</p>
                      <p className="mt-1 text-[11px] text-muted">{option.note}</p>
                    </button>
                  ))}
                </div>
              </div>

              {details.sale_type === 'auction' ? (
                <div className="grid gap-4 border border-night-600 bg-night-900/60 p-4 sm:grid-cols-2">
                  <Field label="Шаг ставки, ₽" htmlFor="increment" required>
                    <Input
                      id="increment"
                      type="number"
                      min={1}
                      value={details.increment}
                      onChange={(event) => updateDetail('increment', event.target.value)}
                    />
                  </Field>
                  <Field label="Длительность" htmlFor="duration" required>
                    <Select
                      id="duration"
                      value={details.duration}
                      onChange={(event) => updateDetail('duration', event.target.value)}
                      options={[
                        { value: '1', label: '1 день' },
                        { value: '3', label: '3 дня' },
                        { value: '5', label: '5 дней' },
                        { value: '7', label: '7 дней' },
                      ]}
                    />
                  </Field>
                  <p className="text-[11px] text-muted sm:col-span-2">
                    Торги начнутся через минуту после публикации. Стартовая цена равна указанной цене.
                  </p>
                </div>
              ) : null}

              <div className="flex items-center justify-between gap-4 border-t border-night-700 pt-5">
                <Button variant="quiet" icon={ArrowLeft} onClick={() => setStep(1)}>
                  Назад
                </Button>
                <Button type="submit" icon={ArrowRight}>
                  К проверке
                </Button>
              </div>
            </form>
          ) : null}

          {step === 3 ? (
            <div className="space-y-6">
              <div className="space-y-2">
                <h2 className="font-display text-3xl text-cream">Проверьте объявление</h2>
                <p className="text-sm text-muted">После публикации вещь уйдёт на модерацию. Обычно это занимает до 24 часов.</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-[160px_1fr]">
                <SmartImage
                  src={photos[0]?.preview}
                  alt={details.title}
                  className="aspect-[3/4] w-full border border-night-600"
                />
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <Badge tone="muted">{categoryName}</Badge>
                    <Badge tone="muted">{brandName}</Badge>
                    <Badge tone="success">{conditionLabel(details.condition)}</Badge>
                    <Badge tone="default">
                      {details.sale_type === 'auction' ? 'Аукцион' : 'Фиксированная цена'}
                    </Badge>
                  </div>
                  <h3 className="font-display text-3xl leading-tight text-cream">{details.title}</h3>
                  <p className="font-display text-2xl text-cream">{formatMoney(Number(details.price))}</p>
                  <div className="grid grid-cols-2 gap-2 text-xs text-muted">
                    <p>Размер: <span className="text-cream">{details.size || '—'}</span></p>
                    <p>Цвет: <span className="text-cream">{details.color || '—'}</span></p>
                    <p>Фото: <span className="text-cream">{photos.length}</span></p>
                    <p>
                      {details.sale_type === 'auction' ? 'Шаг: ' : 'Тип: '}
                      <span className="text-cream">
                        {details.sale_type === 'auction'
                          ? formatMoney(Number(details.increment))
                          : 'фикс. цена'}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              {details.description ? (
                <div className="space-y-2 border-t border-night-700 pt-4">
                  <p className="label">Описание</p>
                  <p className="whitespace-pre-line text-sm leading-relaxed text-muted">{details.description}</p>
                </div>
              ) : null}

              <div className="flex items-center justify-between gap-4 border-t border-night-700 pt-5">
                <Button variant="quiet" icon={ArrowLeft} onClick={() => setStep(2)}>
                  Назад
                </Button>
                <Button
                  icon={UploadCloud}
                  onClick={handlePublish}
                  loading={publishing}
                  disabled={photos.some((photo) => !photo.key)}
                >
                  Опубликовать
                </Button>
              </div>
            </div>
          ) : null}
        </div>

        <aside className="space-y-5">
          <div className="border border-night-600 bg-night-900/60 p-5">
            <p className="label text-muted">Превью</p>
            <SmartImage
              src={photos[0]?.preview}
              alt=""
              className="mt-3 aspect-[3/4] w-full border border-night-700"
            />
            <p className="mt-3 line-clamp-2 font-display text-xl text-cream">
              {details.title || 'Название вещи'}
            </p>
            <p className="mt-1 text-sm text-cream">
              {details.price ? formatMoney(Number(details.price)) : 'Цена не указана'}
            </p>
          </div>

          <div className="border border-night-600 bg-night-900/60 p-5">
            <p className="label flex items-center gap-2">
              <Camera size={13} />
              Советы по фото
            </p>
            <ul className="mt-3 space-y-2 text-xs leading-relaxed text-muted">
              <li>• Снимайте при дневном свете, без вспышки.</li>
              <li>• Покажите общий вид и крупные детали.</li>
              <li>• Не скрывайте дефекты — это повышает доверие.</li>
            </ul>
          </div>

          <div className="border border-night-600 bg-night-900/60 p-5">
            <p className="label">Безопасность</p>
            <p className="mt-3 text-xs leading-relaxed text-muted">
              Оплата проходит через escrow: деньги замораживаются и перечисляются продавцу после получения
              вещи покупателем.
            </p>
          </div>
        </aside>
      </div>

    </div>
  );
}
