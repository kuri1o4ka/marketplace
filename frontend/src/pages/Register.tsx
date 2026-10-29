import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, UserPlus } from 'lucide-react';
import { getErrorMessage } from '../api/client';
import { AuthShell } from '../components/AuthShell';
import { Button, Field, Input } from '../components/ui';
import { useAuth } from '../context/auth';
import { useToast } from '../context/toast';

export default function Register() {
  const { register, user, loading } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!loading && user) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Пароль должен содержать минимум 8 символов');
      return;
    }
    if (password !== confirm) {
      setError('Пароли не совпадают');
      return;
    }

    setSubmitting(true);
    try {
      const me = await register({
        email: email.trim(),
        password,
        display_name: displayName.trim(),
      });
      toast.success(`Аккаунт создан. Добро пожаловать, ${me.display_name}`);
      navigate('/', { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, 'Не удалось создать аккаунт'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Регистрация"
      title="Создание аккаунта"
      subtitle="Один аккаунт для покупок, ставок и продажи архивных вещей."
      footer={
        <p>
          Уже есть аккаунт?{' '}
          <Link to="/login" className="text-accent transition hover:text-accent-light">
            Войти
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <Field label="Как вас зовут" htmlFor="display_name" required>
          <Input
            id="display_name"
            required
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            placeholder="Анна Покупатель"
            autoComplete="name"
          />
        </Field>

        <Field label="Email" htmlFor="email" required>
          <Input
            id="email"
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
          />
        </Field>

        <div className="space-y-5">
          <Field label="Пароль" htmlFor="password" required hint="Минимум 8 символов">
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((visible) => !visible)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted transition hover:text-cream"
                aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </Field>

          <Field label="Повторите пароль" htmlFor="confirm" required>
            <Input
              id="confirm"
              type={showPassword ? 'text' : 'password'}
              required
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
            />
          </Field>
        </div>

        {error ? (
          <p className="border border-danger/30 bg-danger/10 px-4 py-3 text-xs text-danger">{error}</p>
        ) : null}

        <Button type="submit" className="w-full" icon={UserPlus} loading={submitting}>
          Создать аккаунт
        </Button>
      </form>
    </AuthShell>
  );
}
