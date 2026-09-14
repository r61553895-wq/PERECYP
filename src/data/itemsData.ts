import { DefectType, ItemCategory, ItemCondition, MarketDemand, MarketItem, MarketRisk, RarityTier, SaleSpeed } from '../types';

export interface ItemBlueprint {
  title: string;
  category: ItemCategory;
  baseMarketPrice: number;
  minPriceVariance: number; // e.g. 0.78 (-22% realistic discount)
  maxPriceVariance: number; // e.g. 0.94
  rarity: RarityTier;
  demand: MarketDemand;
  risk: MarketRisk;
  possibleDefects: DefectType[];
  photoQualities: ('poor' | 'medium' | 'good')[];
  imageUrl: string;
  stories: string[];
}

export const CATEGORY_FALLBACK_IMAGES: Record<ItemCategory, string> = {
  smartphones: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=600&q=80',
  laptops: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=600&q=80',
  consoles: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&w=600&q=80',
  gpus: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=600&q=80',
  audio: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80',
  cameras: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=600&q=80',
  watches: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=600&q=80',
  appliances: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=80',
  collectibles: 'https://images.unsplash.com/photo-1531525645387-7f14be1bdbbd?auto=format&fit=crop&w=600&q=80',
};

export function getItemImageUrl(
  categoryOrItem: ItemCategory | { category?: ItemCategory; imageUrl?: string; title?: string },
  explicitUrl?: string
): string {
  if (typeof categoryOrItem === 'object') {
    if (categoryOrItem.imageUrl && categoryOrItem.imageUrl.startsWith('http')) {
      return categoryOrItem.imageUrl;
    }
    if (categoryOrItem.category && CATEGORY_FALLBACK_IMAGES[categoryOrItem.category]) {
      return CATEGORY_FALLBACK_IMAGES[categoryOrItem.category];
    }
    return CATEGORY_FALLBACK_IMAGES.smartphones;
  }

  if (explicitUrl && explicitUrl.startsWith('http')) {
    return explicitUrl;
  }
  if (categoryOrItem && CATEGORY_FALLBACK_IMAGES[categoryOrItem]) {
    return CATEGORY_FALLBACK_IMAGES[categoryOrItem];
  }
  return CATEGORY_FALLBACK_IMAGES.smartphones;
}

