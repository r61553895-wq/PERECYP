/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { GameProvider } from './context/GameContext';
import { Header } from './components/Header';
import { BottomNav, NavTab } from './components/BottomNav';
import { FloatingAlerts } from './components/FloatingAlerts';
import { AdminModal } from './components/AdminModal';
import { HomeScreen } from './components/HomeScreen';
import { MarketScreen } from './components/MarketScreen';
import { InventoryScreen } from './components/InventoryScreen';
import { DealsScreen } from './components/DealsScreen';
import { ProfileScreen } from './components/ProfileScreen';

const GameContainer: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const [isAdminOpen, setIsAdminOpen] = useState(false);

  React.useEffect(() => {
    const handleSwitchNav = (e: Event) => {
      const customEvent = e as CustomEvent<NavTab>;
      if (customEvent.detail) {
        setActiveTab(customEvent.detail);
      } else {
        setActiveTab('profile');
      }
    };
    const handleOpenDonate = () => {
      setActiveTab('profile');
    };
    window.addEventListener('switch-nav-tab', handleSwitchNav);
    window.addEventListener('open-donate-tab', handleOpenDonate);
    return () => {
      window.removeEventListener('switch-nav-tab', handleSwitchNav);
      window.removeEventListener('open-donate-tab', handleOpenDonate);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#F5F5F7] text-neutral-900 font-sans antialiased selection:bg-neutral-900 selection:text-white flex flex-col">
      {/* Top sticky app header */}
      <Header />

      {/* Floating toast notifications */}
      <FloatingAlerts />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-md mx-auto relative">
        {activeTab === 'home' && (
          <HomeScreen
            onNavigate={tab => setActiveTab(tab)}
            onOpenAdmin={() => setIsAdminOpen(true)}
          />
        )}
        {activeTab === 'market' && <MarketScreen />}
        {activeTab === 'inventory' && (
          <InventoryScreen onNavigateToDeals={() => setActiveTab('deals')} />
        )}
        {activeTab === 'deals' && (
          <DealsScreen onNavigateToMarket={() => setActiveTab('market')} />
        )}
        {activeTab === 'profile' && (
          <ProfileScreen onOpenAdmin={() => setIsAdminOpen(true)} />
        )}
      </main>

      {/* Bottom Tab Bar */}
      <BottomNav activeTab={activeTab} onSelectTab={tab => setActiveTab(tab)} />

      {/* Admin and Key Generator Modal */}
      <AdminModal isOpen={isAdminOpen} onClose={() => setIsAdminOpen(false)} />
    </div>
  );
};

export default function App() {
  return (
    <GameProvider>
      <GameContainer />
    </GameProvider>
  );
}
