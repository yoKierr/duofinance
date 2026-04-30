import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useLevels, useUserStats, useDiamondsBalance } from '@/shared/hooks/useAPI';
import type { Level, Stats, RewardBalance } from '@/types/api';
import { Sidebar } from '@/components/Sidebar';
import { MenuButton } from '@/components/MenuButton';

// Простая конфетти-анимация на canvas без зависимостей
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
    let particles: Array<{x:number;y:number;vx:number;vy:number;size:number;color:string;life:number}> = [];
    const colors = ['#00e3c1','#1CB0F6','#FF9600','#FFD166','#6C63FF','#EF476F'];
    const spawn = (n: number) => {
      for (let i = 0; i < n; i++) {
        particles.push({
          x: (canvas.clientWidth) * Math.random(),
          y: -10,
          vx: (Math.random() - 0.5) * 2,
          vy: Math.random() * 2 + 2,
          size: Math.random() * 6 + 4,
          color: colors[Math.floor(Math.random()*colors.length)],
          life: 120 + Math.random() * 60,
        });
      }
    };
    let frame = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      frame++;
      const w = canvas.clientWidth; const h = canvas.clientHeight;
      ctx.clearRect(0, 0, w, h);
      if (active && frame < 90) spawn(8);
      particles.forEach(p => { p.x += p.vx; p.y += p.vy; p.vy += 0.03; p.life -= 1; });
      particles = particles.filter(p => p.life > 0 && p.y < h + 20);
      particles.forEach(p => { ctx.save(); ctx.fillStyle = p.color; ctx.translate(p.x, p.y); ctx.rotate((p.x + p.y) * 0.02); ctx.fillRect(-p.size/2, -p.size/2, p.size, p.size); ctx.restore(); });
    };
    const onResize = () => resize();
    window.addEventListener('resize', onResize);
    loop();
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', onResize); };
  }, [active]);
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <canvas ref={canvasRef} className="w-full h-full" />
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
  const accuracy = Math.round((score / Math.max(1, total)) * 100);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-white/70 backdrop-blur-md" />
      <ConfettiCanvas active={true} />
      <div className="relative z-10 w-full max-w-lg mx-auto animate-in fade-in-50 zoom-in-95">
        <div className={`rounded-3xl p-8 shadow-2xl ${
          perfect ? 'bg-gradient-to-b from-[#00e3c1]/10 to-blue-50 border-2 border-[#00e3c1]/30' : 'bg-gradient-to-b from-orange-50 to-yellow-50 border-2 border-orange-200'
        }`}>
          <div className="text-center mb-4">
            <div className="text-5xl mb-2">{perfect ? '🎉' : '✅'}</div>
            <h3 className={`text-2xl font-extrabold ${perfect ? 'text-[#00b89a]' : 'text-orange-700'}`}>
            {perfect ? 'Урок завершен!' : 'Урок завершен!'}
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="p-4 bg-white rounded-xl text-center shadow">
              <div className="text-2xl font-bold text-yellow-600">💎</div>
              <div className="text-sm text-gray-600">+{reward}</div>
            </div>
            <div className="p-4 bg-white rounded-xl text-center shadow">
              <div className="text-2xl font-bold text-green-600">{Math.min(100, Math.round(score))}%</div>
              <div className="text-sm text-gray-600">точность</div>
            </div>
          </div>

          {!perfect && (
            <div className="mb-6 p-3 bg-orange-100 rounded-xl text-center text-sm text-orange-700">
              💡 Все неправильные ответы были исправлены!
            </div>
          )}

          <div className="text-center">
            <button
              onClick={onClose}
              className="duofinance-button duofinance-button-primary px-10 py-3 text-sm"
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function StepNode({
  state,
  label,
}: {
  state: 'active' | 'completed' | 'locked';
  label: string;
}) {
  if (state === 'completed') {
    return (
      <div
        className="relative group animate-in fade-in-50 zoom-in-95 duration-300"
        aria-label={`Level ${label} completed`}
      >
        <div className="absolute inset-0 rounded-full blur-md opacity-40 bg-yellow-400 group-hover:opacity-60 transition-opacity" />
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center text-white shadow-xl ring-4 ring-white">
          <span className="text-2xl">⭐</span>
        </div>
      </div>
    );
  }
  if (state === 'locked') {
    return (
      <div
        className="relative animate-in fade-in-50 zoom-in-95 duration-300"
        aria-label={`Level ${label} locked`}
      >
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-300 to-gray-200 flex items-center justify-center text-gray-500 shadow ring-4 ring-white">
          <span className="text-2xl">🔒</span>
        </div>
      </div>
    );
  }
  return (
    <div
      className="relative group focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 rounded-full animate-in fade-in-50 zoom-in-95 duration-300"
      role="button"
      tabIndex={0}
      aria-label={`Level ${label}`}
    >
      <div className="absolute inset-0 rounded-full bg-[#00e3c1]/40 blur opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#00e3c1] to-[#00b89a] flex items-center justify-center text-white shadow-xl ring-4 ring-white">
        <span className="text-2xl font-bold drop-shadow-sm">{label}</span>
      </div>
    </div>
  );
}

