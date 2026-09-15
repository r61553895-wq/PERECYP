import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { useGame } from '../context/GameContext';
import { PLAYER_LEVELS } from '../data/gameConfig';

export const Header: React.FC = () => {
  const { money, todayProfit, level, reputation } = useGame();

  const currentLevelConfig = PLAYER_LEVELS.find(l => l.level === level) || PLAYER_LEVELS[0];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-neutral-200/80 px-4 py-2.5 transition-colors">
      <div className="max-w-md mx-auto flex items-center justify-between">
        {/* Left: Brand & Level */}
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-neutral-900 flex items-center justify-center text-white font-black text-sm tracking-tight shadow-sm">
            П
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-900">ПЕРЕКУП</span>
              <span className="inline-flex items-center text-[10px] font-semibold px-1.5 py-0.2 rounded bg-neutral-100 text-neutral-700 border border-neutral-200">
                Lvl {level}
              </span>
            </div>
            <div className="text-[11px] text-neutral-500 font-medium leading-none mt-0.5">
              {currentLevelConfig.name}
            </div>
          </div>
        </div>

        {/* Right: Financial Stats & Reputation */}
        <div className="flex flex-col items-end">
          <div className="flex items-center space-x-1.5">
            <span className="text-base font-extrabold tracking-tight text-neutral-950 font-mono">
              {money.toLocaleString('ru-RU')} <span className="text-xs font-semibold text-neutral-600">₽</span>
            </span>
            <button
              type="button"
              onClick={() => {
                window.dispatchEvent(new CustomEvent('switch-nav-tab', { detail: 'profile' }));
                window.dispatchEvent(new CustomEvent('open-donate-tab'));
              }}
              title="Донат и пополнение валюты"
              className="px-1.5 py-0.5 rounded-md bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 text-[10px] font-extrabold transition-all active:scale-95 flex items-center space-x-0.5"
            >
              <span>+</span>
              <span>Донат</span>
            </button>
          </div>
          <div className="flex items-center space-x-2 text-[11px]">
            <span className={`font-semibold ${todayProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {todayProfit >= 0 ? '+' : ''}{todayProfit.toLocaleString('ru-RU')} ₽
            </span>
            <span className="text-neutral-300">•</span>
            <span className="flex items-center text-neutral-600 font-medium">
              <ShieldCheck className="w-3 h-3 mr-0.5 text-neutral-700" />
              {reputation.toFixed(1)}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
