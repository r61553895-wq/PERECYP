export type ItemCategory =
  | 'smartphones'
  | 'laptops'
  | 'consoles'
  | 'gpus'
  | 'audio'
  | 'cameras'
  | 'watches'
  | 'appliances'
  | 'collectibles';

export type ItemCondition = 'perfect' | 'good' | 'fair' | 'defect';

export type DefectType =
  | 'none'
  | 'battery'
  | 'screen_crack'
  | 'fake_parts'
  | 'overheating'
  | 'banned_imei'
  | 'water_damage'
  | 'drift';

export type MarketDemand = 'low' | 'medium' | 'high' | 'viral';
export type MarketRisk = 'low' | 'medium' | 'high';
export type SaleSpeed = 'instant' | 'fast' | 'normal' | 'slow';
export type RarityTier = 'common' | 'uncommon' | 'rare' | 'legendary';

export type InspectionTier = 'none' | 'quick' | 'accurate' | 'expert';

export interface MarketItem {
  id: string;
  title: string;
  category: ItemCategory;
  condition: ItemCondition;
  description: string;
  sellerStory: string;
  sellerName: string;
  baseMarketPrice: number;
  askingPrice: number;
  estimatedProfit: number;
  demand: MarketDemand;
  risk: MarketRisk;
  saleSpeed: SaleSpeed;
  rarity: RarityTier;
  hasDefect: boolean;
  defect: DefectType;
  defectSeverity: number; // percentage penalty to sale price if unfixed (0.1 - 0.5)
  repairCost: number;
  inspected: InspectionTier;
  discoveredDefect: boolean;
  photoQuality: 'poor' | 'medium' | 'good';
  imageUrl?: string;
  createdAt: number;
}

export interface ItemUpgrades {
  cleaned: boolean; // 200 ₽
  accessories: boolean; // 500 ₽
  repaired: boolean;
  proPhotos: boolean; // 700 ₽
  proText: boolean; // 500 ₽
  promoted: boolean; // 1 000 ₽
}

export interface InventoryItem extends MarketItem {
  purchasePrice: number;
  inspectionCostPaid: number;
  upgrades: ItemUpgrades;
  totalInvested: number;
  status: 'in_inventory' | 'listed' | 'sold';
  listedPrice?: number;
  listingQualityScore?: number;
  listedAt?: number;
  buyerOffers: BuyerOffer[];
  soldPrice?: number;
  soldAt?: number;
  profitEarned?: number;
}

export type BuyerPersonality =
  | 'normal'
  | 'bargainer'
  | 'urgent'
  | 'flipper'
  | 'collector';

export interface BuyerOffer {
  id: string;
  buyerName: string;
  personality: BuyerPersonality;
  offeredPrice: number;
  message: string;
  patience: number; // max negotiations remaining
  minAcceptablePrice: number; // lowest seller price buyer would accept
  status: 'pending' | 'accepted' | 'rejected' | 'countered';
  createdAt: number;
}

export interface BuyerReview {
  id: string;
  buyerName: string;
  itemTitle: string;
  rating: number; // 1 to 5
  comment: string;
  profit: number;
  date: string;
}

export interface SkillDefinition {
  id: string;
  name: string;
  desc: string;
  maxLevel: number;
  currentLevel: number;
  costPerLevel: number;
}

export interface BusinessStaff {
  buyerManager: boolean; // 15 000 ₽
  repairMaster: boolean; // 25 000 ₽
  proPhotographer: boolean; // 18 000 ₽
  salesManager: boolean; // 35 000 ₽
}

export interface BusinessWarehouse {
  tier: number; // 0, 1, 2, 3, 4
  name: string;
  capacity: number;
  costToUpgrade: number;
}

export interface PromoCode {
  code: string;
  rewardType: 'money' | 'xp' | 'rep' | 'item';
  rewardValue: number | string;
  description: string;
  maxUses: number;
  usedCount: number;
  isCustom?: boolean;
}

export interface MarketNews {
  id: string;
  title: string;
  description: string;
  categoryAffected: ItemCategory | 'all';
  priceMultiplier: number;
  durationMinutes: number;
  timestamp: number;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  current: number;
  target: number;
  rewardMoney: number;
  rewardXp: number;
  completed: boolean;
  claimed: boolean;
}

export interface FloatingNotification {
  id: string;
  text: string;
  type: 'profit' | 'loss' | 'neutral' | 'event';
}
