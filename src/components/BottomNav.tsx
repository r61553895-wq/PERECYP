import React from 'react';
import { Home, ShoppingBag, Package, MessageSquare, User } from 'lucide-react';
import { useGame } from '../context/GameContext';

export type NavTab = 'home' | 'market' | 'inventory' | 'deals' | 'profile';

interface BottomNavProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onSelectTab }) => {
  const { inventory, activeListings } = useGame();

  // Count items stored
  const inventoryCount = inventory.filter(i => i.status !== 'sold').length;

  // Count total incoming pending offers across active listings
  const pendingOffersCount = activeListings.reduce(
    (total, item) => total + item.buyerOffers.filter(o => o.status === 'pending').length,
    0
  );

  const tabs: { id: NavTab; label: string; icon: React.FC<{ className?: string }>; badge?: number }[] = [
    { id: 'home', label: 'Главная', icon: Home },
    { id: 'market', label: 'Рынок', icon: ShoppingBag },
    { id: 'inventory', label: 'Товары', icon: Package, badge: inventoryCount },
    { id: 'deals', label: 'Сделки', icon: MessageSquare, badge: pendingOffersCount },
    { id: 'profile', label: 'Профиль', icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-neutral-200/80 px-2 py-1 safe-area-pb">
      <div className="max-w-md mx-auto flex items-center justify-around">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`relative flex flex-col items-center justify-center flex-1 min-h-[48px] py-1 transition-all active:scale-95 ${
                isActive ? 'text-neutral-950 font-semibold' : 'text-neutral-500 hover:text-neutral-800'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110 text-neutral-950 stroke-[2.2]' : 'stroke-[1.8]'}`} />
                {!!tab.badge && tab.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 min-w-[17px] h-[17px] px-1 rounded-full bg-neutral-900 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className={`text-[11px] mt-1 tracking-tight ${isActive ? 'font-bold text-neutral-950' : 'font-medium'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
