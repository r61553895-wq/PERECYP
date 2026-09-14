import { BuyerOffer, BuyerPersonality, InventoryItem } from '../types';

export const BUYER_NAMES = [
  'Арсений',
  'Даниил Мастер',
  'Виктор Николаевич',
  'Игорь Сергеевич',
  'Алина',
  'Руслан',
  'Тимур',
  'Константин',
  'Валерий',
  'София',
  'Григорий',
  'Ярослав',
  'Кирилл Техно',
  'Павел',
];

const MESSAGES_BY_PERSONALITY: Record<BuyerPersonality, string[]> = {
  normal: [
    'Здравствуйте! Актуально? Готов забрать за указанную сумму или с небольшой скидкой на бензин.',
    'Добрый день. Интересует ваш товар. Встретимся у метро?',
    'Приветствую! Какое состояние? Если всё как на фото, готов приобрести.',
  ],
  bargainer: [
    'Брат, приветствую! Отдай за {price} прямо сейчас с рук на руки, нал в кармане!',
    'Здравствуйте. Крайняя цена какая? За {price} заберу через 20 минут без лишних вопросов.',
    'День добрый. Скиньте до {price}, на бензин и проверку. Договорились?',
  ],
  urgent: [
    'Срочно нужен к вечеру в подарок коллеге! Готов забрать за {price}, приеду сам.',
    'Здравствуйте! Горит проект, прямо сейчас готов заказать курьера по вашей цене!',
    'Добрый вечер. Если отдадите сегодня, накину сверху, очень выручите!',
  ],
  flipper: [
    'Салют. Занимаюсь техникой, заберу за {price} без проверок и претензий.',
    'Привет. Готов забрать сегодня оптом/быстро за {price}. По рукам?',
  ],
  collector: [
    'Здравствуйте! Давно охочусь за этим экземпляром в таком сохране! Готов предложить {price}.',
    'Прекрасное состояние! Готов забрать за {price}, аккуратно упакуйте, пожалуйста.',
  ],
};

/**
 * Generate a realistic buyer offer for a listed item
 */
export function generateBuyerOffer(item: InventoryItem, sellerReputation: number): BuyerOffer {
  const listedPrice = item.listedPrice || item.baseMarketPrice;
  const quality = item.listingQualityScore || 70;

  // Determine buyer personality
  const personalities: BuyerPersonality[] = ['normal', 'bargainer', 'urgent', 'flipper'];
  if (item.rarity === 'rare' || item.rarity === 'legendary' || item.condition === 'perfect') {
    personalities.push('collector');
  }

  // Weight towards normal and bargainer
  const weights = [0.4, 0.35, 0.12, 0.1, personalities.includes('collector') ? 0.2 : 0];
  const randomRoll = Math.random();
  let selectedPersonality: BuyerPersonality = 'normal';

  let sum = 0;
  for (let i = 0; i < personalities.length; i++) {
    sum += weights[i] || 0.1;
    if (randomRoll <= sum) {
      selectedPersonality = personalities[i];
      break;
    }
  }

  // Calculate offered price depending on personality & listing quality
  let priceFactor = 0.92;
  let patience = 2;

  switch (selectedPersonality) {
    case 'bargainer':
      priceFactor = 0.70 + Math.random() * 0.12; // 70-82%
      patience = 2;
      break;
    case 'flipper':
      priceFactor = 0.60 + Math.random() * 0.12; // 60-72%
      patience = 2;
      break;
    case 'urgent':
      priceFactor = 0.94 + Math.random() * 0.06; // 94-100%
      patience = 1;
      break;
    case 'collector':
      priceFactor = 1.00 + Math.random() * 0.10; // 100-110%
      patience = 2;
      break;
    case 'normal':
    default:
      // High quality listing attracts closer to 86-93%
      const qualityBonus = (quality / 100) * 0.08;
      priceFactor = 0.82 + qualityBonus + Math.random() * 0.04;
      patience = 2;
      break;
  }

  // If item has an unfixed defect, buyers heavily penalize the offer!
  if (item.hasDefect && !item.upgrades.repaired) {
    priceFactor -= (item.defectSeverity || 0.25);
  }

  // If listed higher than 108% of real market price, buyers push back
  const priceOverhead = listedPrice / item.baseMarketPrice;
  if (priceOverhead > 1.08) {
    priceFactor *= Math.max(0.75, 1 - (priceOverhead - 1.08) * 0.6);
  }

  // Seller reputation bonus: higher reputation gives slight offer bump
  const repBonus = (sellerReputation - 4.0) * 0.02;
  priceFactor += Math.max(-0.05, repBonus);

  // Clamp priceFactor
  priceFactor = Math.max(0.45, Math.min(1.10, priceFactor));

  const rawOffer = Math.round((listedPrice * priceFactor) / 100) * 100;
  // Ensure offer doesn't exceed 110% of listed price
  const offeredPrice = Math.min(Math.round(listedPrice * 1.1), rawOffer);

  // Min acceptable price the buyer would actually agree to in counter-offers
  const minAcceptablePrice = Math.round(
    Math.min(listedPrice, offeredPrice * (1 + (patience * 0.045))) / 100
  ) * 100;

  const buyerName = BUYER_NAMES[Math.floor(Math.random() * BUYER_NAMES.length)];
  const templates = MESSAGES_BY_PERSONALITY[selectedPersonality];
  const template = templates[Math.floor(Math.random() * templates.length)];
  const message = template.replace('{price}', `${offeredPrice.toLocaleString('ru-RU')} ₽`);

  return {
    id: `offer_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    buyerName,
    personality: selectedPersonality,
    offeredPrice,
    message,
    patience,
    minAcceptablePrice,
    status: 'pending',
    createdAt: Date.now(),
  };
}

export const PERSONALITY_LABELS: Record<BuyerPersonality, { label: string; tagClass: string; hint: string }> = {
  normal: {
    label: 'Обычный',
    tagClass: 'bg-neutral-100 text-neutral-800 border-neutral-300',
    hint: 'Предлагает около рыночной стоимости, охотно идет на диалог',
  },
  bargainer: {
    label: 'Торгаш',
    tagClass: 'bg-amber-50 text-amber-800 border-amber-200',
    hint: 'Агрессивно сбивает цену, но готов торговаться несколько раундов',
  },
  urgent: {
    label: 'Срочный',
    tagClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    hint: 'Готов заплатить полную цену или даже с наценкой за быструю сделку',
  },
  flipper: {
    label: 'Перекуп',
    tagClass: 'bg-neutral-200 text-neutral-900 border-neutral-400',
    hint: 'Ищет максимальную скидку для перепродажи, сделки закрывает быстро',
  },
  collector: {
    label: 'Коллекционер',
    tagClass: 'bg-neutral-900 text-white border-neutral-700',
    hint: 'Готов щедро переплатить за редкий или безупречный экземпляр',
  },
};
