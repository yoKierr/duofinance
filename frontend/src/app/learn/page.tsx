import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { GlareCard } from '@/components/ui/glare-card';
import { useLevels } from '@/shared/hooks/useAPI';
import type { Level } from '@/types/api';
import { Sidebar } from '@/components/Sidebar';
import { AppHeader } from '@/components/AppHeader';
import { cn } from '@/lib/utils';

function ConfettiCanvas({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const DPR = Math.max(1, window.devicePixelRatio || 1);
    const resize = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      canvas.width = w * DPR;
      canvas.height = h * DPR;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    };
    resize();
    let raf = 0;
    let particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      color: string;
      life: number;
    }> = [];
    const colors = ['#fafafa', '#e5e5e5', '#d4d4d4', '#a3a3a3', '#737373', '#525252'];
    const spawn = (n: number) => {
      for (let i = 0; i < n; i++) {
        particles.push({
          x: canvas.clientWidth * Math.random(),
          y: -10,
          vx: (Math.random() - 0.5) * 2,
          vy: Math.random() * 2 + 2,
          size: Math.random() * 6 + 4,
          color: colors[Math.floor(Math.random() * colors.length)],
          life: 120 + Math.random() * 60,
        });
      }
    };
    let frame = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      frame++;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      ctx.clearRect(0, 0, w, h);
      if (active && frame < 90) spawn(8);
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.03;
        p.life -= 1;
      });
      particles = particles.filter((p) => p.life > 0 && p.y < h + 20);
      particles.forEach((p) => {
        ctx.save();
        ctx.fillStyle = p.color;
        ctx.translate(p.x, p.y);
        ctx.rotate((p.x + p.y) * 0.02);
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
      });
    };
    const onResize = () => resize();
    window.addEventListener('resize', onResize);
    loop();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
    };
  }, [active]);
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <canvas ref={canvasRef} className="h-full w-full" />
    </div>
  );
}

