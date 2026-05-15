import { MenuButton } from '@/components/MenuButton';
import { useDiamondsBalance, useUserStats } from '@/shared/hooks/useAPI';
import { cn } from '@/lib/utils';

interface AppHeaderProps {
  sidebarOpen: boolean;
  onMenuClick: () => void;
}

export function AppHeader({ sidebarOpen, onMenuClick }: AppHeaderProps) {
  const { stats: userStats } = useUserStats();
  const { balance: diamondsBalance } = useDiamondsBalance();

  const currentStreak = userStats?.current_streak ?? 0;
  const streakExtendedToday = userStats?.streak_extended_today ?? false;
  const diamonds = diamondsBalance ?? 0;

  return (
    <header className="sticky top-0 z-30 border-b border-zinc-800 bg-zinc-950">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <MenuButton onClick={onMenuClick} isOpen={sidebarOpen} />
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-800 px-3 py-1 transition-colors hover:bg-zinc-700">
              <div
                className={cn(
                  'flex h-6 w-6 items-center justify-center rounded-full text-sm',
                  streakExtendedToday
                    ? 'bg-gradient-to-br from-neutral-500 to-neutral-700 text-white shadow'
                    : 'bg-zinc-700 text-zinc-500 grayscale'
                )}
              >
                🔥
              </div>
              <span className="font-bold text-zinc-100">{currentStreak}</span>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-800 px-3 py-1 transition-colors hover:bg-zinc-700">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-neutral-400 to-neutral-600 text-sm text-white shadow">
                💎
              </div>
              <span className="font-bold text-zinc-100">{diamonds}</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
