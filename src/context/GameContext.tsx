import React, { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef, ReactNode } from 'react';
import {
  BuyerOffer,
  BuyerReview,
  DefectType,
  FloatingNotification,
  InspectionTier,
  InventoryItem,
  ItemCategory,
  ItemUpgrades,
  MarketItem,
  MarketNews,
  PromoCode,
  Quest,
  SkillDefinition,
} from '../types';
import { generateInitialMarketItems, generateMarketItem, ITEM_BLUEPRINTS } from '../data/itemsData';
import { generateBuyerOffer } from '../data/buyersData';
import {
  DEFAULT_PROMO_CODES,
  INITIAL_QUESTS,
  INITIAL_SKILLS,
  PLAYER_LEVELS,
  SAMPLE_BUYER_REVIEWS,
  STAFF_DEFINITIONS,
  WAREHOUSE_TIERS,
} from '../data/gameConfig';
import { playBuy, playClick, playError, playNotification, playProfit, playSell } from '../services/sound';
import { signGameState, verifyAndSanitizeGameState } from '../services/security';
import {
  fetchServerPromoCodes,
  createPromoCodeOnServer,
  deletePromoCodeOnServer,
  redeemPromoCodeOnServer,
} from '../services/api';

interface GameContextType {
  // Player financials & status
  money: number;
  todayProfit: number;
  totalProfit: number;
  totalDeals: number;
  reputation: number;
  reviews: BuyerReview[];
  level: number;
  xp: number;
  xpToNextLevel: number;
  skillPoints: number;
  skills: SkillDefinition[];
  day: number;
  soundEnabled: boolean;

  // Business & Warehouse
  warehouseTier: number;
  currentWarehouseCapacity: number;
  hiredStaff: {
    buyerManager: boolean;
    repairMaster: boolean;
    proPhotographer: boolean;
    salesManager: boolean;
  };

  // Lists & State
  marketItems: MarketItem[];
  inventory: InventoryItem[];
  activeListings: InventoryItem[];
  quests: Quest[];
  marketNews: MarketNews[];
  notifications: FloatingNotification[];
  promoCodes: PromoCode[];

  // Actions
  setSoundEnabled: (enabled: boolean) => void;
  refreshMarket: () => void;
  inspectMarketItem: (itemId: string, tier: InspectionTier) => { success: boolean; defectFound?: DefectType; message: string };
  buyMarketItem: (itemId: string) => { success: boolean; message: string };
  upgradeInventoryItem: (itemId: string, upgradeType: keyof ItemUpgrades) => { success: boolean; message: string };
  listItemForSale: (itemId: string, price: number) => { success: boolean; message: string };
  delistItem: (itemId: string) => void;
  acceptBuyerOffer: (itemId: string, offerId: string) => { success: boolean; message: string };
  rejectBuyerOffer: (itemId: string, offerId: string) => void;
  counterBuyerOffer: (itemId: string, offerId: string, counterPrice: number) => { accepted: boolean; finalPrice?: number; message: string };
  upgradeSkill: (skillId: string) => void;
  upgradeWarehouse: () => { success: boolean; message: string };
  hireStaff: (key: 'buyerManager' | 'repairMaster' | 'proPhotographer' | 'salesManager') => { success: boolean; message: string };
  claimQuestReward: (questId: string) => void;
  redeemPromoCode: (code: string) => Promise<{ success: boolean; message: string }>;

  // Admin Tools (Password: zxcqwerty)
  createCustomPromoCode: (promo: Omit<PromoCode, 'usedCount'>) => boolean;
  deletePromoCode: (code: string) => boolean;
  adminAddMoney: (amount: number) => void;
  adminAddXp: (amount: number) => void;
  adminSetReputation: (rep: number) => void;
  adminUnlockAllSkills: () => void;
  adminSpawnItem: (title: string, category: ItemCategory, baseMarketPrice: number) => void;
  adminResetGame: () => void;
}

const STORAGE_KEY = 'perekup_game_state_v1';

interface LoadedStateWrapper {
  data: any;
  tampered: boolean;
  tamperReason?: string;
}

// Synchronous safe loader with cryptographic signature verification and anti-tamper sanitation
function loadSavedGameState(): LoadedStateWrapper {
  if (typeof window === 'undefined') return { data: null, tampered: false };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { data: null, tampered: false };
    const parsed = JSON.parse(raw);
    const verified = verifyAndSanitizeGameState(parsed);
    return {
      data: verified.sanitizedState,
      tampered: verified.tampered,
      tamperReason: verified.reason,
    };
  } catch (e) {
    console.warn('Could not parse saved game state:', e);
  }
  return { data: null, tampered: false };
}

export const GameContext = createContext<GameContextType | null>(null);

