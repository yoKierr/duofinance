import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useUserStats, useDiamondsBalance, useAchievements } from '@/shared/hooks/useAPI';
import type { Stats, RewardBalance, Achievement } from '@/types/api';
import { Sidebar } from '@/components/Sidebar';

export default function ProfilePage() {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const { stats: userStats, loading: statsLoading } = useUserStats();
  const { balance: diamondsBalance, loading: balanceLoading } = useDiamondsBalance();
  const { achievements, loading: achievementsLoading } = useAchievements();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Преобразуем данные бэкенда в формат фронтенда
  const stats: Stats = {
    currentStreak: userStats?.current_streak || 0,
    longestStreak: userStats?.current_streak || 0, // TODO: добавить в бэкенд
    completedLevels: userStats?.completed_levels || 0,
  };
  
  const balance: RewardBalance = {
    diamonds: diamondsBalance || 0,
    gems: 0, // TODO: добавить в бэкенд
    coins: 0, // TODO: добавить в бэкенд
  };

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  if (loading || !user || statsLoading || balanceLoading || achievementsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-950 text-zinc-100">
        <div className="text-2xl">Loading...</div>
      </div>
    );
  }

  const userAchievements = achievements.filter(a => a.unlocked).slice(0, 3);

  return (
    <div className="min-h-screen bg-neutral-950 text-zinc-100 flex">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      {/* Main Content (без header) */}
      <div className="flex-1 lg:ml-64">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl shadow-lg p-8 mb-8 hover:shadow-xl hover:scale-105 transition-all duration-300">
          <div className="flex items-center gap-6 mb-8">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-neutral-700 to-neutral-900 flex items-center justify-center text-white font-bold text-4xl">
              {user.username.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-white mb-2">
                {user.displayName || user.username}
              </h1>
              <p className="text-zinc-400">@{user.username}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 justify-items-center">
            <div className="text-center p-4 bg-zinc-800 rounded-2xl border border-zinc-700 w-full max-w-[200px]">
              <div className="text-3xl mb-2">🔥</div>
              <div className="text-2xl font-bold text-white">{stats.currentStreak}</div>
              <div className="text-sm text-zinc-400">Day Streak</div>
            </div>
            <div className="text-center p-4 bg-zinc-800 rounded-2xl border border-zinc-700 w-full max-w-[200px]">
              <div className="text-3xl mb-2">💎</div>
              <div className="text-2xl font-bold text-white">{balance.diamonds}</div>
              <div className="text-sm text-zinc-400">Diamonds</div>
            </div>
            <div className="text-center p-4 bg-zinc-800 rounded-2xl border border-zinc-700 w-full max-w-[200px]">
              <div className="text-3xl mb-2">✅</div>
              <div className="text-2xl font-bold text-white">{stats.completedLevels}</div>
              <div className="text-sm text-zinc-400">Lessons</div>
            </div>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl shadow-lg p-8 mb-8 hover:shadow-xl hover:scale-105 transition-all duration-300">
          <h2 className="text-2xl font-bold text-white mb-6">Statistics</h2>
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-zinc-300">Current Streak</span>
                <span className="text-white font-bold">{stats.currentStreak} days 🔥</span>
              </div>
              <Progress value={(stats.currentStreak / 30) * 100} className="h-3" />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-zinc-300">Longest Streak</span>
                <span className="text-zinc-200 font-bold">{stats.longestStreak} days</span>
              </div>
            </div>


            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-zinc-300">Completed Levels</span>
                <span className="text-white font-bold">{stats.completedLevels}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-white mb-6">Achievements</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {userAchievements.map((achievement) => (
              <Card key={achievement.id} className="p-6 border-2 border-zinc-700 rounded-2xl hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="text-5xl">{achievement.icon}</div>
                  <div className="flex-1">
                    <h3 className="font-bold text-white mb-1">{achievement.name}</h3>
                    <p className="text-sm text-zinc-400 mb-2">{achievement.description}</p>
                    <Badge className="bg-zinc-700 text-zinc-100">
                      +{achievement.points} 💎
                    </Badge>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div className="mt-6 text-center">
            <p className="text-zinc-500 text-sm">
              {achievements.length - userAchievements.length} more achievements to unlock
            </p>
          </div>
        </div>

        <div className="mt-8 text-center">
          <Link
            to="/courses"
            className="finstart-button finstart-button-primary px-8 py-3 text-base inline-block hover:scale-105 transition-transform duration-200"
          >
            К курсам
          </Link>
        </div>
        </div>
      </div>
    </div>
  );
}
