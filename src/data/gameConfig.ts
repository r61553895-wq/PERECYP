import { BusinessStaff, BusinessWarehouse, PromoCode, Quest, SkillDefinition } from '../types';

export const PLAYER_LEVELS = [
  { level: 1, name: 'Новичок', xpRequired: 0, titleDesc: 'Первые шаги на досках объявлений' },
  { level: 2, name: 'Начинающий', xpRequired: 300, titleDesc: 'Уже отличаешь перекупа от обычного продавца' },
  { level: 3, name: 'Продавец', xpRequired: 850, titleDesc: 'Стабильные сделки и растущий баланс' },
  { level: 4, name: 'Опытный перекуп', xpRequired: 2000, titleDesc: 'Знаешь рыночные тренды и дефекты на глаз' },
  { level: 5, name: 'Профессионал', xpRequired: 4500, titleDesc: 'Собственный склад и поток клиентов' },
  { level: 6, name: 'Эксперт', xpRequired: 9500, titleDesc: 'Крупные лоты, раритеты и топ репутация' },
  { level: 7, name: 'Магнат', xpRequired: 20000, titleDesc: 'Владелец торговой сети и легенда рынка' },
];

export const INITIAL_SKILLS: SkillDefinition[] = [
  {
    id: 'negotiation',
    name: 'Мастер переговоров',
    desc: 'Покупатели сговорчивее, а скидки при торгах уменьшаются на 4% за уровень',
    maxLevel: 5,
    currentLevel: 0,
    costPerLevel: 1,
  },
  {
    id: 'marketAnalysis',
    name: 'Анализ рынка',
    desc: 'Раскрывает скрытые риски и вероятность брака до проведения платной диагностики',
    maxLevel: 5,
    currentLevel: 0,
    costPerLevel: 1,
  },
  {
    id: 'diagnostics',
    name: 'Скорость проверки',
    desc: 'Снижает стоимость всех видов диагностики на 15% за каждый уровень',
    maxLevel: 5,
    currentLevel: 0,
    costPerLevel: 1,
  },
  {
    id: 'marketing',
    name: 'Реклама и маркетинг',
    desc: 'Ускоряет появление покупателей на 20% и повышает качество объявлений',
    maxLevel: 5,
    currentLevel: 0,
    costPerLevel: 1,
  },
  {
    id: 'warehouse',
    name: 'Организация пространства',
    desc: 'Добавляет +2 дополнительных слота на текущем складе за уровень',
    maxLevel: 5,
    currentLevel: 0,
    costPerLevel: 1,
  },
  {
    id: 'eliteDeals',
    name: 'Доступ к редким товарам',
    desc: 'Повышает шанс появления флагманов, раритетов и лотов с супер-скидками',
    maxLevel: 5,
    currentLevel: 0,
    costPerLevel: 2,
  },
];

export const WAREHOUSE_TIERS: BusinessWarehouse[] = [
  { tier: 0, name: 'Домашний угол', capacity: 4, costToUpgrade: 0 },
  { tier: 1, name: 'Личный гараж', capacity: 8, costToUpgrade: 15000 },
  { tier: 2, name: 'Арендованный склад', capacity: 16, costToUpgrade: 45000 },
  { tier: 3, name: 'Сервисный центр & Шоурум', capacity: 32, costToUpgrade: 110000 },
  { tier: 4, name: 'Флагманская сеть складов', capacity: 64, costToUpgrade: 300000 },
];

export const STAFF_DEFINITIONS = [
  {
    key: 'buyerManager' as keyof BusinessStaff,
    name: 'Менеджер по закупкам',
    desc: 'Периодически находит эксклюзивные лоты со скидкой до 35% от рынка.',
    cost: 18000,
    salaryDay: 400,
  },
  {
    key: 'repairMaster' as keyof BusinessStaff,
    name: 'Мастер по ремонту',
    desc: 'Предоставляет 50% скидку на устранение любых дефектов и поломок.',
    cost: 26000,
    salaryDay: 550,
  },
  {
    key: 'proPhotographer' as keyof BusinessStaff,
    name: 'Фотограф & Копирайтер',
    desc: 'Бесплатные студийные снимки и продающий текст для всех ваших товаров.',
    cost: 22000,
    salaryDay: 450,
  },
  {
    key: 'salesManager' as keyof BusinessStaff,
    name: 'Старший продавец',
    desc: 'Увеличивает щедрость покупателей при торгах и ускоряет сделки.',
    cost: 40000,
    salaryDay: 750,
  },
];

export const INITIAL_QUESTS: Quest[] = [
  {
    id: 'q_first_deal',
    title: 'Первая сделка',
    description: 'Купите и успешно продайте любой товар с прибылью',
    current: 0,
    target: 1,
    rewardMoney: 1200,
    rewardXp: 100,
    completed: false,
    claimed: false,
  },
  {
    id: 'q_profit_10k',
    title: 'Стартовый капитал',
    description: 'Заработайте первые 10 000 ₽ чистой прибыли',
    current: 0,
    target: 10000,
    rewardMoney: 2000,
    rewardXp: 200,
    completed: false,
    claimed: false,
  },
  {
    id: 'q_phones_3',
    title: 'Мобильный эксперт',
    description: 'Продайте 3 смартфона',
    current: 0,
    target: 3,
    rewardMoney: 3500,
    rewardXp: 300,
    completed: false,
    claimed: false,
  },
  {
    id: 'q_reputation_49',
    title: 'Безупречная репутация',
    description: 'Достигните рейтинга продавца 4.9 ★ и выше',
    current: 0,
    target: 49, // 4.9 * 10
    rewardMoney: 4000,
    rewardXp: 350,
    completed: false,
    claimed: false,
  },
  {
    id: 'q_garage',
    title: 'Своё пространство',
    description: 'Улучшите склад до уровня «Личный гараж»',
    current: 0,
    target: 1,
    rewardMoney: 5000,
    rewardXp: 400,
    completed: false,
    claimed: false,
  },
  {
    id: 'q_profit_100k',
    title: 'Большая игра',
    description: 'Заработайте 100 000 ₽ совокупной прибыли',
    current: 0,
    target: 100000,
    rewardMoney: 15000,
    rewardXp: 800,
    completed: false,
    claimed: false,
  },
  {
    id: 'q_rare_deal',
    title: 'Охотник за редкостями',
    description: 'Купите и перепродайте редкий или легендарный лот',
    current: 0,
    target: 1,
    rewardMoney: 8000,
    rewardXp: 500,
    completed: false,
    claimed: false,
  },
];

export const DEFAULT_PROMO_CODES: PromoCode[] = [];

export const SAMPLE_BUYER_REVIEWS = [
  {
    id: 'rev_1',
    buyerName: 'Константин Т.',
    itemTitle: 'Apple iPhone 13 128GB',
    rating: 5,
    comment: 'Честный продавец! Смартфон ровно в том состоянии, как было указано. Проверили на месте, всё супер.',
    profit: 6500,
    date: 'Вчера',
  },
  {
    id: 'rev_2',
    buyerName: 'Елена В.',
    itemTitle: 'Sony PlayStation 5 Slim',
    rating: 5,
    comment: 'Сделка прошла быстро, комплект полный, консоль тихая. Спасибо за оперативность!',
    profit: 8200,
    date: '2 дня назад',
  },
  {
    id: 'rev_3',
    buyerName: 'Сергей',
    itemTitle: 'AirPods Pro 2',
    rating: 4,
    comment: 'Наушники оригинальные, чистый звук. Снял звезду за то, что продавец опоздал на встречу на 5 минут.',
    profit: 4100,
    date: '3 дня назад',
  },
];
