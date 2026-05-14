import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { MenuButton } from '@/components/MenuButton';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function SettingsPage() {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState('en');

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-950 text-zinc-100">
        <div className="text-2xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-zinc-100 flex">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      {/* Main Content */}
      <div className="flex-1 lg:ml-0">
        <header className="bg-zinc-950 border-b border-zinc-800">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center gap-4">
              <MenuButton onClick={() => setSidebarOpen(!sidebarOpen)} isOpen={sidebarOpen} />
              <h1 className="text-2xl font-bold text-white">Settings</h1>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="space-y-6">
            {/* Account Settings */}
            <Card className="p-6 hover:shadow-lg hover:scale-105 transition-all duration-300">
              <h2 className="text-xl font-bold text-white mb-4">Account Settings</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-zinc-200">Username</p>
                    <p className="text-sm text-zinc-500">@{user.username}</p>
                  </div>
                  <Button variant="outline" className="hover:scale-105 transition-transform duration-200">Edit</Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-zinc-200">Email</p>
                    <p className="text-sm text-zinc-500">{user.email || 'Not provided'}</p>
                  </div>
                  <Button variant="outline" className="hover:scale-105 transition-transform duration-200">Edit</Button>
                </div>
              </div>
            </Card>

            {/* Preferences */}
            <Card className="p-6 hover:shadow-lg hover:scale-105 transition-all duration-300">
              <h2 className="text-xl font-bold text-white mb-4">Preferences</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-zinc-200">Notifications</p>
                    <p className="text-sm text-zinc-500">Receive learning reminders</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifications}
                      onChange={(e) => setNotifications(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-zinc-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-white peer-checked:after:bg-neutral-950 hover:shadow-md transition-shadow duration-200"></div>
                  </label>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-zinc-200">Dark Mode</p>
                    <p className="text-sm text-zinc-500">Switch to dark theme</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={darkMode}
                      onChange={(e) => setDarkMode(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-zinc-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-white peer-checked:after:bg-neutral-950 hover:shadow-md transition-shadow duration-200"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-zinc-200">Language</p>
                    <p className="text-sm text-zinc-500">Interface language</p>
                  </div>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="px-3 py-1 border border-zinc-600 rounded-md text-sm bg-zinc-900 text-zinc-100 hover:border-zinc-500 hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-zinc-400"
                  >
                    <option value="en">English</option>
                    <option value="ru">Русский</option>
                    <option value="es">Español</option>
                    <option value="fr">Français</option>
                  </select>
                </div>
              </div>
            </Card>

            {/* Danger Zone */}
            <Card className="p-6 border-red-900/50 border-2">
              <h2 className="text-xl font-bold text-red-400 mb-4">Danger Zone</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-red-300">Logout</p>
                    <p className="text-sm text-red-400/80">Sign out of your account</p>
                  </div>
                  <Button
                    onClick={logout}
                    className="bg-red-600 hover:bg-red-700 text-white hover:scale-105 transition-all duration-200"
                  >
                    Logout
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
