import { useState } from 'react';
import { ImageOff } from 'lucide-react';
import { cn } from '../lib/cn';

type ImageStatus = 'loading' | 'loaded' | 'failed';

export function SmartImage({
  src,
  alt,
  className,
  imgClassName,
  eager = false,
}: {
  src?: string;
  alt: string;
  className?: string;
  imgClassName?: string;
  eager?: boolean;
}) {
  const [status, setStatus] = useState<{ src?: string; value: ImageStatus }>({
    src,
    value: 'loading',
  });

  // Derive the state for the current src without an effect: when src changes,
  // an old "failed"/"loaded" flag from a previous image must not leak through.
  const value: ImageStatus = status.src === src ? status.value : 'loading';

  return (
    <div className={cn('relative overflow-hidden rounded-xl bg-night-850', className)}>
      {value === 'loading' && src ? <div className="skeleton absolute inset-0" /> : null}
      {!src || value === 'failed' ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-night-500">
          <ImageOff size={26} />
          <span className="text-[10px] uppercase tracking-[0.2em]">Нет фото</span>
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          loading={eager ? 'eager' : 'lazy'}
          onLoad={() => setStatus({ src, value: 'loaded' })}
          onError={() => setStatus({ src, value: 'failed' })}
          className={cn(
            'absolute inset-0 h-full w-full object-cover transition duration-700',
            value === 'loaded' ? 'opacity-100' : 'opacity-0',
            imgClassName,
          )}
        />
      )}
    </div>
  );
}
