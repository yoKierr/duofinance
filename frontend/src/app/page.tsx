import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { useEffect } from 'react';
import { BackgroundLines } from '@/components/ui/background-lines';
import { TypewriterEffectSmooth } from '@/components/ui/typewriter-effect';
import { FeatureGradientCards } from '@/components/landing/FeatureGradientCards';

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

      <section className="border-t border-zinc-800 px-6 py-20 text-center sm:py-28">
        <p className="text-xs text-zinc-500 sm:text-base">
          Путь к финансовой уверенности начинается здесь
        </p>
        <TypewriterEffectSmooth
          className="justify-center"
          cursorClassName="bg-zinc-100"
          words={[
            { text: 'Учись' },
            { text: 'управлять' },
            { text: 'деньгами' },
            { text: 'уверенно.', className: 'text-zinc-400' },
          ]}
        />
      </section>

      <section id="features" className="mx-auto max-w-6xl px-6 pb-8 pt-4">
        <FeatureGradientCards />
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
