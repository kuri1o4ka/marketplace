import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { RefreshCw, Search, SlidersHorizontal } from 'lucide-react';
import { listingsApi } from '../api/endpoints';
import type { CatalogParams } from '../api/types';
import { ListingCard, ListingCardSkeleton } from '../components/ListingCard';
import { Button, EmptyState, Field, Input, Pagination, Select } from '../components/ui';
import { CONDITIONS } from '../lib/format';
import { cn } from '../lib/cn';

const PAGE_SIZE = 12;

const conditionOptions = Object.entries(CONDITIONS).map(([value, label]) => ({ value, label }));

const sortOptions = [
  { value: 'newest', label: 'Сначала новые' },
  { value: 'price_asc', label: 'Цена: по возрастанию' },
  { value: 'price_desc', label: 'Цена: по убыванию' },
  { value: 'oldest', label: 'Сначала старые' },
];

function numberParam(value: string | null): number | undefined {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export default function Home() {
  const [searchParams, setSearchParams] = useSearchParams();

  const q = searchParams.get('q') ?? '';
  const categoryId = numberParam(searchParams.get('category_id'));
  const brandId = numberParam(searchParams.get('brand_id'));
  const condition = searchParams.get('condition') ?? '';
  const saleType = searchParams.get('sale_type') ?? '';
  const sort = searchParams.get('sort') ?? 'newest';
  const minPrice = searchParams.get('min_price') ?? '';
  const maxPrice = searchParams.get('max_price') ?? '';
  const page = Math.max(1, numberParam(searchParams.get('page')) ?? 1);

  const [searchInput, setSearchInput] = useState(q);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [trackedQuery, setTrackedQuery] = useState(q);

  // Reflect external URL changes (reset button, history navigation) in the input.
  if (trackedQuery !== q) {
    setTrackedQuery(q);
    setSearchInput(q);
  }

  const filters: CatalogParams = useMemo(
    () => ({
      q: q || undefined,
      category_id: categoryId,
      brand_id: brandId,
      condition: condition || undefined,
      sale_type: saleType || undefined,
      min_price: numberParam(minPrice),
      max_price: numberParam(maxPrice),
      sort,
      page,
      limit: PAGE_SIZE,
    }),
    [q, categoryId, brandId, condition, saleType, minPrice, maxPrice, sort, page],
  );

  const catalog = useQuery({
    queryKey: ['catalog', filters],
    queryFn: () => listingsApi.catalog(filters),
    placeholderData: keepPreviousData,
  });

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

  const updateFilter = (key: string, value: string | number | undefined) => {
    const next = new URLSearchParams(searchParams);
    if (value === undefined || value === '') {
      next.delete(key);
    } else {
      next.set(key, String(value));
    }
    if (key !== 'page') next.delete('page');
    setSearchParams(next, { replace: true });
  };

  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    updateFilter('q', searchInput.trim());
  };

  const resetFilters = () => {
    setSearchParams(new URLSearchParams(), { replace: true });
    setSearchInput('');
  };

  const items = catalog.data?.items ?? [];
  const total = catalog.data?.total ?? 0;
  const hasFilters = Boolean(
    q || categoryId || brandId || condition || saleType || minPrice || maxPrice,
  );

  return (
    <div>
      {/* Hero */}
      <section className="border-b border-night-600">
        <div className="container-luxe py-16 text-center md:py-24">
          <p className="label text-muted">Маркетплейс архивной одежды</p>
          <h1 className="mx-auto mt-6 w-full text-center font-display text-5xl leading-[1.05] text-cream sm:text-6xl lg:text-7xl">
            <span className="block">
              <span className="bg-cream px-2 text-night-950 sm:px-3">Вещи с историей.</span>
            </span>
            <span className="mt-2 block animate-fadeUp">Новая жизнь.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-sm leading-relaxed text-muted sm:text-base">
            Покупайте у проверенных продавцов и продавайте то, что заслуживает второй жизни.
            Один аккаунт для покупок, ставок и продажи.
          </p>
        </div>
      </section>

      {/* Catalog */}
      <section id="catalog" className="container-luxe scroll-mt-24 py-12 md:py-16">
        <div className="flex flex-col gap-6 border-b border-night-600 pb-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="label text-muted">Каталог</p>
              <h2 className="mt-2 font-display text-4xl text-cream">Находки сезона</h2>
            </div>
            <p className="text-xs text-muted">
              {catalog.isFetching && !catalog.isLoading ? 'Обновляем…' : `Найдено ${total}`}
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <form onSubmit={submitSearch} className="relative flex-1">
                <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
                <Input
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  placeholder="Бренд, категория или название вещи"
                  className="pl-11 pr-28"
                  aria-label="Поиск по каталогу"
                />
                <button
                  type="submit"
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-accent px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-night-950 transition hover:bg-accent-light"
                >
                  Найти
                </button>
              </form>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  icon={SlidersHorizontal}
                  onClick={() => setFiltersOpen((open) => !open)}
                  className={cn(filtersOpen && 'border-accent text-accent')}
                >
                  Фильтры
                </Button>
                {hasFilters ? (
                  <Button variant="quiet" icon={RefreshCw} onClick={resetFilters}>
                    Сбросить
                  </Button>
                ) : null}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => updateFilter('category_id', undefined)}
                className={cn(
                  'border rounded-full px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] transition',
                  !categoryId
                    ? 'border-accent bg-accent text-night-950'
                    : 'border-night-600 text-muted hover:border-accent hover:text-accent',
                )}
              >
                Все категории
              </button>
              {(categories.data ?? []).map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => updateFilter('category_id', category.id)}
                  className={cn(
                    'border rounded-full px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] transition',
                    categoryId === category.id
                      ? 'border-accent bg-accent text-night-950'
                      : 'border-night-600 text-muted hover:border-accent hover:text-accent',
                  )}
                >
                  {category.name}
                </button>
              ))}
            </div>

            {filtersOpen ? (
              <div className="grid gap-4 border border-night-600 bg-night-900/60 rounded-xl p-4 sm:grid-cols-2 lg:grid-cols-4 animate-fadeUp">
                <Field label="Бренд">
                  <Select
                    value={brandId ? String(brandId) : ''}
                    onChange={(event) => updateFilter('brand_id', event.target.value)}
                    options={(brands.data ?? []).map((brand) => ({ value: String(brand.id), label: brand.name }))}
                    placeholder="Любой бренд"
                  />
                </Field>
                <Field label="Состояние">
                  <Select
                    value={condition}
                    onChange={(event) => updateFilter('condition', event.target.value)}
                    options={conditionOptions}
                    placeholder="Любое"
                  />
                </Field>
                <Field label="Тип продажи">
                  <Select
                    value={saleType}
                    onChange={(event) => updateFilter('sale_type', event.target.value)}
                    options={[
                      { value: 'fixed_price', label: 'Фиксированная цена' },
                      { value: 'auction', label: 'Аукцион' },
                    ]}
                    placeholder="Любой"
                  />
                </Field>
                <Field label="Сортировка">
                  <Select
                    value={sort}
                    onChange={(event) => updateFilter('sort', event.target.value)}
                    options={sortOptions}
                  />
                </Field>
                <Field label="Цена от, ₽">
                  <Input
                    type="number"
                    min={0}
                    inputMode="numeric"
                    value={minPrice}
                    onChange={(event) => updateFilter('min_price', event.target.value)}
                    placeholder="0"
                  />
                </Field>
                <Field label="Цена до, ₽">
                  <Input
                    type="number"
                    min={0}
                    inputMode="numeric"
                    value={maxPrice}
                    onChange={(event) => updateFilter('max_price', event.target.value)}
                    placeholder="100 000"
                  />
                </Field>
                <div className="flex items-end sm:col-span-2">
                  <p className="text-xs leading-relaxed text-muted">
                    Фильтры применяются сразу и сохраняются в ссылке — можно делиться подборкой.
                  </p>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <div className="pt-8">
          {catalog.isLoading ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }, (_, index) => (
                <ListingCardSkeleton key={index} />
              ))}
            </div>
          ) : catalog.isError ? (
            <EmptyState
              icon={RefreshCw}
              title="Каталог не загрузился"
              description="Проверьте, что API запущен на localhost:8080, и попробуйте снова."
              action={
                <Button variant="ghost" onClick={() => catalog.refetch()} loading={catalog.isFetching}>
                  Повторить
                </Button>
              }
            />
          ) : items.length === 0 ? (
            <EmptyState
              icon={Search}
              title="Ничего не нашли"
              description="Попробуйте изменить запрос, снять фильтры или заглянуть в аукционы — там всегда есть редкие лоты."
              action={
                hasFilters ? (
                  <Button variant="ghost" onClick={resetFilters}>
                    Сбросить фильтры
                  </Button>
                ) : (
                  <Link to="/auctions" className="btn-ghost">
                    Перейти к аукционам
                  </Link>
                )
              }
            />
          ) : (
            <>
              <div
                className={cn(
                  'grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
                  catalog.isFetching && 'opacity-60 transition-opacity',
                )}
              >
                {items.map((listing, index) => (
                  <ListingCard key={listing.id} listing={listing} index={index} />
                ))}
              </div>

              <div className="mt-12 flex flex-col items-center gap-4">
                <p className="text-xs text-muted">
                  Показано {items.length} из {total}
                </p>
                <Pagination
                  page={page}
                  total={total}
                  limit={PAGE_SIZE}
                  onChange={(nextPage) => updateFilter('page', nextPage)}
                />
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