export const ITEM_BLUEPRINTS: ItemBlueprint[] = [
  // СМАРТФОНЫ
  {
    title: 'Apple iPhone 11 64GB',
    category: 'smartphones',
    baseMarketPrice: 21000,
    minPriceVariance: 0.78,
    maxPriceVariance: 0.94,
    rarity: 'common',
    demand: 'high',
    risk: 'low',
    possibleDefects: ['battery', 'screen_crack', 'fake_parts'],
    photoQualities: ['poor', 'medium'],
    imageUrl: 'https://images.unsplash.com/photo-1574755393849-623942496936?auto=format&fit=crop&w=600&q=80',
    stories: [
      'Купил 15-й, старый отдаю недорого. Всё работает, но батарею лучше заменить.',
      'Телефон девушки, всегда в чехле. Продажа в связи с обновлением.',
      'Срочно нужны деньги на сессию. Быстрым уступлю символически.',
    ],
  },
  {
    title: 'Apple iPhone 13 128GB',
    category: 'smartphones',
    baseMarketPrice: 42000,
    minPriceVariance: 0.80,
    maxPriceVariance: 0.94,
    rarity: 'common',
    demand: 'high',
    risk: 'low',
    possibleDefects: ['screen_crack', 'battery', 'banned_imei'],
    photoQualities: ['medium', 'good'],
    imageUrl: 'https://images.unsplash.com/photo-1632661674596-df8be070a5c5?auto=format&fit=crop&w=600&q=80',
    stories: [
      'Отличное состояние, Face ID и True Tone на месте. Коробка утеряна при переезде.',
      'Срочная продажа, улетаю в командировку через два дня.',
      'Покупался в М.Видео год назад. Чек сохранился.',
    ],
  },
  {
    title: 'Apple iPhone 14 Pro 128GB',
    category: 'smartphones',
    baseMarketPrice: 68000,
    minPriceVariance: 0.82,
    maxPriceVariance: 0.95,
    rarity: 'uncommon',
    demand: 'high',
    risk: 'medium',
    possibleDefects: ['fake_parts', 'screen_crack', 'water_damage'],
    photoQualities: ['medium', 'good'],
    imageUrl: 'https://images.unsplash.com/photo-1663499482523-1c0c1bae4ce1?auto=format&fit=crop&w=600&q=80',
    stories: [
      'Темно-фиолетовый. Батарея 89%. Не вскрывался, любые проверки на месте.',
      'Подарили, но привык к Андроиду. Лежит без дела уже месяц.',
    ],
  },
  {
    title: 'Apple iPhone 15 Pro Max 256GB',
    category: 'smartphones',
    baseMarketPrice: 105000,
    minPriceVariance: 0.84,
    maxPriceVariance: 0.96,
    rarity: 'rare',
    demand: 'viral',
    risk: 'medium',
    possibleDefects: ['banned_imei', 'fake_parts'],
    photoQualities: ['good'],
    imageUrl: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=600&q=80',
    stories: [
      'Титановый корпус. Полный комплект, идеальное состояние. Нужен нал на авто.',
      'Привезен из Дубая, сим + есим. Практически новый.',
    ],
  },
  {
    title: 'Samsung Galaxy S23 Ultra 256GB',
    category: 'smartphones',
    baseMarketPrice: 64000,
    minPriceVariance: 0.80,
    maxPriceVariance: 0.94,
    rarity: 'uncommon',
    demand: 'high',
    risk: 'medium',
    possibleDefects: ['screen_crack', 'battery'],
    photoQualities: ['medium', 'good'],
    imageUrl: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=600&q=80',
    stories: [
      'Камера 200Мп — пушка. Продаю в связи с переходом на Fold.',
      'Рабочий флагман, мелкие потертости на рамке от чехла.',
    ],
  },
  {
    title: 'Google Pixel 8 Pro 128GB',
    category: 'smartphones',
    baseMarketPrice: 58000,
    minPriceVariance: 0.81,
    maxPriceVariance: 0.93,
    rarity: 'uncommon',
    demand: 'medium',
    risk: 'low',
    possibleDefects: ['battery', 'overheating'],
    photoQualities: ['medium', 'good'],
    imageUrl: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=600&q=80',
    stories: [
      'Чистый Android и потрясающие фото. Продаю, так как подарили другой смартфон.',
    ],
  },

  // НОУТБУКИ
  {
    title: 'Apple MacBook Air M1 8/256GB',
    category: 'laptops',
    baseMarketPrice: 54000,
    minPriceVariance: 0.80,
    maxPriceVariance: 0.94,
    rarity: 'common',
    demand: 'high',
    risk: 'low',
    possibleDefects: ['battery', 'screen_crack', 'water_damage'],
    photoQualities: ['medium', 'good'],
    imageUrl: 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?auto=format&fit=crop&w=600&q=80',
    stories: [
      'Батарея 86 циклов, использовался только для веб-серфинга дома.',
      'Студенческий макбук, сдал диплом — продаю за ненадобностью.',
      'Срочно закрываю долг по кредитке, поэтому цена снижена.',
    ],
  },
  {
    title: 'Apple MacBook Pro 14 M2 Pro 16/512GB',
    category: 'laptops',
    baseMarketPrice: 135000,
    minPriceVariance: 0.83,
    maxPriceVariance: 0.95,
    rarity: 'rare',
    demand: 'high',
    risk: 'medium',
    possibleDefects: ['water_damage', 'fake_parts'],
    photoQualities: ['good'],
    imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=600&q=80',
    stories: [
      'Использовался дизайнером в студии. Идеальное состояние, дисплей Liquid Retina XDR.',
      'Переход на стационарный Mac Studio. Полный комплект с оригинальной зарядкой MagSafe.',
    ],
  },
  {
    title: 'Игровой ноутбук ASUS ROG Zephyrus G14',
    category: 'laptops',
    baseMarketPrice: 88000,
    minPriceVariance: 0.80,
    maxPriceVariance: 0.93,
    rarity: 'uncommon',
    demand: 'high',
    risk: 'medium',
    possibleDefects: ['overheating', 'battery'],
    photoQualities: ['medium'],
    imageUrl: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=600&q=80',
    stories: [
      'RTX 4060, Ryzen 7. Тянет Cyberpunk на ультрах. Причина продажи: нет времени играть.',
      'Компактный зверь. Не шумит в офисных задачах. Коробка есть.',
    ],
  },
  {
    title: 'Lenovo ThinkPad X1 Carbon Gen 9',
    category: 'laptops',
    baseMarketPrice: 62000,
    minPriceVariance: 0.79,
    maxPriceVariance: 0.92,
    rarity: 'uncommon',
    demand: 'medium',
    risk: 'low',
    possibleDefects: ['battery'],
    photoQualities: ['poor', 'medium'],
    imageUrl: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=600&q=80',
    stories: [
      'Корпоративный ноутбук после апгрейда офиса. Неубиваемый карбоновый корпус.',
    ],
  },

  // ИГРОВЫЕ ПРИСТАВКИ
  {
    title: 'Sony PlayStation 5 Slim 1TB с дисководом',
    category: 'consoles',
    baseMarketPrice: 48000,
    minPriceVariance: 0.82,
    maxPriceVariance: 0.95,
    rarity: 'common',
    demand: 'viral',
    risk: 'low',
    possibleDefects: ['drift', 'overheating', 'banned_imei'],
    photoQualities: ['medium', 'good'],
    imageUrl: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&w=600&q=80',
    stories: [
      'Купили ребенку на Новый год, поиграл месяц в Spider-Man и забросил.',
      'Ревизия 3-я (тихая). Комплект: консоль, геймпад DualSense, провода.',
      'Срочно отдаю, нужны деньги до вечера.',
    ],
  },
  {
    title: 'Nintendo Switch OLED 64GB White',
    category: 'consoles',
    baseMarketPrice: 24000,
    minPriceVariance: 0.80,
    maxPriceVariance: 0.93,
    rarity: 'common',
    demand: 'high',
    risk: 'low',
    possibleDefects: ['drift', 'screen_crack', 'battery'],
    photoQualities: ['medium', 'good'],
    imageUrl: 'https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?auto=format&fit=crop&w=600&q=80',
    stories: [
      'Шикарный OLED экран. Брал в отпуск на море, теперь лежит на полке.',
      'С защитным стеклом с первого дня. Чехол в подарок.',
    ],
  },
  {
    title: 'Steam Deck OLED 512GB',
    category: 'consoles',
    baseMarketPrice: 56000,
    minPriceVariance: 0.82,
    maxPriceVariance: 0.94,
    rarity: 'uncommon',
    demand: 'high',
    risk: 'low',
    possibleDefects: ['drift', 'battery'],
    photoQualities: ['good'],
    imageUrl: 'https://images.unsplash.com/photo-1612287233207-6f96f9bf35a4?auto=format&fit=crop&w=600&q=80',
    stories: [
      'Новая OLED версия на 90Hz. Идеальное состояние, оригинальный жесткий кейс.',
    ],
  },
  {
    title: 'Xbox Series X 1TB Black',
    category: 'consoles',
    baseMarketPrice: 43000,
    minPriceVariance: 0.81,
    maxPriceVariance: 0.93,
    rarity: 'common',
    demand: 'medium',
    risk: 'low',
    possibleDefects: ['overheating', 'drift'],
    photoQualities: ['medium'],
    imageUrl: 'https://images.unsplash.com/photo-1621259182978-fbf93132d53d?auto=format&fit=crop&w=600&q=80',
    stories: [
      'Самая мощная консоль. Game Pass закончился, продаю. Без пыли, пломбы целые.',
    ],
  },

  // ВИДЕОКАРТЫ
  {
    title: 'NVIDIA GeForce RTX 3060 Ti 8GB',
    category: 'gpus',
    baseMarketPrice: 28000,
    minPriceVariance: 0.79,
    maxPriceVariance: 0.93,
    rarity: 'common',
    demand: 'high',
    risk: 'medium',
    possibleDefects: ['overheating', 'fake_parts'],
    photoQualities: ['poor', 'medium'],
    imageUrl: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=600&q=80',
    stories: [
      'Стояла в домашнем ПК. В майнинге не участвовала (любые тесты FurMark).',
      'Продаю в связи с покупкой 4070. Термопаста свежая Arctic MX-4.',
    ],
  },
  {
    title: 'NVIDIA GeForce RTX 4070 Super 12GB',
    category: 'gpus',
    baseMarketPrice: 66000,
    minPriceVariance: 0.83,
    maxPriceVariance: 0.95,
    rarity: 'uncommon',
    demand: 'high',
    risk: 'low',
    possibleDefects: ['overheating'],
    photoQualities: ['good'],
    imageUrl: 'https://images.unsplash.com/photo-1591488320449-011701bb6704?auto=format&fit=crop&w=600&q=80',
    stories: [
      'Покупалась три месяца назад, гарантия ДНС еще 2.5 года. Пломбы на месте.',
    ],
  },
  {
    title: 'NVIDIA GeForce RTX 4090 24GB',
    category: 'gpus',
    baseMarketPrice: 195000,
    minPriceVariance: 0.85,
    maxPriceVariance: 0.96,
    rarity: 'legendary',
    demand: 'viral',
    risk: 'high',
    possibleDefects: ['overheating', 'fake_parts'],
    photoQualities: ['good'],
    imageUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=600&q=80',
    stories: [
      'Флагман от MSI Suprim X. Использовалась для рендера 3D моделей в студии. Чек есть.',
      'Топовое исполнение. Срочная продажа инвестора проекта.',
    ],
  },

  // АУДИО / НАУШНИКИ
  {
    title: 'Apple AirPods Pro 2 Type-C (Оригинал)',
    category: 'audio',
    baseMarketPrice: 19500,
    minPriceVariance: 0.77,
    maxPriceVariance: 0.92,
    rarity: 'common',
    demand: 'viral',
    risk: 'high',
    possibleDefects: ['fake_parts', 'battery'],
    photoQualities: ['medium', 'good'],
    imageUrl: 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?auto=format&fit=crop&w=600&q=80',
    stories: [
      'Подарили на работе, не подошли амбушюры. Пробиваются на сайте Apple.',
      'Оригинал 100%, любые проверки через локатор и анимацию. Нужны деньги.',
    ],
  },
  {
    title: 'Беспроводные наушники Sony WH-1000XM5',
    category: 'audio',
    baseMarketPrice: 27000,
    minPriceVariance: 0.80,
    maxPriceVariance: 0.94,
    rarity: 'uncommon',
    demand: 'high',
    risk: 'low',
    possibleDefects: ['battery'],
    photoQualities: ['medium', 'good'],
    imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80',
    stories: [
      'Лучшее шумоподавление в классе. Полный комплект с футляром и проводами.',
    ],
  },
  {
    title: 'Marshall Major IV Black',
    category: 'audio',
    baseMarketPrice: 11500,
    minPriceVariance: 0.76,
    maxPriceVariance: 0.92,
    rarity: 'common',
    demand: 'high',
    risk: 'high',
    possibleDefects: ['fake_parts', 'battery'],
    photoQualities: ['poor', 'medium'],
    imageUrl: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=600&q=80',
    stories: [
      'Держат заряд 80 часов. Стильный ретро-дизайн, звук чистый.',
    ],
  },

  // ФОТОАППАРАТЫ
  {
    title: 'Sony Alpha A7 III Body',
    category: 'cameras',
    baseMarketPrice: 92000,
    minPriceVariance: 0.82,
    maxPriceVariance: 0.94,
    rarity: 'rare',
    demand: 'high',
    risk: 'medium',
    possibleDefects: ['screen_crack', 'water_damage'],
    photoQualities: ['good'],
    imageUrl: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=600&q=80',
    stories: [
      'Пробег затвора 24 000 кадров (ресурс 200к+). Матрица чистая без битых пикселей.',
      'Камера свадебного фотографа, переход на A7 IV. Бережная эксплуатация.',
    ],
  },
  {
    title: 'Fujifilm X-T4 Body Silver',
    category: 'cameras',
    baseMarketPrice: 84000,
    minPriceVariance: 0.81,
    maxPriceVariance: 0.93,
    rarity: 'rare',
    demand: 'medium',
    risk: 'low',
    possibleDefects: ['battery'],
    photoQualities: ['good'],
    imageUrl: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=600&q=80',
    stories: [
      'Пленочные симуляции цветов неповторимы. Корпус в идеале, использовалась для домашних фото.',
    ],
  },

  // ЧАСЫ
  {
    title: 'Apple Watch Ultra 2 49mm Titanium',
    category: 'watches',
    baseMarketPrice: 65000,
    minPriceVariance: 0.83,
    maxPriceVariance: 0.95,
    rarity: 'uncommon',
    demand: 'high',
    risk: 'low',
    possibleDefects: ['battery', 'banned_imei'],
    photoQualities: ['good'],
    imageUrl: 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&w=600&q=80',
    stories: [
      'Титановый корпус, сапфировое стекло без единой царапины. Ремешок Ocean Band.',
      'Куплены летом, АКБ 100%. Чек из restore.',
    ],
  },
  {
    title: 'Швейцарские часы Tissot PRX Powermatic 80',
    category: 'watches',
    baseMarketPrice: 52000,
    minPriceVariance: 0.80,
    maxPriceVariance: 0.93,
    rarity: 'rare',
    demand: 'medium',
    risk: 'medium',
    possibleDefects: ['fake_parts'],
    photoQualities: ['good'],
    imageUrl: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=600&q=80',
    stories: [
      'Синий вафельный циферблат. Автоподзавод на 80 часов. Все звенья браслета и коробка.',
    ],
  },

  // БЫТОВАЯ ТЕХНИКА
  {
    title: 'Беспроводной пылесос Dyson V15 Detect',
    category: 'appliances',
    baseMarketPrice: 58000,
    minPriceVariance: 0.80,
    maxPriceVariance: 0.93,
    rarity: 'uncommon',
    demand: 'high',
    risk: 'medium',
    possibleDefects: ['battery', 'fake_parts'],
    photoQualities: ['medium', 'good'],
    imageUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=80',
    stories: [
      'Лазерная подсветка пыли. Полный комплект из 7 насадок. Переезжаем за границу.',
    ],
  },
  {
    title: 'Автоматическая кофемашина DeLonghi Magnifica S',
    category: 'appliances',
    baseMarketPrice: 32000,
    minPriceVariance: 0.78,
    maxPriceVariance: 0.92,
    rarity: 'common',
    demand: 'medium',
    risk: 'low',
    possibleDefects: ['water_damage'],
    photoQualities: ['poor', 'medium'],
    imageUrl: 'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?auto=format&fit=crop&w=600&q=80',
    stories: [
      'Готовит превосходный эспрессо и капучино. Декальцинация проводилась вовремя.',
    ],
  },

  // КОЛЛЕКЦИОННОЕ / РАРИТЕТЫ
  {
    title: 'Nintendo Game Boy Color Atomic Purple (Mint)',
    category: 'collectibles',
    baseMarketPrice: 18000,
    minPriceVariance: 0.72,
    maxPriceVariance: 0.90,
    rarity: 'rare',
    demand: 'medium',
    risk: 'low',
    possibleDefects: ['screen_crack'],
    photoQualities: ['poor', 'good'],
    imageUrl: 'https://images.unsplash.com/photo-1531525645387-7f14be1bdbbd?auto=format&fit=crop&w=600&q=80',
    stories: [
      'Нашел на даче в коробке со старыми вещами. Включается, экран четкий, звук играет!',
      'Коллекционный экземпляр из Японии 1998 года. Родной корпус без желтизны.',
    ],
  },
  {
    title: 'Apple iPod Classic 7th Gen 160GB Black',
    category: 'collectibles',
    baseMarketPrice: 22000,
    minPriceVariance: 0.74,
    maxPriceVariance: 0.91,
    rarity: 'rare',
    demand: 'high',
    risk: 'medium',
    possibleDefects: ['battery'],
    photoQualities: ['medium'],
    imageUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=600&q=80',
    stories: [
      'Тот самый легендарный плеер с колесом Click Wheel. Жесткий диск без сбойных секторов.',
    ],
  },
  {
    title: 'Золотые карманные механические часы СССР 1965г',
    category: 'collectibles',
    baseMarketPrice: 75000,
    minPriceVariance: 0.70,
    maxPriceVariance: 0.88,
    rarity: 'legendary',
    demand: 'medium',
    risk: 'high',
    possibleDefects: ['fake_parts'],
    photoQualities: ['poor', 'medium'],
    imageUrl: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80',
    stories: [
      'Достались от дедушки. На ходу. Срочно нужны деньги на лечение, продаю как лом или коллекционерам.',
    ],
  },
  {
    title: 'Samsung Galaxy S24 Ultra 512GB Titanium Gray',
    category: 'smartphones',
    baseMarketPrice: 118000,
    minPriceVariance: 0.82,
    maxPriceVariance: 0.95,
    rarity: 'legendary',
    demand: 'high',
    risk: 'medium',
    possibleDefects: ['screen_crack', 'banned_imei'],
    photoQualities: ['medium', 'good'],
    imageUrl: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?auto=format&fit=crop&w=600&q=80',
    stories: [
      'Топовый флагман с титановым корпусом и стилусом S-Pen. Подарили на юбилей, привык к iOS.',
      'Официал, покупался в фирменном магазине Samsung. В защитной гидрогелевой пленке.',
    ],
  },
  {
    title: 'Apple iPhone 15 Pro Max 256GB Natural Titanium',
    category: 'smartphones',
    baseMarketPrice: 112000,
    minPriceVariance: 0.84,
    maxPriceVariance: 0.96,
    rarity: 'legendary',
    demand: 'high',
    risk: 'medium',
    possibleDefects: ['screen_crack', 'fake_parts', 'battery'],
    photoQualities: ['good'],
    imageUrl: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=600&q=80',
    stories: [
      'Самый желанный цвет года — Натуральный титан! Полный комплект, АКБ 99%, без единой царапины.',
      'Купил в Дубае месяц назад. Продаю в связи с непредвиденными расходами.',
    ],
  },
  {
    title: 'Google Pixel 8 Pro 128GB Obsidian',
    category: 'smartphones',
    baseMarketPrice: 59000,
    minPriceVariance: 0.78,
    maxPriceVariance: 0.92,
    rarity: 'uncommon',
    demand: 'medium',
    risk: 'low',
    possibleDefects: ['screen_crack'],
    photoQualities: ['medium', 'good'],
    imageUrl: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=600&q=80',
    stories: [
      'Эталонный чистый Android и лучшая камера для мобильной фотографии. Полный комплект.',
    ],
  },
  {
    title: 'Nothing Phone (2) 256GB Dark Grey',
    category: 'smartphones',
    baseMarketPrice: 43000,
    minPriceVariance: 0.76,
    maxPriceVariance: 0.90,
    rarity: 'uncommon',
    demand: 'medium',
    risk: 'low',
    possibleDefects: ['screen_crack'],
    photoQualities: ['medium'],
    imageUrl: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=600&q=80',
    stories: [
      'Дизайнерский прозрачный корпус со светодиодным интерфейсом Glyph. Очень привлекает внимание.',
    ],
  },
  {
    title: 'Apple MacBook Air 15" M2 512GB Starlight',
    category: 'laptops',
    baseMarketPrice: 105000,
    minPriceVariance: 0.80,
    maxPriceVariance: 0.94,
    rarity: 'rare',
    demand: 'high',
    risk: 'low',
    possibleDefects: ['battery', 'screen_crack'],
    photoQualities: ['good'],
    imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=600&q=80',
    stories: [
      'Большой 15-дюймовый Retina дисплей при тончайшем весе. 42 цикла зарядки, состояние витринного образца.',
    ],
  },
  {
    title: 'Apple MacBook Pro 16" M3 Max 36GB / 1TB Space Black',
    category: 'laptops',
    baseMarketPrice: 295000,
    minPriceVariance: 0.82,
    maxPriceVariance: 0.95,
    rarity: 'legendary',
    demand: 'medium',
    risk: 'medium',
    possibleDefects: ['screen_crack', 'water_damage'],
    photoQualities: ['good'],
    imageUrl: 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?auto=format&fit=crop&w=600&q=80',
    stories: [
      'Монстр производительности для 8K монтажа и 3D графики в цвете Space Black. На гарантии Apple.',
    ],
  },
  {
    title: 'ASUS ROG Zephyrus G14 OLED Ryzen 9 / RTX 4070',
    category: 'laptops',
    baseMarketPrice: 165000,
    minPriceVariance: 0.79,
    maxPriceVariance: 0.93,
    rarity: 'rare',
    demand: 'high',
    risk: 'medium',
    possibleDefects: ['overheating', 'fake_parts'],
    photoQualities: ['medium', 'good'],
    imageUrl: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=600&q=80',
    stories: [
      'Идеальный игровой ультрабук в белом корпусе. Невероятный OLED 120Hz дисплей и RTX 4070.',
    ],
  },
  {
    title: 'Steam Deck OLED 512GB Limited Edition',
    category: 'consoles',
    baseMarketPrice: 64000,
    minPriceVariance: 0.80,
    maxPriceVariance: 0.94,
    rarity: 'rare',
    demand: 'high',
    risk: 'low',
    possibleDefects: ['screen_crack', 'battery'],
    photoQualities: ['medium', 'good'],
    imageUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=600&q=80',
    stories: [
      'Новейшая ревизия с сочным 90Hz OLED экраном и улучшенным аккумулятором. Пройдена пара игр в поездках.',
    ],
  },
  {
    title: 'Sony PlayStation 5 Pro 2TB 4K 120Hz',
    category: 'consoles',
    baseMarketPrice: 89000,
    minPriceVariance: 0.83,
    maxPriceVariance: 0.96,
    rarity: 'legendary',
    demand: 'high',
    risk: 'low',
    possibleDefects: ['overheating'],
    photoQualities: ['good'],
    imageUrl: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&w=600&q=80',
    stories: [
      'Ультимативная PS5 Pro с технологией PSSR и накопителем на 2 ТБ. Привезена по предзаказу.',
    ],
  },
  {
    title: 'Nintendo Switch OLED Zelda Tears of the Kingdom',
    category: 'consoles',
    baseMarketPrice: 31000,
    minPriceVariance: 0.78,
    maxPriceVariance: 0.92,
    rarity: 'rare',
    demand: 'high',
    risk: 'low',
    possibleDefects: ['screen_crack'],
    photoQualities: ['medium', 'good'],
    imageUrl: 'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?auto=format&fit=crop&w=600&q=80',
    stories: [
      'Коллекционная лимитка с золотыми Джойконами и узорами Хайрула. Идеальное состояние.',
    ],
  },
  {
    title: 'Meta Quest 3 128GB VR Headset',
    category: 'consoles',
    baseMarketPrice: 54000,
    minPriceVariance: 0.78,
    maxPriceVariance: 0.92,
    rarity: 'uncommon',
    demand: 'high',
    risk: 'low',
    possibleDefects: ['screen_crack'],
    photoQualities: ['medium'],
    imageUrl: 'https://images.unsplash.com/photo-1622979135225-d2ba269bc1df?auto=format&fit=crop&w=600&q=80',
    stories: [
      'Шлем смешанной реальности нового поколения с цветными сквозными камерами Passthrough.',
    ],
  },
  {
    title: 'NVIDIA GeForce RTX 4090 24GB ASUS ROG Strix OC',
    category: 'gpus',
    baseMarketPrice: 215000,
    minPriceVariance: 0.82,
    maxPriceVariance: 0.95,
    rarity: 'legendary',
    demand: 'high',
    risk: 'medium',
    possibleDefects: ['overheating', 'fake_parts'],
    photoQualities: ['good'],
    imageUrl: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=600&q=80',
    stories: [
      'Король видеокарт. 24GB VRAM, массивнейший радиатор на 4 слота. В майнинге не участвовала, стояла в домашнем ПК.',
    ],
  },
  {
    title: 'NVIDIA GeForce RTX 4070 Ti Super 16GB MSI Gaming X',
    category: 'gpus',
    baseMarketPrice: 88000,
    minPriceVariance: 0.80,
    maxPriceVariance: 0.94,
    rarity: 'rare',
    demand: 'high',
    risk: 'low',
    possibleDefects: ['overheating'],
    photoQualities: ['medium', 'good'],
    imageUrl: 'https://images.unsplash.com/photo-1591488320449-011701bb6704?auto=format&fit=crop&w=600&q=80',
    stories: [
      'Обновленная ревизия с шиной 256-бит и 16 гигабайтами видеопамяти. Чек DNS, на гарантии 3 года.',
    ],
  },
  {
    title: 'Apple AirPods Max Space Gray',
    category: 'audio',
    baseMarketPrice: 49000,
    minPriceVariance: 0.77,
    maxPriceVariance: 0.92,
    rarity: 'rare',
    demand: 'high',
    risk: 'high',
    possibleDefects: ['fake_parts', 'battery'],
    photoQualities: ['medium', 'good'],
    imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80',
    stories: [
      'Премиальный алюминий и сетчатое оголовье. Пространственное аудио работает идеально. Остерегайтесь реплик!',
    ],
  },
  {
    title: 'Marshall Stanmore III Bluetooth Speaker Black',
    category: 'audio',
    baseMarketPrice: 35000,
    minPriceVariance: 0.76,
    maxPriceVariance: 0.91,
    rarity: 'uncommon',
    demand: 'high',
    risk: 'low',
    possibleDefects: ['fake_parts'],
    photoQualities: ['medium', 'good'],
    imageUrl: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=600&q=80',
    stories: [
      'Винтажный британский рок-н-ролльный дизайн, латунные тумблеры и мощный глубокий бас.',
    ],
  },
  {
    title: 'DJI Mini 4 Pro Fly More Combo RC 2',
    category: 'cameras',
    baseMarketPrice: 89000,
    minPriceVariance: 0.81,
    maxPriceVariance: 0.94,
    rarity: 'rare',
    demand: 'high',
    risk: 'low',
    possibleDefects: ['screen_crack'],
    photoQualities: ['good'],
    imageUrl: 'https://images.unsplash.com/photo-1527977966376-1c8408f9f108?auto=format&fit=crop&w=600&q=80',
    stories: [
      'Компактный квадрокоптер до 249г со всенаправленными сенсорами препятствий и пультом с ярким экраном.',
    ],
  },
  {
    title: 'Sony A7 IV Body (Alpha 7 Mark 4) 33MP',
    category: 'cameras',
    baseMarketPrice: 195000,
    minPriceVariance: 0.82,
    maxPriceVariance: 0.95,
    rarity: 'legendary',
    demand: 'high',
    risk: 'medium',
    possibleDefects: ['screen_crack', 'fake_parts'],
    photoQualities: ['good'],
    imageUrl: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=600&q=80',
    stories: [
      'Золотой стандарт коммерческого фото и видео. Пробег затвора всего 14 тысяч кадров.',
    ],
  },
  {
    title: 'Apple Watch Ultra 2 49mm Titanium Ocean Band',
    category: 'watches',
    baseMarketPrice: 78000,
    minPriceVariance: 0.80,
    maxPriceVariance: 0.94,
    rarity: 'rare',
    demand: 'high',
    risk: 'medium',
    possibleDefects: ['battery', 'screen_crack', 'banned_imei'],
    photoQualities: ['good'],
    imageUrl: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=600&q=80',
    stories: [
      'Титановый неубиваемый корпус, яркость экрана 3000 нит и сапфировое стекло. Комплектный оранжевый ремешок.',
    ],
  },
  {
    title: 'Швейцарские часы Omega Seamaster Diver 300M',
    category: 'watches',
    baseMarketPrice: 350000,
    minPriceVariance: 0.72,
    maxPriceVariance: 0.89,
    rarity: 'legendary',
    demand: 'medium',
    risk: 'high',
    possibleDefects: ['fake_parts'],
    photoQualities: ['poor', 'good'],
    imageUrl: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=600&q=80',
    stories: [
      'Культовые часы Джеймса Бонда с керамическим циферблатом "волна" и гелиевым клапаном. Проверка в ломбарде приветствуется.',
    ],
  },
  {
    title: 'Sony Walkman WM-D6C Pro Cassette Player 1984',
    category: 'collectibles',
    baseMarketPrice: 68000,
    minPriceVariance: 0.72,
    maxPriceVariance: 0.90,
    rarity: 'legendary',
    demand: 'medium',
    risk: 'low',
    possibleDefects: ['battery'],
    photoQualities: ['medium', 'good'],
    imageUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=600&q=80',
    stories: [
      'Легендарный репортерский кассетник высочайшего Hi-Fi класса. Прямой привод, новые пассики, идеальный звук.',
    ],
  },
  {
    title: 'Оригинальный виниловый проигрыватель Technics SL-1200MK2',
    category: 'collectibles',
    baseMarketPrice: 95000,
    minPriceVariance: 0.75,
    maxPriceVariance: 0.92,
    rarity: 'legendary',
    demand: 'high',
    risk: 'medium',
    possibleDefects: ['fake_parts'],
    photoQualities: ['poor', 'good'],
    imageUrl: 'https://images.unsplash.com/photo-1539185441755-769473a23570?auto=format&fit=crop&w=600&q=80',
    stories: [
      'Икона клубной культуры и аудиофилов всего мира. Прямой кварцевый привод, Made in Japan.',
    ],
  },
];