export default function LearnPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { levels, loading: levelsLoading } = useLevels();
  const { stats: userStats, loading: statsLoading } = useUserStats();
  const { balance: diamondsBalance, loading: balanceLoading } = useDiamondsBalance();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Обработка состояния завершения урока
  const [showCompletionMessage, setShowCompletionMessage] = useState(false);
  const [completionData, setCompletionData] = useState<any>(null);
  
  // Преобразуем данные бэкенда в формат фронтенда
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

  // (dark theme removed)

  // Обработка завершения урока
  useEffect(() => {
    if (location.state?.lessonCompleted) {
      setCompletionData(location.state);
      setShowCompletionMessage(true);
      // очищаем state в history, но оставляем экран до нажатия Continue
      navigate('/learn', { replace: true, state: {} });
    }
  }, [location.state, navigate]);

  if (loading || !user || levelsLoading || statsLoading || balanceLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="animate-in fade-in-50 slide-in-from-top-2 duration-300 mb-6 grid grid-cols-3 gap-4">
            <div className="p-3 bg-white rounded-xl shadow">
              <div className="h-6 w-16 rounded bg-gray-200 animate-pulse" />
            </div>
            <div className="p-3 bg-white rounded-xl shadow">
              <div className="h-6 w-16 rounded bg-gray-200 animate-pulse" />
            </div>
            <div className="p-3 bg-white rounded-xl shadow">
              <div className="h-6 w-16 rounded bg-gray-200 animate-pulse" />
            </div>
          </div>
          <div className="space-y-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-8">
                <div className="flex-1">
                  <div className="inline-block w-full max-w-md">
                    <div className="bg-white p-6 rounded-3xl shadow-lg animate-pulse">
                      <div className="h-4 w-24 bg-gray-200 rounded mb-3" />
                      <div className="h-6 w-56 bg-gray-200 rounded mb-2" />
                      <div className="h-4 w-64 bg-gray-200 rounded mb-4" />
                      <div className="h-8 w-24 bg-gray-200 rounded" />
                    </div>
                  </div>
                </div>
                <div className="w-16 h-16 rounded-full bg-gray-200 shadow ring-4 ring-white" />
                <div className="flex-1"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const getLevelIcon = (level: Level, index: number) => {
    if (level.isCompleted) return <StepNode state="completed" label={`${index + 1}`} />;
    if (level.isLocked) return <StepNode state="locked" label={`${index + 1}`} />;
    return <StepNode state="active" label={`${index + 1}`} />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 flex">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      {/* Main Content */}
      <div className="flex-1 lg:ml-64">
        <header className="bg-white border-b-2 border-gray-200 sticky top-0 z-30">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <MenuButton onClick={() => setSidebarOpen(!sidebarOpen)} isOpen={sidebarOpen} />
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white text-sm shadow">
                    🔥
                  </div>
                  <span className="font-bold text-gray-800">{stats.currentStreak}</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white text-sm shadow">
                    💎
                  </div>
                  <span className="font-bold text-gray-800">{balance.diamonds}</span>
                </div>
                
                <Link to="/profile" className="flex items-center gap-2 hover:opacity-80 transition-opacity duration-200 hover:scale-110">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1CB0F6] to-[#1899D6] flex items-center justify-center text-white font-bold hover:shadow-lg transition-all duration-200">
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-8 max-w-4xl">
          {/* Экран завершения урока */}
          {showCompletionMessage && completionData && (
            <LessonCompleteOverlay
              perfect={!!completionData.perfectScore}
              score={completionData.score}
              total={completionData.totalQuestions}
              reward={completionData.reward}
              onClose={() => {
                setShowCompletionMessage(false);
                setCompletionData(null);
              }}
            />
          )}

        <div className="space-y-6">
          <h2 className="text-3xl font-bold text-gray-800 text-center">Your Learning Path</h2>

          <div className="relative">
            <div className="absolute left-1/2 -translate-x-1/2 w-[3px] h-full bg-gradient-to-b from-gray-200 via-gray-100 to-transparent rounded-full"></div>

            <div className="space-y-8 relative">
              {levels.map((level, index) => {
                const isEven = index % 2 === 0;
                return (
                  <div
                    key={level.id}
                    className={`flex items-center gap-8 ${
                      isEven ? 'flex-row' : 'flex-row-reverse'
                    }`}
                  >
                    <div className={`flex-1 ${isEven ? 'text-right' : 'text-left'}`}>
                      <div className="inline-block">
                            <div className="bg-white p-6 rounded-3xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer animate-in fade-in-50 slide-in-from-bottom-2">
                          <div className="flex items-center gap-3 mb-3">
                            <Badge
                              className={`${
                        level.difficulty === 'beginner'
                          ? 'bg-[#00e3c1]/20 text-[#00b89a]'
                                  : level.difficulty === 'intermediate'
                                    ? 'bg-yellow-100 text-yellow-700'
                                    : 'bg-red-100 text-red-700'
                              }`}
                            >
                              {level.difficulty}
                            </Badge>
                            <span className="text-sm text-gray-500">{level.reward_points} 💎</span>
                          </div>

                          <h3 className="text-xl font-bold text-gray-800 mb-2">{level.title}</h3>
                          <p className="text-gray-600 text-sm mb-4">{level.description || `Learn ${level.topic}`}</p>

                          {level.isCompleted && (
                            <div className="space-y-2">
                              <Progress value={100} className="h-2" />
                              <p className="text-xs text-gray-500">Complete</p>
                            </div>
                          )}

                          {!level.isLocked && (
                            <Link
                              to={`/lesson/${level.id}`}
                              className="mt-4 inline-block duofinance-button duofinance-button-primary px-6 py-2 text-xs"
                            >
                              {level.isCompleted ? 'Practice Again' : 'Start'}
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="relative z-10">
                      {getLevelIcon(level, index)}
                    </div>

                    <div className="flex-1"></div>
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
