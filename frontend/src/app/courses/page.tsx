import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sidebar } from '@/components/Sidebar';
import { MenuButton } from '@/components/MenuButton';
import { useCourses, useUserStats, useDiamondsBalance } from '@/shared/hooks/useAPI';
import type { Stats, RewardBalance, Course } from '@/types/api';
import { cn } from '@/lib/utils';

export default function CoursesPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { courses, loading: coursesLoading, error: coursesError } = useCourses();
  const { stats: userStats, loading: statsLoading } = useUserStats();
  const { balance: diamondsBalance, loading: balanceLoading } = useDiamondsBalance();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const stats: Stats = {
    currentStreak: userStats?.current_streak || 0,
    longestStreak: userStats?.current_streak || 0,
    completedLevels: userStats?.completed_levels || 0,
  };

  const balance: RewardBalance = {
    diamonds: diamondsBalance || 0,
    gems: 0,
    coins: 0,
  };

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  const pageLoading = loading || !user || coursesLoading || statsLoading || balanceLoading;

  if (pageLoading) {
    return (
      <div className="flex min-h-screen bg-neutral-950 text-zinc-100">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex min-h-screen flex-1 flex-col lg:ml-64">
          <div className="flex-1 px-4 py-8 lg:px-8">
            <div className="mb-8 h-10 max-w-md animate-pulse rounded-lg bg-zinc-900" />
            <div className="grid max-w-2xl gap-4">
              <div className="h-40 animate-pulse rounded-2xl border border-zinc-800 bg-black" />
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
        <header className="sticky top-0 z-30 border-b border-zinc-800 bg-zinc-950">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <MenuButton onClick={() => setSidebarOpen(!sidebarOpen)} isOpen={sidebarOpen} />
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-800 px-3 py-1">
                  <span className="text-sm">🔥</span>
                  <span className="font-bold text-zinc-100">{stats.currentStreak}</span>
                </div>
                <div className="flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-800 px-3 py-1">
                  <span className="text-sm">💎</span>
                  <span className="font-bold text-zinc-100">{balance.diamonds}</span>
                </div>
                <Link
                  to="/profile"
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-neutral-700 to-neutral-900 font-bold text-white transition hover:opacity-90"
                >
                  {user.username.charAt(0).toUpperCase()}
                </Link>
              </div>
            </div>
          </div>
        </header>

        <div className="px-4 py-8 lg:px-8">
          <div className="mb-8 max-w-2xl">
            <h1 className="text-2xl font-bold text-white sm:text-3xl">Курсы</h1>
            <p className="mt-2 text-sm leading-relaxed text-zinc-500">
              Выберите курс. Сейчас доступен один путь — остальные появятся позже.
            </p>
          </div>

          {coursesError && (
            <p className="mb-6 text-sm text-red-400" role="alert">
              {coursesError}
            </p>
          )}

          <ul className="mx-auto grid max-w-2xl gap-4">
            {courses.map((course: Course) => (
              <li key={course.id}>
                {course.available ? (
                  <Link
                    to="/learn"
                    className={cn(
                      'flex flex-col rounded-2xl border border-zinc-700 bg-black p-5 transition-colors',
                      'hover:border-zinc-500 hover:bg-zinc-950'
                    )}
                  >
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <h2 className="text-lg font-semibold text-white">{course.title}</h2>
                      <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-400">
                        Доступен
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-zinc-500">{course.description}</p>
                    <span className="mt-4 text-xs font-semibold uppercase tracking-wider text-zinc-300">
                      К урокам →
                    </span>
                  </Link>
                ) : (
                  <div
                    className={cn(
                      'flex flex-col rounded-2xl border border-zinc-800 bg-black p-5 opacity-60'
                    )}
                  >
                    <h2 className="text-lg font-semibold text-zinc-500">{course.title}</h2>
                    <p className="mt-3 text-sm leading-relaxed text-zinc-600">{course.description}</p>
                    <span className="mt-4 text-[10px] font-medium uppercase tracking-wider text-zinc-600">
                      Скоро
                    </span>
                  </div>
                )}
              </li>
            ))}
          </ul>

          {courses.length === 0 && !coursesError && (
            <p className="text-sm text-zinc-500">Курсов пока нет в каталоге.</p>
          )}
        </div>
      </div>
    </div>
  );
}
