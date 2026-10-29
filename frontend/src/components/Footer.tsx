import { Link } from 'react-router-dom';
import { ArrowUpRight, AtSign, Mail, ShieldCheck } from 'lucide-react';

const columns = [
  {
    title: 'Маркетплейс',
    links: [
      { label: 'Каталог', to: '/' },
      { label: 'Аукционы', to: '/auctions' },
      { label: 'Продать вещь', to: '/sell' },
      { label: 'Мои лоты', to: '/my-listings' },
    ],
  },
  {
    title: 'Аккаунт',
    links: [
      { label: 'Заказы', to: '/orders' },
      { label: 'Кошелёк', to: '/wallet' },
      { label: 'Корзина', to: '/cart' },
    ],
  },
];

const currentYear = new Date().getFullYear();

const columnTitle = 'text-[11px] font-semibold uppercase tracking-luxe text-night-500';

export function Footer() {
  return (
    <footer className="mt-24 border-t border-night-600 bg-white text-night-950">
      <div className="container-luxe grid gap-12 py-16 md:grid-cols-[1.4fr_1fr_1fr_1.1fr]">
        <div className="space-y-5">
          <Link to="/" className="font-display text-3xl tracking-[0.12em] text-night-950">
            POLYCLOTHES.
          </Link>
          <p className="max-w-xs text-sm leading-relaxed text-night-600">
            Маркетплейс архивной и винтажной одежды. Каждая вещь проходит ручную и AI-проверку.
          </p>
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-muted">
            <ShieldCheck size={14} />
            Проверено экспертами
          </div>
        </div>

        {columns.map((column) => (
          <div key={column.title} className="space-y-4">
            <p className={columnTitle}>{column.title}</p>
            <ul className="space-y-2.5">
              {column.links.map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="text-sm text-night-600 transition hover:text-night-950">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div className="space-y-4">
          <p className={columnTitle}>Связь</p>
          <a
            href="mailto:hello@polyclothes.ru"
            className="flex items-center gap-2 text-sm text-night-600 transition hover:text-night-950"
          >
            <Mail size={15} />
            hello@polyclothes.ru
          </a>
          <a
            href="https://instagram.com"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 text-sm text-night-600 transition hover:text-night-950"
          >
            <AtSign size={15} />
            @polyclothes
            <ArrowUpRight size={13} />
          </a>
          <p className="pt-2 text-xs leading-relaxed text-night-500">
            Демонстрационный проект. Платежи и доставка имитируются.
          </p>
        </div>
      </div>

      <div className="border-t border-night-600">
        <div className="container-luxe flex flex-col gap-2 py-5 text-[10px] uppercase tracking-[0.16em] text-night-500 sm:flex-row sm:items-center sm:justify-between">
          <span>© {currentYear} Polyclothes</span>
          <span>Vintage marketplace · Moscow</span>
        </div>
      </div>
    </footer>
  );
}
