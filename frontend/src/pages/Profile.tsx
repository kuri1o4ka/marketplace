import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Save, User as UserIcon } from 'lucide-react';
import { useAuth } from '../context/auth';
import { useToast } from '../context/toast';
import { Button, Field, Input, PageHeader } from '../components/ui';

export default function Profile() {
  const { user, updateProfile } = useAuth();
  const toast = useToast();
  const [displayName, setDisplayName] = useState(user?.display_name ?? '');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!user) return;
    const next = displayName.trim();
    if (!next) return;
    setSaving(true);
    try {
      await updateProfile(next);
      toast.success('Профиль обновлён');
    } catch {
      toast.error('Не удалось обновить профиль');
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="container-luxe py-10 md:py-14">
      <PageHeader
        eyebrow="Профиль"
        title="Профиль"
        description="Здесь можно поменять отображаемое имя — оно видно другим пользователям в каталоге."
      />

      <div className="mt-8 max-w-xl">
        <form onSubmit={handleSubmit} className="space-y-6 border border-night-600 bg-night-900/60 rounded-xl p-6">
          <div className="flex items-center gap-3 text-muted">
            <UserIcon size={16} />
            <span className="text-[10px] uppercase tracking-[0.16em]">{user.email}</span>
          </div>

          <Field label="Отображаемое имя" htmlFor="display_name">
            <Input
              id="display_name"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              placeholder="Как к вам обращаться"
            />
          </Field>

          <div className="flex flex-wrap gap-3">
            <Button type="submit" icon={Save} loading={saving}>
              Сохранить
            </Button>
            <Link to="/" className="btn-quiet">
              В каталог
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
