import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { MenuButton } from '@/components/MenuButton';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function AchievementsPage() {
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
      <div className="min-h-screen flex items-center justify-center bg-neutral-950 text-zinc-100">
        <div className="text-2xl">Loading...</div>
      </div>
    );
  }

  // Mock achievements data
  const achievements = [
    {
      id: 1,
      name: "First Steps",
      description: "Complete your first lesson",
      icon: "🎯",
      unlocked: true,
      points: 10,
      unlockedAt: "2024-01-15"
    },
    {
      id: 2,
      name: "Streak Master",
      description: "Maintain a 7-day streak",
      icon: "🔥",
      unlocked: true,
      points: 50,
      unlockedAt: "2024-01-20"
    },
    {
      id: 3,
      name: "Knowledge Seeker",
      description: "Complete 10 lessons",
      icon: "📚",
      unlocked: false,
      points: 100,
      progress: 7
    },
    {
      id: 4,
      name: "Perfectionist",
      description: "Get 100% on 5 lessons",
      icon: "⭐",
      unlocked: false,
      points: 75,
      progress: 2
    }
  ];

  const unlockedAchievements = achievements.filter(a => a.unlocked);
  const lockedAchievements = achievements.filter(a => !a.unlocked);

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
              <h1 className="text-2xl font-bold text-white">Achievements</h1>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <Card className="p-6 text-center hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer">
                <div className="text-3xl mb-2">🏆</div>
                <div className="text-2xl font-bold text-white">{unlockedAchievements.length}</div>
                <div className="text-sm text-zinc-400">Unlocked</div>
              </Card>
              <Card className="p-6 text-center hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer">
                <div className="text-3xl mb-2">🔒</div>
                <div className="text-2xl font-bold text-zinc-300">{lockedAchievements.length}</div>
                <div className="text-sm text-zinc-400">Locked</div>
              </Card>
              <Card className="p-6 text-center hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer">
                <div className="text-3xl mb-2">⭐</div>
                <div className="text-2xl font-bold text-white">
                  {unlockedAchievements.reduce((sum, a) => sum + a.points, 0)}
                </div>
                <div className="text-sm text-zinc-400">Total Points</div>
              </Card>
            </div>

            {/* Unlocked Achievements */}
            <div>
              <h2 className="text-xl font-bold text-white mb-4">Unlocked Achievements</h2>
              <div className="grid md:grid-cols-2 gap-4">
                {unlockedAchievements.map((achievement) => (
                  <Card key={achievement.id} className="p-6 border-2 border-zinc-600 bg-zinc-900/80 hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer">
                    <div className="flex items-center gap-4">
                      <div className="text-5xl">{achievement.icon}</div>
                      <div className="flex-1">
                        <h3 className="font-bold text-white mb-1">{achievement.name}</h3>
                        <p className="text-sm text-zinc-400 mb-2">{achievement.description}</p>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-zinc-700 text-zinc-100">
                            +{achievement.points} 💎
                          </Badge>
                          <span className="text-xs text-zinc-500">
                            Unlocked {achievement.unlockedAt ? new Date(achievement.unlockedAt).toLocaleDateString() : 'Recently'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Locked Achievements */}
            {lockedAchievements.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-white mb-4">Locked Achievements</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  {lockedAchievements.map((achievement) => (
                    <Card key={achievement.id} className="p-6 border-2 border-zinc-800 bg-zinc-950/80 opacity-90 hover:opacity-100 hover:shadow-lg transition-all duration-300 cursor-pointer">
                      <div className="flex items-center gap-4">
                        <div className="text-5xl grayscale opacity-70">{achievement.icon}</div>
                        <div className="flex-1">
                          <h3 className="font-bold text-zinc-300 mb-1">{achievement.name}</h3>
                          <p className="text-sm text-zinc-500 mb-2">{achievement.description}</p>
                          <div className="flex items-center gap-2">
                            <Badge className="bg-zinc-800 text-zinc-400">
                              +{achievement.points} 💎
                            </Badge>
                            {achievement.progress && (
                              <span className="text-xs text-zinc-500">
                                {achievement.progress}/10 progress
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
