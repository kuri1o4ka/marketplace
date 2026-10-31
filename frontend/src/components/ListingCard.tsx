import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight, ChevronLeft, ChevronRight, Gavel } from 'lucide-react';
import type { ListingSummary } from '../api/types';
import { formatMoney } from '../lib/format';
import { Badge, Skeleton, VerifiedShopBadge } from './ui';
import { SmartImage } from './SmartImage';
import { cn } from '../lib/cn';

export function ListingCard({ listing, index = 0 }: { listing: ListingSummary; index?: number }) {
  const navigate = useNavigate();
  const isAuction = listing.sale_type === 'auction';
  const images = listing.images.length > 0 ? listing.images : [listing.cover_image].filter(Boolean);
  const [activeImage, setActiveImage] = useState(0);
  const hasGallery = images.length > 1;

  const target = isAuction ? '/auctions' : `/listing/${listing.id}`;

  const cycle = (direction: -1 | 1) => {
    setActiveImage((current) => (current + direction + images.length) % images.length);
  };

  const edgeClass =
    'absolute inset-y-0 z-10 flex w-[26%] items-center justify-center text-cream opacity-0 transition duration-200 group-hover:opacity-100';

  return (
    <div
      role="link"
      tabIndex={0}
      onClick={() => navigate(target)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          navigate(target);
        }
      }}
      className="group flex cursor-pointer flex-col rounded-xl border border-night-600 bg-night-900/60 transition duration-300 hover:border-accent/60 hover:bg-night-900 animate-fadeUp"
      style={{ animationDelay: `${Math.min(index, 8) * 45}ms` }}
    >
      <div className="relative overflow-hidden rounded-t-xl">
        <SmartImage
          src={images[activeImage]}
          alt={listing.title}
          className="aspect-[3/4] w-full"
          imgClassName="group-hover:scale-[1.04]"
        />

        <div className="absolute left-3 top-3 z-20">
          {isAuction ? (
            <Badge tone="accent">
              <Gavel size={11} />
              Аукцион
            </Badge>
          ) : null}
        </div>

        {hasGallery ? (
          <>
            <button
              type="button"
              aria-label="Предыдущее фото"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                cycle(-1);
              }}
              className={cn(edgeClass, 'left-0 bg-gradient-to-r from-night-950/60 to-transparent')}
            >
              <ChevronLeft size={22} />
            </button>
            <button
              type="button"
              aria-label="Следующее фото"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                cycle(1);
              }}
              className={cn(edgeClass, 'right-0 bg-gradient-to-l from-night-950/60 to-transparent')}
            >
              <ChevronRight size={22} />
            </button>
            <div className="absolute inset-x-0 bottom-14 z-20 flex items-center justify-center gap-1.5">
              {images.map((image, imageIndex) => (
                <span
                  key={`${image}-${imageIndex}`}
                  className={cn(
                    'h-1.5 rounded-full transition-all',
                    imageIndex === activeImage ? 'w-4 bg-cream' : 'w-1.5 bg-cream/40',
                  )}
                />
              ))}
            </div>
          </>
        ) : null}

        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between bg-gradient-to-t from-night-950/90 via-night-950/30 to-transparent p-4 opacity-0 transition duration-300 group-hover:opacity-100">
          <span className="text-[10px] uppercase tracking-[0.2em] text-cream/80">{listing.seller_name}</span>
          <ArrowUpRight size={18} className="text-cream" />
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <p className="text-[10px] uppercase tracking-[0.2em] text-muted">
          {listing.brand || 'Без бренда'} · {listing.category}
        </p>
        <h3 className="line-clamp-2 font-display text-xl leading-snug text-cream transition group-hover:text-accent">
          {listing.title}
        </h3>
        {listing.seller_role === 'shop' ? (
          <div>
            <VerifiedShopBadge />
          </div>
        ) : null}
        <div className="mt-auto flex items-baseline justify-between pt-3">
          <span className="text-sm font-semibold tracking-wide text-cream">{formatMoney(listing.price)}</span>
          <span className="text-[10px] uppercase tracking-[0.18em] text-muted">{isAuction ? 'ставка' : 'цена'}</span>
        </div>
      </div>
    </div>
  );
}

export function ListingCardSkeleton() {
  return (
    <div className="rounded-xl border border-night-600 bg-night-900/60">
      <Skeleton className="aspect-[3/4] w-full rounded-t-xl" />
      <div className="space-y-3 p-4">
        <Skeleton className="h-2.5 w-24" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
  );
}
