import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import { getErrorMessage } from '../api/client';
import { AuthShell } from '../components/AuthShell';
import { Button, Field, Input } from '../components/ui';
import { useAuth } from '../context/auth';
import { useToast } from '../context/toast';

const demoAccounts = [
  { label: 'Покупатель', email: 'buyer@example.com', note: 'баланс 250 000 ₽' },
  { label: 'Продавец', email: 'seller@example.com', note: 'свои лоты' },
  { label: 'Модератор', email: 'moderator@example.com', note: 'доступ к модерации' },
];

export default function Login() {
  const { login, user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  const from = (location.state as { from?: string } | null)?.from ?? '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!loading && user) {
    return <Navigate to={from} replace />;
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const me = await login({ email: email.trim(), password });
      toast.success(`С возвращением, ${me.display_name}`);
      navigate(from, { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, 'Не удалось войти'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Вход"
      title="Вход в аккаунт"
      subtitle="Войдите, чтобы покупать, делать ставки и управлять своими лотами."
      footer={
        <p>
          Нет аккаунта?{' '}
          <Link to="/register" className="text-accent transition hover:text-accent-light">
            Зарегистрироваться
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <Field label="Email" htmlFor="email" required>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
          />
        </Field>

        <Field label="Пароль" htmlFor="password" required>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              className="pr-12"
            />
            <button
              type="button"
              onClick={() => setShowPassword((visible) => !visible)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted transition hover:text-cream"
              aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
            >
              {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
        </Field>

        {error ? (
          <p className="border border-danger/30 bg-danger/10 px-4 py-3 text-xs text-danger">{error}</p>
        ) : null}

        <Button type="submit" className="w-full" icon={LogIn} loading={submitting}>
          Войти
        </Button>
      </form>

      <div className="space-y-3 border border-night-600 bg-night-900/70 p-4">
        <p className="label">Демо-аккаунты · пароль password123</p>
        <div className="grid gap-2">
          {demoAccounts.map((account) => (
            <button
              key={account.email}
              type="button"
              onClick={() => {
                setEmail(account.email);
                setPassword('password123');
                setError('');
              }}
              className="flex items-center justify-between gap-3 border border-night-600 px-3 py-2 text-left transition hover:border-cream"
            >
              <div>
                <p className="text-xs text-cream">{account.label}</p>
                <p className="text-[10px] text-muted">{account.email}</p>
              </div>
              <span className="text-[10px] uppercase tracking-[0.12em] text-muted">{account.note}</span>
            </button>
          ))}
        </div>
      </div>
    </AuthShell>
  );
}
