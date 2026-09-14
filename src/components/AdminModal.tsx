import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import {
  X,
  Key,
  ShieldAlert,
  ShieldCheck,
  Lock,
  Plus,
  Check,
  RefreshCw,
  Zap,
  Sparkles,
  Copy,
  Package,
  Boxes,
  Shuffle,
  Tag,
  Trash2,
} from 'lucide-react';
import { PromoCode } from '../types';
import { ITEM_BLUEPRINTS, CATEGORY_LABELS } from '../data/itemsData';
import { adminGuard, secureTimingSafeCompare } from '../services/security';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminModal: React.FC<AdminModalProps> = ({ isOpen, onClose }) => {
  const {
    promoCodes,
    createCustomPromoCode,
    deletePromoCode,
    adminAddMoney,
    adminAddXp,
    adminSetReputation,
    adminUnlockAllSkills,
    adminSpawnItem,
    adminResetGame,
  } = useGame();

  const [passwordInput, setPasswordInput] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState(false);
  const [lockoutSeconds, setLockoutSeconds] = useState<number>(0);
  const [attemptsLeft, setAttemptsLeft] = useState<number>(4);

  // Check lockout on mount or tick
  useEffect(() => {
    const status = adminGuard.isLocked();
    if (status.locked) {
      setLockoutSeconds(status.remainingSeconds);
    }
  }, [isOpen]);

  // Countdown timer for lockout
  useEffect(() => {
    if (lockoutSeconds <= 0) return;
    const timer = setInterval(() => {
      setLockoutSeconds(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [lockoutSeconds]);

  // New Key Form State
  const [newCode, setNewCode] = useState('');
  const [rewardType, setRewardType] = useState<'money' | 'xp' | 'rep' | 'item'>('money');
  const [rewardValue, setRewardValue] = useState('50000');
  const [description, setDescription] = useState('Бонусный промо-ключ');
  const [maxUses, setMaxUses] = useState('1');
  const [keyCreatedSuccess, setKeyCreatedSuccess] = useState(false);

  // Copy & Item selection state
  const [isInputCopied, setIsInputCopied] = useState(false);
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);
  const [itemInputMode, setItemInputMode] = useState<'catalog' | 'custom'>('catalog');

  if (!isOpen) return null;

  // Selected item blueprint if in item mode
  const selectedBlueprint =
    rewardType === 'item' ? ITEM_BLUEPRINTS.find(b => b.title === rewardValue) : undefined;

  // Clipboard copy helper with fallback for iframe compatibility
  const copyToClipboard = async (text: string, id?: string) => {
    if (!text) return;
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }

      if (id) {
        setCopiedCodeId(id);
        setTimeout(() => setCopiedCodeId(null), 2000);
      } else {
        setIsInputCopied(true);
        setTimeout(() => setIsInputCopied(false), 2000);
      }
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  // Smart promo key auto-generator
  const handleGenerateRandomCode = () => {
    let prefixes = ['PRKP', 'VIP', 'BONUS', 'GIFT', 'LUCKY', 'DROP', 'SECRET', 'TOP', 'BOOST', 'CASH'];
    if (rewardType === 'money') {
      prefixes = ['CASH', 'MONEY', 'RUB', 'PROFIT', 'BANK', 'PRKP'];
    } else if (rewardType === 'xp') {
      prefixes = ['EXP', 'LEVEL', 'BOOST', 'SKILL', 'MASTER'];
    } else if (rewardType === 'rep') {
      prefixes = ['STAR', 'REP', 'HONOR', 'VIP', 'TRUST'];
    } else if (rewardType === 'item') {
      prefixes = ['DROP', 'GIFT', 'LOOT', 'DEVICE', 'TECH', 'GEAR', 'PRKP'];
      if (rewardValue) {
        const lower = rewardValue.toLowerCase();
        if (lower.includes('iphone')) prefixes = ['IPHONE', 'APPLE', 'DROP'];
        else if (lower.includes('macbook')) prefixes = ['MAC', 'APPLE', 'DROP'];
        else if (lower.includes('rtx') || lower.includes('geforce')) prefixes = ['RTX', 'GPU', 'DROP'];
        else if (lower.includes('playstation') || lower.includes('ps5')) prefixes = ['PS5', 'SONY', 'GAME'];
        else if (lower.includes('часы') || lower.includes('watch')) prefixes = ['WATCH', 'GOLD', 'VIP'];
      }
    }

    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const generated = `${prefix}-${randomNum}`;
    setNewCode(generated);
  };

  // Switch reward type handler
  const handleRewardTypeChange = (newType: 'money' | 'xp' | 'rep' | 'item') => {
    setRewardType(newType);
    if (newType === 'item') {
      const defaultItem = ITEM_BLUEPRINTS[0]?.title || 'Apple iPhone 15 Pro Max 256GB';
      setRewardValue(defaultItem);
      setDescription(`Товар на склад: ${defaultItem}`);
      if (!newCode || newCode.startsWith('CASH') || newCode.startsWith('EXP') || newCode.startsWith('STAR')) {
        const num = Math.floor(1000 + Math.random() * 9000);
        setNewCode(`DROP-${num}`);
      }
    } else if (newType === 'money') {
      setRewardValue('50000');
      setDescription('Бонусный капитал перекупа');
      if (!newCode || newCode.startsWith('DROP') || newCode.startsWith('EXP') || newCode.startsWith('STAR')) {
        const num = Math.floor(1000 + Math.random() * 9000);
        setNewCode(`CASH-${num}`);
      }
    } else if (newType === 'xp') {
      setRewardValue('1000');
      setDescription('Бонусный опыт XP для прокачки');
      if (!newCode || newCode.startsWith('CASH') || newCode.startsWith('DROP') || newCode.startsWith('STAR')) {
        const num = Math.floor(1000 + Math.random() * 9000);
        setNewCode(`EXP-${num}`);
      }
    } else if (newType === 'rep') {
      setRewardValue('0.5');
      setDescription('Повышение рейтинга продавца');
      if (!newCode || newCode.startsWith('CASH') || newCode.startsWith('DROP') || newCode.startsWith('EXP')) {
        const num = Math.floor(1000 + Math.random() * 9000);
        setNewCode(`STAR-${num}`);
      }
    }
  };

  // Select catalog item
  const handleSelectItem = (itemTitle: string) => {
    setRewardValue(itemTitle);
    setDescription(`Товар на склад: ${itemTitle}`);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const lockStatus = adminGuard.isLocked();
    if (lockStatus.locked) {
      setLockoutSeconds(lockStatus.remainingSeconds);
      return;
    }

    if (secureTimingSafeCompare(passwordInput.trim(), 'zxcqwerty')) {
      adminGuard.resetOnSuccess();
      setIsAuthenticated(true);
      setAuthError(false);
      // Pre-fill a random generated promo code if empty
      if (!newCode) {
        setNewCode(`PRKP-${Math.floor(1000 + Math.random() * 9000)}`);
      }
    } else {
      const res = adminGuard.recordFailure();
      setAuthError(true);
      if (res.locked) {
        setLockoutSeconds(res.remainingSeconds);
      } else {
        setAttemptsLeft(res.attemptsLeft);
      }
    }
  };

  const handleCreateKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode.trim()) return;

    let parsedVal: number | string = rewardValue;
    if (rewardType !== 'item') {
      parsedVal = Number(rewardValue) || 1000;
    }

    const newPromo: Omit<PromoCode, 'usedCount'> = {
      code: newCode.trim().toUpperCase(),
      rewardType,
      rewardValue: parsedVal,
      description: description || 'Специальный ключ разработчика',
      maxUses: Math.max(1, parseInt(maxUses) || 1),
    };

    createCustomPromoCode(newPromo);
    setKeyCreatedSuccess(true);
    // Generate a fresh new code for convenience
    setTimeout(() => {
      setKeyCreatedSuccess(false);
      handleGenerateRandomCode();
    }, 2000);
  };

  // Popular preset item chips for quick picking
  const POPULAR_ITEM_PRESETS = [
    'Apple iPhone 15 Pro Max 256GB',
    'Sony PlayStation 5 Slim 1TB с дисководом',
    'NVIDIA GeForce RTX 4090 24GB',
    'Apple MacBook Pro 14 M2 Pro 16/512GB',
    'Apple Watch Ultra 2 49mm Titanium',
    'Золотые карманные механические часы СССР 1965г',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/50">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-neutral-900 text-white flex items-center justify-center">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-neutral-900">Служебный доступ</h2>
              <p className="text-[11px] text-neutral-500">Генератор промокодов и админ-панель</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-6 flex-1 text-neutral-900">
          {!isAuthenticated ? (
            <form onSubmit={handleLogin} className="space-y-4 py-4">
              <div className="text-center space-y-1 mb-4">
                <div className={`w-12 h-12 rounded-full mx-auto flex items-center justify-center mb-2 ${
                  lockoutSeconds > 0 ? 'bg-rose-100 text-rose-600 animate-pulse' : 'bg-neutral-100 text-neutral-700'
                }`}>
                  {lockoutSeconds > 0 ? <Lock className="w-5 h-5" /> : <Key className="w-5 h-5" />}
                </div>
                <h3 className="text-sm font-bold text-neutral-900">Авторизация</h3>
                <p className="text-xs text-neutral-500">
                  {lockoutSeconds > 0
                    ? 'Панель временно заблокирована защитой от подбора'
                    : 'Введите ключ доступа для входа в панель'}
                </p>
              </div>

              {lockoutSeconds > 0 ? (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-center space-y-1">
                  <div className="flex items-center justify-center space-x-1.5 text-rose-700 text-xs font-bold">
                    <ShieldAlert className="w-4 h-4" />
                    <span>Защита от взлома активна</span>
                  </div>
                  <p className="text-[11px] text-rose-600">
                    Слишком много неверных попыток. Повторная авторизация доступна через:
                  </p>
                  <div className="text-base font-extrabold text-rose-700 font-mono pt-1">
                    {lockoutSeconds} сек
                  </div>
                </div>
              ) : (
                <div>
                  <input
                    type="password"
                    value={passwordInput}
                    disabled={lockoutSeconds > 0}
                    onChange={e => {
                      setPasswordInput(e.target.value);
                      setAuthError(false);
                    }}
                    placeholder="Введите пароль..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-sm focus:outline-none focus:border-neutral-900 transition-colors"
                    autoFocus
                  />
                  {authError && (
                    <div className="mt-1.5 flex items-center justify-between text-xs text-rose-600 font-medium">
                      <span>Неверный пароль доступа</span>
                      <span className="text-[11px] text-neutral-500">Осталось попыток: {attemptsLeft}</span>
                    </div>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={lockoutSeconds > 0}
                className={`w-full py-2.5 rounded-xl font-medium text-xs transition-all ${
                  lockoutSeconds > 0
                    ? 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                    : 'bg-neutral-900 text-white hover:bg-neutral-800 active:scale-[0.98]'
                }`}
              >
                {lockoutSeconds > 0 ? `Блокировка (${lockoutSeconds}с)` : 'Войти в панель'}
              </button>
            </form>
          ) : (
            <div className="space-y-6">
              {/* Generator Section */}
              <div className="space-y-3 bg-neutral-50 p-4 rounded-xl border border-neutral-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Key className="w-4 h-4 text-neutral-700" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-800">
                      Создать промокод
                    </h4>
                  </div>
                  <span className="text-[10px] text-neutral-500 font-medium">Автогенерация и копирование</span>
                </div>

                <form onSubmit={handleCreateKey} className="space-y-3 pt-1">
                  {/* Promo Code Input with Auto-Generate and Copy Buttons */}
                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-600 mb-1">
                      Код (промокод)
                    </label>
                    <div className="flex items-center space-x-1.5">
                      <input
                        type="text"
                        value={newCode}
                        onChange={e => setNewCode(e.target.value.toUpperCase())}
                        placeholder="Например: PRKP-8492"
                        required
                        className="flex-1 px-3 py-2 rounded-lg border border-neutral-300 text-xs font-mono font-bold focus:outline-none focus:border-neutral-900 uppercase"
                      />
                      {/* Auto-generate button */}
                      <button
                        type="button"
                        onClick={handleGenerateRandomCode}
                        title="Подобрать и сгенерировать случайный код"
                        className="px-2.5 py-2 rounded-lg border border-neutral-300 bg-white hover:bg-neutral-100 text-neutral-700 text-xs font-semibold flex items-center space-x-1 active:scale-95 transition-all shadow-sm shrink-0"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        <span className="text-[11px]">Автокод</span>
                      </button>
                      {/* Copy input button */}
                      <button
                        type="button"
                        onClick={() => copyToClipboard(newCode)}
                        disabled={!newCode.trim()}
                        title="Скопировать код в буфер обмена"
                        className={`p-2 rounded-lg border text-xs font-semibold flex items-center justify-center transition-all shrink-0 active:scale-95 ${
                          isInputCopied
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                            : 'bg-white border-neutral-300 hover:bg-neutral-100 text-neutral-700 disabled:opacity-40'
                        }`}
                      >
                        {isInputCopied ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                    {isInputCopied && (
                      <p className="text-[10px] text-emerald-600 font-medium mt-1 flex items-center">
                        <Check className="w-3 h-3 mr-0.5" /> Код скопирован в буфер обмена!
                      </p>
                    )}
                  </div>

                  {/* Reward Type & Max Uses */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-neutral-600 mb-1">
                        Тип награды
                      </label>
                      <select
                        value={rewardType}
                        onChange={e => handleRewardTypeChange(e.target.value as any)}
                        className="w-full px-2.5 py-2 rounded-lg border border-neutral-300 text-xs focus:outline-none focus:border-neutral-900 bg-white"
                      >
                        <option value="money">Деньги (₽)</option>
                        <option value="xp">Опыт (XP)</option>
                        <option value="rep">Репутация</option>
                        <option value="item">Товар на склад</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-neutral-600 mb-1">
                        Активаций
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="999"
                        value={maxUses}
                        onChange={e => setMaxUses(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-xs focus:outline-none focus:border-neutral-900 bg-white"
                      />
                    </div>
                  </div>

                  {/* Reward Value: Items Selection OR Manual input */}
                  {rewardType === 'item' ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="block text-[11px] font-semibold text-neutral-600">
                          Выбор товара в промокод
                        </label>
                        <div className="flex items-center space-x-1 text-[10px]">
                          <button
                            type="button"
                            onClick={() => setItemInputMode('catalog')}
                            className={`px-1.5 py-0.5 rounded transition-colors ${
                              itemInputMode === 'catalog'
                                ? 'bg-neutral-900 text-white font-semibold'
                                : 'text-neutral-500 hover:text-neutral-800'
                            }`}
                          >
                            Из каталога
                          </button>
                          <button
                            type="button"
                            onClick={() => setItemInputMode('custom')}
                            className={`px-1.5 py-0.5 rounded transition-colors ${
                              itemInputMode === 'custom'
                                ? 'bg-neutral-900 text-white font-semibold'
                                : 'text-neutral-500 hover:text-neutral-800'
                            }`}
                          >
                            Свое название
                          </button>
                        </div>
                      </div>

                      {itemInputMode === 'catalog' ? (
                        <>
                          <select
                            value={rewardValue}
                            onChange={e => handleSelectItem(e.target.value)}
                            required
                            className="w-full px-2.5 py-2 rounded-lg border border-neutral-300 text-xs focus:outline-none focus:border-neutral-900 bg-white"
                          >
                            <option value="" disabled>-- Выберите предмет --</option>
                            {Object.entries(CATEGORY_LABELS).map(([catKey, catLabel]) => {
                              const itemsInCat = ITEM_BLUEPRINTS.filter(b => b.category === catKey);
                              if (itemsInCat.length === 0) return null;
                              return (
                                <optgroup key={catKey} label={catLabel}>
                                  {itemsInCat.map(b => (
                                    <option key={b.title} value={b.title}>
                                      {b.title} (~{b.baseMarketPrice.toLocaleString('ru-RU')} ₽)
                                    </option>
                                  ))}
                                </optgroup>
                              );
                            })}
                          </select>

                          {/* Quick Popular Chips */}
                          <div className="space-y-1 pt-0.5">
                            <span className="text-[10px] text-neutral-500 font-medium">Быстрый выбор топа:</span>
                            <div className="flex flex-wrap gap-1">
                              {POPULAR_ITEM_PRESETS.map((pTitle, idx) => (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => handleSelectItem(pTitle)}
                                  className={`text-[10px] px-2 py-0.5 rounded-full border transition-all ${
                                    rewardValue === pTitle
                                      ? 'bg-neutral-900 text-white border-neutral-900 font-medium'
                                      : 'bg-white border-neutral-200 text-neutral-700 hover:border-neutral-400'
                                  }`}
                                >
                                  {pTitle.split(' ')[0]} {pTitle.split(' ')[1]}
                                </button>
                              ))}
                            </div>
                          </div>
                        </>
                      ) : (
                        <input
                          type="text"
                          value={rewardValue}
                          onChange={e => {
                            setRewardValue(e.target.value);
                            setDescription(`Товар на склад: ${e.target.value}`);
                          }}
                          placeholder="Например: Золотые часы Rolex Submariner"
                          required
                          className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-xs focus:outline-none focus:border-neutral-900 bg-white"
                        />
                      )}

                      {/* Selected Item Card Preview */}
                      {selectedBlueprint && (
                        <div className="p-2.5 rounded-lg border border-neutral-200 bg-white flex items-center justify-between text-xs">
                          <div className="space-y-0.5">
                            <div className="font-semibold text-neutral-900 text-[11px] leading-tight">
                              {selectedBlueprint.title}
                            </div>
                            <div className="flex items-center space-x-1.5 text-[10px] text-neutral-500">
                              <span className="px-1.5 py-0.2 rounded bg-neutral-100 text-neutral-700 font-medium">
                                {CATEGORY_LABELS[selectedBlueprint.category]}
                              </span>
                              <span>Рыночная цена: ~{selectedBlueprint.baseMarketPrice.toLocaleString('ru-RU')} ₽</span>
                            </div>
                          </div>
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded font-semibold uppercase ${
                              selectedBlueprint.rarity === 'legendary'
                                ? 'bg-amber-100 text-amber-800'
                                : selectedBlueprint.rarity === 'rare'
                                ? 'bg-purple-100 text-purple-800'
                                : selectedBlueprint.rarity === 'uncommon'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-neutral-100 text-neutral-700'
                            }`}
                          >
                            {selectedBlueprint.rarity === 'legendary'
                              ? 'Легенда'
                              : selectedBlueprint.rarity === 'rare'
                              ? 'Редкий'
                              : selectedBlueprint.rarity === 'uncommon'
                              ? 'Необычный'
                              : 'Обычный'}
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      <label className="block text-[11px] font-semibold text-neutral-600 mb-1">
                        {rewardType === 'money'
                          ? 'Сумма денег (₽)'
                          : rewardType === 'xp'
                          ? 'Количество опыта (XP)'
                          : 'Прирост репутации (например 0.5)'}
                      </label>
                      <input
                        type="number"
                        step={rewardType === 'rep' ? '0.1' : '1'}
                        value={rewardValue}
                        onChange={e => setRewardValue(e.target.value)}
                        placeholder="50000"
                        required
                        className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-xs font-mono focus:outline-none focus:border-neutral-900 bg-white"
                      />
                    </div>
                  )}

                  {/* Description */}
                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-600 mb-1">
                      Описание ключа
                    </label>
                    <input
                      type="text"
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      placeholder="Краткое описание"
                      className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-xs focus:outline-none focus:border-neutral-900 bg-white"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-lg bg-neutral-900 text-white text-xs font-semibold flex items-center justify-center space-x-1.5 hover:bg-neutral-800 active:scale-[0.98] transition-all mt-2 shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Создать промокод</span>
                  </button>

                  <div className="flex items-center justify-center space-x-1.5 pt-1 text-[10px] text-neutral-500">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    <span>Синхронизация с сервером: код будет сразу работать на любом вашем устройстве</span>
                  </div>

                  {keyCreatedSuccess && (
                    <div className="flex items-center justify-center space-x-1 text-emerald-600 text-xs font-semibold py-1 animate-in fade-in">
                      <Check className="w-3.5 h-3.5" />
                      <span>Ключ «{newCode}» успешно создан и сохранен в облачной базе!</span>
                    </div>
                  )}
                </form>
              </div>

              {/* Active Keys List with One-Click Copy */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-600">
                    Все ключи и промокоды ({promoCodes.length})
                  </h4>
                  <span className="text-[10px] text-neutral-400">Нажмите на иконку для копирования</span>
                </div>

                <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                  {promoCodes.length === 0 ? (
                    <div className="p-4 rounded-xl border border-dashed border-neutral-200 text-center text-neutral-400 text-xs">
                      Промокодов пока нет. Сгенерируйте первый ключ в форме выше!
                    </div>
                  ) : (
                    promoCodes.map((p, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-lg border border-neutral-200 bg-white flex items-center justify-between text-xs hover:border-neutral-300 transition-colors"
                      >
                        <div className="space-y-0.5 max-w-[65%]">
                          <div className="font-mono font-bold text-neutral-900 flex items-center space-x-1.5 flex-wrap gap-y-0.5">
                            <span>{p.code}</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-neutral-100 text-neutral-700 font-sans font-medium">
                              {p.rewardType === 'money'
                                ? `${Number(p.rewardValue).toLocaleString('ru-RU')} ₽`
                                : p.rewardType === 'xp'
                                ? `${p.rewardValue} XP`
                                : p.rewardType === 'item'
                                ? `📦 ${String(p.rewardValue).substring(0, 22)}${String(p.rewardValue).length > 22 ? '…' : ''}`
                                : `+${p.rewardValue}★`}
                            </span>
                          </div>
                          <div className="text-[10px] text-neutral-500 truncate" title={p.description}>
                            {p.description}
                          </div>
                        </div>

                        <div className="flex items-center space-x-1.5 shrink-0">
                          <span className="text-[10px] font-medium text-neutral-500 bg-neutral-50 px-1.5 py-0.5 rounded border border-neutral-200">
                            {p.usedCount} / {p.maxUses}
                          </span>

                          <button
                            type="button"
                            onClick={() => copyToClipboard(p.code, p.code)}
                            title={`Скопировать ключ ${p.code}`}
                            className={`p-1.5 rounded-md border transition-all active:scale-90 ${
                              copiedCodeId === p.code
                                ? 'bg-emerald-50 border-emerald-300 text-emerald-600'
                                : 'border-neutral-200 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100'
                            }`}
                          >
                            {copiedCodeId === p.code ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => deletePromoCode(p.code)}
                            title={`Удалить ключ ${p.code}`}
                            className="p-1.5 rounded-md border border-neutral-200 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition-all active:scale-90"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Quick Cheats & Debug */}
              <div className="space-y-2.5 pt-2 border-t border-neutral-200">
                <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-600 flex items-center space-x-1.5">
                  <Zap className="w-3.5 h-3.5 text-neutral-700" />
                  <span>Быстрые действия</span>
                </h4>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => adminAddMoney(50000)}
                    className="p-2 rounded-lg border border-neutral-300 hover:bg-neutral-100 text-xs font-semibold text-neutral-800 text-left active:scale-95 transition-all"
                  >
                    +50 000 ₽
                  </button>
                  <button
                    onClick={() => adminAddMoney(500000)}
                    className="p-2 rounded-lg border border-neutral-300 hover:bg-neutral-100 text-xs font-semibold text-neutral-800 text-left active:scale-95 transition-all"
                  >
                    +500 000 ₽
                  </button>
                  <button
                    onClick={() => adminAddXp(1000)}
                    className="p-2 rounded-lg border border-neutral-300 hover:bg-neutral-100 text-xs font-semibold text-neutral-800 text-left active:scale-95 transition-all"
                  >
                    +1 000 XP
                  </button>
                  <button
                    onClick={() => adminSetReputation(5.0)}
                    className="p-2 rounded-lg border border-neutral-300 hover:bg-neutral-100 text-xs font-semibold text-neutral-800 text-left active:scale-95 transition-all"
                  >
                    Рейтинг 5.0 ★
                  </button>
                  <button
                    onClick={() => adminUnlockAllSkills()}
                    className="p-2 rounded-lg border border-neutral-300 hover:bg-neutral-100 text-xs font-semibold text-neutral-800 text-left active:scale-95 transition-all"
                  >
                    Все навыки MAX
                  </button>
                  <button
                    onClick={() => adminSpawnItem('Apple iPhone 15 Pro Max 256GB', 'smartphones', 105000)}
                    className="p-2 rounded-lg border border-neutral-300 hover:bg-neutral-100 text-xs font-semibold text-neutral-800 text-left active:scale-95 transition-all"
                  >
                    Спавн Флагмана
                  </button>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => {
                      if (confirm('Сбросить весь прогресс игры и начать заново?')) {
                        adminResetGame();
                      }
                    }}
                    className="w-full py-2 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-semibold flex items-center justify-center space-x-1 transition-colors"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Полный сброс сохранения</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

