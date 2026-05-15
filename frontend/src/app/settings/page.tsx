import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Sidebar } from '@/components/Sidebar';
import { AppHeader } from '@/components/AppHeader';
import { ProfileAccountSettings } from '@/components/ProfileAccountSettings';

export default function SettingsPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-950 text-zinc-100">
        <p className="text-sm text-zinc-500">Загрузка…</p>
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
            <Link
              to="/profile"
              className="mb-4 inline-flex items-center gap-2 text-sm text-zinc-500 transition-colors hover:text-zinc-300"
            >
              <ArrowLeft className="h-4 w-4" strokeWidth={2} />
              К профилю
            </Link>
            <h1 className="text-2xl font-bold text-white sm:text-3xl">Настройки</h1>
            <p className="mt-2 max-w-2xl text-sm text-zinc-500">
              Имя, фото и выход из аккаунта.
            </p>
          </div>

          <ProfileAccountSettings />
        </div>
      </div>
    </div>
  );
}
