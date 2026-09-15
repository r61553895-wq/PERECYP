import React, { useState, useEffect } from 'react';
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
  Coins,
  Copy,
  Check,
  ExternalLink,
  Flame,
  Crown,
  Calculator,
  MessageCircle,
} from 'lucide-react';
import { PLAYER_LEVELS, STAFF_DEFINITIONS, WAREHOUSE_TIERS } from '../data/gameConfig';

interface ProfileScreenProps {
  onOpenAdmin: () => void;
  initialSection?: 'skills' | 'business' | 'quests' | 'donate' | 'promo';
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ onOpenAdmin, initialSection = 'skills' }) => {
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

  const [activeSection, setActiveSection] = useState<'skills' | 'business' | 'quests' | 'donate' | 'promo'>(initialSection);
  const [promoInput, setPromoInput] = useState('');
  const [promoMessage, setPromoMessage] = useState<{ text: string; success: boolean } | null>(null);
  const [isRedeeming, setIsRedeeming] = useState(false);

  // Donate Calculator & Copy State
  const [customRubles, setCustomRubles] = useState<number>(50);
  const [copiedTiktok, setCopiedTiktok] = useState(false);
  const [copiedOrderText, setCopiedOrderText] = useState(false);

  const getDonateReward = (rubles: number) => {
    if (rubles <= 0 || isNaN(rubles)) return 0;
    let rate = 2500;
    if (rubles >= 250) rate = 6000;
    else if (rubles >= 100) rate = 5000;
    else if (rubles >= 50) rate = 4000;
    else if (rubles >= 25) rate = 3400;
    return Math.floor(rubles * rate);
  };

  const handleCopyTiktok = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText('@ctrl_z52');
      setCopiedTiktok(true);
      setTimeout(() => setCopiedTiktok(false), 2000);
    }
  };

  const handleOrderPack = (packName: string, priceRub: number, rewardGame: number) => {
    const text = `Привет! Хочу задонатить ${priceRub} руб на пак "${packName}" (${rewardGame.toLocaleString('ru-RU')} ₽ в игре) в Перекуп Симуляторе`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedOrderText(true);
      setTimeout(() => setCopiedOrderText(false), 2500);
    }
    window.open('https://www.tiktok.com/@ctrl_z52', '_blank');
  };

  useEffect(() => {
    const handleSwitchToDonate = () => setActiveSection('donate');
    window.addEventListener('open-donate-tab', handleSwitchToDonate);
    return () => window.removeEventListener('open-donate-tab', handleSwitchToDonate);
  }, []);

  const currentLevelConfig = PLAYER_LEVELS.find(l => l.level === level) || PLAYER_LEVELS[0];
  const nextLevelConfig = PLAYER_LEVELS.find(l => l.level === level + 1);
  const nextWarehouse = WAREHOUSE_TIERS[warehouseTier + 1];

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoInput.trim() || isRedeeming) return;

    setIsRedeeming(true);
    setPromoMessage(null);
    try {
      const res = await redeemPromoCode(promoInput);
      setPromoMessage({ text: res.message, success: res.success });
      if (res.success) {
        setPromoInput('');
      }
    } finally {
      setIsRedeeming(false);
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
      <div className="flex items-center space-x-1 bg-neutral-200/60 p-1 rounded-xl text-xs font-semibold overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveSection('skills')}
          className={`flex-1 min-w-[64px] py-1.5 rounded-lg transition-all ${
            activeSection === 'skills'
              ? 'bg-white text-neutral-900 shadow-sm'
              : 'text-neutral-600 hover:text-neutral-900'
          }`}
        >
          Навыки ({skillPoints})
        </button>
        <button
          onClick={() => setActiveSection('business')}
          className={`flex-1 min-w-[58px] py-1.5 rounded-lg transition-all ${
            activeSection === 'business'
              ? 'bg-white text-neutral-900 shadow-sm'
              : 'text-neutral-600 hover:text-neutral-900'
          }`}
        >
          Бизнес
        </button>
        <button
          onClick={() => setActiveSection('quests')}
          className={`flex-1 min-w-[54px] py-1.5 rounded-lg transition-all relative ${
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
          onClick={() => setActiveSection('donate')}
          className={`flex-1 min-w-[68px] py-1.5 rounded-lg transition-all flex items-center justify-center space-x-1 ${
            activeSection === 'donate'
              ? 'bg-amber-500 text-white shadow-sm font-bold'
              : 'text-amber-700 hover:text-amber-900 hover:bg-amber-100/50'
          }`}
        >
          <Coins className="w-3.5 h-3.5" />
          <span>Донат</span>
        </button>
        <button
          onClick={() => setActiveSection('promo')}
          className={`flex-1 min-w-[76px] py-1.5 rounded-lg transition-all ${
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

      {/* Section: Donate & TikTok Admin */}
      {activeSection === 'donate' && (
        <div className="space-y-3">
          {/* TikTok Admin Hero Card */}
          <div className="bg-neutral-950 text-white rounded-2xl p-4.5 border border-neutral-800 shadow-md relative overflow-hidden">
            {/* Ambient subtle glow */}
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-start justify-between relative z-10">
              <div>
                <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-neutral-800/90 border border-neutral-700 text-neutral-300 text-[10px] font-bold uppercase tracking-wider mb-2">
                  <MessageCircle className="w-3 h-3 text-rose-400" />
                  <span>Официальный Донат</span>
                </div>
                <h3 className="text-base font-extrabold tracking-tight text-white">
                  Пополнение игровой валюты
                </h3>
              </div>
              <div className="px-2 py-1 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 text-[11px] font-mono font-bold">
                1 ₽ = 2 500 ₽
              </div>
            </div>

            <p className="text-xs text-neutral-300 mt-2 leading-relaxed relative z-10">
              Чтобы задонатить, напишите админу в TikTok:{' '}
              <span className="font-extrabold text-white font-mono bg-neutral-800 px-1.5 py-0.5 rounded border border-neutral-700">
                @ctrl_z52
              </span>
              . Админ моментально выдаст вам персональный промокод на зачисление любой суммы!
            </p>

            {/* Action Buttons for TikTok */}
            <div className="grid grid-cols-2 gap-2 mt-3.5 relative z-10">
              <button
                type="button"
                onClick={handleCopyTiktok}
                className="py-2 px-3 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl text-xs font-bold border border-neutral-700 transition-all flex items-center justify-center space-x-1.5 active:scale-95"
              >
                {copiedTiktok ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Скопировано!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-neutral-400" />
                    <span>Скопировать ник</span>
                  </>
                )}
              </button>

              <a
                href="https://www.tiktok.com/@ctrl_z52"
                target="_blank"
                rel="noreferrer"
                className="py-2 px-3 bg-white hover:bg-neutral-100 text-neutral-950 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 active:scale-95 shadow-sm"
              >
                <span>Открыть TikTok</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            {copiedOrderText && (
              <div className="mt-2 text-center text-[11px] text-emerald-400 font-semibold animate-pulse">
                ✓ Текст сообщения скопирован! Отправьте его админу в TikTok
              </div>
            )}
          </div>

          {/* Economy Explanation Banner */}
          <div className="bg-amber-50/80 border border-amber-200/90 rounded-2xl p-3.5 text-xs text-amber-950 space-y-1">
            <div className="flex items-center space-x-1.5 font-bold text-amber-900">
              <Coins className="w-4 h-4 text-amber-600 fill-amber-600" />
              <span>Сбалансированная экономика валюты</span>
            </div>
            <p className="text-[11px] text-amber-800 leading-relaxed">
              Курс рассчитан так, чтобы игра оставалась интересной: 1 рубль даёт 2 500 ₽ в игре (на 10 ₽ можно купить первые лоты электроники, на 50 ₽ — расширить склад и нанять персонал, а от 100 ₽ действуют повышенные бонусы!).
            </p>
          </div>

          {/* Preset Donation Packs */}
          <div className="space-y-2">
            <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 px-1">
              Готовые паки валюты
            </div>

            {/* Pack 1 */}
            <div className="bg-white rounded-2xl p-3.5 border border-neutral-200/90 shadow-sm flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center space-x-1.5">
                  <span className="font-bold text-xs text-neutral-900">«Старт перекупа»</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-neutral-100 font-medium text-neutral-600">Базовый</span>
                </div>
                <div className="text-sm font-extrabold font-mono text-emerald-600">
                  +25 000 ₽ <span className="text-xs font-normal text-neutral-500">в игре</span>
                </div>
                <div className="text-[10px] text-neutral-500">
                  Хватит на первые 3-4 лота на барахолке
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleOrderPack('Старт перекупа', 10, 25000)}
                className="px-3 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold transition-all active:scale-95 text-center min-w-[75px]"
              >
                10 ₽
              </button>
            </div>

            {/* Pack 2 */}
            <div className="bg-white rounded-2xl p-3.5 border border-neutral-200/90 shadow-sm flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center space-x-1.5">
                  <span className="font-bold text-xs text-neutral-900">«Быстрый разгон»</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                    +33% Бонус
                  </span>
                </div>
                <div className="text-sm font-extrabold font-mono text-emerald-600">
                  +85 000 ₽ <span className="text-xs font-normal text-neutral-500">в игре</span>
                </div>
                <div className="text-[10px] text-neutral-500">
                  Хватит на апгрейд склада до Гаража
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleOrderPack('Быстрый разгон', 25, 85000)}
                className="px-3 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold transition-all active:scale-95 text-center min-w-[75px]"
              >
                25 ₽
              </button>
            </div>

            {/* Pack 3 - Popular */}
            <div className="bg-gradient-to-r from-amber-50/70 to-orange-50/70 rounded-2xl p-3.5 border-2 border-amber-300 shadow-sm flex items-center justify-between relative">
              <div className="space-y-0.5">
                <div className="flex items-center space-x-1.5">
                  <span className="font-bold text-xs text-neutral-950">«Опытный делец»</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500 text-white font-bold flex items-center space-x-0.5">
                    <Flame className="w-2.5 h-2.5" />
                    <span>ХИТ • +60%</span>
                  </span>
                </div>
                <div className="text-base font-black font-mono text-amber-900">
                  +200 000 ₽ <span className="text-xs font-normal text-neutral-600">в игре</span>
                </div>
                <div className="text-[10px] text-neutral-600">
                  Свободные деньги на iPhone, PS5 и персонал
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleOrderPack('Опытный делец', 50, 200000)}
                className="px-3.5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-extrabold transition-all active:scale-95 text-center min-w-[75px] shadow-sm"
              >
                50 ₽
              </button>
            </div>

            {/* Pack 4 */}
            <div className="bg-white rounded-2xl p-3.5 border border-neutral-200/90 shadow-sm flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center space-x-1.5">
                  <span className="font-bold text-xs text-neutral-900">«Магнат электроники»</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                    2x Курс (+100%)
                  </span>
                </div>
                <div className="text-sm font-extrabold font-mono text-emerald-600">
                  +500 000 ₽ <span className="text-xs font-normal text-neutral-500">в игре</span>
                </div>
                <div className="text-[10px] text-neutral-500">
                  Доступ к топовым ПК, Mac и ювелирным лотам
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleOrderPack('Магнат электроники', 100, 500000)}
                className="px-3 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold transition-all active:scale-95 text-center min-w-[75px]"
              >
                100 ₽
              </button>
            </div>

            {/* Pack 5 - VIP */}
            <div className="bg-neutral-900 text-white rounded-2xl p-3.5 border border-neutral-800 shadow-sm flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center space-x-1.5">
                  <span className="font-bold text-xs text-white">«Владелец империи»</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-400 text-neutral-950 font-black flex items-center space-x-0.5">
                    <Crown className="w-2.5 h-2.5 fill-current" />
                    <span>VIP</span>
                  </span>
                </div>
                <div className="text-sm font-extrabold font-mono text-amber-400">
                  +1 500 000 ₽ <span className="text-xs font-normal text-neutral-400">в игре</span>
                </div>
                <div className="text-[10px] text-neutral-400">
                  Максимальный курс: 1 ₽ = 6 000 ₽ в игре
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleOrderPack('Владелец империи', 250, 1500000)}
                className="px-3 py-2 bg-amber-400 hover:bg-amber-300 text-neutral-950 rounded-xl text-xs font-black transition-all active:scale-95 text-center min-w-[75px]"
              >
                250 ₽
              </button>
            </div>
          </div>

          {/* Interactive Calculator for Custom Amount */}
          <div className="bg-white rounded-2xl p-4 border border-neutral-200/90 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                  Калькулятор доната
                </span>
                <h4 className="text-sm font-bold text-neutral-900 mt-0.5">Своя сумма</h4>
              </div>
              <div className="flex items-center space-x-1 text-xs text-neutral-500 font-semibold">
                <Calculator className="w-3.5 h-3.5" />
                <span>Живой расчёт</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] text-neutral-500 font-medium">
                Сколько рублей вы хотите задонатить?
              </label>
              <div className="flex items-center space-x-2">
                <div className="relative flex-1">
                  <input
                    type="number"
                    min="1"
                    max="10000"
                    value={customRubles || ''}
                    onChange={e => setCustomRubles(Math.max(1, parseInt(e.target.value) || 0))}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-xl text-sm font-mono font-bold focus:outline-none focus:border-neutral-900 pr-8"
                    placeholder="Например: 50"
                  />
                  <span className="absolute right-3 top-2.5 text-xs font-bold text-neutral-400">₽</span>
                </div>
                <div className="text-right px-3 py-2 bg-neutral-50 rounded-xl border border-neutral-200 min-w-[130px]">
                  <div className="text-[10px] text-neutral-400 font-medium">В игре получите:</div>
                  <div className="text-sm font-extrabold font-mono text-emerald-600">
                    +{getDonateReward(customRubles).toLocaleString('ru-RU')} ₽
                  </div>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleOrderPack('Произвольная сумма', customRubles, getDonateReward(customRubles))}
              className="w-full py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center justify-center space-x-1.5 shadow-sm"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>Заказать {customRubles} ₽ у админа в TikTok</span>
            </button>
          </div>

          {/* Step by step guide */}
          <div className="p-3.5 rounded-2xl bg-neutral-100 border border-neutral-200 text-xs text-neutral-700 space-y-2">
            <div className="font-bold text-neutral-900 flex items-center space-x-1.5">
              <span>Как происходит зачисление доната:</span>
            </div>
            <ol className="text-[11px] space-y-1 text-neutral-600 pl-1 list-decimal list-inside leading-relaxed">
              <li>Напишите админу в TikTok: <strong>@ctrl_z52</strong></li>
              <li>Укажите желаемый пак или сумму</li>
              <li>После перевода админ выдаст вам личный промокод</li>
              <li>Введите полученный код во вкладке <strong>«Промокоды»</strong></li>
            </ol>
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setActiveSection('promo')}
                className="w-full py-2 bg-white border border-neutral-300 rounded-xl text-xs font-bold text-neutral-800 hover:bg-neutral-50 transition-colors flex items-center justify-center space-x-1"
              >
                <span>Перейти во вкладку «Промокоды»</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
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
                  disabled={isRedeeming}
                  className="flex-1 px-3 py-2 border border-neutral-300 rounded-xl text-xs font-mono font-bold focus:outline-none focus:border-neutral-900 uppercase disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={isRedeeming}
                  className="px-4 py-2 bg-neutral-900 text-white font-bold text-xs rounded-xl hover:bg-neutral-800 transition-colors disabled:opacity-50 flex items-center space-x-1"
                >
                  {isRedeeming ? (
                    <span>Проверка...</span>
                  ) : (
                    <span>Применить</span>
                  )}
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

            <div className="flex items-center space-x-1.5 pt-1 text-[10px] text-neutral-500">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Глобальная сеть: промокод сразу работает в любой стране и на всех устройствах</span>
            </div>
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
