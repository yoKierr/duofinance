import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Settings } from 'lucide-react';
import { Sidebar } from '@/components/Sidebar';
import { AppHeader } from '@/components/AppHeader';
import { UserAvatar } from '@/components/UserAvatar';
import { useUserStats, useDiamondsBalance } from '@/shared/hooks/useAPI';

function StatBlock({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-black px-5 py-4">
      <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-zinc-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold tabular-nums text-white">{value}</p>
      {hint && <p className="mt-1 text-xs text-zinc-500">{hint}</p>}
    </div>
  );
}

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { stats: userStats, loading: statsLoading } = useUserStats();
  const { balance: diamondsBalance, loading: balanceLoading } = useDiamondsBalance();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  const pageLoading = loading || !user || statsLoading || balanceLoading;

  if (pageLoading) {
    return (
      <div className="flex min-h-screen bg-neutral-950 text-zinc-100">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex min-h-screen flex-1 flex-col lg:ml-64">
          <div className="flex-1 px-4 py-8 lg:px-8">
            <div className="mb-8 h-10 max-w-xs animate-pulse rounded-lg bg-zinc-900" />
            <div className="mb-8 grid gap-4 sm:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-24 animate-pulse rounded-2xl border border-zinc-800 bg-black" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const streak = userStats?.current_streak ?? 0;
  const lessons = userStats?.completed_levels ?? 0;
  const diamonds = diamondsBalance ?? userStats?.total_diamonds ?? 0;

  return (
    <div className="flex min-h-screen bg-neutral-950 text-zinc-100">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 lg:ml-64">
        <AppHeader sidebarOpen={sidebarOpen} onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

        <div className="px-4 py-8 lg:px-8">
          <div className="mb-8 flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white sm:text-3xl">Профиль</h1>
              <p className="mt-2 max-w-2xl text-sm text-zinc-500">
                Ваша статистика обучения. Настройки аккаунта — через шестерёнку.
              </p>
            </div>
            <Link
              to="/settings"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-zinc-800 bg-black text-zinc-300 transition-all duration-200 hover:-translate-y-0.5 hover:border-zinc-600 hover:bg-zinc-900 hover:text-white"
              aria-label="Настройки"
            >
              <Settings className="h-5 w-5" strokeWidth={2} />
            </Link>
          </div>

          <section className="mb-10 flex items-center gap-5 rounded-2xl border border-zinc-800 bg-black p-6">
            <UserAvatar username={user.username} avatar={user.avatar} className="h-16 w-16 text-2xl" />
            <div className="min-w-0">
              <p className="truncate text-lg font-semibold text-white">{user.username}</p>
              <p className="truncate text-sm text-zinc-500">{user.email}</p>
            </div>
          </section>

          <div className="mb-10 grid gap-4 sm:grid-cols-3">
            <StatBlock label="Стрик" value={streak} hint="дней подряд" />
            <StatBlock label="Алмазы" value={diamonds} />
            <StatBlock label="Уроки" value={lessons} hint="завершено" />
          </div>

          <section className="rounded-2xl border border-zinc-800 bg-black p-6 sm:p-8">
            <h2 className="mb-6 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
              Подробная статистика
            </h2>
            <dl className="space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-900 pb-4">
                <dt className="text-sm text-zinc-400">Текущий стрик</dt>
                <dd className="font-semibold tabular-nums text-white">{streak} дн.</dd>
              </div>
              <div className="flex items-center justify-between border-b border-zinc-900 pb-4">
                <dt className="text-sm text-zinc-400">Завершённых уроков</dt>
                <dd className="font-semibold tabular-nums text-white">{lessons}</dd>
              </div>
              {userStats && userStats.total_attempts > 0 && (
                <div className="flex items-center justify-between border-b border-zinc-900 pb-4">
                  <dt className="text-sm text-zinc-400">Всего попыток</dt>
                  <dd className="font-semibold tabular-nums text-white">{userStats.total_attempts}</dd>
                </div>
              )}
              {userStats && userStats.average_score > 0 && (
                <div className="flex items-center justify-between">
                  <dt className="text-sm text-zinc-400">Средняя точность</dt>
                  <dd className="font-semibold tabular-nums text-white">
                    {Math.round(userStats.average_score)}%
                  </dd>
                </div>
              )}
            </dl>
          </section>
        </div>
      </div>
    </div>
  );
}
