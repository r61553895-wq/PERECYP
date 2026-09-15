import { PromoCode, PromoRewardType } from '../types';

/**
 * Universal Self-Verifying Voucher System
 * 
 * Allows creating and redeeming promo codes across ANY device (tablets, phones, PCs, offline,
 * different networks or instances) without depending strictly on server connectivity.
 * 
 * Format: VK-<TYPE>-<VALUE>-<SIGNATURE>
 * Examples:
 *   VK-M-50000-XXXX   (Money 50 000 ₽)
 *   VK-XP-1000-XXXX   (XP 1000)
 *   VK-REP-5-XXXX     (Reputation +0.5)
 *   VK-ITM-SLUG-XXXX  (Item Blueprint)
 */

const VOUCHER_SALT = 'perekup_master_salt_v2_2026';

// Simple deterministic hash for tamper-proof signatures
function computeVoucherHash(payload: string): string {
  let hash = 0x811c9dc5;
  const str = payload + VOUCHER_SALT;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  const hex = (hash >>> 0).toString(16).toUpperCase().padStart(8, '0');
  return hex.substring(0, 4) + hex.substring(hex.length - 4);
}

export function generateUniversalVoucher(
  rewardType: PromoRewardType,
  rewardValue: string | number
): string {
  let typeCode = 'M';
  let valStr = String(rewardValue).trim();

  if (rewardType === 'money') {
    typeCode = 'M';
    valStr = String(Math.floor(Number(rewardValue)) || 10000);
  } else if (rewardType === 'xp') {
    typeCode = 'XP';
    valStr = String(Math.floor(Number(rewardValue)) || 500);
  } else if (rewardType === 'rep') {
    typeCode = 'REP';
    valStr = String(Number(rewardValue) || 0.5);
  } else if (rewardType === 'item') {
    typeCode = 'ITM';
    // Create slug from item name
    valStr = encodeURIComponent(String(rewardValue)).replace(/%/g, '_').substring(0, 32);
  }

  const payload = `${typeCode}-${valStr}`.toUpperCase();
  const signature = computeVoucherHash(payload);
  return `VK-${payload}-${signature}`;
}

export function parseAndValidateUniversalVoucher(rawCode: string): PromoCode | null {
  const code = rawCode.trim().toUpperCase();
  if (!code.startsWith('VK-')) {
    return null;
  }

  const parts = code.split('-');
  if (parts.length < 4) {
    return null;
  }

  const typeCode = parts[1];
  const signature = parts[parts.length - 1];
  const valParts = parts.slice(2, parts.length - 1);
  const valStr = valParts.join('-');

  const expectedPayload = `${typeCode}-${valStr}`.toUpperCase();
  const expectedSig = computeVoucherHash(expectedPayload);

  if (signature !== expectedSig) {
    return null;
  }

  let rewardType: PromoRewardType = 'money';
  let rewardValue: string | number = 50000;
  let description = 'Универсальный подарочный ключ';

  if (typeCode === 'M') {
    rewardType = 'money';
    rewardValue = Math.max(100, Math.min(10000000, Number(valStr) || 50000));
    description = `Подарок: +${rewardValue.toLocaleString('ru-RU')} ₽`;
  } else if (typeCode === 'XP') {
    rewardType = 'xp';
    rewardValue = Math.max(10, Math.min(50000, Number(valStr) || 500));
    description = `Опыт перекупщика: +${rewardValue} XP`;
  } else if (typeCode === 'REP') {
    rewardType = 'rep';
    rewardValue = Math.max(0.1, Math.min(5.0, Number(valStr) || 0.5));
    description = `Повышение репутации: +${rewardValue} ★`;
  } else if (typeCode === 'ITM') {
    rewardType = 'item';
    try {
      rewardValue = decodeURIComponent(valStr.replace(/_/g, '%'));
    } catch {
      rewardValue = valStr;
    }
    description = `Подарочный товар: ${rewardValue}`;
  }

  return {
    code,
    rewardType,
    rewardValue,
    description,
    maxUses: 1,
    usedCount: 0,
    isCustom: true,
    createdAt: Date.now(),
  };
}
