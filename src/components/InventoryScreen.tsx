import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { InventoryItem, ItemUpgrades } from '../types';
import {
  Package,
  Sparkles,
  Wrench,
  Camera,
  FileText,
  Rocket,
  Sliders,
  Check,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  X,
  Layers,
} from 'lucide-react';
import { CATEGORY_LABELS, DEFECT_DETAILS, getItemImageUrl } from '../data/itemsData';
import { WAREHOUSE_TIERS } from '../data/gameConfig';

interface InventoryScreenProps {
  onNavigateToDeals?: () => void;
}

export const InventoryScreen: React.FC<InventoryScreenProps> = ({ onNavigateToDeals }) => {
  const {
    inventory,
    warehouseTier,
    currentWarehouseCapacity,
    upgradeInventoryItem,
    listItemForSale,
    delistItem,
    hiredStaff,
    money,
  } = useGame();

  const [activeTab, setActiveTab] = useState<'warehouse' | 'listed' | 'sold'>('warehouse');
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

  // Listing creation form state
  const [listingPrice, setListingPrice] = useState<number>(0);

  const warehouseItems = inventory.filter(i => i.status === 'in_inventory');
  const listedItems = inventory.filter(i => i.status === 'listed');
  const soldItems = inventory.filter(i => i.status === 'sold');

  const currentWarehouse = WAREHOUSE_TIERS[warehouseTier] || WAREHOUSE_TIERS[0];
  const storedCount = inventory.filter(i => i.status !== 'sold').length;

  const handleSelectItem = (item: InventoryItem) => {
    setSelectedItem(item);
    // Suggest listing price: market price or +10%
    setListingPrice(item.listedPrice || Math.round(item.baseMarketPrice * 1.0));
  };

  const calculateDynamicQualityScore = (item: InventoryItem, price: number) => {
    let score = 55;
    const ratio = price / (item.baseMarketPrice || 1);
    if (ratio <= 0.9) score += 20;
    else if (ratio <= 1.0) score += 12;
    else if (ratio <= 1.1) score += 5;
    else if (ratio > 1.25) score -= 15;

    if (item.upgrades.cleaned) score += 8;
    if (item.upgrades.accessories) score += 7;
    if (item.upgrades.proPhotos) score += 10;
    if (item.upgrades.proText) score += 8;
    if (item.upgrades.promoted) score += 12;

    if (item.hasDefect && !item.upgrades.repaired) {
      score -= 25;
    }
    return Math.max(15, Math.min(99, score));
  };

  const handlePublish = () => {
    if (!selectedItem) return;
    const res = listItemForSale(selectedItem.id, listingPrice);
    if (res.success) {
      setSelectedItem(null);
      if (onNavigateToDeals) onNavigateToDeals();
    }
  };

  return (
    <div className="space-y-4 pb-24 max-w-md mx-auto px-4 pt-3">
      {/* Warehouse Status Header */}
      <div className="bg-white rounded-2xl p-4 border border-neutral-200/90 shadow-sm space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
              Склад: {currentWarehouse.name}
            </div>
            <div className="text-sm font-bold text-neutral-900 mt-0.5">
              Вместимость: {storedCount} из {currentWarehouseCapacity} мест
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs font-mono font-bold text-neutral-800">
              {Math.round((storedCount / currentWarehouseCapacity) * 100)}%
            </span>
          </div>
        </div>

        {/* Capacity Bar */}
        <div className="w-full h-2 bg-neutral-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              storedCount >= currentWarehouseCapacity ? 'bg-rose-500' : 'bg-neutral-900'
            }`}
            style={{ width: `${Math.min(100, (storedCount / currentWarehouseCapacity) * 100)}%` }}
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-1 bg-neutral-200/60 p-1 rounded-xl text-xs font-semibold">
        <button
          onClick={() => setActiveTab('warehouse')}
          className={`flex-1 py-1.5 rounded-lg transition-all ${
            activeTab === 'warehouse' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-600 hover:text-neutral-900'
          }`}
        >
          На складе ({warehouseItems.length})
        </button>
        <button
          onClick={() => setActiveTab('listed')}
          className={`flex-1 py-1.5 rounded-lg transition-all ${
            activeTab === 'listed' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-600 hover:text-neutral-900'
          }`}
        >
          В продаже ({listedItems.length})
        </button>
        <button
          onClick={() => setActiveTab('sold')}
          className={`flex-1 py-1.5 rounded-lg transition-all ${
            activeTab === 'sold' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-600 hover:text-neutral-900'
          }`}
        >
          Архив ({soldItems.length})
        </button>
      </div>

      {/* Items List */}
      <div className="space-y-3">
        {activeTab === 'warehouse' && (
          warehouseItems.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-neutral-200 p-6 space-y-2">
              <Package className="w-8 h-8 text-neutral-400 mx-auto" />
              <p className="text-sm font-semibold text-neutral-800">Склад пуст</p>
              <p className="text-xs text-neutral-500">Перейдите на рынок, чтобы найти выгодные предложения</p>
            </div>
          ) : (
            warehouseItems.map(item => (
              <div
                key={item.id}
                onClick={() => handleSelectItem(item)}
                className="bg-white rounded-2xl p-4 border border-neutral-200/90 shadow-sm hover:border-neutral-400 active:scale-[0.99] transition-all cursor-pointer space-y-3"
              >
                <div className="flex items-start gap-3">
                  {/* Thumbnail */}
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-neutral-100 shrink-0 border border-neutral-200/80">
                    <img
                      src={getItemImageUrl(item.category, item.imageUrl)}
                      alt={item.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-1.5">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 bg-neutral-100 px-1.5 py-0.2 rounded">
                          {CATEGORY_LABELS[item.category]}
                        </span>
                        <h3 className="text-xs font-bold text-neutral-950 mt-0.5 line-clamp-1">{item.title}</h3>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-xs font-extrabold text-neutral-900 font-mono">
                          {item.totalInvested.toLocaleString('ru-RU')} ₽
                        </div>
                        <div className="text-[9px] text-neutral-400">вложено</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Defect warning if unfixed */}
                {item.hasDefect && (
                  <div className="p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>Дефект: {DEFECT_DETAILS[item.defect]?.name || 'Неисправность'}</span>
                  </div>
                )}

                {/* Upgrades Applied badges */}
                <div className="flex flex-wrap gap-1 text-[10px] font-semibold text-neutral-600">
                  {item.upgrades.cleaned && <span className="bg-neutral-100 px-1.5 py-0.5 rounded">🧼 Очищен</span>}
                  {item.upgrades.accessories && <span className="bg-neutral-100 px-1.5 py-0.5 rounded">🔌 Комплект</span>}
                  {item.upgrades.repaired && <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-1.5 py-0.5 rounded">🛠️ Отремонтирован</span>}
                  {item.upgrades.proPhotos && <span className="bg-neutral-100 px-1.5 py-0.5 rounded">📸 Фото</span>}
                  {item.upgrades.proText && <span className="bg-neutral-100 px-1.5 py-0.5 rounded">✍️ Текст</span>}
                  {item.upgrades.promoted && <span className="bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.5 rounded">🚀 Турбо</span>}
                </div>

                <div className="pt-2 border-t border-neutral-100 flex items-center justify-between text-xs">
                  <span className="text-neutral-500 font-medium">Рыночная: {item.baseMarketPrice.toLocaleString('ru-RU')} ₽</span>
                  <span className="font-bold text-neutral-900 flex items-center">
                    Подготовить и продать <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </span>
                </div>
              </div>
            ))
          )
        )}

        {activeTab === 'listed' && (
          listedItems.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-neutral-200 p-6 space-y-2">
              <p className="text-sm font-semibold text-neutral-800">Нет активных объявлений</p>
              <p className="text-xs text-neutral-500">Выставите товар со склада на продажу, чтобы получать предложения</p>
            </div>
          ) : (
            listedItems.map(item => (
              <div
                key={item.id}
                className="bg-white rounded-2xl p-4 border border-neutral-200/90 shadow-sm space-y-3"
              >
                <div className="flex items-start gap-3">
                  {/* Thumbnail */}
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-neutral-100 shrink-0 border border-neutral-200/80">
                    <img
                      src={getItemImageUrl(item.category, item.imageUrl)}
                      alt={item.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-1.5">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded">
                          В продаже
                        </span>
                        <h3 className="text-xs font-bold text-neutral-950 mt-0.5 line-clamp-1">{item.title}</h3>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-sm font-extrabold text-neutral-900 font-mono">
                          {(item.listedPrice || item.baseMarketPrice).toLocaleString('ru-RU')} ₽
                        </div>
                        <div className="text-[9px] text-neutral-400">цена</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs p-2.5 bg-neutral-50 rounded-xl border border-neutral-100">
                  <div>
                    <span className="text-neutral-500">Качество объявления:</span>
                    <span className="font-bold text-neutral-900 font-mono ml-1.5">
                      {item.listingQualityScore}/100
                    </span>
                  </div>
                  <div className="font-semibold text-neutral-700">
                    Офферов: {item.buyerOffers.length}
                  </div>
                </div>

                <div className="flex items-center space-x-2 pt-1">
                  <button
                    onClick={() => delistItem(item.id)}
                    className="flex-1 py-2 rounded-xl border border-neutral-200 text-xs font-semibold text-neutral-600 hover:bg-neutral-50 transition-colors"
                  >
                    Снять с продажи
                  </button>
                  {onNavigateToDeals && (
                    <button
                      onClick={onNavigateToDeals}
                      className="flex-1 py-2 rounded-xl bg-neutral-900 text-white text-xs font-semibold hover:bg-neutral-800 transition-colors"
                    >
                      Смотреть чат ({item.buyerOffers.length})
                    </button>
                  )}
                </div>
              </div>
            ))
          )
        )}

        {activeTab === 'sold' && (
          soldItems.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-neutral-200 p-6 space-y-2">
              <p className="text-sm font-semibold text-neutral-800">Архив пуст</p>
              <p className="text-xs text-neutral-500">Здесь будут отображаться завершенные сделки с расчетом прибыли</p>
            </div>
          ) : (
            soldItems.map(item => (
              <div
                key={item.id}
                className="bg-white rounded-2xl p-4 border border-neutral-200/90 shadow-sm space-y-2"
              >
                <div className="flex items-start gap-3">
                  {/* Thumbnail */}
                  <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-neutral-100 shrink-0 border border-neutral-200/80">
                    <img
                      src={getItemImageUrl(item.category, item.imageUrl)}
                      alt={item.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-1.5">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 bg-neutral-100 px-1.5 py-0.2 rounded">
                          Продано
                        </span>
                        <h3 className="text-xs font-bold text-neutral-900 mt-0.5 line-clamp-1">{item.title}</h3>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-sm font-extrabold text-emerald-600 font-mono">
                          +{(item.profitEarned || 0).toLocaleString('ru-RU')} ₽
                        </div>
                        <div className="text-[9px] text-neutral-400">чистая маржа</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-neutral-100 text-neutral-600">
                  <div>Куплен: {item.purchasePrice.toLocaleString('ru-RU')} ₽</div>
                  <div className="text-right">Продан: {(item.soldPrice || 0).toLocaleString('ru-RU')} ₽</div>
                </div>
              </div>
            ))
          )
        )}
      </div>

      {/* Item Preparation & Listing Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden max-h-[90vh] flex flex-col animate-in slide-in-from-bottom-6">
            {/* Modal Image Header */}
            <div className="relative w-full h-40 bg-neutral-100 overflow-hidden shrink-0">
              <img
                src={getItemImageUrl(selectedItem.category, selectedItem.imageUrl)}
                alt={selectedItem.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/25" />
              <button
                onClick={() => setSelectedItem(null)}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-xs transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="absolute bottom-3 left-4 right-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 bg-black/40 backdrop-blur-xs px-2 py-0.5 rounded">
                  {CATEGORY_LABELS[selectedItem.category]} • Подготовка
                </span>
                <h3 className="text-base font-bold text-white leading-tight mt-1 drop-shadow-xs">
                  {selectedItem.title}
                </h3>
              </div>
            </div>

            {/* Content */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs text-neutral-800 flex-1">
              {/* Financial Summary */}
              <div className="p-3.5 bg-neutral-50 rounded-xl border border-neutral-200 grid grid-cols-2 gap-2">
                <div>
                  <div className="text-neutral-500 text-[11px]">Цена покупки:</div>
                  <div className="font-bold font-mono text-neutral-900 text-sm">
                    {selectedItem.purchasePrice.toLocaleString('ru-RU')} ₽
                  </div>
                </div>
                <div>
                  <div className="text-neutral-500 text-[11px]">Всего вложено:</div>
                  <div className="font-bold font-mono text-neutral-900 text-sm">
                    {selectedItem.totalInvested.toLocaleString('ru-RU')} ₽
                  </div>
                </div>
              </div>

              {/* Defect Alert & Repair */}
              {selectedItem.hasDefect && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 space-y-2">
                  <div className="flex items-center space-x-2 text-rose-800 font-bold">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Обнаружен дефект: {DEFECT_DETAILS[selectedItem.defect]?.name}</span>
                  </div>
                  <p className="text-[11px] text-rose-700">
                    {DEFECT_DETAILS[selectedItem.defect]?.desc}. Неисправный товар снизит оценку объявления и вызовет претензии покупателя!
                  </p>
                  <button
                    onClick={() => {
                      upgradeInventoryItem(selectedItem.id, 'repaired');
                      const updated = inventory.find(i => i.id === selectedItem.id);
                      if (updated) setSelectedItem(updated);
                    }}
                    className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-xs flex items-center justify-center space-x-1 transition-colors"
                  >
                    <Wrench className="w-3.5 h-3.5" />
                    <span>
                      Отремонтировать (
                      {hiredStaff.repairMaster
                        ? `${Math.round(selectedItem.repairCost * 0.5)} ₽ со скидкой мастера`
                        : `${selectedItem.repairCost} ₽`}
                      )
                    </span>
                  </button>
                </div>
              )}

              {/* Upgrades Checklist */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-600">
                  Улучшения и маркетинг
                </span>

                <div className="space-y-1.5">
                  {/* Cleaning */}
                  <div className="flex items-center justify-between p-2.5 rounded-xl border border-neutral-200 bg-white">
                    <div className="flex items-center space-x-2">
                      <Sparkles className="w-4 h-4 text-neutral-600" />
                      <div>
                        <div className="font-semibold text-neutral-900">Очистка и полировка</div>
                        <div className="text-[10px] text-neutral-500">+8 к качеству объявления</div>
                      </div>
                    </div>
                    {selectedItem.upgrades.cleaned ? (
                      <span className="text-emerald-600 font-bold text-xs flex items-center">
                        <Check className="w-3.5 h-3.5 mr-0.5" /> Готово
                      </span>
                    ) : (
                      <button
                        onClick={() => {
                          upgradeInventoryItem(selectedItem.id, 'cleaned');
                          const updated = inventory.find(i => i.id === selectedItem.id);
                          if (updated) setSelectedItem(updated);
                        }}
                        className="px-3 py-1 bg-neutral-900 text-white rounded-lg text-xs font-semibold hover:bg-neutral-800"
                      >
                        200 ₽
                      </button>
                    )}
                  </div>

                  {/* Accessories */}
                  <div className="flex items-center justify-between p-2.5 rounded-xl border border-neutral-200 bg-white">
                    <div className="flex items-center space-x-2">
                      <Layers className="w-4 h-4 text-neutral-600" />
                      <div>
                        <div className="font-semibold text-neutral-900">Новый кабель / Комплектация</div>
                        <div className="text-[10px] text-neutral-500">+7 к качеству объявления</div>
                      </div>
                    </div>
                    {selectedItem.upgrades.accessories ? (
                      <span className="text-emerald-600 font-bold text-xs flex items-center">
                        <Check className="w-3.5 h-3.5 mr-0.5" /> Готово
                      </span>
                    ) : (
                      <button
                        onClick={() => {
                          upgradeInventoryItem(selectedItem.id, 'accessories');
                          const updated = inventory.find(i => i.id === selectedItem.id);
                          if (updated) setSelectedItem(updated);
                        }}
                        className="px-3 py-1 bg-neutral-900 text-white rounded-lg text-xs font-semibold hover:bg-neutral-800"
                      >
                        500 ₽
                      </button>
                    )}
                  </div>

                  {/* Pro Photos */}
                  <div className="flex items-center justify-between p-2.5 rounded-xl border border-neutral-200 bg-white">
                    <div className="flex items-center space-x-2">
                      <Camera className="w-4 h-4 text-neutral-600" />
                      <div>
                        <div className="font-semibold text-neutral-900">Студийные фотографии</div>
                        <div className="text-[10px] text-neutral-500">
                          {hiredStaff.proPhotographer ? 'Бесплатно (штатный фотограф)' : '+10 к качеству объявления'}
                        </div>
                      </div>
                    </div>
                    {selectedItem.upgrades.proPhotos ? (
                      <span className="text-emerald-600 font-bold text-xs flex items-center">
                        <Check className="w-3.5 h-3.5 mr-0.5" /> Готово
                      </span>
                    ) : (
                      <button
                        onClick={() => {
                          upgradeInventoryItem(selectedItem.id, 'proPhotos');
                          const updated = inventory.find(i => i.id === selectedItem.id);
                          if (updated) setSelectedItem(updated);
                        }}
                        className="px-3 py-1 bg-neutral-900 text-white rounded-lg text-xs font-semibold hover:bg-neutral-800"
                      >
                        {hiredStaff.proPhotographer ? 'Бесплатно' : '700 ₽'}
                      </button>
                    )}
                  </div>

                  {/* Pro Text */}
                  <div className="flex items-center justify-between p-2.5 rounded-xl border border-neutral-200 bg-white">
                    <div className="flex items-center space-x-2">
                      <FileText className="w-4 h-4 text-neutral-600" />
                      <div>
                        <div className="font-semibold text-neutral-900">Продающее описание</div>
                        <div className="text-[10px] text-neutral-500">
                          {hiredStaff.proPhotographer ? 'Бесплатно (штатный копирайтер)' : '+8 к качеству объявления'}
                        </div>
                      </div>
                    </div>
                    {selectedItem.upgrades.proText ? (
                      <span className="text-emerald-600 font-bold text-xs flex items-center">
                        <Check className="w-3.5 h-3.5 mr-0.5" /> Готово
                      </span>
                    ) : (
                      <button
                        onClick={() => {
                          upgradeInventoryItem(selectedItem.id, 'proText');
                          const updated = inventory.find(i => i.id === selectedItem.id);
                          if (updated) setSelectedItem(updated);
                        }}
                        className="px-3 py-1 bg-neutral-900 text-white rounded-lg text-xs font-semibold hover:bg-neutral-800"
                      >
                        {hiredStaff.proPhotographer ? 'Бесплатно' : '500 ₽'}
                      </button>
                    )}
                  </div>

                  {/* Promoted Boost */}
                  <div className="flex items-center justify-between p-2.5 rounded-xl border border-neutral-200 bg-white">
                    <div className="flex items-center space-x-2">
                      <Rocket className="w-4 h-4 text-neutral-600" />
                      <div>
                        <div className="font-semibold text-neutral-900">Турбо-продвижение в топ</div>
                        <div className="text-[10px] text-neutral-500">Покупатели в 2x быстрее</div>
                      </div>
                    </div>
                    {selectedItem.upgrades.promoted ? (
                      <span className="text-emerald-600 font-bold text-xs flex items-center">
                        <Check className="w-3.5 h-3.5 mr-0.5" /> Активно
                      </span>
                    ) : (
                      <button
                        onClick={() => {
                          upgradeInventoryItem(selectedItem.id, 'promoted');
                          const updated = inventory.find(i => i.id === selectedItem.id);
                          if (updated) setSelectedItem(updated);
                        }}
                        className="px-3 py-1 bg-neutral-900 text-white rounded-lg text-xs font-semibold hover:bg-neutral-800"
                      >
                        1 000 ₽
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Price Setting & Quality Score Preview */}
              <div className="space-y-3 pt-2 border-t border-neutral-200">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-700">
                    Установить цену продажи
                  </span>
                  <span className="text-[11px] text-neutral-500">
                    Рынок: {selectedItem.baseMarketPrice.toLocaleString('ru-RU')} ₽
                  </span>
                </div>

                <div className="flex items-center space-x-3">
                  <input
                    type="range"
                    min={Math.round(selectedItem.totalInvested * 0.9)}
                    max={Math.round(selectedItem.baseMarketPrice * 1.35)}
                    step="500"
                    value={listingPrice}
                    onChange={e => setListingPrice(Number(e.target.value))}
                    className="flex-1 accent-neutral-900 h-2 bg-neutral-200 rounded-lg cursor-pointer"
                  />
                  <input
                    type="number"
                    step="500"
                    value={listingPrice}
                    onChange={e => setListingPrice(Number(e.target.value))}
                    className="w-28 px-2.5 py-1.5 border border-neutral-300 rounded-lg font-mono font-bold text-xs text-right focus:outline-none focus:border-neutral-900"
                  />
                </div>

                {/* Score & Expected Profit */}
                <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-neutral-500">Оценка объявления</div>
                    <div className="text-sm font-bold text-neutral-900 font-mono">
                      {calculateDynamicQualityScore(selectedItem, listingPrice)} / 100
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-neutral-500">Ожидаемая прибыль</div>
                    <div
                      className={`text-sm font-bold font-mono ${
                        listingPrice - selectedItem.totalInvested >= 0 ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {listingPrice - selectedItem.totalInvested >= 0 ? '+' : ''}
                      {(listingPrice - selectedItem.totalInvested).toLocaleString('ru-RU')} ₽
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer / Publish Button */}
            <div className="p-4 border-t border-neutral-100 bg-neutral-50">
              <button
                onClick={handlePublish}
                className="w-full py-3 rounded-xl bg-neutral-900 text-white font-bold text-xs hover:bg-neutral-800 active:scale-[0.98] transition-all flex items-center justify-center space-x-1.5 shadow-sm"
              >
                <span>Опубликовать объявление за {listingPrice.toLocaleString('ru-RU')} ₽</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
