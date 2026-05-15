import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { useEffect } from 'react';
import { BackgroundLines } from '@/components/ui/background-lines';

export default function Home() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate('/learn');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-950 text-white">
        <div className="text-2xl">Loading...</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-white antialiased">
      <BackgroundLines
        className="flex min-h-[max(48rem,78vh)] w-full flex-col bg-black/[0.96] md:min-h-[max(52rem,82vh)]"
        svgOptions={{ duration: 12 }}
      >
        <header className="w-full shrink-0 border-b border-white/10">
          <div className="mx-auto flex max-w-7xl items-center justify-center px-5 py-4 sm:px-8">
            <Link
              to="/"
              className="text-[1.35rem] font-extrabold lowercase tracking-tight text-white sm:text-[1.55rem]"
            >
              финстарт
            </Link>
          </div>
        </header>

        <section className="mx-auto flex w-full max-w-7xl flex-1 flex-col items-center justify-center px-4 py-12 text-center md:px-6 md:pb-36 md:pt-10">
          <h1 className="relative z-20 max-w-4xl bg-gradient-to-b from-neutral-50 to-neutral-400 bg-clip-text text-[2rem] font-bold leading-tight text-transparent sm:text-5xl lg:text-6xl lg:leading-[1.1]">
            Бесплатно, понятно и по делу — так можно освоить финансы онлайн!
          </h1>
          <div className="relative z-20 mt-10 flex w-full max-w-lg flex-col flex-wrap items-center justify-center gap-3 sm:flex-row">
            <Link
              to="/register"
              className="inline-flex h-10 min-w-[12rem] w-full items-center justify-center rounded-full border border-zinc-300 bg-white px-6 text-xs font-semibold text-neutral-950 transition hover:bg-zinc-200 sm:w-auto"
            >
              Начать обучение
            </Link>
            <Link
              to="/login"
              className="inline-flex h-10 min-w-[12rem] w-full items-center justify-center rounded-full border border-white px-6 text-xs font-medium text-white transition-colors hover:bg-white/10 sm:w-auto"
            >
              У меня уже есть аккаунт
            </Link>
          </div>
        </section>
      </BackgroundLines>

      <section id="features" className="max-w-6xl mx-auto px-6 pt-4 text-center">
        <div className="grid md:grid-cols-3 gap-10">
          <div className="flex flex-col items-center">
            <div className="h-44 w-full max-w-sm rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
              <div className="w-16 h-16 bg-zinc-700 rounded-lg" aria-hidden="true" />
            </div>
            <h3 className="mt-6 font-semibold text-white">Курсы онлайн.</h3>
            <p className="mt-2 text-xs leading-relaxed text-white max-w-[260px] mx-auto">
              Учитесь в удобном формате в любое время. Курсы подходят для новичков.
            </p>
          </div>

          <div className="flex flex-col items-center">
            <div className="h-44 w-full max-w-sm rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
              <div className="w-16 h-16 bg-zinc-700 rounded-full" aria-hidden="true" />
            </div>
            <h3 className="mt-6 font-semibold text-white">Простая подача.</h3>
            <p className="mt-2 text-xs leading-relaxed text-white max-w-[260px] mx-auto">
              Интерактивные задания и короткие объяснения в игровом формате.
            </p>
          </div>

          <div className="flex flex-col items-center">
            <div className="h-44 w-full max-w-sm rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
              <div
                className="w-0 h-0 border-l-[34px] border-l-transparent border-r-[34px] border-r-transparent border-b-[58px] border-b-zinc-600"
                aria-hidden="true"
              />
            </div>
            <h3 className="mt-6 font-semibold text-white">Чёткие результаты.</h3>
            <p className="mt-2 text-xs leading-relaxed text-white max-w-[260px] mx-auto">
              Отслеживайте свой прогресс по уровням и темам.
            </p>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 pt-28 pb-20 text-center">
        <h2 className="text-lg font-semibold text-white">Готовы начать?</h2>
        <p className="mt-2 text-xs text-white leading-relaxed">
          Зарегистрируйтесь
          <br />
          бесплатно и откройте свой
          <br />
          первый курс.
        </p>
        <div className="mt-4">
          <Link
            to="/register"
            className="h-8 px-4 rounded-full border border-white text-white text-xs font-medium inline-flex items-center justify-center hover:bg-white/10 transition-colors"
          >
            Начать обучение
          </Link>
        </div>
      </section>

      <footer className="border-t border-zinc-800">
        <div className="max-w-6xl mx-auto px-6 py-14 flex items-end justify-between">
          <div className="text-xs text-white">© 2026.</div>
          <div className="grid grid-cols-3 gap-16 text-xs text-white">
            <div>
              <div className="font-semibold text-white mb-3">Платформа</div>
              <ul className="space-y-2">
                <li>
                  <a href="#courses" className="text-white hover:underline transition-colors">
                    Курсы
                  </a>
                </li>
                <li>
                  <a href="#features" className="text-white hover:underline transition-colors">
                    Уровни
                  </a>
                </li>
                <li>
                  <a href="#features" className="text-white hover:underline transition-colors">
                    Отзывы
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <div className="font-semibold text-white mb-3">Ресурсы</div>
              <ul className="space-y-2">
                <li>
                  <a href="#features" className="text-white hover:underline transition-colors">
                    FAQ
                  </a>
                </li>
                <li>
                  <a href="#features" className="text-white hover:underline transition-colors">
                    Поддержка
                  </a>
                </li>
                <li>
                  <a href="#features" className="text-white hover:underline transition-colors">
                    Контакты
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <div className="font-semibold text-white mb-3">О компании</div>
              <ul className="space-y-2">
                <li>
                  <a href="#features" className="text-white hover:underline transition-colors">
                    Миссия
                  </a>
                </li>
                <li>
                  <a href="#features" className="text-white hover:underline transition-colors">
                    Команда
                  </a>
                </li>
                <li>
                  <a href="#features" className="text-white hover:underline transition-colors">
                    Партнёры
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
