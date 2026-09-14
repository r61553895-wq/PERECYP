import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { BuyerOffer, InventoryItem } from '../types';
import {
  MessageSquare,
  Handshake,
  Check,
  X,
  Send,
  AlertCircle,
  Sparkles,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { PERSONALITY_LABELS } from '../data/buyersData';
import { CATEGORY_LABELS, getItemImageUrl } from '../data/itemsData';

interface DealsScreenProps {
  onNavigateToMarket?: () => void;
}

export const DealsScreen: React.FC<DealsScreenProps> = ({ onNavigateToMarket }) => {
  const { activeListings, acceptBuyerOffer, rejectBuyerOffer, counterBuyerOffer } = useGame();

  // Selected offer for active negotiation dialog
  const [activeChat, setActiveChat] = useState<{
    item: InventoryItem;
    offer: BuyerOffer;
  } | null>(null);

  const [counterPriceInput, setCounterPriceInput] = useState<number>(0);
  const [chatFeedback, setChatFeedback] = useState<string | null>(null);

  const handleOpenNegotiation = (item: InventoryItem, offer: BuyerOffer) => {
    setActiveChat({ item, offer });
    // Default counter-offer: midway between offer and listed price
    const listedPrice = item.listedPrice || item.baseMarketPrice;
    const midway = Math.round((offer.offeredPrice + (listedPrice - offer.offeredPrice) * 0.6) / 500) * 500;
    setCounterPriceInput(midway);
    setChatFeedback(null);
  };

  const handleAccept = (item: InventoryItem, offer: BuyerOffer) => {
    const res = acceptBuyerOffer(item.id, offer.id);
    if (res.success) {
      setActiveChat(null);
    }
  };

  const handleReject = (item: InventoryItem, offer: BuyerOffer) => {
    rejectBuyerOffer(item.id, offer.id);
    setActiveChat(null);
  };

  const handleSendCounter = () => {
    if (!activeChat) return;
    const res = counterBuyerOffer(activeChat.item.id, activeChat.offer.id, counterPriceInput);
    setChatFeedback(res.message);

    if (res.accepted) {
      // Refresh offer inside activeChat
      setTimeout(() => {
        setActiveChat(null);
      }, 1800);
    }
  };

  const totalOffersCount = activeListings.reduce((sum, i) => sum + i.buyerOffers.length, 0);

  return (
    <div className="space-y-4 pb-24 max-w-md mx-auto px-4 pt-3">
      {/* Header Info */}
      <div className="bg-white rounded-2xl p-4 border border-neutral-200/90 shadow-sm flex items-center justify-between">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Входящие отклики</div>
          <div className="text-base font-extrabold text-neutral-900 mt-0.5">
            {totalOffersCount} {totalOffersCount === 1 ? 'предложение' : totalOffersCount < 5 ? 'предложения' : 'предложений'}
          </div>
        </div>
        <div className="text-right text-xs text-neutral-500">
          Активных лотов: <span className="font-bold text-neutral-900">{activeListings.length}</span>
        </div>
      </div>

      {/* Active Listings and Buyer Offers Feed */}
      {activeListings.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-neutral-200 p-6 space-y-3">
          <Handshake className="w-9 h-9 text-neutral-400 mx-auto" />
          <h3 className="text-sm font-bold text-neutral-800">Нет активных объявлений</h3>
          <p className="text-xs text-neutral-500">
            Чтобы покупатели начали писать, приобретите товар на рынке и опубликуйте объявление.
          </p>
          {onNavigateToMarket && (
            <button
              onClick={onNavigateToMarket}
              className="mt-2 px-4 py-2.5 bg-neutral-900 text-white text-xs font-semibold rounded-xl hover:bg-neutral-800 transition-colors"
            >
              Перейти на рынок
            </button>
          )}
        </div>
      ) : (
        activeListings.map(item => {
          const offers = item.buyerOffers;

          return (
            <div
              key={item.id}
              className="bg-white rounded-2xl p-4 border border-neutral-200/90 shadow-sm space-y-3"
            >
              {/* Listing Card Header */}
              <div className="flex items-start gap-3 border-b border-neutral-100 pb-2.5">
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
                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                    {CATEGORY_LABELS[item.category]}
                  </span>
                  <h4 className="text-xs font-bold text-neutral-950 leading-tight mt-0.5 line-clamp-1">
                    {item.title}
                  </h4>
                  <div className="text-[10px] text-neutral-500 mt-0.5">
                    Вложено: {item.totalInvested.toLocaleString('ru-RU')} ₽ • В объявлении:{' '}
                    {(item.listedPrice || item.baseMarketPrice).toLocaleString('ru-RU')} ₽
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  <span className="px-2 py-0.5 rounded bg-neutral-100 text-neutral-700 text-[10px] font-mono font-bold">
                    Score: {item.listingQualityScore}/100
                  </span>
                </div>
              </div>

              {/* Offers Section */}
              {offers.length === 0 ? (
                <div className="p-4 bg-neutral-50 rounded-xl text-center space-y-1">
                  <p className="text-xs font-medium text-neutral-600">Покупатели просматривают лот...</p>
                  <p className="text-[11px] text-neutral-400">
                    Обычно первый звонок поступает в течение 10–30 секунд
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-600">
                    Предложения покупателей ({offers.length}):
                  </div>

                  {offers.map(offer => {
                    const meta = PERSONALITY_LABELS[offer.personality];
                    const profitIfSold = offer.offeredPrice - item.totalInvested;

                    return (
                      <div
                        key={offer.id}
                        className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 space-y-2.5"
                      >
                        {/* Buyer Header */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-xs text-neutral-900">{offer.buyerName}</span>
                            <span className={`text-[10px] px-1.5 py-0.2 rounded border font-semibold ${meta.tagClass}`}>
                              {meta.label}
                            </span>
                          </div>

                          <div className="text-right">
                            <div className="text-sm font-extrabold text-neutral-900 font-mono">
                              {offer.offeredPrice.toLocaleString('ru-RU')} ₽
                            </div>
                            <div
                              className={`text-[10px] font-semibold font-mono ${
                                profitIfSold >= 0 ? 'text-emerald-600' : 'text-rose-600'
                              }`}
                            >
                              {profitIfSold >= 0 ? '+' : ''}
                              {profitIfSold.toLocaleString('ru-RU')} ₽ маржи
                            </div>
                          </div>
                        </div>

                        {/* Buyer Message Bubble */}
                        <div className="text-xs text-neutral-700 bg-white p-2.5 rounded-lg border border-neutral-200/80 leading-relaxed italic">
                          «{offer.message}»
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center space-x-2 pt-1">
                          <button
                            onClick={() => handleAccept(item, offer)}
                            className="flex-1 py-2 bg-neutral-900 hover:bg-neutral-800 active:scale-95 text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-1"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Продать за {offer.offeredPrice.toLocaleString('ru-RU')} ₽</span>
                          </button>

                          <button
                            onClick={() => handleOpenNegotiation(item, offer)}
                            className="px-3 py-2 bg-white border border-neutral-300 hover:border-neutral-900 active:scale-95 text-neutral-800 rounded-lg text-xs font-semibold transition-all"
                          >
                            Торговаться
                          </button>

                          <button
                            onClick={() => handleReject(item, offer)}
                            className="p-2 text-neutral-400 hover:text-neutral-800 rounded-lg transition-colors"
                            title="Отклонить предложение"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })
      )}

      {/* Negotiation Dialog Modal */}
      {activeChat && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden max-h-[90vh] flex flex-col animate-in slide-in-from-bottom-6">
            {/* Header */}
            <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between bg-neutral-50">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full bg-neutral-200 flex items-center justify-center font-bold text-neutral-800 text-xs">
                  {activeChat.offer.buyerName[0]}
                </div>
                <div>
                  <div className="flex items-center space-x-1.5">
                    <span className="text-xs font-bold text-neutral-900">{activeChat.offer.buyerName}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded border font-semibold ${
                        PERSONALITY_LABELS[activeChat.offer.personality].tagClass
                      }`}
                    >
                      {PERSONALITY_LABELS[activeChat.offer.personality].label}
                    </span>
                  </div>
                  <div className="text-[10px] text-neutral-500">
                    Терпение покупателя: {'●'.repeat(activeChat.offer.patience)}
                    {'○'.repeat(Math.max(0, 3 - activeChat.offer.patience))}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setActiveChat(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-neutral-400 hover:text-neutral-900"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Chat Body */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1 text-xs">
              {/* Product Card Snippet */}
              <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 flex items-center justify-between gap-3">
                <div className="flex items-center space-x-2.5 min-w-0">
                  <div className="relative w-11 h-11 rounded-lg overflow-hidden bg-neutral-200 shrink-0 border border-neutral-300">
                    <img
                      src={getItemImageUrl(activeChat.item.category, activeChat.item.imageUrl)}
                      alt={activeChat.item.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-neutral-500">Товар:</span>
                    <div className="font-bold text-neutral-900 line-clamp-1">{activeChat.item.title}</div>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[10px] text-neutral-500">Ваша цена:</span>
                  <div className="font-bold font-mono text-neutral-900">
                    {(activeChat.item.listedPrice || activeChat.item.baseMarketPrice).toLocaleString('ru-RU')} ₽
                  </div>
                </div>
              </div>

              {/* Message History */}
              <div className="space-y-2 pt-1">
                {/* Buyer Message */}
                <div className="flex flex-col items-start max-w-[85%] space-y-1">
                  <span className="text-[10px] text-neutral-500 px-1">{activeChat.offer.buyerName}</span>
                  <div className="bg-neutral-100 text-neutral-900 p-3 rounded-2xl rounded-tl-sm border border-neutral-200 leading-relaxed">
                    {activeChat.offer.message}
                  </div>
                </div>

                {/* System / Feedback message if any */}
                {chatFeedback && (
                  <div className="p-2.5 rounded-xl bg-neutral-900 text-white text-[11px] font-medium text-center animate-in fade-in">
                    {chatFeedback}
                  </div>
                )}
              </div>

              {/* Negotiation Controls */}
              <div className="space-y-3 pt-3 border-t border-neutral-200">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-600">
                    Ваше контрпредложение:
                  </span>
                  <span className="font-bold font-mono text-neutral-900 text-sm">
                    {counterPriceInput.toLocaleString('ru-RU')} ₽
                  </span>
                </div>

                {/* Slider */}
                <input
                  type="range"
                  min={activeChat.offer.offeredPrice}
                  max={Math.round((activeChat.item.listedPrice || activeChat.item.baseMarketPrice) * 1.05)}
                  step="200"
                  value={counterPriceInput}
                  onChange={e => setCounterPriceInput(Number(e.target.value))}
                  className="w-full accent-neutral-900 h-2 bg-neutral-200 rounded-lg cursor-pointer"
                />

                {/* Quick adjustments */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() =>
                      setCounterPriceInput(prev =>
                        Math.min(
                          activeChat.item.listedPrice || activeChat.item.baseMarketPrice,
                          prev + 500
                        )
                      )
                    }
                    className="flex-1 py-1 rounded bg-neutral-100 text-neutral-800 font-semibold text-[11px] hover:bg-neutral-200"
                  >
                    +500 ₽
                  </button>
                  <button
                    onClick={() =>
                      setCounterPriceInput(prev =>
                        Math.min(
                          activeChat.item.listedPrice || activeChat.item.baseMarketPrice,
                          prev + 1000
                        )
                      )
                    }
                    className="flex-1 py-1 rounded bg-neutral-100 text-neutral-800 font-semibold text-[11px] hover:bg-neutral-200"
                  >
                    +1 000 ₽
                  </button>
                  <button
                    onClick={() =>
                      setCounterPriceInput(activeChat.item.listedPrice || activeChat.item.baseMarketPrice)
                    }
                    className="flex-1 py-1 rounded bg-neutral-100 text-neutral-800 font-semibold text-[11px] hover:bg-neutral-200"
                  >
                    Без торга
                  </button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-neutral-100 bg-neutral-50 flex items-center space-x-2">
              <button
                onClick={handleSendCounter}
                className="flex-1 py-2.5 rounded-xl bg-neutral-900 text-white font-bold text-xs hover:bg-neutral-800 flex items-center justify-center space-x-1.5 transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Предложить {counterPriceInput.toLocaleString('ru-RU')} ₽</span>
              </button>

              <button
                onClick={() => handleAccept(activeChat.item, activeChat.offer)}
                className="px-4 py-2.5 rounded-xl border border-neutral-300 bg-white font-semibold text-xs text-neutral-800 hover:bg-neutral-100 transition-colors"
              >
                Согласиться
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
