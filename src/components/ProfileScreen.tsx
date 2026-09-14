import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import {
  User,
  Star,
  Award,
  Zap,
  Store,
  CheckCircle2,
  Lock,
  ArrowUpRight,
  Gift,
  Key,
  TrendingUp,
  ShieldCheck,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { PLAYER_LEVELS, STAFF_DEFINITIONS, WAREHOUSE_TIERS } from '../data/gameConfig';

interface ProfileScreenProps {
  onOpenAdmin: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ onOpenAdmin }) => {
  const {
    level,
    xp,
    xpToNextLevel,
    reputation,
    reviews,
    totalProfit,
    totalDeals,
    money,
    skillPoints,
    skills,
    upgradeSkill,
    warehouseTier,
    currentWarehouseCapacity,
    upgradeWarehouse,
    hiredStaff,
    hireStaff,
    quests,
    claimQuestReward,
    redeemPromoCode,
  } = useGame();

  const [activeSection, setActiveSection] = useState<'skills' | 'business' | 'quests' | 'promo'>('skills');
  const [promoInput, setPromoInput] = useState('');
  const [promoMessage, setPromoMessage] = useState<{ text: string; success: boolean } | null>(null);

  const currentLevelConfig = PLAYER_LEVELS.find(l => l.level === level) || PLAYER_LEVELS[0];
  const nextLevelConfig = PLAYER_LEVELS.find(l => l.level === level + 1);
  const nextWarehouse = WAREHOUSE_TIERS[warehouseTier + 1];

  const handleRedeem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoInput.trim()) return;

    const res = redeemPromoCode(promoInput);
    setPromoMessage({ text: res.message, success: res.success });
    if (res.success) {
      setPromoInput('');
    }
  };

  return (
    <div className="space-y-4 pb-24 max-w-md mx-auto px-4 pt-3">
      {/* Profile Overview Card */}
      <div className="bg-white rounded-2xl p-5 border border-neutral-200/90 shadow-sm space-y-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-2xl bg-neutral-900 text-white flex items-center justify-center font-bold text-lg font-mono shadow-sm">
            {currentLevelConfig.name[0]}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-1.5">
              <h2 className="text-base font-extrabold text-neutral-900 tracking-tight">
                {currentLevelConfig.name}
              </h2>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-neutral-100 text-neutral-700">
                Уровень {level}
              </span>
            </div>
            <p className="text-xs text-neutral-500 mt-0.5">{currentLevelConfig.titleDesc}</p>
          </div>
        </div>

        {/* Level XP Progress */}
        <div className="space-y-1.5 pt-1 border-t border-neutral-100">
          <div className="flex items-center justify-between text-xs">
            <span className="text-neutral-500">Прогресс ранга</span>
            <span className="font-mono text-neutral-700 font-semibold">
              {xp} {nextLevelConfig ? `/ ${nextLevelConfig.xpRequired} XP` : '(Макс)'}
            </span>
          </div>
          <div className="w-full h-1.5 bg-neutral-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-neutral-900 rounded-full transition-all"
              style={{
                width: nextLevelConfig
                  ? `${Math.min(100, Math.max(5, (xp / nextLevelConfig.xpRequired) * 100))}%`
                  : '100%',
              }}
            />
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-neutral-100 text-center">
          <div className="p-2 rounded-xl bg-neutral-50">
            <div className="text-[10px] text-neutral-500 font-medium">Репутация</div>
            <div className="text-sm font-bold text-neutral-900 font-mono mt-0.5 flex items-center justify-center">
              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 mr-0.5" />
              {reputation.toFixed(1)}
            </div>
          </div>
          <div className="p-2 rounded-xl bg-neutral-50">
            <div className="text-[10px] text-neutral-500 font-medium">Всего сделок</div>
            <div className="text-sm font-bold text-neutral-900 font-mono mt-0.5">{totalDeals}</div>
          </div>
          <div className="p-2 rounded-xl bg-neutral-50">
            <div className="text-[10px] text-neutral-500 font-medium">Общая маржа</div>
            <div className="text-sm font-bold text-emerald-600 font-mono mt-0.5">
              +{totalProfit.toLocaleString('ru-RU')} ₽
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Pills */}
      <div className="flex items-center space-x-1 bg-neutral-200/60 p-1 rounded-xl text-xs font-semibold">
        <button
          onClick={() => setActiveSection('skills')}
          className={`flex-1 py-1.5 rounded-lg transition-all ${
            activeSection === 'skills'
              ? 'bg-white text-neutral-900 shadow-sm'
              : 'text-neutral-600 hover:text-neutral-900'
          }`}
        >
          Навыки ({skillPoints})
        </button>
        <button
          onClick={() => setActiveSection('business')}
          className={`flex-1 py-1.5 rounded-lg transition-all ${
            activeSection === 'business'
              ? 'bg-white text-neutral-900 shadow-sm'
              : 'text-neutral-600 hover:text-neutral-900'
          }`}
        >
          Бизнес
        </button>
        <button
          onClick={() => setActiveSection('quests')}
          className={`flex-1 py-1.5 rounded-lg transition-all relative ${
            activeSection === 'quests'
              ? 'bg-white text-neutral-900 shadow-sm'
              : 'text-neutral-600 hover:text-neutral-900'
          }`}
        >
          Цели
          {quests.some(q => q.completed && !q.claimed) && (
            <span className="w-2 h-2 rounded-full bg-emerald-600 absolute top-1 right-2" />
          )}
        </button>
        <button
          onClick={() => setActiveSection('promo')}
          className={`flex-1 py-1.5 rounded-lg transition-all ${
            activeSection === 'promo'
              ? 'bg-white text-neutral-900 shadow-sm'
              : 'text-neutral-600 hover:text-neutral-900'
          }`}
        >
          Промокоды
        </button>
      </div>

      {/* Section 1: Skills Tree */}
      {activeSection === 'skills' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-600">
              Дерево прокачки
            </span>
            <span className="text-xs font-bold text-neutral-900 bg-neutral-100 px-2 py-0.5 rounded-lg font-mono">
              Очков навыков: {skillPoints}
            </span>
          </div>

          <div className="space-y-2.5">
            {skills.map(skill => {
              const isMax = skill.currentLevel >= skill.maxLevel;
              const canUpgrade = skillPoints >= skill.costPerLevel && !isMax;

              return (
                <div
                  key={skill.id}
                  className="bg-white rounded-2xl p-4 border border-neutral-200/90 shadow-sm flex items-start justify-between gap-3"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="text-xs font-bold text-neutral-900">{skill.name}</h4>
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-neutral-100 text-neutral-700">
                        {skill.currentLevel} / {skill.maxLevel}
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-500 mt-1 leading-normal">{skill.desc}</p>
                  </div>

                  <button
                    onClick={() => upgradeSkill(skill.id)}
                    disabled={!canUpgrade}
                    className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      isMax
                        ? 'bg-neutral-100 text-neutral-400 cursor-default'
                        : canUpgrade
                        ? 'bg-neutral-900 text-white hover:bg-neutral-800 active:scale-95'
                        : 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
                    }`}
                  >
                    {isMax ? 'MAX' : `+1 ур (${skill.costPerLevel} SP)`}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Section 2: Business Expansion */}
      {activeSection === 'business' && (
        <div className="space-y-4">
          {/* Warehouse Upgrade Card */}
          <div className="bg-white rounded-2xl p-4 border border-neutral-200/90 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                  Помещение
                </span>
                <h4 className="text-sm font-bold text-neutral-900 mt-0.5">
                  {WAREHOUSE_TIERS[warehouseTier].name}
                </h4>
              </div>
              <span className="text-xs font-bold font-mono text-neutral-700 bg-neutral-100 px-2 py-1 rounded-lg">
                Вместимость: {currentWarehouseCapacity} мест
              </span>
            </div>

            {nextWarehouse ? (
              <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-neutral-600 font-medium">Следующий уровень:</span>
                  <span className="font-bold text-neutral-900">{nextWarehouse.name}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-neutral-600 font-medium">Новая вместимость:</span>
                  <span className="font-bold text-neutral-900 font-mono">
                    {nextWarehouse.capacity} мест (+{nextWarehouse.capacity - WAREHOUSE_TIERS[warehouseTier].capacity})
                  </span>
                </div>
                <button
                  onClick={upgradeWarehouse}
                  disabled={money < nextWarehouse.costToUpgrade}
                  className="w-full py-2.5 bg-neutral-900 hover:bg-neutral-800 disabled:bg-neutral-200 disabled:text-neutral-400 text-white font-bold text-xs rounded-xl transition-all mt-1"
                >
                  Расширить склад за {nextWarehouse.costToUpgrade.toLocaleString('ru-RU')} ₽
                </button>
              </div>
            ) : (
              <div className="p-2.5 bg-neutral-50 rounded-xl text-center text-xs text-neutral-500 font-medium">
                У вас флагманский уровень складских помещений!
              </div>
            )}
          </div>

          {/* Staff Hiring */}
          <div className="space-y-2.5">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-600 px-1">
              Найм сотрудников в штат
            </span>

            {STAFF_DEFINITIONS.map(staff => {
              const isHired = hiredStaff[staff.key];
              const canAfford = money >= staff.cost && !isHired;

              return (
                <div
                  key={staff.key}
                  className="bg-white rounded-2xl p-4 border border-neutral-200/90 shadow-sm flex items-start justify-between gap-3"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-1.5">
                      <h4 className="text-xs font-bold text-neutral-900">{staff.name}</h4>
                      {isHired && (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded flex items-center">
                          <CheckCircle2 className="w-3 h-3 mr-0.5" /> В штате
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-neutral-500 mt-1 leading-normal">{staff.desc}</p>
                  </div>

                  {!isHired && (
                    <button
                      onClick={() => hireStaff(staff.key)}
                      disabled={!canAfford}
                      className="shrink-0 px-3 py-2 bg-neutral-900 hover:bg-neutral-800 disabled:bg-neutral-200 disabled:text-neutral-400 text-white font-bold text-xs rounded-xl active:scale-95 transition-all"
                    >
                      {staff.cost.toLocaleString('ru-RU')} ₽
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Section 3: Quests & Goals */}
      {activeSection === 'quests' && (
        <div className="space-y-2.5">
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-600 px-1">
            Задания и награды
          </span>

          {quests.map(quest => (
            <div
              key={quest.id}
              className="bg-white rounded-2xl p-4 border border-neutral-200/90 shadow-sm space-y-2.5"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-xs font-bold text-neutral-900">{quest.title}</h4>
                  <p className="text-[11px] text-neutral-500 mt-0.5">{quest.description}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    +{quest.rewardMoney.toLocaleString('ru-RU')} ₽ • +{quest.rewardXp} XP
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-neutral-500 font-mono">
                  <span>Прогресс:</span>
                  <span>
                    {Math.min(quest.current, quest.target)} / {quest.target}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-neutral-900 rounded-full transition-all"
                    style={{
                      width: `${Math.min(100, (quest.current / quest.target) * 100)}%`,
                    }}
                  />
                </div>
              </div>

              {/* Claim Button */}
              {quest.completed && !quest.claimed && (
                <button
                  onClick={() => claimQuestReward(quest.id)}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl active:scale-95 transition-all flex items-center justify-center space-x-1"
                >
                  <Gift className="w-3.5 h-3.5" />
                  <span>Забрать награду</span>
                </button>
              )}

              {quest.claimed && (
                <div className="text-center text-[10px] text-neutral-400 font-semibold py-1">
                  ✓ Награда получена
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Section 4: Promo Codes */}
      {activeSection === 'promo' && (
        <div className="space-y-3">
          <div className="bg-white rounded-2xl p-4 border border-neutral-200/90 shadow-sm space-y-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                Активация промокода
              </span>
              <h4 className="text-sm font-bold text-neutral-900 mt-0.5">Ввод ключа или кода</h4>
              <p className="text-[11px] text-neutral-500 mt-0.5">
                Введите промокод для мгновенного получения денег, опыта или раритетов
              </p>
            </div>

            <form onSubmit={handleRedeem} className="space-y-2">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={promoInput}
                  onChange={e => setPromoInput(e.target.value.toUpperCase())}
                  placeholder="ВВЕДИТЕ КОД..."
                  className="flex-1 px-3 py-2 border border-neutral-300 rounded-xl text-xs font-mono font-bold focus:outline-none focus:border-neutral-900 uppercase"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-neutral-900 text-white font-bold text-xs rounded-xl hover:bg-neutral-800 transition-colors"
                >
                  Применить
                </button>
              </div>

              {promoMessage && (
                <div
                  className={`p-2.5 rounded-xl text-xs font-medium ${
                    promoMessage.success
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}
                >
                  {promoMessage.text}
                </div>
              )}
            </form>
          </div>

          {/* Quick info note */}
          <div className="p-3.5 rounded-2xl bg-neutral-100 border border-neutral-200 text-xs text-neutral-600 space-y-1">
            <p className="font-semibold text-neutral-800">Совет перекупщика:</p>
            <p className="text-[11px] leading-relaxed">
              Следите за событиями рынка, прокачивайте навыки переговоров и расширяйте склад, чтобы переходить к более дорогим сделкам.
            </p>
          </div>
        </div>
      )}

      {/* Secret Developer Mode Button */}
      <div className="text-center pt-4">
        <button
          onClick={onOpenAdmin}
          className="text-xs text-neutral-400 hover:text-neutral-700 transition-colors font-mono flex items-center justify-center mx-auto space-x-1"
        >
          <Lock className="w-3 h-3" />
          <span>Вход для разработчика</span>
        </button>
      </div>
    </div>
  );
};
