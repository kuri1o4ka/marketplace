import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

export function AuthShell({
  eyebrow,
  title,
  subtitle,
  children,
  footer,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <div className="container-luxe py-12 md:py-20">
      <div className="mx-auto w-full max-w-md border border-night-600 bg-night-900 rounded-xl p-6 sm:p-10">
        <Link to="/" className="font-display text-xl tracking-[0.12em] text-cream">
          POLYCLOTHES.
        </Link>

        <div className="mt-8 space-y-3">
          <p className="label text-muted">{eyebrow}</p>
          <h1 className="font-display text-3xl leading-tight text-cream sm:text-4xl">{title}</h1>
          <p className="text-sm leading-relaxed text-muted">{subtitle}</p>
        </div>

        <div className="mt-8">{children}</div>
        <div className="mt-6 border-t border-night-600 pt-5 text-sm text-muted">{footer}</div>
      </div>
    </div>
  );
}
