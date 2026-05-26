import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { AppHeader } from '@/components/AppHeader';
import { useAchievementsCatalog } from '@/shared/hooks/useAPI';
import type { AchievementCatalogItem } from '@/types/api';
import { cn } from '@/lib/utils';

function formatAwardDate(iso?: string) {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return null;
  }
}

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

function AchievementRow({ item }: { item: AchievementCatalogItem }) {
  const pct =
    item.max_progress > 0 ? Math.min(100, Math.round((item.progress / item.max_progress) * 100)) : 0;
  const awarded = formatAwardDate(item.awarded_at);

  return (
    <li
      className={cn(
        'rounded-2xl border px-5 py-4 transition-all duration-300 ease-out',
        'hover:-translate-y-1 hover:scale-[1.02] hover:shadow-lg hover:shadow-black/50',
        item.unlocked
          ? 'border-zinc-600 bg-zinc-900/40 hover:border-zinc-500'
          : 'border-zinc-800 bg-black hover:border-zinc-700'
      )}
    >
      <div className="flex gap-4">
        <div
          className={cn(
            'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border text-2xl',
            item.unlocked ? 'border-zinc-600 bg-zinc-800' : 'border-zinc-800 bg-zinc-950 grayscale opacity-60'
          )}
          aria-hidden
        >
          {item.icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h3 className={cn('font-semibold', item.unlocked ? 'text-white' : 'text-zinc-300')}>
              {item.name}
            </h3>
            <span className="shrink-0 text-xs font-medium text-zinc-400">+{item.points} 💎</span>
          </div>
          <p className="mt-1.5 text-sm leading-relaxed text-zinc-500">{item.description}</p>

          {!item.unlocked && item.max_progress > 1 && (
            <div className="mt-4">
              <div className="flex items-center justify-between text-[11px] font-medium text-zinc-500">
                <span>Прогресс</span>
                <span className="tabular-nums">
                  {item.progress} / {item.max_progress}
                </span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-zinc-900">
                <div
                  className="h-full rounded-full bg-zinc-100 transition-[width] duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )}

          {item.unlocked && awarded && (
            <p className="mt-3 text-xs text-emerald-400/90">Получено {awarded}</p>
          )}
          {item.unlocked && !awarded && (
            <p className="mt-3 text-xs text-emerald-400/90">Разблокировано</p>
          )}
        </div>
      </div>
    </li>
  );
}

export default function AchievementsPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { achievements, loading: catalogLoading, error } = useAchievementsCatalog();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  const { unlocked, locked, totalPoints } = useMemo(() => {
    const u = achievements.filter((a) => a.unlocked);
    const l = achievements.filter((a) => !a.unlocked);
    const pts = u.reduce((sum, a) => sum + a.points, 0);
    return { unlocked: u, locked: l, totalPoints: pts };
  }, [achievements]);

  const pageLoading = loading || !user || catalogLoading;

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
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-28 animate-pulse rounded-2xl border border-zinc-800 bg-black" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-neutral-950 text-zinc-100">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 lg:ml-64">
        <AppHeader sidebarOpen={sidebarOpen} onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

        <div className="px-4 py-8 lg:px-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-white sm:text-3xl">Достижения</h1>
            <p className="mt-2 max-w-2xl text-sm text-zinc-500">
              Награды за уроки, стрики и точность. Прогресс обновляется после прохождения уроков.
            </p>
          </div>

          {error && (
            <p className="mb-6 rounded-2xl border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-300" role="alert">
              {error}
            </p>
          )}

          <div className="mb-10 grid gap-4 sm:grid-cols-3">
            <StatBlock label="Получено" value={unlocked.length} hint="из каталога" />
            <StatBlock label="В процессе" value={locked.length} hint="ещё можно открыть" />
            <StatBlock label="Алмазы за награды" value={totalPoints} hint="только разблокированные" />
          </div>

          {unlocked.length > 0 && (
            <section className="mb-10">
              <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
                Ваши достижения
              </h2>
              <ul className="space-y-3">
                {unlocked.map((item) => (
                  <AchievementRow key={item.id} item={item} />
                ))}
              </ul>
            </section>
          )}

          {locked.length > 0 && (
            <section>
              <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
                Ещё не открыты
              </h2>
              <ul className="space-y-3">
                {locked.map((item) => (
                  <AchievementRow key={item.id} item={item} />
                ))}
              </ul>
            </section>
          )}

          {achievements.length === 0 && !error && (
            <p className="text-sm text-zinc-500">Достижения пока не добавлены в каталог.</p>
          )}
        </div>
      </div>
    </div>
  );
}
