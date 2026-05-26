import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { UserAvatar } from '@/components/UserAvatar';
import { cn } from '@/lib/utils';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const menuItems = [
  { name: 'Уроки', path: '/learn', icon: '📚' },
  { name: 'Достижения', path: '/achievements', icon: '🏆' },
  { name: 'Магазин', path: '/shop', icon: '🛒' },
];

function isNavActive(pathname: string, path: string) {
  if (path === '/learn') {
    return pathname === '/learn' || pathname.startsWith('/lesson/');
  }
  return pathname === path;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const location = useLocation();
  const { user } = useAuth();

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
          aria-hidden
        />
      )}

      <aside
        className={cn(
          'fixed top-0 left-0 z-50 flex h-screen w-64 flex-col border-r border-zinc-800 bg-zinc-950 transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="shrink-0 border-b border-zinc-800 bg-zinc-950 px-4 py-4">
          <Link
            to="/learn"
            onClick={onClose}
            className="text-xl font-bold text-zinc-100 transition-opacity hover:opacity-80"
          >
            финстарт
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto p-4">
          <ul className="space-y-1">
            {menuItems.map((item) => {
              const active = isNavActive(location.pathname, item.path);
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    onClick={onClose}
                    className={cn(
                      'flex items-center gap-3 rounded-xl px-4 py-3 transition-colors',
                      active
                        ? 'bg-white text-neutral-950 hover:bg-zinc-200'
                        : 'text-zinc-300 hover:bg-zinc-800 hover:text-white'
                    )}
                  >
                    <span className="text-xl leading-none" aria-hidden>
                      {item.icon}
                    </span>
                    <span className="flex-1 font-medium">{item.name}</span>
                    {active && (
                      <span className="text-sm font-bold leading-none" aria-hidden>
                        &gt;
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {user && (
          <div className="shrink-0 border-t border-zinc-800 p-4">
            <Link
              to="/profile"
              onClick={onClose}
              className={cn(
                'flex items-center gap-3 rounded-xl px-4 py-3 transition-colors',
                location.pathname === '/profile'
                  ? 'bg-white text-neutral-950 hover:bg-zinc-200'
                  : 'text-zinc-300 hover:bg-zinc-800 hover:text-white'
              )}
            >
              <UserAvatar username={user.username} avatar={user.avatar} className="h-9 w-9 text-sm" />
              <span className="min-w-0 flex-1 truncate font-medium">{user.username}</span>
              {location.pathname === '/profile' && (
                <span className="text-sm font-bold leading-none" aria-hidden>
                  &gt;
                </span>
              )}
            </Link>
          </div>
        )}
      </aside>
    </>
  );
}