function LessonCompleteOverlay({
  perfect,
  score,
  total,
  reward,
  onClose,
}: {
  perfect: boolean;
  score: number;
  total: number;
  reward: number;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />
      <ConfettiCanvas active={true} />
      <div className="relative z-10 mx-auto w-full max-w-lg animate-in fade-in-50 zoom-in-95 px-4">
        <div
          className={`rounded-3xl p-8 shadow-2xl ${
            perfect
              ? 'border-2 border-zinc-600 bg-gradient-to-b from-zinc-900 to-zinc-950'
              : 'border-2 border-zinc-700 bg-gradient-to-b from-zinc-900 to-zinc-950'
          }`}
        >
          <div className="mb-4 text-center">
            <div className="mb-2 text-5xl">{perfect ? '🎉' : '✅'}</div>
            <h3 className={`text-2xl font-extrabold ${perfect ? 'text-white' : 'text-zinc-200'}`}>
              Урок завершен!
            </h3>
          </div>

          <div className="mb-6 grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-zinc-700 bg-zinc-800 p-4 text-center">
              <div className="text-2xl font-bold text-zinc-200">💎</div>
              <div className="text-sm text-zinc-400">+{reward}</div>
            </div>
            <div className="rounded-xl border border-zinc-700 bg-zinc-800 p-4 text-center">
              <div className="text-2xl font-bold text-white">{Math.min(100, Math.round(score))}%</div>
              <div className="text-sm text-zinc-400">точность</div>
            </div>
          </div>

          {!perfect && (
            <div className="mb-6 rounded-xl border border-zinc-600 bg-zinc-800 p-3 text-center text-sm text-zinc-300">
              💡 Все неправильные ответы были исправлены!
            </div>
          )}

          <div className="text-center">
            <button onClick={onClose} className="finstart-button finstart-button-primary px-10 py-3 text-sm">
              Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function LessonExpandOverlay({
  level,
  lessonIndex,
  onClose,
  onStartLesson,
}: {
  level: Level;
  lessonIndex: number;
  onClose: () => void;
  onStartLesson: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity"
        aria-hidden
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="lesson-expand-title"
        className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-zinc-700 bg-zinc-900 p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200 sm:p-8"
      >
        <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Урок {lessonIndex}</p>
        <h2 id="lesson-expand-title" className="mt-2 text-2xl font-bold leading-tight text-white sm:text-3xl">
          {level.title}
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-zinc-400">
          {level.description || `Раздел: ${level.topic}. Интерактивные задания и проверка усвоения материала.`}
        </p>

        <ul className="mt-6 space-y-2.5 border-t border-zinc-800 pt-6 text-sm text-zinc-400">
          <li>
            <span className="text-zinc-500">Тема:</span>{' '}
            <span className="text-zinc-200">{level.topic}</span>
          </li>
          <li>
            <span className="text-zinc-500">Награда:</span>{' '}
            <span className="text-zinc-200">{level.reward_points} 💎</span>
          </li>
          {typeof level.steps_count === 'number' && level.steps_count > 0 && (
            <li>
              <span className="text-zinc-500">Заданий в уроке:</span>{' '}
              <span className="text-zinc-200">{level.steps_count}</span>
            </li>
          )}
          <li className="text-zinc-500">Подсказки и мгновенная обратная связь по ходу урока.</li>
        </ul>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            type="button"
            className="finstart-button finstart-button-primary inline-flex min-h-[48px] flex-1 items-center justify-center rounded-full px-6 py-3 text-sm font-semibold !rounded-full transition active:scale-[0.98] sm:flex-none"
            onClick={onStartLesson}
          >
            {level.isCompleted ? 'Пройти заново' : 'Пройти'}
          </button>
          <button
            type="button"
            className="rounded-full px-4 py-3 text-sm font-medium text-zinc-400 underline-offset-4 transition hover:text-white hover:underline"
            onClick={onClose}
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
}

export default function LearnPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { levels, loading: levelsLoading } = useLevels();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [showCompletionMessage, setShowCompletionMessage] = useState(false);
  const [completionData, setCompletionData] = useState<Record<string, unknown> | null>(null);
  const [expandedLevelId, setExpandedLevelId] = useState<number | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const state = location.state as { lessonCompleted?: boolean } | null;
    if (state?.lessonCompleted) {
      setCompletionData(state as Record<string, unknown>);
      setShowCompletionMessage(true);
      navigate('/learn', { replace: true, state: {} });
    }
  }, [location.state, navigate]);

  useEffect(() => {
    if (expandedLevelId === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setExpandedLevelId(null);
    };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [expandedLevelId]);

  useEffect(() => {
    if (expandedLevelId === null) return;
    if (!levels.some((l) => l.id === expandedLevelId)) {
      setExpandedLevelId(null);
    }
  }, [expandedLevelId, levels]);

  if (loading || !user || levelsLoading) {
    return (
      <div className="flex min-h-screen bg-neutral-950 text-zinc-100">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex min-h-screen flex-1 flex-col lg:ml-64">
          <div className="flex-1 px-4 py-8">
            <div className="mb-8 grid animate-in fade-in-50 slide-in-from-top-2 duration-300 grid-cols-3 gap-4">
              {[0, 1, 2].map((i) => (
                <div key={i} className="rounded-xl border border-zinc-800 bg-zinc-900 p-3">
                  <div className="h-6 w-16 animate-pulse rounded bg-zinc-700" />
                </div>
              ))}
            </div>
            <div className="grid w-full grid-cols-[repeat(auto-fill,minmax(min(100%,16rem),1fr))] gap-6 pb-4 sm:gap-8 md:gap-10">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-[17/21] w-full min-w-0 animate-pulse rounded-[48px] border border-zinc-800 bg-zinc-900"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const expandedLevel =
    expandedLevelId !== null ? levels.find((l) => l.id === expandedLevelId) : undefined;

  return (
    <div className="flex min-h-screen bg-neutral-950 text-zinc-100">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 lg:ml-64">
        <AppHeader
          sidebarOpen={sidebarOpen}
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
        />

        <div className="px-4 py-8 lg:px-8">
          {showCompletionMessage && completionData && (
            <LessonCompleteOverlay
              perfect={!!completionData.perfectScore}
              score={Number(completionData.score)}
              total={Number(completionData.totalQuestions)}
              reward={Number(completionData.reward)}
              onClose={() => {
                setShowCompletionMessage(false);
                setCompletionData(null);
              }}
            />
          )}

          {expandedLevel && !expandedLevel.isLocked && (
            <LessonExpandOverlay
              level={expandedLevel}
              lessonIndex={levels.findIndex((l) => l.id === expandedLevel.id) + 1}
              onClose={() => setExpandedLevelId(null)}
              onStartLesson={() => {
                setSidebarOpen(false);
                setExpandedLevelId(null);
                navigate(`/lesson/${expandedLevel.id}`);
              }}
            />
          )}

          <div
            className={cn(
              'transition-[opacity,filter] [scrollbar-gutter:stable]',
              expandedLevelId !== null && 'pointer-events-none opacity-40 blur-[1px]'
            )}
          >
            <div className="mb-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <h1 className="text-2xl font-bold text-white sm:text-3xl">Уроки</h1>
                <Link
                  to="/courses"
                  className="text-sm font-medium text-zinc-500 transition hover:text-zinc-200"
                >
                  ← К курсам
                </Link>
              </div>
              <p className="mt-2 max-w-2xl text-sm text-zinc-500">
                Проходите уроки по порядку — следующий откроется после успешного прохождения.
              </p>
            </div>

            <div className="w-full pb-4">
              <div className="grid w-full grid-cols-[repeat(auto-fill,minmax(min(100%,16rem),1fr))] items-stretch gap-6 py-4 sm:gap-8 md:gap-10">
              {levels.map((level: Level, index: number) => {
                const locked = !!level.isLocked;
                const card = (
                  <GlareCard
                    disabled={locked}
                    frameClassName={locked ? 'border-zinc-900' : 'border-zinc-600/55'}
                    className={cn(
                      'flex h-full min-h-0 flex-col px-5 py-6 text-center',
                      locked ? 'bg-zinc-950' : 'bg-zinc-800'
                    )}
                  >
                    <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                      Урок {index + 1}
                    </span>
                    <div className="mt-3 flex min-h-0 flex-1 flex-col items-center gap-2">
                      <span className="text-xs text-zinc-400">{level.reward_points} 💎</span>
                      <h2 className="line-clamp-2 text-lg font-bold leading-snug text-white">{level.title}</h2>
                      <p className="line-clamp-3 text-xs leading-relaxed text-zinc-400">
                        {level.description || `Категория: ${level.topic}`}
                      </p>
                      {level.isCompleted && (
                        <span className="text-xs font-medium text-emerald-400/90">Пройдено</span>
                      )}
                    </div>
                    {!locked && (
                      <p className="mt-6 text-[11px] font-medium uppercase tracking-wide text-zinc-500">
                        Нажмите, чтобы открыть
                      </p>
                    )}
                  </GlareCard>
                );

                return (
                  <div key={level.id} className="flex min-w-0 w-full flex-col">
                    {locked ? (
                      <div className="w-full rounded-[52px]">{card}</div>
                    ) : (
                      <button
                        type="button"
                        className="w-full rounded-[52px] border-0 bg-transparent p-0 text-left outline-none transition-transform hover:scale-[1.02] active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
                        aria-label={`Открыть урок ${index + 1}: ${level.title}`}
                        onClick={() => setExpandedLevelId(level.id)}
                      >
                        {card}
                      </button>
                    )}
                  </div>
                );
              })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
