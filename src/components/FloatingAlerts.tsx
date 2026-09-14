import React from 'react';
import { useGame } from '../context/GameContext';
import { CheckCircle2, AlertTriangle, Info } from 'lucide-react';

export const FloatingAlerts: React.FC = () => {
  const { notifications } = useGame();

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-14 left-0 right-0 z-50 pointer-events-none px-4 flex flex-col items-center space-y-2">
      {notifications.map(notif => {
        let borderAndBg = 'bg-neutral-900 text-white border-neutral-800';
        let Icon = Info;

        if (notif.type === 'profit') {
          borderAndBg = 'bg-neutral-900 text-emerald-400 border-neutral-700';
          Icon = CheckCircle2;
        } else if (notif.type === 'loss') {
          borderAndBg = 'bg-neutral-900 text-rose-400 border-neutral-700';
          Icon = AlertTriangle;
        } else if (notif.type === 'event') {
          borderAndBg = 'bg-neutral-900 text-amber-300 border-neutral-700';
          Icon = Info;
        }

        return (
          <div
            key={notif.id}
            className={`max-w-sm w-full py-2.5 px-3.5 rounded-xl shadow-lg border text-xs font-medium flex items-center space-x-2.5 transition-all transform animate-in fade-in slide-in-from-top-2 duration-200 pointer-events-auto ${borderAndBg}`}
          >
            <Icon className="w-4 h-4 shrink-0" />
            <span className="flex-1 text-neutral-100 font-sans">{notif.text}</span>
          </div>
        );
      })}
    </div>
  );
};