export const SELLER_NAMES = [
  'Алексей',
  'Михаил К.',
  'Дмитрий В.',
  'Екатерина',
  'Сергей П.',
  'Артем Студент',
  'Иван М.',
  'Максим',
  'Анна',
  'Владислав',
  'Денис Т.',
  'Ольга Р.',
  'Никита',
  'Роман Б.',
];

export const DEFECT_DETAILS: Record<DefectType, { name: string; desc: string; severity: number; repairCostCoeff: number }> = {
  none: { name: 'Без дефектов', desc: 'Технически полностью исправен', severity: 0, repairCostCoeff: 0 },
  battery: { name: 'Износ аккумулятора', desc: 'Емкость АКБ ниже 75%, требует частой подзарядки', severity: 0.18, repairCostCoeff: 0.09 },
  screen_crack: { name: 'Скол / Трещина экрана', desc: 'Заметный дефект защитного стекла или матрицы', severity: 0.32, repairCostCoeff: 0.18 },
  fake_parts: { name: 'Неоригинальные запчасти', desc: 'Установлен дешевый китайский дубликат', severity: 0.36, repairCostCoeff: 0.22 },
  overheating: { name: 'Перегрев / Троттлинг', desc: 'Высокие температуры под нагрузкой, шум кулеров', severity: 0.25, repairCostCoeff: 0.12 },
  banned_imei: { name: 'Блокировка / Привязка', desc: 'Проблемы с оператором или активацией', severity: 0.50, repairCostCoeff: 0.30 },
  water_damage: { name: 'Следы попадания влаги', desc: 'Окисление контактов внутри корпуса', severity: 0.40, repairCostCoeff: 0.25 },
  drift: { name: 'Дрифт аналоговых стиков', desc: 'Стики отклоняются без касания', severity: 0.20, repairCostCoeff: 0.08 },
};

