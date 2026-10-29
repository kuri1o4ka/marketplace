import { Link } from 'react-router-dom';
import { ArrowUpRight, Gavel } from 'lucide-react';
import type { ListingSummary } from '../api/types';
import { formatMoney } from '../lib/format';
import { Badge, Skeleton } from './ui';
import { SmartImage } from './SmartImage';

export function ListingCard({ listing, index = 0 }: { listing: ListingSummary; index?: number }) {
  const isAuction = listing.sale_type === 'auction';

  return (
    <Link
      to={isAuction ? '/auctions' : `/listing/${listing.id}`}
      className="group flex flex-col border border-night-600 bg-night-900/60 rounded-xl transition duration-300 hover:border-accent/60 hover:bg-night-900 animate-fadeUp"
      style={{ animationDelay: `${Math.min(index, 8) * 45}ms` }}
    >
      <div className="relative overflow-hidden rounded-xl">
        <SmartImage
          src={listing.cover_image}
          alt={listing.title}
          className="aspect-[3/4] w-full"
          imgClassName="group-hover:scale-[1.04]"
        />
        <div className="absolute left-3 top-3">
          {isAuction ? (
            <Badge tone="accent">
              <Gavel size={11} />
              Аукцион
            </Badge>
          ) : null}
        </div>
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between bg-gradient-to-t from-night-950/90 via-night-950/30 to-transparent p-4 opacity-0 transition duration-300 group-hover:opacity-100">
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
        <div className="mt-auto flex items-baseline justify-between pt-3">
          <span className="text-sm font-semibold tracking-wide text-cream">{formatMoney(listing.price)}</span>
          <span className="text-[10px] uppercase tracking-[0.18em] text-muted">{isAuction ? 'ставка' : 'цена'}</span>
        </div>
      </div>
    </Link>
  );
}

export function ListingCardSkeleton() {
  return (
    <div className="border border-night-600 bg-night-900/60 rounded-xl">
      <Skeleton className="aspect-[3/4] w-full" />
      <div className="space-y-3 p-4">
        <Skeleton className="h-2.5 w-24" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
  );
}
