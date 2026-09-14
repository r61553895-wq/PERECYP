import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { InspectionTier, ItemCategory, MarketItem, MarketRisk } from '../types';
import {
  Search,
  RefreshCw,
  SlidersHorizontal,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  Flame,
  CheckCircle2,
  X,
  Sparkles,
} from 'lucide-react';
import { CATEGORY_LABELS, getItemImageUrl } from '../data/itemsData';

export const MarketScreen: React.FC = () => {
  const {
    marketItems,
    refreshMarket,
    buyMarketItem,
    inspectMarketItem,
    money,
    skills,
    inventory,
    currentWarehouseCapacity,
  } = useGame();

  const [selectedCategory, setSelectedCategory] = useState<ItemCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'profit' | 'price_asc' | 'risk'>('profit');

  // Inspection & Purchase Modal
  const [activeModalItem, setActiveModalItem] = useState<MarketItem | null>(null);
  const [inspectionResult, setInspectionResult] = useState<string | null>(null);

  // Filter items
  const filteredItems = marketItems.filter(item => {
    if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return item.title.toLowerCase().includes(q) || item.sellerStory.toLowerCase().includes(q);
    }
    return true;
  });

  // Sort items
  const sortedItems = [...filteredItems].sort((a, b) => {
    if (sortBy === 'profit') return b.estimatedProfit - a.estimatedProfit;
    if (sortBy === 'price_asc') return a.askingPrice - b.askingPrice;
    if (sortBy === 'risk') {
      const riskWeight: Record<MarketRisk, number> = { low: 1, medium: 2, high: 3 };
      return riskWeight[a.risk] - riskWeight[b.risk];
    }
    return 0;
  });

  const diagSkill = skills.find(s => s.id === 'diagnostics')?.currentLevel || 0;
  const diagDiscount = 1 - diagSkill * 0.15;

  const quickCost = Math.max(100, Math.round(300 * diagDiscount));
  const accurateCost = Math.max(200, Math.round(800 * diagDiscount));
  const expertCost = Math.max(400, Math.round(1500 * diagDiscount));

  const handleInspect = (tier: InspectionTier) => {
    if (!activeModalItem) return;
    const res = inspectMarketItem(activeModalItem.id, tier);
    setInspectionResult(res.message);

    // Refresh modal item from updated state
    const updated = marketItems.find(i => i.id === activeModalItem.id);
    if (updated) {
      setActiveModalItem(updated);
    }
  };

  const handleBuy = () => {
    if (!activeModalItem) return;
    const res = buyMarketItem(activeModalItem.id);
    if (res.success) {
      setActiveModalItem(null);
      setInspectionResult(null);
    } else {
      setInspectionResult(res.message);
    }
  };

  const storedCount = inventory.filter(i => i.status !== 'sold').length;

  return (
    <div className="space-y-4 pb-24 max-w-md mx-auto px-4 pt-3">
      {/* Search & Refresh Bar */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Поиск по объявлениям..."
            className="w-full pl-9 pr-3 py-2 bg-white border border-neutral-200/90 rounded-xl text-xs placeholder:text-neutral-400 focus:outline-none focus:border-neutral-900 transition-colors"
          />
        </div>

        <button
          onClick={refreshMarket}
          className="px-3 py-2 bg-white border border-neutral-200/90 rounded-xl text-xs font-semibold text-neutral-800 hover:border-neutral-400 flex items-center space-x-1 active:scale-95 transition-all shrink-0 shadow-sm"
          title="Обновить ленту"
        >
          <RefreshCw className="w-3.5 h-3.5 text-neutral-700" />
          <span className="hidden sm:inline">Обновить</span>
        </button>
      </div>

      {/* Category Pills (Horizontal Scroll) */}
      <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-3 py-1.5 rounded-full whitespace-nowrap font-medium transition-all ${
            selectedCategory === 'all'
              ? 'bg-neutral-900 text-white font-semibold'
              : 'bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-50'
          }`}
        >
          Все категории
        </button>
        {(Object.keys(CATEGORY_LABELS) as ItemCategory[]).map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-full whitespace-nowrap font-medium transition-all ${
              selectedCategory === cat
                ? 'bg-neutral-900 text-white font-semibold'
                : 'bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-50'
            }`}
          >
            {CATEGORY_LABELS[cat]}
          </button>
        ))}
      </div>

      {/* Sort selection */}
      <div className="flex items-center justify-between text-xs px-1 text-neutral-500">
        <span>Найдено лотов: {sortedItems.length}</span>
        <div className="flex items-center space-x-1 font-medium">
          <SlidersHorizontal className="w-3 h-3 mr-0.5" />
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
            className="bg-transparent border-none text-neutral-800 font-semibold focus:outline-none cursor-pointer"
          >
            <option value="profit">По марже (прибыли)</option>
            <option value="price_asc">По цене (дешевые)</option>
            <option value="risk">По риску (надежные)</option>
          </select>
        </div>
      </div>

      {/* Items Feed */}
      <div className="space-y-3">
        {sortedItems.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-neutral-200 p-6 space-y-2">
            <p className="text-sm font-semibold text-neutral-800">Объявлений не найдено</p>
            <p className="text-xs text-neutral-500">Попробуйте изменить категорию или нажмите «Обновить»</p>
            <button
              onClick={refreshMarket}
              className="mt-2 px-4 py-2 bg-neutral-900 text-white text-xs font-semibold rounded-xl"
            >
              Обновить ленту
            </button>
          </div>
        ) : (
          sortedItems.map(item => {
            const hasInspected = item.inspected !== 'none';
            const canAfford = money >= item.askingPrice;

            return (
              <div
                key={item.id}
                onClick={() => {
                  setActiveModalItem(item);
                  setInspectionResult(null);
                }}
                className="bg-white rounded-2xl p-4 border border-neutral-200/90 shadow-sm hover:border-neutral-400 active:scale-[0.99] transition-all cursor-pointer space-y-3 relative overflow-hidden"
              >
                {/* Product Layout: Image + Header */}
                <div className="flex gap-3 items-start">
                  {/* Item Image Thumbnail */}
                  <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-neutral-100 shrink-0 border border-neutral-200/80 shadow-xs">
                    <img
                      src={getItemImageUrl(item.category, item.imageUrl)}
                      alt={item.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    {item.rarity !== 'common' && (
                      <span className="absolute bottom-1 left-1 text-[8px] font-black uppercase px-1 py-0.2 rounded bg-neutral-900/85 text-amber-400 backdrop-blur-xs">
                        {item.rarity === 'legendary' ? '★ ТОП' : 'РЕДКИЙ'}
                      </span>
                    )}
                  </div>

                  {/* Header: Title & Badges & Profit */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-1.5">
                      <div className="min-w-0">
                        <div className="flex items-center space-x-1.5 mb-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 bg-neutral-100 px-1.5 py-0.2 rounded">
                            {CATEGORY_LABELS[item.category]}
                          </span>
                        </div>
                        <h3 className="text-xs font-bold text-neutral-950 leading-snug line-clamp-2">
                          {item.title}
                        </h3>
                      </div>

                      {/* Profit Potential Chip */}
                      <div className="shrink-0 text-right">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 font-bold text-xs border border-emerald-200 font-mono">
                          +{item.estimatedProfit.toLocaleString('ru-RU')} ₽
                        </span>
                        <div className="text-[9px] text-neutral-400 mt-0.5">потенциал</div>
                      </div>
                    </div>

                    {/* Price in Header Preview */}
                    <div className="flex items-baseline space-x-2 mt-2">
                      <span className="text-base font-extrabold text-neutral-950 font-mono">
                        {item.askingPrice.toLocaleString('ru-RU')} <span className="text-xs font-bold">₽</span>
                      </span>
                      <span className="text-xs text-neutral-400 font-mono line-through">
                        {item.baseMarketPrice.toLocaleString('ru-RU')} ₽
                      </span>
                    </div>
                  </div>
                </div>

                {/* Seller Story / Comment */}
                <p className="text-xs text-neutral-600 line-clamp-2 bg-neutral-50/80 p-2.5 rounded-xl border border-neutral-100 italic">
                  «{item.sellerStory}»
                </p>

                {/* Characteristics Badges */}
                <div className="flex flex-wrap gap-1.5 pt-1 text-[11px]">
                  <span className="px-2 py-0.5 rounded bg-neutral-100 text-neutral-700 font-medium">
                    Состояние: {item.condition === 'perfect' ? 'Идеальное' : item.condition === 'good' ? 'Хорошее' : item.condition === 'fair' ? 'Потертое' : 'С нюансом'}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-neutral-100 text-neutral-700 font-medium">
                    Спрос: {item.demand === 'viral' ? 'Ажиотажный' : item.demand === 'high' ? 'Высокий' : 'Обычный'}
                  </span>

                  {item.risk === 'high' ? (
                    <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 font-medium border border-rose-200 flex items-center">
                      <AlertTriangle className="w-3 h-3 mr-0.5" /> Риск: Высокий
                    </span>
                  ) : item.risk === 'medium' ? (
                    <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 font-medium border border-amber-200">
                      Риск: Средний
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded bg-neutral-100 text-neutral-600 font-medium">
                      Риск: Низкий
                    </span>
                  )}

                  {hasInspected && (
                    <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200 flex items-center">
                      <CheckCircle2 className="w-3 h-3 mr-0.5" /> Проверен
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Item Detail & Inspection / Buy Modal */}
      {activeModalItem && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden max-h-[90vh] flex flex-col animate-in slide-in-from-bottom-6">
            {/* Modal Image Header Banner */}
            <div className="relative w-full h-44 bg-neutral-100 overflow-hidden shrink-0">
              <img
                src={getItemImageUrl(activeModalItem.category, activeModalItem.imageUrl)}
                alt={activeModalItem.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />
              <button
                onClick={() => {
                  setActiveModalItem(null);
                  setInspectionResult(null);
                }}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-xs transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="absolute bottom-3 left-4 right-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 bg-black/40 backdrop-blur-xs px-2 py-0.5 rounded">
                  {CATEGORY_LABELS[activeModalItem.category]}
                </span>
                <h3 className="text-base font-bold text-white leading-tight mt-1 drop-shadow-xs">
                  {activeModalItem.title}
                </h3>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs text-neutral-800 flex-1">
              {/* Price comparison card */}
              <div className="p-3.5 bg-neutral-50 rounded-xl border border-neutral-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-neutral-500">Цена продавца:</span>
                  <span className="text-base font-extrabold text-neutral-900 font-mono">
                    {activeModalItem.askingPrice.toLocaleString('ru-RU')} ₽
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-500">Средняя цена на рынке:</span>
                  <span className="font-semibold text-neutral-700 font-mono">
                    {activeModalItem.baseMarketPrice.toLocaleString('ru-RU')} ₽
                  </span>
                </div>
                <div className="flex items-center justify-between pt-1.5 border-t border-neutral-200">
                  <span className="font-bold text-neutral-900">Потенциальная маржа:</span>
                  <span className="font-bold text-emerald-600 font-mono text-sm">
                    +{activeModalItem.estimatedProfit.toLocaleString('ru-RU')} ₽
                  </span>
                </div>
              </div>

              {/* Seller Note */}
              <div>
                <div className="text-[11px] font-semibold text-neutral-500 mb-1">
                  Комментарий продавца ({activeModalItem.sellerName}):
                </div>
                <p className="p-3 bg-neutral-50 rounded-xl border border-neutral-100 text-neutral-700 italic">
                  «{activeModalItem.sellerStory}»
                </p>
              </div>

              {/* Inspection Status / Notice */}
              {inspectionResult && (
                <div
                  className={`p-3 rounded-xl border font-medium ${
                    activeModalItem.discoveredDefect
                      ? 'bg-rose-50 text-rose-800 border-rose-200'
                      : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  }`}
                >
                  {inspectionResult}
                </div>
              )}

              {/* Inspection Tiers (If not yet inspected or want deeper check) */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-600">
                    Диагностика перед покупкой
                  </span>
                  {diagSkill > 0 && (
                    <span className="text-[10px] text-emerald-600 font-semibold">
                      Скидка навыка -{diagSkill * 15}%
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => handleInspect('quick')}
                    disabled={money < quickCost}
                    className="p-2.5 rounded-xl border border-neutral-200 hover:border-neutral-900 text-left active:scale-95 disabled:opacity-40 transition-all"
                  >
                    <div className="font-bold text-neutral-900">Экспресс</div>
                    <div className="text-[10px] text-neutral-500">60% точность</div>
                    <div className="font-mono font-bold text-neutral-800 mt-1">{quickCost} ₽</div>
                  </button>

                  <button
                    onClick={() => handleInspect('accurate')}
                    disabled={money < accurateCost}
                    className="p-2.5 rounded-xl border border-neutral-200 hover:border-neutral-900 text-left active:scale-95 disabled:opacity-40 transition-all"
                  >
                    <div className="font-bold text-neutral-900">Точная</div>
                    <div className="text-[10px] text-neutral-500">90% точность</div>
                    <div className="font-mono font-bold text-neutral-800 mt-1">{accurateCost} ₽</div>
                  </button>

                  <button
                    onClick={() => handleInspect('expert')}
                    disabled={money < expertCost}
                    className="p-2.5 rounded-xl border border-neutral-900 bg-neutral-900 text-white text-left active:scale-95 disabled:opacity-40 transition-all"
                  >
                    <div className="font-bold">Экспертная</div>
                    <div className="text-[10px] text-neutral-300">100% гарантия</div>
                    <div className="font-mono font-bold mt-1">{expertCost} ₽</div>
                  </button>
                </div>
              </div>

              {/* Warehouse Capacity Notice */}
              <div className="flex items-center justify-between text-[11px] text-neutral-500 pt-1">
                <span>Занято на складе:</span>
                <span className="font-semibold font-mono text-neutral-800">
                  {storedCount} из {currentWarehouseCapacity} мест
                </span>
              </div>
            </div>

            {/* Footer / Buy Action */}
            <div className="p-4 border-t border-neutral-100 bg-neutral-50 flex items-center space-x-2">
              <button
                onClick={handleBuy}
                disabled={money < activeModalItem.askingPrice || storedCount >= currentWarehouseCapacity}
                className="w-full py-3 rounded-xl bg-neutral-900 text-white font-bold text-xs hover:bg-neutral-800 disabled:bg-neutral-300 disabled:cursor-not-allowed active:scale-[0.98] transition-all flex items-center justify-center space-x-1.5 shadow-sm"
              >
                <span>
                  {money < activeModalItem.askingPrice
                    ? 'Недостаточно денег'
                    : storedCount >= currentWarehouseCapacity
                    ? 'Склад переполнен'
                    : `Купить за ${activeModalItem.askingPrice.toLocaleString('ru-RU')} ₽`}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