export const CATEGORY_LABELS: Record<ItemCategory, string> = {
  smartphones: 'Смартфоны',
  laptops: 'Ноутбуки',
  consoles: 'Приставки',
  gpus: 'Видеокарты',
  audio: 'Аудио',
  cameras: 'Фотокамеры',
  watches: 'Часы',
  appliances: 'Техника',
  collectibles: 'Раритеты',
};

/**
 * Generate a randomized market item from blueprint
 */
export function generateMarketItem(forcedRarity?: RarityTier): MarketItem {
  let pool = ITEM_BLUEPRINTS;
  if (forcedRarity) {
    const matched = ITEM_BLUEPRINTS.filter(b => b.rarity === forcedRarity);
    if (matched.length > 0) pool = matched;
  }

  const blueprint = pool[Math.floor(Math.random() * pool.length)];

  // Randomized price variance
  const variance = blueprint.minPriceVariance + Math.random() * (blueprint.maxPriceVariance - blueprint.minPriceVariance);
  // Round price to neat numbers (e.g. 27 500 or 27 000)
  const rawPrice = blueprint.baseMarketPrice * variance;
  const askingPrice = Math.round(rawPrice / 500) * 500;

  // Chance of hidden defect (28% - 48% depending on how cheap it is)
  const isSuspiciouslyCheap = variance < 0.80;
  const defectChance = isSuspiciouslyCheap ? 0.50 : 0.26;
  const hasDefect = Math.random() < defectChance && blueprint.possibleDefects.length > 0;

  let defect: DefectType = 'none';
  if (hasDefect) {
    defect = blueprint.possibleDefects[Math.floor(Math.random() * blueprint.possibleDefects.length)];
  }

  const defectMeta = DEFECT_DETAILS[defect];
  const repairCost = Math.round((blueprint.baseMarketPrice * defectMeta.repairCostCoeff) / 100) * 100;

  // Condition
  let condition: ItemCondition = 'good';
  if (hasDefect) {
    condition = Math.random() > 0.4 ? 'fair' : 'defect';
  } else if (variance > 0.9) {
    condition = 'perfect';
  } else {
    condition = Math.random() > 0.3 ? 'good' : 'fair';
  }

  const photoQuality = blueprint.photoQualities[Math.floor(Math.random() * blueprint.photoQualities.length)];
  const sellerStory = blueprint.stories[Math.floor(Math.random() * blueprint.stories.length)];
  const sellerName = SELLER_NAMES[Math.floor(Math.random() * SELLER_NAMES.length)];

  const estimatedProfit = Math.max(0, blueprint.baseMarketPrice - askingPrice);

  const saleSpeeds: SaleSpeed[] = ['fast', 'normal', 'instant', 'slow'];
  const saleSpeed = blueprint.demand === 'viral' ? 'instant' : blueprint.demand === 'high' ? 'fast' : saleSpeeds[Math.floor(Math.random() * saleSpeeds.length)];

  return {
    id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    title: blueprint.title,
    category: blueprint.category,
    condition,
    description: sellerStory,
    sellerStory,
    sellerName,
    baseMarketPrice: blueprint.baseMarketPrice,
    askingPrice,
    estimatedProfit,
    demand: blueprint.demand,
    risk: blueprint.risk,
    saleSpeed,
    rarity: blueprint.rarity,
    hasDefect,
    defect,
    defectSeverity: defectMeta.severity,
    repairCost,
    inspected: 'none',
    discoveredDefect: false,
    photoQuality,
    imageUrl: blueprint.imageUrl,
    createdAt: Date.now(),
  };
}

export function generateInitialMarketItems(count = 9): MarketItem[] {
  const items: MarketItem[] = [];
  // Ensure we have varied categories
  for (let i = 0; i < count; i++) {
    items.push(generateMarketItem());
  }
  return items;
}

// Anti-tamper: freeze blueprints to protect against console/runtime manipulation
try {
  Object.freeze(ITEM_BLUEPRINTS);
} catch {
  // Ignore in restricted environments
}
