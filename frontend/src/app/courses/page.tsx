import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sidebar } from '@/components/Sidebar';
import { AppHeader } from '@/components/AppHeader';
import { useCourses } from '@/shared/hooks/useAPI';
import type { Course } from '@/types/api';
import { cn } from '@/lib/utils';

export default function CoursesPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { courses, loading: coursesLoading, error: coursesError } = useCourses();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  const pageLoading = loading || !user || coursesLoading;

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
        <AppHeader
          sidebarOpen={sidebarOpen}
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
        />

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
