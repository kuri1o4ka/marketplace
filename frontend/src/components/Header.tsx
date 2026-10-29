import { useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ChevronDown,
  Gavel,
  LogOut,
  Menu,
  Package,
  PlusSquare,
  ShieldCheck,
  ShoppingBag,
  Tags,
  User as UserIcon,
  Wallet,
  X,
} from 'lucide-react';
import { cartApi } from '../api/endpoints';
import { useAuth } from '../context/auth';
import { useToast } from '../context/toast';
import { cn } from '../lib/cn';
import { formatMoney } from '../lib/format';
import { Avatar } from './ui';

const baseLinks = [
  { to: '/', label: 'Каталог', end: true },
  { to: '/auctions', label: 'Аукционы', icon: Gavel },
];

const privateLinks = [
  { to: '/sell', label: 'Продать', icon: PlusSquare },
  { to: '/my-listings', label: 'Мои лоты', icon: Tags },
  { to: '/orders', label: 'Заказы', icon: Package },
  { to: '/wallet', label: 'Кошелёк', icon: Wallet },
  { to: '/profile', label: 'Профиль', icon: UserIcon },
];

export function Header() {
  const { user, isAuthenticated, logout, hasRole } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [trackedPath, setTrackedPath] = useState(location.pathname);

  // Close both menus whenever navigation happens. Adjusting state during
  // render is the documented alternative to a synchronising effect.
  if (trackedPath !== location.pathname) {
    setTrackedPath(location.pathname);
    setMobileOpen(false);
    setUserMenuOpen(false);
  }

  const { data: cart } = useQuery({
    queryKey: ['cart'],
    queryFn: cartApi.get,
    enabled: isAuthenticated,
    staleTime: 15_000,
  });

  const handleLogout = async () => {
    await logout();
    toast.info('Вы вышли из аккаунта');
    navigate('/');
  };

  const cartCount = cart?.items.length ?? 0;
  const links = [...baseLinks, ...(isAuthenticated ? privateLinks : [])];

  const navClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      'relative py-1 text-[11px] font-semibold uppercase tracking-[0.18em] transition',
      isActive ? 'text-night-950' : 'text-night-600 hover:text-night-950',
    );

  return (
    <header className="sticky top-0 z-50 border-b border-night-600 bg-cream text-night-950 backdrop-blur-xl">
      <div className="container-luxe relative flex h-[72px] items-center justify-between gap-6">
        <Link to="/" className="font-display text-2xl tracking-[0.12em] text-night-950 transition hover:text-night-600">
          POLYCLOTHES.
        </Link>

        <nav className="hidden items-center gap-8 lg:flex">
          {links.map((link) => (
            <NavLink key={link.to} to={link.to} end={'end' in link ? link.end : undefined} className={navClass}>
              {link.label}
            </NavLink>
          ))}
          {hasRole('moderator', 'admin') ? (
            <NavLink to="/moderation" className={navClass}>
              Модерация
            </NavLink>
          ) : null}
        </nav>

        <div className="flex items-center gap-2 sm:gap-4">
          <Link
            to="/cart"
            className="relative flex h-10 w-10 items-center justify-center text-night-600 transition hover:text-night-950"
            aria-label="Корзина"
          >
            <ShoppingBag size={20} />
            {cartCount > 0 ? (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-night-950">
                {cartCount}
              </span>
            ) : null}
          </Link>

          {isAuthenticated && user ? (
            <div className="relative hidden sm:block">
              <button
                type="button"
                onClick={() => setUserMenuOpen((open) => !open)}
                className="flex items-center gap-2 border border-night-600 py-1.5 pl-1.5 pr-3 text-left transition hover:border-night-950"
              >
                <Avatar name={user.display_name} size={30} />
                <span className="hidden max-w-28 truncate text-xs font-medium text-night-950 md:block">
                  {user.display_name}
                </span>
                <ChevronDown size={14} className={cn('text-night-600 transition', userMenuOpen && 'rotate-180')} />
              </button>

              {userMenuOpen ? (
                <>
                  <button
                    type="button"
                    className="fixed inset-0 z-40 cursor-default"
                    onClick={() => setUserMenuOpen(false)}
                    aria-label="Закрыть меню"
                  />
                  <div className="absolute right-0 z-50 mt-3 w-64 rounded-xl border border-night-600 bg-night-900 shadow-card">
                    <div className="border-b border-night-700 px-4 py-3">
                      <p className="truncate text-sm text-cream">{user.display_name}</p>
                      <p className="truncate text-xs text-muted">{user.email}</p>
                      <p className="mt-2 text-[10px] uppercase tracking-[0.16em] text-cream">
                        {formatMoney(Number(user.balance), true)}
                      </p>
                    </div>
                    <div className="flex flex-col py-1 text-sm">
                      {privateLinks.map((link) => (
                        <Link
                          key={link.to}
                          to={link.to}
                          className="flex items-center gap-3 px-4 py-2.5 text-muted transition hover:bg-night-800 hover:text-cream"
                        >
                          <link.icon size={15} />
                          {link.label}
                        </Link>
                      ))}
                      {hasRole('moderator', 'admin') ? (
                        <Link
                          to="/moderation"
                          className="flex items-center gap-3 px-4 py-2.5 text-muted transition hover:bg-night-800 hover:text-cream"
                        >
                          <ShieldCheck size={15} />
                          Модерация
                        </Link>
                      ) : null}
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="flex items-center gap-3 border-t border-night-700 px-4 py-2.5 text-left text-muted transition hover:bg-night-800 hover:text-danger"
                      >
                        <LogOut size={15} />
                        Выйти
                      </button>
                    </div>
                  </div>
                </>
              ) : null}
            </div>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Link to="/login" className="btn-ghost px-3 py-2">
                <UserIcon size={15} />
                Войти
              </Link>
              <Link to="/register" className="btn-ghost px-4 py-2 text-[10px]">
                Регистрация
              </Link>
            </div>
          )}

          <button
            type="button"
            onClick={() => setMobileOpen((open) => !open)}
            className="flex h-10 w-10 items-center justify-center text-night-600 transition hover:text-night-950 lg:hidden"
            aria-label="Меню"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {mobileOpen ? (
        <div className="absolute inset-x-0 top-full border-b border-night-600 bg-cream backdrop-blur-xl lg:hidden">
          <nav className="container-luxe flex flex-col py-4">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={'end' in link ? link.end : undefined}
                className={({ isActive }) =>
                  cn(
                    'border-b border-night-700 py-3 text-xs font-semibold uppercase tracking-[0.18em] transition',
                    isActive ? 'text-night-950' : 'text-night-600',
                  )
                }
              >
                {link.label}
              </NavLink>
            ))}
            {hasRole('moderator', 'admin') ? (
              <NavLink
                to="/moderation"
                className={({ isActive }) =>
                  cn(
                    'border-b border-night-700 py-3 text-xs font-semibold uppercase tracking-[0.18em]',
                    isActive ? 'text-night-950' : 'text-night-600',
                  )
                }
              >
                Модерация
              </NavLink>
            ) : null}

            {isAuthenticated && user ? (
              <div className="flex items-center justify-between pt-4">
                <div className="flex items-center gap-3">
                  <Avatar name={user.display_name} size={34} />
                  <div>
                    <p className="text-sm text-cream">{user.display_name}</p>
                    <p className="text-[10px] uppercase tracking-[0.14em] text-cream">
                      {formatMoney(Number(user.balance), true)}
                    </p>
                  </div>
                </div>
                <button type="button" onClick={handleLogout} className="btn-ghost px-3 py-2">
                  <LogOut size={14} />
                  Выйти
                </button>
              </div>
            ) : (
              <div className="flex gap-3 pt-4">
                <Link to="/login" className="btn-ghost flex-1 py-2.5">
                  Войти
                </Link>
                <Link to="/register" className="btn-primary flex-1 py-2.5">
                  Регистрация
                </Link>
              </div>
            )}
          </nav>
        </div>
      ) : null}
    </header>
  );
}
