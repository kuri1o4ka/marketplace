import { Link, Navigate, Outlet, useLocation } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/auth';
import type { Role } from '../api/types';
import { Spinner } from './ui';

export function ProtectedRoute({ roles }: { roles?: Role[] }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <Spinner size={26} className="text-muted" />
        <p className="label">Проверяем сессию</p>
      </div>
    );
  }

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: `${location.pathname}${location.search}` }}
      />
    );
  }

  if (roles && !roles.includes(user.role)) {
    return (
      <div className="container-luxe flex min-h-[60vh] flex-col items-center justify-center gap-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full border border-danger/30 bg-danger/10 text-danger">
          <ShieldAlert size={26} />
        </div>
        <div className="space-y-2">
          <h1 className="font-display text-4xl text-cream">Доступ закрыт</h1>
          <p className="max-w-md text-sm text-muted">
            {roles?.includes('moderator')
              ? 'Для этого раздела нужна роль модератора. Войдите под аккаунтом модератора, чтобы продолжить.'
              : 'Этот раздел доступен только покупателям и магазинам. Войдите под подходящим аккаунтом, чтобы продолжить.'}
          </p>
        </div>
        <Link to="/" className="btn-ghost">
          Вернуться в каталог
        </Link>
      </div>
    );
  }

  return <Outlet />;
}
