import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { UserAvatar } from '@/components/UserAvatar';
import { apiClient } from '@/shared/api/client';
import { fileToAvatarDataUrl } from '@/lib/avatarImage';
import { cn } from '@/lib/utils';

export function ProfileAccountSettings() {
  const { user, logout, setUserFromApi } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [avatarPreview, setAvatarPreview] = useState<string | undefined>();
  const [avatarDirty, setAvatarDirty] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      setUsername(user.username);
      setAvatarPreview(user.avatar);
      setAvatarDirty(false);
    }
  }, [user]);

  if (!user) return null;

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setSaveError('');
    setSaveSuccess('');
    try {
      const dataUrl = await fileToAvatarDataUrl(file);
      setAvatarPreview(dataUrl);
      setAvatarDirty(true);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Не удалось загрузить фото');
    }
  };

  const handleRemoveAvatar = () => {
    setAvatarPreview(undefined);
    setAvatarDirty(true);
    setSaveError('');
    setSaveSuccess('');
  };

  const handleSave = async () => {
    const trimmed = username.trim();
    if (trimmed.length < 3) {
      setSaveError('Имя пользователя — минимум 3 символа');
      return;
    }

    const usernameChanged = trimmed !== user.username;
    if (!usernameChanged && !avatarDirty) {
      setSaveSuccess('Нет изменений для сохранения');
      return;
    }

    setSaving(true);
    setSaveError('');
    setSaveSuccess('');

    try {
      const payload: { username?: string; avatar?: string } = {};
      if (usernameChanged) payload.username = trimmed;
      if (avatarDirty) payload.avatar = avatarPreview ?? '';

      const updated = await apiClient.updateProfile(payload);
      setUserFromApi(updated);
      setAvatarPreview(updated.avatar);
      setAvatarDirty(false);
      setSaveSuccess('Изменения сохранены');
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('Username already taken') || msg.includes('USER_EXISTS')) {
        setSaveError('Это имя уже занято');
      } else if (msg.includes('invalid username') || msg.includes('Invalid')) {
        setSaveError('Имя может содержать только буквы, цифры и _ (3–50 символов)');
      } else if (msg.includes('avatar')) {
        setSaveError('Недопустимый формат или размер фото');
      } else {
        setSaveError('Не удалось сохранить изменения');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    void logout().then(() => navigate('/login'));
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-zinc-800 bg-black p-6 sm:p-8">
        <h2 className="mb-6 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Аккаунт</h2>

        <div className="flex flex-col gap-8 sm:flex-row sm:items-start">
          <div className="flex flex-col items-center gap-4 sm:items-start">
            <UserAvatar
              username={username || user.username}
              avatar={avatarPreview}
              className="h-24 w-24 text-3xl"
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={handleAvatarChange}
            />
            <div className="flex flex-wrap justify-center gap-2 sm:justify-start">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="finstart-button finstart-button-secondary px-4 py-2 text-sm"
              >
                Загрузить фото
              </button>
              {(avatarPreview || user.avatar) && (
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  className="rounded-full border border-zinc-700 px-4 py-2 text-sm text-zinc-400 transition-colors hover:border-zinc-500 hover:text-white"
                >
                  Удалить
                </button>
              )}
            </div>
          </div>

          <div className="min-w-0 flex-1 space-y-5">
            <div>
              <label
                htmlFor="settings-username"
                className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500"
              >
                Имя пользователя
              </label>
              <input
                id="settings-username"
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setSaveError('');
                  setSaveSuccess('');
                }}
                autoComplete="username"
                maxLength={50}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-white outline-none transition-colors focus:border-zinc-500"
              />
              <p className="mt-2 text-xs text-zinc-500">Буквы, цифры и подчёркивание, от 3 до 50 символов</p>
            </div>

            <p className="text-sm text-zinc-500">{user.email}</p>

            {saveError && (
              <p
                className="rounded-xl border border-red-900/50 bg-red-950/30 px-4 py-2 text-sm text-red-300"
                role="alert"
              >
                {saveError}
              </p>
            )}
            {saveSuccess && (
              <p
                className="rounded-xl border border-emerald-900/50 bg-emerald-950/30 px-4 py-2 text-sm text-emerald-300"
                role="status"
              >
                {saveSuccess}
              </p>
            )}

            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className={cn(
                'finstart-button finstart-button-primary px-6 py-2.5 text-sm',
                saving && 'pointer-events-none opacity-60'
              )}
            >
              {saving ? 'Сохранение…' : 'Сохранить'}
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-red-900/40 bg-black p-6 sm:p-8">
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-red-400/90">Сессия</h2>
        <p className="mb-5 text-sm text-zinc-500">Выйти из аккаунта на этом устройстве.</p>
        <button
          type="button"
          onClick={handleLogout}
          className="rounded-full border border-red-800/80 bg-red-950/40 px-5 py-2.5 text-sm font-medium text-red-300 transition-colors hover:border-red-600 hover:bg-red-950/70 hover:text-red-200"
        >
          Выйти
        </button>
      </section>
    </div>
  );
}
