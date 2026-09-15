import React from 'react';
import { useGame } from '../context/GameContext';
import { NavTab } from './BottomNav';
import {
  TrendingUp,
  ShoppingBag,
  Package,
  Handshake,
  Store,
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  Star,
  Flame,
  Clock,
} from 'lucide-react';
import { PLAYER_LEVELS, WAREHOUSE_TIERS } from '../data/gameConfig';

interface HomeScreenProps {
  onNavigate: (tab: NavTab) => void;
  onOpenAdmin: () => void;
  onOpenPromo?: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onNavigate, onOpenAdmin }) => {
  const {
    money,
    todayProfit,
    totalProfit,
    totalDeals,
    reputation,
    reviews,
    level,
    xp,
    xpToNextLevel,
    inventory,
    activeListings,
    warehouseTier,
    currentWarehouseCapacity,
    marketNews,
    quests,
  } = useGame();

  const currentLevelConfig = PLAYER_LEVELS.find(l => l.level === level) || PLAYER_LEVELS[0];
  const nextLevelConfig = PLAYER_LEVELS.find(l => l.level === level + 1);
  const currentWarehouse = WAREHOUSE_TIERS[warehouseTier] || WAREHOUSE_TIERS[0];
  const storedItemsCount = inventory.filter(i => i.status !== 'sold').length;

  const pendingOffersCount = activeListings.reduce(
    (total, item) => total + item.buyerOffers.filter(o => o.status === 'pending').length,
    0
  );

  const completedQuestsCount = quests.filter(q => q.completed && !q.claimed).length;
  const latestReview = reviews[0];

  return (
    <div className="space-y-4 pb-20 max-w-md mx-auto px-4 pt-3">
      {/* Primary Balance & Quick Stats Card */}
      <div className="bg-white rounded-2xl p-5 border border-neutral-200/90 shadow-sm relative overflow-hidden">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
              Текущий капитал
            </div>
            <div className="flex items-center space-x-2 mt-1">
              <div className="text-3xl font-extrabold text-neutral-950 tracking-tight font-mono">
                {money.toLocaleString('ru-RU')} <span className="text-lg font-bold text-neutral-500">₽</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('switch-nav-tab', { detail: 'profile' }));
                  window.dispatchEvent(new CustomEvent('open-donate-tab'));
                }}
                className="px-2 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 text-xs font-bold transition-all active:scale-95 flex items-center space-x-1"
                title="Пополнить валюту"
              >
                <span>+</span>
                <span>Донат</span>
              </button>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
              Прибыль за день
            </span>
            <div
              className={`text-sm font-bold font-mono mt-1 flex items-center ${
                todayProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5 mr-1" />
              {todayProfit >= 0 ? '+' : ''}{todayProfit.toLocaleString('ru-RU')} ₽
            </div>
          </div>
        </div>

        {/* Level XP Bar */}
        <div className="mt-4 pt-3 border-t border-neutral-100">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-semibold text-neutral-800">
              Ранг: {currentLevelConfig.name}
            </span>
            <span className="text-[11px] text-neutral-500 font-mono">
              {xp} {nextLevelConfig ? `/ ${nextLevelConfig.xpRequired} XP` : 'MAX'}
            </span>
          </div>
          <div className="w-full h-1.5 bg-neutral-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-neutral-900 rounded-full transition-all duration-300"
              style={{
                width: nextLevelConfig
                  ? `${Math.min(100, Math.max(5, (xp / nextLevelConfig.xpRequired) * 100))}%`
                  : '100%',
              }}
            />
          </div>
        </div>

        {/* Secondary KPI Row */}
        <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-neutral-100 text-center">
          <div className="p-2 rounded-xl bg-neutral-50">
            <div className="text-[10px] font-medium text-neutral-500 uppercase tracking-tight">Сделки</div>
            <div className="text-sm font-bold text-neutral-900 font-mono mt-0.5">{totalDeals}</div>
          </div>
          <div className="p-2 rounded-xl bg-neutral-50">
            <div className="text-[10px] font-medium text-neutral-500 uppercase tracking-tight">Рейтинг</div>
            <div className="text-sm font-bold text-neutral-900 font-mono mt-0.5 flex items-center justify-center">
              <Star className="w-3 h-3 text-amber-500 fill-amber-500 mr-0.5" />
              {reputation.toFixed(1)}
            </div>
          </div>
          <div className="p-2 rounded-xl bg-neutral-50">
            <div className="text-[10px] font-medium text-neutral-500 uppercase tracking-tight">Склад</div>
            <div className="text-sm font-bold text-neutral-900 font-mono mt-0.5">
              {storedItemsCount}/{currentWarehouseCapacity}
            </div>
          </div>
        </div>
      </div>

      {/* Breaking Market News / Ticker */}
      {marketNews.length > 0 && (
        <div className="bg-neutral-950 text-white rounded-2xl p-3.5 border border-neutral-800 flex items-start space-x-3 shadow-sm">
          <div className="w-7 h-7 rounded-lg bg-neutral-800 flex items-center justify-center shrink-0 mt-0.5 text-amber-400">
            <Flame className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                Сводка рынка
              </span>
            </div>
            <div className="text-xs font-bold text-neutral-100 mt-0.5 leading-snug">
              {marketNews[0].title}
            </div>
            <div className="text-[11px] text-neutral-400 mt-0.5 line-clamp-2">
              {marketNews[0].description}
            </div>
          </div>
        </div>
      )}


      {/* Quick Action Navigation Grid */}
      <div className="space-y-2">
        <div className="text-xs font-bold text-neutral-600 uppercase tracking-wider px-1">
          Быстрые действия
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {/* Market CTA */}
          <button
            onClick={() => onNavigate('market')}
            className="p-4 rounded-2xl bg-white border border-neutral-200/90 text-left hover:border-neutral-400 active:scale-[0.98] transition-all flex flex-col justify-between h-28 shadow-sm group"
          >
            <div className="flex items-center justify-between w-full">
              <div className="w-8 h-8 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-900 group-hover:bg-neutral-900 group-hover:text-white transition-colors">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <ArrowUpRight className="w-4 h-4 text-neutral-400" />
            </div>
            <div>
              <div className="text-xs font-bold text-neutral-900">Найти товар</div>
              <div className="text-[11px] text-neutral-500 font-medium">Лента свежих лотов</div>
            </div>
          </button>

          {/* Active Deals CTA */}
          <button
            onClick={() => onNavigate('deals')}
            className="p-4 rounded-2xl bg-white border border-neutral-200/90 text-left hover:border-neutral-400 active:scale-[0.98] transition-all flex flex-col justify-between h-28 shadow-sm group relative"
          >
            <div className="flex items-center justify-between w-full">
              <div className="w-8 h-8 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-900 group-hover:bg-neutral-900 group-hover:text-white transition-colors">
                <Handshake className="w-4 h-4" />
              </div>
              {pendingOffersCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-neutral-900 text-white text-[10px] font-bold animate-pulse">
                  +{pendingOffersCount}
                </span>
              )}
            </div>
            <div>
              <div className="text-xs font-bold text-neutral-900">Сделки и чаты</div>
              <div className="text-[11px] text-neutral-500 font-medium">
                {activeListings.length} активных объявлений
              </div>
            </div>
          </button>

          {/* Inventory CTA */}
          <button
            onClick={() => onNavigate('inventory')}
            className="p-4 rounded-2xl bg-white border border-neutral-200/90 text-left hover:border-neutral-400 active:scale-[0.98] transition-all flex flex-col justify-between h-28 shadow-sm group"
          >
            <div className="flex items-center justify-between w-full">
              <div className="w-8 h-8 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-900 group-hover:bg-neutral-900 group-hover:text-white transition-colors">
                <Package className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold font-mono text-neutral-600">
                {storedItemsCount}/{currentWarehouseCapacity}
              </span>
            </div>
            <div>
              <div className="text-xs font-bold text-neutral-900">Мой склад</div>
              <div className="text-[11px] text-neutral-500 font-medium">Подготовка и ремонт</div>
            </div>
          </button>

          {/* Business & Quests CTA */}
          <button
            onClick={() => onNavigate('profile')}
            className="p-4 rounded-2xl bg-white border border-neutral-200/90 text-left hover:border-neutral-400 active:scale-[0.98] transition-all flex flex-col justify-between h-28 shadow-sm group relative"
          >
            <div className="flex items-center justify-between w-full">
              <div className="w-8 h-8 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-900 group-hover:bg-neutral-900 group-hover:text-white transition-colors">
                <Store className="w-4 h-4" />
              </div>
              {completedQuestsCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold">
                  {completedQuestsCount} наград
                </span>
              )}
            </div>
            <div>
              <div className="text-xs font-bold text-neutral-900">Бизнес и цели</div>
              <div className="text-[11px] text-neutral-500 font-medium">Штат, склад, навыки</div>
            </div>
          </button>
        </div>
      </div>

      {/* Latest Buyer Feedback */}
      {latestReview && (
        <div className="bg-white rounded-2xl p-4 border border-neutral-200/90 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5">
              <div className="flex text-amber-500">
                {[...Array(latestReview.rating)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                ))}
              </div>
              <span className="text-xs font-bold text-neutral-900">{latestReview.buyerName}</span>
            </div>
            <span className="text-[10px] text-neutral-400">{latestReview.date}</span>
          </div>
          <p className="text-xs text-neutral-600 italic">«{latestReview.comment}»</p>
          <div className="flex items-center justify-between text-[11px] pt-1 text-neutral-500">
            <span>{latestReview.itemTitle}</span>
            <span className="font-semibold text-emerald-600 font-mono">
              +{latestReview.profit.toLocaleString('ru-RU')} ₽
            </span>
          </div>
        </div>
      )}

      {/* Discreet link to admin panel */}
      <div className="text-center pt-2">
        <button
          onClick={onOpenAdmin}
          className="text-[11px] text-neutral-400 hover:text-neutral-700 transition-colors font-mono"
        >
          Версия 1.4.2 • Сервисный режим
        </button>
      </div>
    </div>
  );
};
