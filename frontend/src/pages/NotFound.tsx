import { Link } from 'react-router-dom';
import { ArrowLeft, Compass, Gavel, Search } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="container-luxe flex min-h-[70vh] flex-col items-center justify-center py-16 text-center">
      <p className="font-display text-[112px] leading-none text-cream/20">404</p>
      <h1 className="-mt-4 font-display text-4xl text-cream sm:text-5xl">Страница ушла в архив</h1>
      <p className="mt-4 max-w-md text-sm leading-relaxed text-muted">
        Такой страницы нет или она была перемещена. Зато в каталоге точно есть что-то редкое.
      </p>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link to="/" className="btn-primary">
          <ArrowLeft size={15} />
          В каталог
        </Link>
        <Link to="/auctions" className="btn-ghost">
          <Gavel size={15} />
          Аукционы
        </Link>
      </div>

      <div className="mt-14 grid w-full max-w-2xl gap-3 text-left sm:grid-cols-3">
        {[
          { icon: Compass, title: 'Каталог', text: 'Архивные вещи с проверкой', to: '/' },
          { icon: Gavel, title: 'Аукционы', text: 'Редкие лоты и ставки', to: '/auctions' },
          { icon: Search, title: 'Поиск', text: 'Бренд, категория, название', to: '/' },
        ].map((item) => (
          <Link
            key={item.title}
            to={item.to}
            className="flex items-start gap-3 border border-night-600 bg-night-900/40 p-4 transition hover:border-accent/60"
          >
            <item.icon size={17} className="mt-0.5 text-muted" />
            <div>
              <p className="text-sm text-cream">{item.title}</p>
              <p className="mt-1 text-[11px] text-muted">{item.text}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