export const GameProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Read and verify saved state synchronously once on startup
  const savedMeta = useMemo(() => loadSavedGameState(), []);
  const saved = savedMeta.data;

  // Player financials & status initialized directly from saved state
  const [money, setMoney] = useState<number>(() =>
    typeof saved?.money === 'number' ? saved.money : 15000
  );
  const [todayProfit, setTodayProfit] = useState<number>(() =>
    typeof saved?.todayProfit === 'number' ? saved.todayProfit : 0
  );
  const [totalProfit, setTotalProfit] = useState<number>(() =>
    typeof saved?.totalProfit === 'number' ? saved.totalProfit : 0
  );
  const [totalDeals, setTotalDeals] = useState<number>(() =>
    typeof saved?.totalDeals === 'number' ? saved.totalDeals : 0
  );
  const [reputation, setReputation] = useState<number>(() =>
    typeof saved?.reputation === 'number' ? saved.reputation : 4.8
  );
  const [reviews, setReviews] = useState<BuyerReview[]>(() =>
    Array.isArray(saved?.reviews) && saved.reviews.length > 0
      ? saved.reviews
      : SAMPLE_BUYER_REVIEWS
  );
  const [level, setLevel] = useState<number>(() =>
    typeof saved?.level === 'number' ? saved.level : 1
  );
  const [xp, setXp] = useState<number>(() =>
    typeof saved?.xp === 'number' ? saved.xp : 0
  );
  const [skillPoints, setSkillPoints] = useState<number>(() =>
    typeof saved?.skillPoints === 'number' ? saved.skillPoints : 1
  );
  const [skills, setSkills] = useState<SkillDefinition[]>(() =>
    Array.isArray(saved?.skills) && saved.skills.length > 0
      ? saved.skills
      : INITIAL_SKILLS
  );
  const [day, setDay] = useState<number>(() =>
    typeof saved?.day === 'number' ? saved.day : 1
  );
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() =>
    typeof saved?.soundEnabled === 'boolean' ? saved.soundEnabled : false
  );

  const [warehouseTier, setWarehouseTier] = useState<number>(() =>
    typeof saved?.warehouseTier === 'number' ? saved.warehouseTier : 0
  );
  const [hiredStaff, setHiredStaff] = useState(() =>
    saved?.hiredStaff || {
      buyerManager: false,
      repairMaster: false,
      proPhotographer: false,
      salesManager: false,
    }
  );

  const [marketItems, setMarketItems] = useState<MarketItem[]>(() => {
    if (Array.isArray(saved?.marketItems) && saved.marketItems.length > 0) {
      return saved.marketItems;
    }
    return generateInitialMarketItems(8);
  });
  const [inventory, setInventory] = useState<InventoryItem[]>(() =>
    Array.isArray(saved?.inventory) ? saved.inventory : []
  );
  const [quests, setQuests] = useState<Quest[]>(() =>
    Array.isArray(saved?.quests) && saved.quests.length > 0
      ? saved.quests
      : INITIAL_QUESTS
  );
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>(() =>
    Array.isArray(saved?.promoCodes) ? saved.promoCodes : DEFAULT_PROMO_CODES
  );
  const [notifications, setNotifications] = useState<FloatingNotification[]>([]);
  const [marketNews, setMarketNews] = useState<MarketNews[]>([
    {
      id: 'news_1',
      title: 'Ажиотажный спрос на консоли',
      description: 'В ритейле дефицит PlayStation 5, спрос на вторичке вырос на 25%.',
      categoryAffected: 'consoles',
      priceMultiplier: 1.15,
      durationMinutes: 10,
      timestamp: Date.now(),
    },
  ]);

  // Persist state to localStorage whenever game state changes
  const saveGameState = useCallback(() => {
    try {
      const stateToSave = {
        money: Math.max(0, Math.floor(money)),
        todayProfit: Math.floor(todayProfit),
        totalProfit: Math.floor(totalProfit),
        totalDeals: Math.max(0, Math.floor(totalDeals)),
        reputation: Math.max(1.0, Math.min(5.0, Math.round(reputation * 10) / 10)),
        reviews,
        level: Math.max(1, Math.min(10, Math.floor(level))),
        xp: Math.max(0, Math.floor(xp)),
        skillPoints: Math.max(0, Math.floor(skillPoints)),
        skills,
        day: Math.max(1, Math.floor(day)),
        soundEnabled,
        warehouseTier: Math.max(0, Math.min(4, Math.floor(warehouseTier))),
        hiredStaff,
        marketItems,
        inventory,
        quests,
        promoCodes,
        lastSaved: Date.now(),
      };
      const signedState = signGameState(stateToSave);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(signedState));
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
  }, [
    money,
    todayProfit,
    totalProfit,
    totalDeals,
    reputation,
    reviews,
    level,
    xp,
    skillPoints,
    skills,
    day,
    soundEnabled,
    warehouseTier,
    hiredStaff,
    marketItems,
    inventory,
    quests,
    promoCodes,
  ]);

  // Save on state change
  useEffect(() => {
    saveGameState();
  }, [saveGameState]);

  // Ensure state is flushed on page reload / tab close / visibility change
  useEffect(() => {
    const handleSave = () => {
      saveGameState();
    };
    window.addEventListener('beforeunload', handleSave);
    window.addEventListener('pagehide', handleSave);
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        saveGameState();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.removeEventListener('beforeunload', handleSave);
      window.removeEventListener('pagehide', handleSave);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [saveGameState]);

  // Push floating notification helper
  const addNotification = useCallback((text: string, type: 'profit' | 'loss' | 'neutral' | 'event' = 'neutral') => {
    const id = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    setNotifications(prev => [...prev.slice(-3), { id, text, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 3500);
  }, []);

  // Alert player if saved state was tampered with
  useEffect(() => {
    if (savedMeta.tampered) {
      addNotification(
        `🛡️ Античит: обнаружено несанкционированное изменение данных. Баланс восстановлен в безопасный режим.`,
        'loss'
      );
    }
  }, [savedMeta.tampered, addNotification]);

  // Cloud Sync: Synchronize promo codes with server so codes created on tablet immediately work on phone/PC
  useEffect(() => {
    let isMounted = true;
    const syncPromoCodes = async () => {
      try {
        const serverCodes = await fetchServerPromoCodes();
        if (!isMounted) return;
        if (serverCodes && serverCodes.length >= 0) {
          setPromoCodes(prev => {
            const map = new Map<string, PromoCode>();
            prev.forEach(p => map.set(p.code.toUpperCase(), p));
            serverCodes.forEach(p => map.set(p.code.toUpperCase(), p));
            return Array.from(map.values());
          });
        }
      } catch (err) {
        console.warn('Background sync promo codes failed:', err);
      }
    };

    syncPromoCodes();
    const interval = setInterval(syncPromoCodes, 8000);
    const onFocus = () => syncPromoCodes();
    window.addEventListener('focus', onFocus);

    return () => {
      isMounted = false;
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  // Calculate current warehouse capacity including warehouse skill
  const warehouseSkillLevel = skills.find(s => s.id === 'warehouse')?.currentLevel || 0;
  const currentWarehouseCapacity = (WAREHOUSE_TIERS[warehouseTier]?.capacity || 4) + warehouseSkillLevel * 2;

  // Level & XP progression
  const currentLevelConfig = PLAYER_LEVELS.find(l => l.level === level) || PLAYER_LEVELS[0];
  const nextLevelConfig = PLAYER_LEVELS.find(l => l.level === level + 1);
  const xpToNextLevel = nextLevelConfig ? nextLevelConfig.xpRequired - xp : 0;

  const addXp = useCallback(
    (amount: number) => {
      setXp(prevXp => {
        const newXp = prevXp + amount;
        // Check for level ups
        const nextLvl = PLAYER_LEVELS.find(l => l.level === level + 1);
        if (nextLvl && newXp >= nextLvl.xpRequired) {
          setLevel(prevLvl => prevLvl + 1);
          setSkillPoints(sp => sp + 2);
          playNotification(soundEnabled);
          addNotification(`Уровень повышен: ${nextLvl.name}! Получено +2 очка навыков`, 'event');
        }
        return newXp;
      });
    },
    [level, soundEnabled, addNotification]
  );

  // Quest progress updater
  const updateQuestProgress = useCallback((type: 'deal' | 'profit' | 'smartphone' | 'rep' | 'warehouse' | 'rare', amount: number) => {
    setQuests(prev =>
      prev.map(q => {
        if (q.completed) return q;
        let newCurrent = q.current;

        if (type === 'deal' && q.id === 'q_first_deal') newCurrent += amount;
        if (type === 'profit' && (q.id === 'q_profit_10k' || q.id === 'q_profit_100k')) newCurrent += amount;
        if (type === 'smartphone' && q.id === 'q_phones_3') newCurrent += amount;
        if (type === 'rep' && q.id === 'q_reputation_49') newCurrent = amount;
        if (type === 'warehouse' && q.id === 'q_garage') newCurrent = amount;
        if (type === 'rare' && q.id === 'q_rare_deal') newCurrent += amount;

        const completed = newCurrent >= q.target;
        return {
          ...q,
          current: newCurrent,
          completed,
        };
      })
    );
  }, []);

  // Refresh market listings
  const refreshMarket = useCallback(() => {
    playClick(soundEnabled);
    const count = 7 + Math.floor(Math.random() * 3);
    const newItems = generateInitialMarketItems(count);

    // If buyerManager is hired, inject an extra bargain deal (-35% discount)
    if (hiredStaff.buyerManager) {
      const sweetDeal = generateMarketItem();
      sweetDeal.askingPrice = Math.round((sweetDeal.baseMarketPrice * 0.6) / 500) * 500;
      sweetDeal.estimatedProfit = sweetDeal.baseMarketPrice - sweetDeal.askingPrice;
      sweetDeal.sellerStory = '🔥 Спецпредложение от вашего менеджера по закупкам: срочный выкуп ниже рынка!';
      newItems.unshift(sweetDeal);
    }

    setMarketItems(newItems);
    addNotification('Лента объявлений обновлена', 'neutral');
  }, [soundEnabled, hiredStaff.buyerManager, addNotification]);

  // Inspect an item before purchase
  const inspectMarketItem = useCallback(
    (itemId: string, tier: InspectionTier) => {
      const item = marketItems.find(i => i.id === itemId);
      if (!item) return { success: false, message: 'Товар не найден' };

      const diagSkill = skills.find(s => s.id === 'diagnostics')?.currentLevel || 0;
      const discount = 1 - diagSkill * 0.15;

      let baseCost = 300;
      let detectionChance = 0.6;
      if (tier === 'accurate') {
        baseCost = 800;
        detectionChance = 0.9;
      } else if (tier === 'expert') {
        baseCost = 1500;
        detectionChance = 1.0;
      }

      const cost = Math.max(100, Math.round(baseCost * discount));

      if (money < cost) {
        playError(soundEnabled);
        return { success: false, message: 'Недостаточно денег для диагностики' };
      }

      setMoney(m => m - cost);
      playClick(soundEnabled);

      let discovered = false;
      let defectFound: DefectType = 'none';

      if (item.hasDefect) {
        if (Math.random() < detectionChance) {
          discovered = true;
          defectFound = item.defect;
        }
      }

      // Update item in marketItems
      setMarketItems(prev =>
        prev.map(i => {
          if (i.id === itemId) {
            return {
              ...i,
              inspected: tier,
              discoveredDefect: discovered,
            };
          }
          return i;
        })
      );

      if (discovered) {
        addNotification(`Обнаружен скрытый дефект!`, 'loss');
        return {
          success: true,
          defectFound,
          message: `Внимание: обнаружен дефект (${defectFound})! Потребуется ремонт или уценка.`,
        };
      } else if (tier === 'expert' || !item.hasDefect) {
        addNotification('Проверка пройдена: скрытых проблем нет', 'profit');
        return { success: true, message: 'Диагностика подтвердила: товар полностью исправен!' };
      } else {
        addNotification('Явных проблем не обнаружено', 'neutral');
        return { success: true, message: 'Осмотр не выявил видимых дефектов.' };
      }
    },
    [marketItems, skills, money, soundEnabled, addNotification]
  );

  // Buy item
  const buyMarketItem = useCallback(
    (itemId: string) => {
      const item = marketItems.find(i => i.id === itemId);
      if (!item) return { success: false, message: 'Товар больше недоступен' };

      // Warehouse capacity check
      const currentItemsCount = inventory.filter(i => i.status !== 'sold').length;
      if (currentItemsCount >= currentWarehouseCapacity) {
        playError(soundEnabled);
        return {
          success: false,
          message: `Склад полон (${currentItemsCount}/${currentWarehouseCapacity}). Расширьте склад в профиле или продайте текущие товары.`,
        };
      }

      if (money < item.askingPrice) {
        playError(soundEnabled);
        return { success: false, message: 'Недостаточно средств для покупки' };
      }

      setMoney(m => m - item.askingPrice);
      playBuy(soundEnabled);

      // Free photographer upgrades if staff hired
      const freePhotos = hiredStaff.proPhotographer;

      const newInventoryItem: InventoryItem = {
        ...item,
        purchasePrice: item.askingPrice,
        inspectionCostPaid: item.inspected === 'quick' ? 300 : item.inspected === 'accurate' ? 800 : item.inspected === 'expert' ? 1500 : 0,
        upgrades: {
          cleaned: false,
          accessories: false,
          repaired: false,
          proPhotos: freePhotos,
          proText: freePhotos,
          promoted: false,
        },
        totalInvested: item.askingPrice,
        status: 'in_inventory',
        buyerOffers: [],
      };

      setInventory(prev => [newInventoryItem, ...prev]);
      setMarketItems(prev => prev.filter(i => i.id !== itemId));

      addNotification(`Куплен: ${item.title} (-${item.askingPrice.toLocaleString('ru-RU')} ₽)`, 'neutral');

      return { success: true, message: 'Товар успешно куплен и отправлен на склад' };
    },
    [marketItems, inventory, currentWarehouseCapacity, money, soundEnabled, hiredStaff.proPhotographer, addNotification]
  );

  // Upgrade / Prepare inventory item
  const upgradeInventoryItem = useCallback(
    (itemId: string, upgradeType: keyof ItemUpgrades) => {
      const item = inventory.find(i => i.id === itemId);
      if (!item) return { success: false, message: 'Товар не найден' };

      if (item.upgrades[upgradeType]) {
        return { success: false, message: 'Это улучшение уже применено' };
      }

      let cost = 0;
      switch (upgradeType) {
        case 'cleaned':
          cost = 200;
          break;
        case 'accessories':
          cost = 500;
          break;
        case 'proPhotos':
          cost = hiredStaff.proPhotographer ? 0 : 700;
          break;
        case 'proText':
          cost = hiredStaff.proPhotographer ? 0 : 500;
          break;
        case 'promoted':
          cost = 1000;
          break;
        case 'repaired':
          cost = hiredStaff.repairMaster ? Math.round(item.repairCost * 0.5) : item.repairCost;
          break;
      }

      if (money < cost) {
        playError(soundEnabled);
        return { success: false, message: `Недостаточно денег (требуется ${cost.toLocaleString('ru-RU')} ₽)` };
      }

      if (cost > 0) {
        setMoney(m => m - cost);
      }
      playClick(soundEnabled);

      setInventory(prev =>
        prev.map(i => {
          if (i.id === itemId) {
            const newUpgrades = { ...i.upgrades, [upgradeType]: true };
            return {
              ...i,
              upgrades: newUpgrades,
              totalInvested: i.totalInvested + cost,
              // If repaired, clear defect penalty
              hasDefect: upgradeType === 'repaired' ? false : i.hasDefect,
            };
          }
          return i;
        })
      );

      addNotification(`Улучшение применено (-${cost.toLocaleString('ru-RU')} ₽)`, 'neutral');
      return { success: true, message: 'Улучшение успешно применено' };
    },
    [inventory, hiredStaff, money, soundEnabled, addNotification]
  );

  // List item for sale with custom price & calculate Listing Quality Score
  const listItemForSale = useCallback(
    (itemId: string, price: number) => {
      const item = inventory.find(i => i.id === itemId);
      if (!item) return { success: false, message: 'Товар не найден' };

      // Calculate quality score (0 - 100)
      let score = 55;

      // Price factor (comparing to baseMarketPrice)
      const ratio = price / item.baseMarketPrice;
      if (ratio <= 0.9) score += 20;
      else if (ratio <= 1.0) score += 12;
      else if (ratio <= 1.1) score += 5;
      else if (ratio > 1.25) score -= 15;

      // Upgrades bonus
      if (item.upgrades.cleaned) score += 8;
      if (item.upgrades.accessories) score += 7;
      if (item.upgrades.proPhotos) score += 10;
      if (item.upgrades.proText) score += 8;
      if (item.upgrades.promoted) score += 12;

      // Defect penalty
      if (item.hasDefect && !item.upgrades.repaired) {
        score -= 25;
      }

      // Reputation bonus
      score += Math.round((reputation - 4.0) * 8);

      // Clamp 10 - 100
      const listingQualityScore = Math.max(15, Math.min(99, score));

      setInventory(prev =>
        prev.map(i => {
          if (i.id === itemId) {
            return {
              ...i,
              status: 'listed',
              listedPrice: price,
              listingQualityScore,
              listedAt: Date.now(),
              buyerOffers: [],
            };
          }
          return i;
        })
      );

      playClick(soundEnabled);
      addNotification(`Объявление опубликовано: ${item.title}`, 'neutral');

      // Schedule first buyer offer quickly (between 3 and 10 seconds)
      const initialWait = item.upgrades.promoted ? 2500 : 5000;
      setTimeout(() => {
        setInventory(currentInv =>
          currentInv.map(invItem => {
            if (invItem.id === itemId && invItem.status === 'listed') {
              const offer = generateBuyerOffer(invItem, reputation);
              playNotification(soundEnabled);
              return {
                ...invItem,
                buyerOffers: [offer, ...invItem.buyerOffers],
              };
            }
            return invItem;
          })
        );
      }, initialWait);

      return { success: true, message: 'Товар выставлен на продажу! Ожидайте звонков и сообщений.' };
    },
    [inventory, reputation, soundEnabled, addNotification]
  );

  // Delist item back to inventory
  const delistItem = useCallback((itemId: string) => {
    setInventory(prev =>
      prev.map(i => {
        if (i.id === itemId) {
          return {
            ...i,
            status: 'in_inventory',
            buyerOffers: [],
          };
        }
        return i;
      })
    );
    playClick(soundEnabled);
  }, [soundEnabled]);

  // Accept buyer offer (Finish sale)
  const acceptBuyerOffer = useCallback(
    (itemId: string, offerId: string) => {
      const item = inventory.find(i => i.id === itemId);
      if (!item) return { success: false, message: 'Товар не найден' };

      const offer = item.buyerOffers.find(o => o.id === offerId);
      if (!offer) return { success: false, message: 'Предложение не найдено' };

      const salePrice = offer.offeredPrice;
      const profit = salePrice - item.totalInvested;

      setMoney(m => m + salePrice);
      setTodayProfit(p => p + profit);
      setTotalProfit(p => p + profit);
      setTotalDeals(d => d + 1);

      playSell(soundEnabled);
      if (profit > 0) {
        playProfit(soundEnabled);
      }

      // Generate buyer review
      const hadUndisclosedDefect = item.hasDefect && !item.upgrades.repaired;
      let reviewRating = 5;
      let reviewComment = 'Отличная сделка, продавец пунктуальный и вежливый. Рекомендую!';

      if (hadUndisclosedDefect) {
        reviewRating = Math.random() > 0.5 ? 2 : 3;
        reviewComment = 'Товар оказался с нюансом, который не был указан в объявлении. Пришлось разбираться самому.';
        setReputation(r => Math.max(3.2, Number((r - 0.2).toFixed(1))));
      } else {
        reviewRating = Math.random() > 0.15 ? 5 : 4;
        reviewComment =
          reviewRating === 5
            ? 'Все супер! Состояние в точности как в объявлении. Спасибо!'
            : 'Товар хороший, претензий нет, цена адекватная.';
        setReputation(r => Math.min(5.0, Number((r + 0.05).toFixed(1))));
      }

      const newReview: BuyerReview = {
        id: `rev_${Date.now()}`,
        buyerName: offer.buyerName,
        itemTitle: item.title,
        rating: reviewRating,
        comment: reviewComment,
        profit,
        date: 'Только что',
      };
      setReviews(prev => [newReview, ...prev.slice(0, 15)]);

      // XP reward based on profit
      const earnedXp = Math.max(50, Math.round(profit / 150) + 75);
      addXp(earnedXp);

      // Quests progression
      updateQuestProgress('deal', 1);
      updateQuestProgress('profit', profit);
      if (item.category === 'smartphones') updateQuestProgress('smartphone', 1);
      if (item.rarity === 'rare' || item.rarity === 'legendary') updateQuestProgress('rare', 1);
      updateQuestProgress('rep', Math.round(reputation * 10));

      // Mark item as sold
      setInventory(prev =>
        prev.map(i => {
          if (i.id === itemId) {
            return {
              ...i,
              status: 'sold',
              soldPrice: salePrice,
              soldAt: Date.now(),
              profitEarned: profit,
              buyerOffers: [],
            };
          }
          return i;
        })
      );

      const profitSign = profit >= 0 ? '+' : '';
      addNotification(`Продано! Прибыль: ${profitSign}${profit.toLocaleString('ru-RU')} ₽ (+${earnedXp} XP)`, profit >= 0 ? 'profit' : 'loss');

      return {
        success: true,
        message: `Товар успешно продан за ${salePrice.toLocaleString('ru-RU')} ₽! Чистая прибыль: ${profit.toLocaleString('ru-RU')} ₽`,
      };
    },
    [inventory, soundEnabled, reputation, addXp, updateQuestProgress, addNotification]
  );

  // Reject buyer offer
  const rejectBuyerOffer = useCallback(
    (itemId: string, offerId: string) => {
      setInventory(prev =>
        prev.map(i => {
          if (i.id === itemId) {
            return {
              ...i,
              buyerOffers: i.buyerOffers.filter(o => o.id !== offerId),
            };
          }
          return i;
        })
      );
      playClick(soundEnabled);
    },
    [soundEnabled]
  );

  // Counter buyer offer (Bargaining)
  const counterBuyerOffer = useCallback(
    (itemId: string, offerId: string, counterPrice: number) => {
      const item = inventory.find(i => i.id === itemId);
      if (!item) return { accepted: false, message: 'Товар не найден' };

      const offer = item.buyerOffers.find(o => o.id === offerId);
      if (!offer) return { accepted: false, message: 'Оффер не найден' };

      const negSkill = skills.find(s => s.id === 'negotiation')?.currentLevel || 0;
      const staffBonus = hiredStaff.salesManager ? 0.08 : 0;
      const concessionTolerance = 0.05 * negSkill + staffBonus;

      // If counterPrice <= minAcceptablePrice (plus concession skill), buyer agrees!
      const effectiveMinPrice = offer.minAcceptablePrice * (1 - concessionTolerance);

      if (counterPrice <= effectiveMinPrice) {
        // Buyer agrees!
        setInventory(prev =>
          prev.map(i => {
            if (i.id === itemId) {
              return {
                ...i,
                buyerOffers: i.buyerOffers.map(o => {
                  if (o.id === offerId) {
                    return {
                      ...o,
                      offeredPrice: counterPrice,
                      message: `Договорились! Забираю за ${counterPrice.toLocaleString('ru-RU')} ₽. Где встретимся?`,
                      status: 'accepted' as const,
                      patience: 0,
                    };
                  }
                  return o;
                }),
              };
            }
            return i;
          })
        );
        playNotification(soundEnabled);
        addNotification(`Покупатель согласился на ${counterPrice.toLocaleString('ru-RU')} ₽!`, 'profit');
        return { accepted: true, finalPrice: counterPrice, message: 'Покупатель согласился на ваше предложение!' };
      } else {
        // Buyer pushes back or walks away
        if (offer.patience <= 1) {
          // Walks away
          setInventory(prev =>
            prev.map(i => {
              if (i.id === itemId) {
                return {
                  ...i,
                  buyerOffers: i.buyerOffers.filter(o => o.id !== offerId),
                };
              }
              return i;
            })
          );
          playError(soundEnabled);
          addNotification('Покупатель отказался и ушел искать другой вариант', 'loss');
          return { accepted: false, message: 'Покупатель посчитал цену слишком высокой и отказался от сделки.' };
        } else {
          // Mid-way compromise
          const newBuyerOfferPrice = Math.round((offer.offeredPrice + (counterPrice - offer.offeredPrice) * 0.45) / 100) * 100;
          setInventory(prev =>
            prev.map(i => {
              if (i.id === itemId) {
                return {
                  ...i,
                  buyerOffers: i.buyerOffers.map(o => {
                    if (o.id === offerId) {
                      return {
                        ...o,
                        offeredPrice: newBuyerOfferPrice,
                        patience: o.patience - 1,
                        message: `Дороговато. Давайте сойдемся на ${newBuyerOfferPrice.toLocaleString('ru-RU')} ₽, и я сразу выезжаю?`,
                      };
                    }
                    return o;
                  }),
                };
              }
              return i;
            })
          );
          playClick(soundEnabled);
          return { accepted: false, finalPrice: newBuyerOfferPrice, message: `Покупатель сделал встречное предложение: ${newBuyerOfferPrice.toLocaleString('ru-RU')} ₽` };
        }
      }
    },
    [inventory, skills, hiredStaff.salesManager, soundEnabled, addNotification]
  );

  // Upgrade Skill
  const upgradeSkill = useCallback(
    (skillId: string) => {
      const skill = skills.find(s => s.id === skillId);
      if (!skill) return;

      if (skill.currentLevel >= skill.maxLevel) {
        addNotification('Навык уже прокачан до максимума', 'neutral');
        return;
      }

      if (skillPoints < skill.costPerLevel) {
        playError(soundEnabled);
        addNotification('Недостаточно очков навыков', 'neutral');
        return;
      }

      setSkillPoints(sp => sp - skill.costPerLevel);
      setSkills(prev =>
        prev.map(s => {
          if (s.id === skillId) {
            return { ...s, currentLevel: s.currentLevel + 1 };
          }
          return s;
        })
      );
      playClick(soundEnabled);
      addNotification(`Навык прокачан: ${skill.name}`, 'event');
    },
    [skills, skillPoints, soundEnabled, addNotification]
  );

  // Upgrade Warehouse
  const upgradeWarehouse = useCallback(() => {
    const nextTier = warehouseTier + 1;
    if (nextTier >= WAREHOUSE_TIERS.length) {
      return { success: false, message: 'У вас максимальный уровень склада' };
    }

    const config = WAREHOUSE_TIERS[nextTier];
    if (money < config.costToUpgrade) {
      playError(soundEnabled);
      return { success: false, message: `Недостаточно денег (требуется ${config.costToUpgrade.toLocaleString('ru-RU')} ₽)` };
    }

    setMoney(m => m - config.costToUpgrade);
    setWarehouseTier(nextTier);
    playProfit(soundEnabled);
    updateQuestProgress('warehouse', nextTier);

    addNotification(`Склад расширен: ${config.name} (${config.capacity} мест)`, 'event');
    return { success: true, message: `Склад успешно расширен до «${config.name}»!` };
  }, [warehouseTier, money, soundEnabled, updateQuestProgress, addNotification]);

  // Hire Staff
  const hireStaff = useCallback(
    (staffKey: 'buyerManager' | 'repairMaster' | 'proPhotographer' | 'salesManager') => {
      if (hiredStaff[staffKey]) {
        return { success: false, message: 'Этот сотрудник уже в вашей команде' };
      }

      const staffDef = STAFF_DEFINITIONS.find(s => s.key === staffKey);
      if (!staffDef) return { success: false, message: 'Сотрудник не найден' };

      if (money < staffDef.cost) {
        playError(soundEnabled);
        return { success: false, message: `Недостаточно денег для найма (${staffDef.cost.toLocaleString('ru-RU')} ₽)` };
      }

      setMoney(m => m - staffDef.cost);
      setHiredStaff(prev => ({ ...prev, [staffKey]: true }));
      playProfit(soundEnabled);

      addNotification(`Нанят: ${staffDef.name}`, 'event');
      return { success: true, message: `${staffDef.name} принят в штат!` };
    },
    [hiredStaff, money, soundEnabled, addNotification]
  );

  // Claim Quest Reward
  const claimQuestReward = useCallback(
    (questId: string) => {
      const quest = quests.find(q => q.id === questId);
      if (!quest || !quest.completed || quest.claimed) return;

      setMoney(m => m + quest.rewardMoney);
      addXp(quest.rewardXp);

      setQuests(prev =>
        prev.map(q => {
          if (q.id === questId) {
            return { ...q, claimed: true };
          }
          return q;
        })
      );

      playProfit(soundEnabled);
      addNotification(`Награда за задание: +${quest.rewardMoney.toLocaleString('ru-RU')} ₽, +${quest.rewardXp} XP`, 'profit');
    },
    [quests, soundEnabled, addXp, addNotification]
  );

  const lastPromoAttemptRef = useRef<number>(0);

  // Redeem Promo Code with Cloud Server Validation (cross-device) + Anti-Spam
  const redeemPromoCode = useCallback(
    async (rawCode: string): Promise<{ success: boolean; message: string }> => {
      const now = Date.now();
      if (now - lastPromoAttemptRef.current < 600) {
        return { success: false, message: 'Защита от перебора: подождите секунду перед следующим вводом' };
      }
      lastPromoAttemptRef.current = now;

      const cleanCode = rawCode.trim().toUpperCase();

      // 1. First validate on the cloud server (so promo created on tablet works on phone)
      const serverResult = await redeemPromoCodeOnServer(cleanCode);

      let targetPromo: PromoCode | null = null;

      if (serverResult.success && serverResult.promo) {
        targetPromo = serverResult.promo;
      } else if (serverResult.status === 410) {
        // Explicitly expired / out of uses on server
        playError(soundEnabled);
        return {
          success: false,
          message: serverResult.message || `Промокод «${cleanCode}» устарел (лимит исчерпан)`,
        };
      } else {
        // If 404 on server or offline, check if code exists in local memory
        const local = promoCodes.find(p => p.code.toUpperCase() === cleanCode);
        if (local) {
          if (local.usedCount >= local.maxUses) {
            playError(soundEnabled);
            return { success: false, message: `Промокод «${cleanCode}» уже был активирован` };
          }
          targetPromo = local;
        } else {
          playError(soundEnabled);
          return {
            success: false,
            message: serverResult.message || `Промокод «${cleanCode}» не найден или устарел`,
          };
        }
      }

      if (!targetPromo) {
        playError(soundEnabled);
        return { success: false, message: `Промокод «${cleanCode}» не найден` };
      }

      // 2. Apply reward with sanitized limits
      if (targetPromo.rewardType === 'money') {
        const val = Math.min(10000000, Math.max(0, Math.floor(Number(targetPromo.rewardValue)) || 0));
        setMoney(m => Math.max(0, m + val));
        addNotification(`Активирован промокод: +${val.toLocaleString('ru-RU')} ₽!`, 'profit');
      } else if (targetPromo.rewardType === 'xp') {
        const val = Math.min(50000, Math.max(0, Math.floor(Number(targetPromo.rewardValue)) || 0));
        addXp(val);
        addNotification(`Активирован промокод: +${val} XP!`, 'event');
      } else if (targetPromo.rewardType === 'rep') {
        const val = Math.min(5.0, Math.max(0, Number(targetPromo.rewardValue) || 0));
        setReputation(r => Math.min(5.0, Number((r + val).toFixed(1))));
        addNotification(`Активирован промокод: Репутация +${val}!`, 'profit');
      } else if (targetPromo.rewardType === 'item') {
        const itemTitle = String(targetPromo.rewardValue);
        const blueprint = ITEM_BLUEPRINTS.find(b => b.title.toLowerCase() === itemTitle.toLowerCase());
        const newItem = generateMarketItem();
        newItem.title = itemTitle;
        if (blueprint) {
          newItem.category = blueprint.category;
          newItem.baseMarketPrice = blueprint.baseMarketPrice;
          newItem.rarity = blueprint.rarity;
          newItem.imageUrl = blueprint.imageUrl;
          if (blueprint.stories && blueprint.stories.length > 0) {
            newItem.sellerStory = blueprint.stories[0];
            newItem.description = blueprint.stories[0];
          }
        } else {
          newItem.rarity = 'legendary';
        }
        newItem.askingPrice = 0;
        newItem.hasDefect = false;
        newItem.defect = 'none';
        newItem.condition = 'perfect';

        const invItem: InventoryItem = {
          ...newItem,
          purchasePrice: 0,
          inspectionCostPaid: 0,
          upgrades: {
            cleaned: true,
            accessories: true,
            repaired: true,
            proPhotos: true,
            proText: true,
            promoted: true,
          },
          totalInvested: 0,
          status: 'in_inventory',
          buyerOffers: [],
        };
        setInventory(prev => [invItem, ...prev]);
        addNotification(`Активирован промокод: Товар «${targetPromo.rewardValue}» добавлен на склад!`, 'profit');
      }

      // Mark used in local state
      setPromoCodes(prev =>
        prev.map(p => {
          if (p.code.toUpperCase() === cleanCode) {
            return { ...p, usedCount: (p.usedCount || 0) + 1 };
          }
          return p;
        })
      );

      playProfit(soundEnabled);
      return { success: true, message: `Промокод «${cleanCode}» успешно активирован: ${targetPromo.description}` };
    },
    [promoCodes, soundEnabled, addNotification, addXp]
  );

  // Admin Panel Functions (Password zxcqwerty) with Cloud Persistence
  const createCustomPromoCode = useCallback(
    (promo: Omit<PromoCode, 'usedCount'>) => {
      const newPromo: PromoCode = {
        ...promo,
        code: promo.code.trim().toUpperCase(),
        usedCount: 0,
        isCustom: true,
      };
      setPromoCodes(prev => [newPromo, ...prev.filter(p => p.code.toUpperCase() !== newPromo.code)]);

      // Save to cloud server so all devices receive it
      createPromoCodeOnServer(promo).then(res => {
        if (res.success) {
          console.log(`[Cloud Sync] Promo ${newPromo.code} saved to server`);
        }
      });

      addNotification(`Создан промо-ключ «${newPromo.code}» (синхронизирован)`, 'event');
      return true;
    },
    [addNotification]
  );

  const deletePromoCode = useCallback(
    (codeToDelete: string) => {
      const clean = codeToDelete.trim().toUpperCase();
      setPromoCodes(prev => prev.filter(p => p.code.toUpperCase() !== clean));

      // Remove from cloud server
      deletePromoCodeOnServer(clean);

      addNotification(`Промокод «${clean}» удален`, 'neutral');
      return true;
    },
    [addNotification]
  );

  const adminAddMoney = useCallback(
    (amount: number) => {
      setMoney(m => m + amount);
      playProfit(soundEnabled);
      addNotification(`Админ: Начислено ${amount.toLocaleString('ru-RU')} ₽`, 'profit');
    },
    [soundEnabled, addNotification]
  );

  const adminAddXp = useCallback(
    (amount: number) => {
      addXp(amount);
      addNotification(`Админ: Начислено ${amount} XP`, 'event');
    },
    [addXp, addNotification]
  );

  const adminSetReputation = useCallback(
    (rep: number) => {
      setReputation(rep);
      addNotification(`Админ: Репутация установлена на ${rep}`, 'event');
    },
    [addNotification]
  );

  const adminUnlockAllSkills = useCallback(() => {
    setSkills(prev => prev.map(s => ({ ...s, currentLevel: s.maxLevel })));
    addNotification(`Админ: Все навыки прокачаны на максимум!`, 'event');
  }, [addNotification]);

  const adminSpawnItem = useCallback(
    (title: string, category: ItemCategory, baseMarketPrice: number) => {
      const item = generateMarketItem();
      item.title = title;
      item.category = category;
      item.baseMarketPrice = baseMarketPrice;
      item.askingPrice = Math.round(baseMarketPrice * 0.5);
      item.estimatedProfit = item.baseMarketPrice - item.askingPrice;
      item.rarity = 'legendary';
      item.hasDefect = false;
      item.defect = 'none';

      setMarketItems(prev => [item, ...prev]);
      addNotification(`Админ: Сгенерирован лот «${title}» на рынке`, 'event');
    },
    [addNotification]
  );

  const adminResetGame = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    window.location.reload();
  }, []);

  // Periodic background simulation: generate new buyer offers for listed items & refresh news
  useEffect(() => {
    const interval = setInterval(() => {
      // 1. Check listed items, potentially add buyer offers if under limit
      setInventory(prevInv =>
        prevInv.map(item => {
          if (item.status === 'listed' && item.buyerOffers.length < 3) {
            // Chance based on marketing upgrade & speed
            const promotionBonus = item.upgrades.promoted ? 0.75 : 0.45;
            if (Math.random() < promotionBonus) {
              const newOffer = generateBuyerOffer(item, reputation);
              playNotification(soundEnabled);
              return {
                ...item,
                buyerOffers: [...item.buyerOffers, newOffer],
              };
            }
          }
          return item;
        })
      );

      // 2. Small random market news tick
      if (Math.random() < 0.2) {
        const newsItems: MarketNews[] = [
          {
            id: `news_${Date.now()}`,
            title: 'Дефицит чипов памяти',
            description: 'Цены на производительные ноутбуки и видеокарты могут вырасти.',
            categoryAffected: 'gpus',
            priceMultiplier: 1.1,
            durationMinutes: 5,
            timestamp: Date.now(),
          },
          {
            id: `news_${Date.now()}`,
            title: 'Старт сезона подарков',
            description: 'Спрос на наушники и аксессуары на вторичном рынке увеличился на 30%.',
            categoryAffected: 'audio',
            priceMultiplier: 1.15,
            durationMinutes: 5,
            timestamp: Date.now(),
          },
          {
            id: `news_${Date.now()}`,
            title: 'Анонс нового поколения флагманов',
            description: 'Пользователи активно избавляются от прошлогодних моделей смартфонов.',
            categoryAffected: 'smartphones',
            priceMultiplier: 0.92,
            durationMinutes: 5,
            timestamp: Date.now(),
          },
        ];
        const selected = newsItems[Math.floor(Math.random() * newsItems.length)];
        setMarketNews([selected]);
      }
    }, 18000);

    return () => clearInterval(interval);
  }, [reputation, soundEnabled]);

  const activeListings = inventory.filter(i => i.status === 'listed');

  return (
    <GameContext.Provider
      value={{
        money,
        todayProfit,
        totalProfit,
        totalDeals,
        reputation,
        reviews,
        level,
        xp,
        xpToNextLevel,
        skillPoints,
        skills,
        day,
        soundEnabled,
        warehouseTier,
        currentWarehouseCapacity,
        hiredStaff,
        marketItems,
        inventory,
        activeListings,
        quests,
        marketNews,
        notifications,
        promoCodes,
        setSoundEnabled,
        refreshMarket,
        inspectMarketItem,
        buyMarketItem,
        upgradeInventoryItem,
        listItemForSale,
        delistItem,
        acceptBuyerOffer,
        rejectBuyerOffer,
        counterBuyerOffer,
        upgradeSkill,
        upgradeWarehouse,
        hireStaff,
        claimQuestReward,
        redeemPromoCode,
        createCustomPromoCode,
        deletePromoCode,
        adminAddMoney,
        adminAddXp,
        adminSetReputation,
        adminUnlockAllSkills,
        adminSpawnItem,
        adminResetGame,
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};
