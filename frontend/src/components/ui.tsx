import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react';
import type { LucideIcon } from 'lucide-react';
import { ChevronLeft, ChevronRight, Loader2, ShieldCheck } from 'lucide-react';
import { cn } from '../lib/cn';

/* ---------- Spinner ---------- */

export function Spinner({ size = 18, className }: { size?: number; className?: string }) {
  return <Loader2 size={size} className={cn('animate-spin', className)} />;
}

/* ---------- Button ---------- */

type ButtonVariant = 'primary' | 'ghost' | 'quiet' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: LucideIcon;
}

const variantClass: Record<ButtonVariant, string> = {
  primary: 'btn-primary',
  ghost: 'btn-ghost',
  quiet: 'btn-quiet',
  danger: 'btn border border-danger/40 text-danger hover:bg-danger/10',
};

const sizeClass: Record<ButtonSize, string> = {
  sm: 'px-4 py-2 text-[10px]',
  md: '',
  lg: 'px-8 py-4 text-[13px]',
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon: Icon,
  className,
  children,
  disabled,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={cn(variantClass[variant], sizeClass[size], className)}
      {...props}
    >
      {loading ? <Spinner size={16} /> : Icon ? <Icon size={16} /> : null}
      {children}
    </button>
  );
}

/* ---------- Form fields ---------- */

export function Field({
  label,
  htmlFor,
  hint,
  error,
  required,
  children,
  className,
}: {
  label?: string;
  htmlFor?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {label ? (
        <label htmlFor={htmlFor} className="label">
          {label}
          {required ? <span className="ml-1 text-muted">*</span> : null}
        </label>
      ) : null}
      {children}
      {error ? <p className="text-xs text-danger">{error}</p> : hint ? <p className="text-xs text-muted">{hint}</p> : null}
    </div>
  );
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn('input', className)} {...props} />;
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn('input min-h-32 resize-y', className)} {...props} />;
}

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  options: SelectOption[];
  placeholder?: string;
}

export function Select({ options, placeholder, className, ...props }: SelectProps) {
  return (
    <select className={cn('input appearance-none pr-10', className)} {...props}>
      {placeholder ? <option value="">{placeholder}</option> : null}
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

/* ---------- Badge ---------- */

type BadgeTone = 'default' | 'accent' | 'success' | 'danger' | 'muted';

const badgeToneClass: Record<BadgeTone, string> = {
  default: 'border-night-600 bg-night-850 text-cream',
  accent: 'border-accent/40 bg-accent/10 text-accent',
  success: 'border-success/30 bg-success/10 text-success',
  danger: 'border-danger/30 bg-danger/10 text-danger',
  muted: 'border-night-600 bg-night-900 text-muted',
};

export function Badge({
  children,
  tone = 'default',
  className,
}: {
  children: ReactNode;
  tone?: BadgeTone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em]',
        badgeToneClass[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/* ---------- Verified shop badge ---------- */

export function VerifiedShopBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-accent',
        className,
      )}
      title="Верифицированный магазин"
    >
      <ShieldCheck size={11} />
      Верифицированный магазин
    </span>
  );
}

/* ---------- Skeleton ---------- */

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton', className)} />;
}

/* ---------- Empty state ---------- */

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-night-600 px-6 py-20 text-center', className)}>
      {Icon ? (
        <div className="flex h-14 w-14 items-center justify-center rounded-full border border-night-600 bg-night-900 text-muted">
          <Icon size={22} />
        </div>
      ) : null}
      <div className="space-y-2">
        <h3 className="font-display text-2xl text-cream">{title}</h3>
        {description ? <p className="mx-auto max-w-md text-sm leading-relaxed text-muted">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

/* ---------- Page header ---------- */

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col gap-6 border-b border-night-600 pb-8 md:flex-row md:items-end md:justify-between', className)}>
      <div className="space-y-3">
        {eyebrow ? <p className="label text-muted">{eyebrow}</p> : null}
        <h1 className="font-display text-4xl leading-none text-cream sm:text-5xl">{title}</h1>
        {description ? <p className="max-w-2xl text-sm leading-relaxed text-muted">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-3">{actions}</div> : null}
    </div>
  );
}

/* ---------- Pagination ---------- */

function pageNumbers(current: number, total: number): Array<number | 'gap'> {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: Array<number | 'gap'> = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  if (start > 2) pages.push('gap');
  for (let page = start; page <= end; page += 1) pages.push(page);
  if (end < total - 1) pages.push('gap');
  pages.push(total);
  return pages;
}

export function Pagination({
  page,
  total,
  limit,
  onChange,
}: {
  page: number;
  total: number;
  limit: number;
  onChange: (page: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  if (totalPages <= 1) return null;

  return (
    <nav className="flex items-center justify-center gap-2" aria-label="Пагинация">
      <button
        type="button"
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        className="flex h-10 w-10 items-center justify-center rounded-lg border border-night-600 text-muted transition hover:border-accent hover:text-accent disabled:opacity-30"
        aria-label="Предыдущая страница"
      >
        <ChevronLeft size={16} />
      </button>

      {pageNumbers(page, totalPages).map((item, index) =>
        item === 'gap' ? (
          <span key={`gap-${index}`} className="px-1 text-muted">
            …
          </span>
        ) : (
          <button
            key={item}
            type="button"
            onClick={() => onChange(item)}
            className={cn(
              'h-10 min-w-10 rounded-lg border px-3 text-sm transition',
              item === page
                ? 'border-accent bg-accent text-night-950'
                : 'border-night-600 text-muted hover:border-accent hover:text-accent',
            )}
            aria-current={item === page ? 'page' : undefined}
          >
            {item}
          </button>
        ),
      )}

      <button
        type="button"
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
        className="flex h-10 w-10 items-center justify-center rounded-lg border border-night-600 text-muted transition hover:border-accent hover:text-accent disabled:opacity-30"
        aria-label="Следующая страница"
      >
        <ChevronRight size={16} />
      </button>
    </nav>
  );
}

/* ---------- Avatar ---------- */

export function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full border border-night-600 bg-night-900 font-display text-cream"
      style={{ width: size, height: size, fontSize: Math.round(size / 2.6) }}
      aria-hidden="true"
    >
      {initials || 'P'}
    </div>
  );
}
