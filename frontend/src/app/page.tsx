import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { useEffect } from 'react';

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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl">Loading...</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-white via-blue-50/30 to-gray-50">
      <header className="container mx-auto px-4 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img 
            src="/logo-removebg-preview.png" 
            alt="DuoFinance" 
            className="w-10 h-10"
          />
          <span className="text-2xl font-bold text-gray-800">duofinance</span>
        </div>
        <div className="flex items-center gap-4">
          <Link
            to="/login"
            className="px-4 py-2 text-[#1CB0F6] font-bold hover:text-[#1899D6]"
          >
            I ALREADY HAVE AN ACCOUNT
          </Link>
          <Link
            to="/register"
            className="duofinance-button duofinance-button-primary px-8 py-3 text-sm"
          >
            Get Started
          </Link>
        </div>
      </header>

      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-5xl mx-auto">
          <div className="mb-10 animate-in fade-in-50 slide-in-from-top-2">
            <div className="relative w-72 h-72 mx-auto rounded-3xl shadow-2xl bg-gradient-to-br from-[#00e3c1] to-[#00b89a]">
              <svg viewBox="0 0 200 200" className="absolute inset-0 w-full h-full" aria-hidden="true">
                <defs>
                  <filter id="softShadow" x="-50%" y="-50%" width="200%" height="200%">
                    <feDropShadow dx="0" dy="6" stdDeviation="8" floodColor="#1a1a1a" floodOpacity="0.25" />
                  </filter>
                </defs>
                <circle cx="100" cy="100" r="68" fill="#fff" fillOpacity="0.15" filter="url(#softShadow)" />
                <circle cx="70" cy="90" r="10" fill="#fff" />
                <circle cx="130" cy="90" r="10" fill="#fff" />
                <path d="M70 125 C95 145 105 145 130 125" stroke="#fff" strokeWidth="6" strokeLinecap="round" fill="none" />
              </svg>
            </div>
          </div>

          <h1 className="text-5xl font-extrabold text-gray-800 mb-6 leading-tight">
            The free, fun, and effective way to<br />learn a language!
          </h1>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12 animate-in fade-in-50 slide-in-from-bottom-2">
            <Link
              to="/register"
              className="duofinance-button duofinance-button-primary px-12 py-4 text-base w-full sm:w-auto"
            >
              Get Started
            </Link>
            <Link
              to="/login"
              className="duofinance-button duofinance-button-secondary px-12 py-4 text-base w-full sm:w-auto"
            >
              I Already Have an Account
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-[#F7F7F7] py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-16">
            <span className="text-[#00e3c1]">free.</span>{' '}
            <span className="text-[#1CB0F6]">fun.</span>{' '}
            <span className="text-[#FF9600]">effective.</span>
          </h2>

          <div className="grid md:grid-cols-3 gap-12 max-w-6xl mx-auto">
            <div className="text-center">
              <div className="w-32 h-32 mx-auto mb-6 bg-white rounded-2xl shadow-lg flex items-center justify-center text-6xl">
                📱
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-800">
                backed by science
              </h3>
              <p className="text-gray-600">
                We use research-backed teaching methods and delightful content to create courses that effectively teach skills!
              </p>
            </div>

            <div className="text-center">
              <div className="w-32 h-32 mx-auto mb-6 bg-white rounded-2xl shadow-lg flex items-center justify-center text-6xl">
                🎮
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-800">
                stay motivated
              </h3>
              <p className="text-gray-600">
                We make it easy to form a habit with game-like features, fun challenges, and reminders from Duo the owl.
              </p>
            </div>

            <div className="text-center">
              <div className="w-32 h-32 mx-auto mb-6 bg-white rounded-2xl shadow-lg flex items-center justify-center text-6xl">
                ✨
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-800">
                personalized learning
              </h3>
              <p className="text-gray-600">
                Combining the best of AI and language science, lessons are tailored to help you learn at just the right level.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-8 text-gray-800">
            <span className="text-[#00e3c1]">learn a language</span> with duofinance
          </h2>
          <Link
            to="/register"
            className="duofinance-button duofinance-button-primary px-12 py-4 text-base inline-block"
          >
            Get Started
          </Link>
        </div>
      </section>

      <footer className="bg-[#00e3c1] py-8">
        <div className="container mx-auto px-4 text-center text-white">
          <p>Site language: English</p>
        </div>
      </footer>
    </main>
  );
}
