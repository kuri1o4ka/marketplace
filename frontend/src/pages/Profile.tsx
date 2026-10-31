import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { KeyRound, Mail, Save, ShieldCheck, User as UserIcon } from 'lucide-react';
import { getErrorMessage } from '../api/client';
import { useAuth } from '../context/auth';
import { useToast } from '../context/toast';
import { Badge, Button, Field, Input, PageHeader, VerifiedShopBadge } from '../components/ui';

const roleLabel: Record<string, string> = {
  user: 'Покупатель и продавец',
  shop: 'Магазин',
  moderator: 'Модератор',
  admin: 'Администратор',
};

export default function Profile() {
  const { user, updateProfile, changePassword, isShop, isModerator } = useAuth();
  const toast = useToast();

  const [displayName, setDisplayName] = useState(user?.display_name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [emailPassword, setEmailPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [savingName, setSavingName] = useState(false);
  const [savingEmail, setSavingEmail] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  if (!user) {
    return null;
  }

  const handleName = async (event: FormEvent) => {
    event.preventDefault();
    const next = displayName.trim();
    if (!next) {
      toast.error('Имя не может быть пустым');
      return;
    }
    setSavingName(true);
    try {
      await updateProfile({ display_name: next });
      toast.success('Имя обновлено');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Не удалось обновить имя'));
    } finally {
      setSavingName(false);
    }
  };

  const handleEmail = async (event: FormEvent) => {
    event.preventDefault();
    const next = email.trim().toLowerCase();
    if (!next) {
      toast.error('Укажите email');
      return;
    }
    if (next === user.email) {
      toast.info('Email не изменился');
      return;
    }
    if (!emailPassword) {
      toast.error('Введите текущий пароль, чтобы сменить email');
      return;
    }
    setSavingEmail(true);
    try {
      await updateProfile({ email: next, current_password: emailPassword });
      setEmailPassword('');
      toast.success('Email обновлён');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Не удалось обновить email'));
    } finally {
      setSavingEmail(false);
    }
  };

  const handlePassword = async (event: FormEvent) => {
    event.preventDefault();
    if (newPassword.length < 8) {
      toast.error('Новый пароль должен быть не короче 8 символов');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Пароли не совпадают');
      return;
    }
    setSavingPassword(true);
    try {
      await changePassword({ current_password: currentPassword, new_password: newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast.success('Пароль изменён');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Не удалось изменить пароль'));
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="container-luxe py-10 md:py-14">
      <PageHeader
        eyebrow="Профиль"
        title="Профиль"
        description="Управляйте именем, email и паролем. Имя видно другим пользователям в каталоге."
      />

      <div className="mt-8 grid gap-6 lg:grid-cols-[320px_1fr]">
        <aside className="space-y-4">
          <div className="rounded-xl border border-night-600 bg-night-900/60 p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full border border-night-600 bg-night-900 text-cream">
                <UserIcon size={20} />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm text-cream">{user.display_name}</p>
                <p className="truncate text-xs text-muted">{user.email}</p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge tone="muted">{roleLabel[user.role] ?? user.role}</Badge>
              {isShop ? <VerifiedShopBadge /> : null}
              {isModerator ? (
                <Badge tone="accent">
                  <ShieldCheck size={11} />
                  Модерация
                </Badge>
              ) : null}
            </div>
          </div>

          <Link to="/" className="btn-quiet w-full">
            В каталог
          </Link>
        </aside>

        <div className="space-y-6">
          <form onSubmit={handleName} className="space-y-5 rounded-xl border border-night-600 bg-night-900/60 p-6">
            <div className="flex items-center gap-3 text-muted">
              <UserIcon size={16} />
              <span className="text-[10px] uppercase tracking-[0.16em]">Отображаемое имя</span>
            </div>
            <Field label="Имя" htmlFor="display_name" hint="Это имя видят покупатели и модераторы.">
              <Input
                id="display_name"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder="Как к вам обращаться"
              />
            </Field>
            <Button type="submit" icon={Save} loading={savingName}>
              Сохранить имя
            </Button>
          </form>

          <form onSubmit={handleEmail} className="space-y-5 rounded-xl border border-night-600 bg-night-900/60 p-6">
            <div className="flex items-center gap-3 text-muted">
              <Mail size={16} />
              <span className="text-[10px] uppercase tracking-[0.16em]">Email</span>
            </div>
            <Field label="Новый email" htmlFor="email">
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
              />
            </Field>
            <Field label="Текущий пароль" htmlFor="email_password" hint="Нужен для подтверждения смены email.">
              <Input
                id="email_password"
                type="password"
                value={emailPassword}
                onChange={(event) => setEmailPassword(event.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </Field>
            <Button type="submit" icon={Save} loading={savingEmail}>
              Сохранить email
            </Button>
          </form>

          <form onSubmit={handlePassword} className="space-y-5 rounded-xl border border-night-600 bg-night-900/60 p-6">
            <div className="flex items-center gap-3 text-muted">
              <KeyRound size={16} />
              <span className="text-[10px] uppercase tracking-[0.16em]">Пароль</span>
            </div>
            <Field label="Текущий пароль" htmlFor="current_password">
              <Input
                id="current_password"
                type="password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Новый пароль" htmlFor="new_password" hint="Минимум 8 символов.">
                <Input
                  id="new_password"
                  type="password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                />
              </Field>
              <Field label="Повторите пароль" htmlFor="confirm_password">
                <Input
                  id="confirm_password"
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                />
              </Field>
            </div>
            <Button type="submit" icon={Save} loading={savingPassword}>
              Изменить пароль
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
