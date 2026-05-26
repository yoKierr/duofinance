import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { AppHeader } from '@/components/AppHeader';
import { useDiamondsBalance, useShopItems } from '@/shared/hooks/useAPI';
import { apiClient } from '@/shared/api/client';
import type { ShopItem } from '@/types/api';
import { cn } from '@/lib/utils';

function ShopItemCard({
  item,
  balance,
  purchasing,
  onBuy,
}: {
  item: ShopItem;
  balance: number;
  purchasing: boolean;
  onBuy: (id: number) => void;
}) {
  const canAfford = balance >= item.price;

  return (
    <li
      className={cn(
        'rounded-2xl border px-5 py-5 transition-all duration-300 ease-out',
        'hover:-translate-y-1 hover:scale-[1.02] hover:shadow-lg hover:shadow-black/50',
        item.owned
          ? 'border-emerald-800/60 bg-emerald-950/20'
          : 'border-zinc-800 bg-black hover:border-zinc-600'
      )}
    >
      <div className="flex gap-4">
        <div
          className={cn(
            'flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border text-3xl',
            item.owned ? 'border-emerald-700/50 bg-emerald-950/40' : 'border-zinc-700 bg-zinc-900'
          )}
          aria-hidden
        >
          {item.icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h3 className="font-semibold text-white">{item.name}</h3>
            <span className="shrink-0 text-sm font-semibold tabular-nums text-zinc-300">
              {item.price} 💎
            </span>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-zinc-500">{item.description}</p>

          {item.owned ? (
            <p className="mt-4 text-xs font-medium text-emerald-400/90">Уже в коллекции</p>
          ) : (
            <button
              type="button"
              disabled={purchasing || !canAfford}
              onClick={() => onBuy(item.id)}
              className={cn(
                'mt-4 finstart-button px-5 py-2 text-sm',
                canAfford ? 'finstart-button-primary' : 'finstart-button-secondary opacity-60',
                purchasing && 'pointer-events-none opacity-60'
              )}
            >
              {purchasing ? 'Покупка…' : canAfford ? 'Купить' : 'Недостаточно алмазов'}
            </button>
          )}
        </div>
      </div>
    </li>
  );
}

export default function ShopPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { balance, loading: balanceLoading, refetch: refetchBalance, setBalance } = useDiamondsBalance();
  const { items, loading: shopLoading, error, refetch: refetchShop } = useShopItems();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [purchasingId, setPurchasingId] = useState<number | null>(null);
  const [purchaseError, setPurchaseError] = useState('');
  const [purchaseSuccess, setPurchaseSuccess] = useState('');

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  const pageLoading = loading || !user || balanceLoading || shopLoading;

  const handleBuy = async (achievementId: number) => {
    setPurchaseError('');
    setPurchaseSuccess('');
    setPurchasingId(achievementId);
    try {
      const result = await apiClient.purchaseShopItem(achievementId);
      setBalance(result.balance);
      await refetchShop();
      void refetchBalance();
      const item = items.find((i) => i.id === achievementId);
      setPurchaseSuccess(item ? `«${item.name}» добавлено в достижения` : 'Покупка успешна');
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('INSUFFICIENT') || msg.includes('Недостаточно')) {
        setPurchaseError('Недостаточно алмазов');
      } else if (msg.includes('уже куплено') || msg.includes('CONFLICT')) {
        setPurchaseError('Это достижение уже куплено');
        void refetchShop();
      } else {
        setPurchaseError('Не удалось совершить покупку');
      }
    } finally {
      setPurchasingId(null);
    }
  };

  if (pageLoading) {
    return (
      <div className="flex min-h-screen bg-neutral-950 text-zinc-100">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex min-h-screen flex-1 flex-col lg:ml-64">
          <div className="flex-1 px-4 py-8 lg:px-8">
            <div className="mb-8 h-10 max-w-xs animate-pulse rounded-lg bg-zinc-900" />
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-32 animate-pulse rounded-2xl border border-zinc-800 bg-black" />
              ))}
            </div>
          </div>
        </div>
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
            <h1 className="text-2xl font-bold text-white sm:text-3xl">Магазин</h1>
            <p className="mt-2 max-w-2xl text-sm text-zinc-500">
              Покупайте эксклюзивные достижения за алмазы. На счёте:{' '}
              <span className="font-semibold tabular-nums text-zinc-300">{balance} 💎</span>
            </p>
          </div>

          {error && (
            <p className="mb-6 rounded-2xl border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-300" role="alert">
              {error}
            </p>
          )}
          {purchaseError && (
            <p className="mb-6 rounded-2xl border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-300" role="alert">
              {purchaseError}
            </p>
          )}
          {purchaseSuccess && (
            <p
              className="mb-6 rounded-2xl border border-emerald-900/50 bg-emerald-950/30 px-4 py-3 text-sm text-emerald-300"
              role="status"
            >
              {purchaseSuccess}
            </p>
          )}

          {items.length === 0 ? (
            <p className="text-sm text-zinc-500">В магазине пока нет товаров.</p>
          ) : (
            <ul className="space-y-3">
              {items.map((item) => (
                <ShopItemCard
                  key={item.id}
                  item={item}
                  balance={balance}
                  purchasing={purchasingId === item.id}
                  onBuy={handleBuy}
                />
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
