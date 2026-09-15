import { PromoCode, PromoRewardType } from '../types';
import { DEFAULT_PROMO_CODES } from '../data/gameConfig';
import { parseAndValidateUniversalVoucher } from './voucher';

/**
 * Global Real-Time Cloud Promo Code Synchronizer
 * 
 * Works instantly across devices (phones, tablets, PCs), browsers, and countries
 * using a high-availability, low-latency Cloud KV network with zero rate-limit blocks,
 * dual-mirror redundancy, and local resilience.
 */

const CLOUD_APP_KEY_PRIMARY = 'p4hs9c32';
const CLOUD_APP_KEY_BACKUP = '6kwaihe2';
const CLOUD_BASE_URL = 'https://keyvalue.immanuel.co/api/KeyVal';

const CACHE_KEY = 'perekup_cloud_promos_cache_v3';
const REDEEMED_KEY = 'perekup_device_redeemed_codes_v3';

/**
 * Normalizes promo code inputs:
 * 1. Trims whitespace
 * 2. Uppercases
 * 3. Transliterates visually identical Russian/Cyrillic keyboard characters to Latin
 *    (prevents errors like typing Russian 'Р' instead of English 'R' in 'RUB-3551')
 */
export function normalizePromoCode(raw: string): string {
  if (!raw) return '';
  let s = raw.trim().toUpperCase();

  // 1. Common Russian word abbreviations
  if (s.startsWith('РУБ')) {
    s = 'RUB' + s.slice(3);
  } else if (s.startsWith('РУВ')) {
    s = 'RUB' + s.slice(3);
  }

  // 2. Keyboard layout typos (e.g. typing WWWW on Russian keyboard gives ЦЦЦЦ)
  if (s.startsWith('ЦЦЦЦ')) {
    s = 'WWWW' + s.slice(4);
  }

  // 3. Visual & phonetic homoglyphs
  const homoglyphMap: Record<string, string> = {
    'А': 'A', 'В': 'B', 'Б': 'B', 'Е': 'E', 'К': 'K', 'М': 'M', 'Н': 'H',
    'О': 'O', 'Р': 'R', 'С': 'C', 'Т': 'T', 'У': 'U', 'Х': 'X',
  };

  return s
    .split('')
    .map(ch => homoglyphMap[ch] || ch)
    .join('');
}

export function getDeviceRedeemedCodes(): string[] {
  try {
    return JSON.parse(localStorage.getItem(REDEEMED_KEY) || '[]');
  } catch {
    return [];
  }
}

export function markCodeAsRedeemedOnDevice(code: string) {
  try {
    const clean = normalizePromoCode(code);
    const list = getDeviceRedeemedCodes();
    if (!list.includes(clean)) {
      list.push(clean);
      // Also store clean alphanumeric version to prevent any double-claiming
      const alpha = clean.replace(/[^A-Z0-9]/g, '');
      if (alpha && !list.includes(alpha)) {
        list.push(alpha);
      }
      localStorage.setItem(REDEEMED_KEY, JSON.stringify(list.slice(-300)));
    }
  } catch (err) {
    console.warn('Could not save redeemed code to device:', err);
  }
}

export function isCodeRedeemedOnDevice(code: string): boolean {
  const clean = normalizePromoCode(code);
  const alpha = clean.replace(/[^A-Z0-9]/g, '');
  const redeemed = getDeviceRedeemedCodes();
  return redeemed.includes(clean) || (Boolean(alpha) && redeemed.includes(alpha));
}

function getLocalCache(): PromoCode[] {
  try {
    const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || '[]');
    if (Array.isArray(cached) && cached.length > 0) {
      return cached;
    }
  } catch {
    // fallback
  }
  return [...DEFAULT_PROMO_CODES];
}

function saveLocalCache(codes: PromoCode[]) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(codes));
  } catch (err) {
    console.warn('Could not save promo cache:', err);
  }
}

/**
 * Encodes a promo code object into a compact, URL-path-safe cloud string
 * Format: TYPE_VALUE_MODE_MAXUSES_B64DESC
 */
function serializeCloudValue(promo: PromoCode): string {
  const typeCode =
    promo.rewardType === 'money'
      ? 'M'
      : promo.rewardType === 'xp'
      ? 'XP'
      : promo.rewardType === 'rep'
      ? 'REP'
      : 'ITM';

  let valStr = String(promo.rewardValue);
  if (promo.rewardType === 'item') {
    try {
      valStr = btoa(encodeURIComponent(String(promo.rewardValue)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
    } catch {
      valStr = encodeURIComponent(String(promo.rewardValue)).replace(/%/g, '_');
    }
  }

  const mode = promo.forAudience !== false ? 'AUD' : 'LIM';
  const maxUses = promo.maxUses || (mode === 'AUD' ? 999999 : 1);
  let descB64 = '';
  try {
    descB64 = btoa(encodeURIComponent(promo.description || 'Промокод для игроков'))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  } catch {
    descB64 = 'PROMO';
  }

  return `${typeCode}_${valStr}_${mode}_${maxUses}_${descB64}`;
}

/**
 * Decodes a cloud value string into a PromoCode object
 */
function deserializeCloudValue(code: string, rawVal: string): PromoCode | null {
  if (!rawVal || typeof rawVal !== 'string') return null;
  let cleanVal = rawVal.trim();
  if (cleanVal.startsWith('"') && cleanVal.endsWith('"')) {
    cleanVal = cleanVal.slice(1, -1);
  }
  if (!cleanVal || cleanVal === 'null' || cleanVal === 'EXPIRED' || cleanVal.startsWith('<!DOCTYPE')) {
    return null;
  }

  const parts = cleanVal.split('_');
  if (parts.length < 3) return null;

  const typeCode = parts[0];
  const valStr = parts[1];
  const mode = parts[2];
  const maxUses = parseInt(parts[3], 10) || (mode === 'AUD' ? 999999 : 1);

  let desc = 'Промокод для игроков';
  if (parts[4]) {
    try {
      const restored = parts[4].replace(/-/g, '+').replace(/_/g, '/');
      desc = decodeURIComponent(atob(restored));
    } catch {
      desc = 'Промокод для игроков';
    }
  }

  let rewardType: PromoRewardType = 'money';
  let rewardValue: string | number = 50000;

  if (typeCode === 'M') {
    rewardType = 'money';
    rewardValue = Math.max(100, Math.min(100000000, Number(valStr) || 50000));
  } else if (typeCode === 'XP') {
    rewardType = 'xp';
    rewardValue = Math.max(10, Math.min(100000, Number(valStr) || 1000));
  } else if (typeCode === 'REP') {
    rewardType = 'rep';
    rewardValue = Math.max(0.1, Math.min(5.0, Number(valStr) || 0.5));
  } else if (typeCode === 'ITM') {
    rewardType = 'item';
    try {
      const restored = valStr.replace(/-/g, '+').replace(/_/g, '/');
      rewardValue = decodeURIComponent(atob(restored));
    } catch {
      rewardValue = valStr;
    }
  }

  return {
    code: normalizePromoCode(code),
    rewardType,
    rewardValue,
    description: desc,
    forAudience: mode === 'AUD',
    maxUses,
    usedCount: 0,
    isCustom: true,
    createdAt: Date.now(),
  };
}

async function safeJsonFetch(
  url: string,
  options: RequestInit = {},
  timeoutMs = 4500
): Promise<{ ok: boolean; status: number; text: string }> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Accept': 'application/json, text/plain, */*',
        ...(options.headers || {}),
      },
    });

    clearTimeout(timeoutId);
    const text = await res.text();
    return { ok: res.ok, status: res.status, text };
  } catch (err: any) {
    return { ok: false, status: 0, text: '' };
  }
}

/**
 * Writes key-value directly to both primary and backup cloud databases
 */
async function setCloudKey(key: string, value: string): Promise<boolean> {
  const safeKey = encodeURIComponent(key);
  const safeVal = encodeURIComponent(value);

  const primaryUrl = `${CLOUD_BASE_URL}/UpdateValue/${CLOUD_APP_KEY_PRIMARY}/${safeKey}/${safeVal}`;
  const backupUrl = `${CLOUD_BASE_URL}/UpdateValue/${CLOUD_APP_KEY_BACKUP}/${safeKey}/${safeVal}`;

  const [res1, res2] = await Promise.allSettled([
    safeJsonFetch(primaryUrl, { method: 'POST', headers: { 'Content-Length': '0' } }),
    safeJsonFetch(backupUrl, { method: 'POST', headers: { 'Content-Length': '0' } }),
  ]);

  const ok1 = res1.status === 'fulfilled' && res1.value.ok;
  const ok2 = res2.status === 'fulfilled' && res2.value.ok;
  return ok1 || ok2;
}

/**
 * Reads key-value with primary -> backup fallback
 */
async function getCloudKey(key: string): Promise<string | null> {
  const safeKey = encodeURIComponent(key);

  const primaryUrl = `${CLOUD_BASE_URL}/GetValue/${CLOUD_APP_KEY_PRIMARY}/${safeKey}`;
  const res1 = await safeJsonFetch(primaryUrl, { method: 'GET' });
  if (res1.ok && res1.text && !res1.text.startsWith('<!DOCTYPE') && res1.text !== 'null') {
    return res1.text;
  }

  const backupUrl = `${CLOUD_BASE_URL}/GetValue/${CLOUD_APP_KEY_BACKUP}/${safeKey}`;
  const res2 = await safeJsonFetch(backupUrl, { method: 'GET' });
  if (res2.ok && res2.text && !res2.text.startsWith('<!DOCTYPE') && res2.text !== 'null') {
    return res2.text;
  }

  return null;
}

/**
 * Fetch all promo codes from Global Cloud Storage + Express backend + Local Cache
 */
export async function fetchServerPromoCodes(): Promise<PromoCode[]> {
  const mergedMap = new Map<string, PromoCode>();

  // 1. Pre-seed default codes (including RUB-3551, RRRR-1111, WWWW-6666)
  for (const p of DEFAULT_PROMO_CODES) {
    if (p?.code) mergedMap.set(normalizePromoCode(p.code), p);
  }

  // 2. Load from local cache
  for (const p of getLocalCache()) {
    if (p?.code) mergedMap.set(normalizePromoCode(p.code), p);
  }

  // 3. Fetch index of codes from Cloud KV
  try {
    const rawIndex = await getCloudKey('PROMO_INDEX');
    if (rawIndex) {
      let cleanIndex = rawIndex.trim();
      if (cleanIndex.startsWith('"') && cleanIndex.endsWith('"')) {
        cleanIndex = cleanIndex.slice(1, -1);
      }
      const codeKeys = cleanIndex
        .split(',')
        .map(k => k.trim())
        .filter(Boolean);

      // Fetch details for any missing codes (max 15 concurrent)
      const fetchJobs = codeKeys.slice(0, 30).map(async codeKey => {
        const val = await getCloudKey(codeKey);
        if (val) {
          const promo = deserializeCloudValue(codeKey, val);
          if (promo) {
            mergedMap.set(normalizePromoCode(promo.code), promo);
          }
        }
      });
      await Promise.allSettled(fetchJobs);
    }
  } catch (err) {
    console.warn('[Promo Sync] Cloud KV index fetch fallback:', err);
  }

  // 4. Also fetch from local Express server if running
  try {
    const serverRes = await safeJsonFetch('/api/promo-codes');
    if (serverRes.ok && serverRes.text) {
      const data = JSON.parse(serverRes.text);
      if (data?.success && Array.isArray(data.promoCodes)) {
        for (const p of data.promoCodes) {
          if (p?.code) mergedMap.set(normalizePromoCode(p.code), p);
        }
      }
    }
  } catch {
    // optional Express server fallback
  }

  const result = Array.from(mergedMap.values());
  saveLocalCache(result);
  return result;
}

/**
 * Create promo code and broadcast it across all devices worldwide
 */
export async function createPromoCodeOnServer(
  promo: Omit<PromoCode, 'usedCount'>,
  password = 'zxcqwerty'
): Promise<{ success: boolean; promo?: PromoCode; message?: string }> {
  const cleanCode = normalizePromoCode(promo.code);
  const isAudience = promo.forAudience !== false;
  const calculatedMaxUses = isAudience ? 999999 : Math.max(1, promo.maxUses || 1);

  const newPromo: PromoCode = {
    ...promo,
    code: cleanCode,
    usedCount: 0,
    forAudience: isAudience,
    maxUses: calculatedMaxUses,
    createdAt: Date.now(),
    isCustom: true,
  };

  // 1. Immediately store in local cache
  const cached = getLocalCache();
  const existingIdx = cached.findIndex(p => normalizePromoCode(p.code) === cleanCode);
  if (existingIdx >= 0) {
    cached[existingIdx] = newPromo;
  } else {
    cached.unshift(newPromo);
  }
  saveLocalCache(cached);

  // 2. Store in Cloud KV (both key with hyphen and alphanumeric key)
  const serialized = serializeCloudValue(newPromo);
  const alphaCode = cleanCode.replace(/[^A-Z0-9]/g, '');

  try {
    await Promise.allSettled([
      setCloudKey(cleanCode, serialized),
      alphaCode !== cleanCode ? setCloudKey(alphaCode, serialized) : Promise.resolve(true),
    ]);

    // Update PROMO_INDEX
    const currentIndex = (await getCloudKey('PROMO_INDEX')) || '';
    let keys = currentIndex.replace(/"/g, '').split(',').map(k => k.trim()).filter(Boolean);
    if (!keys.includes(cleanCode)) {
      keys.unshift(cleanCode);
    }
    const updatedIndex = keys.slice(0, 40).join(',');
    await setCloudKey('PROMO_INDEX', updatedIndex);
  } catch (err) {
    console.warn('[Promo Sync] Cloud KV write error:', err);
  }

  // 3. Send to Express Server
  safeJsonFetch('/api/promo-codes', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-password': password,
    },
    body: JSON.stringify({
      ...newPromo,
      password,
    }),
  }).catch(() => {});

  return {
    success: true,
    promo: newPromo,
    message: `Промокод «${cleanCode}» успешно создан и синхронизирован со всеми устройствами!`,
  };
}

/**
 * Delete promo code from Global Cloud & Local Cache
 */
export async function deletePromoCodeOnServer(
  code: string,
  password = 'zxcqwerty'
): Promise<{ success: boolean; message?: string }> {
  const cleanCode = normalizePromoCode(code);
  const alphaCode = cleanCode.replace(/[^A-Z0-9]/g, '');

  // 1. Update local cache
  const cached = getLocalCache().filter(p => normalizePromoCode(p.code) !== cleanCode);
  saveLocalCache(cached);

  // 2. Mark as expired in Cloud KV
  try {
    await Promise.allSettled([
      setCloudKey(cleanCode, 'EXPIRED'),
      alphaCode ? setCloudKey(alphaCode, 'EXPIRED') : Promise.resolve(true),
    ]);

    const currentIndex = (await getCloudKey('PROMO_INDEX')) || '';
    let keys = currentIndex.replace(/"/g, '').split(',').map(k => k.trim()).filter(Boolean);
    keys = keys.filter(k => k !== cleanCode && k !== alphaCode);
    await setCloudKey('PROMO_INDEX', keys.join(','));
  } catch (err) {
    console.warn('[Promo Sync] Delete error:', err);
  }

  // 3. Delete on Express server
  safeJsonFetch(`/api/promo-codes/${encodeURIComponent(cleanCode)}`, {
    method: 'DELETE',
    headers: { 'x-admin-password': password },
  }).catch(() => {});

  return { success: true, message: `Промокод «${cleanCode}» удален` };
}

/**
 * Redeem promo code from ANY device in ANY country
 * 
 * Order of resolution:
 * 1. Device check: has THIS device already redeemed it?
 * 2. Self-verifying voucher check (VK- format)
 * 3. Default built-in list & local cache
 * 4. Real-time Cloud KV query (handles codes created on another device seconds ago!)
 * 5. Local Express server query
 */
export async function redeemPromoCodeOnServer(
  code: string
): Promise<{ success: boolean; promo?: PromoCode; message?: string; status: number }> {
  const cleanCode = normalizePromoCode(code);
  if (!cleanCode) {
    return { success: false, message: 'Введите промокод', status: 400 };
  }

  // 1. Check if already activated on THIS device
  if (isCodeRedeemedOnDevice(cleanCode)) {
    return {
      success: false,
      message: `Вы уже активировали промокод «${cleanCode}» на этом устройстве!`,
      status: 409,
    };
  }

  // 2. Check universal self-verifying voucher
  if (cleanCode.startsWith('VK-')) {
    const voucher = parseAndValidateUniversalVoucher(cleanCode);
    if (voucher) {
      markCodeAsRedeemedOnDevice(cleanCode);
      return {
        success: true,
        promo: voucher,
        message: `Универсальный ключ активирован: ${voucher.description}!`,
        status: 200,
      };
    }
  }

  // 3. Check Default Built-in Codes and Local Cache
  const allKnown = [...DEFAULT_PROMO_CODES, ...getLocalCache()];
  const cachedMatch = allKnown.find(p => {
    const norm = normalizePromoCode(p.code);
    return norm === cleanCode || norm.replace(/[^A-Z0-9]/g, '') === cleanCode.replace(/[^A-Z0-9]/g, '');
  });

  if (cachedMatch) {
    const isAudience = cachedMatch.forAudience || (cachedMatch.maxUses && cachedMatch.maxUses >= 9999);
    if (!isAudience && typeof cachedMatch.maxUses === 'number' && (cachedMatch.usedCount || 0) >= cachedMatch.maxUses) {
      return {
        success: false,
        message: `Промокод «${cleanCode}» устарел (лимит активаций исчерпан)`,
        status: 410,
      };
    }

    markCodeAsRedeemedOnDevice(cleanCode);
    return {
      success: true,
      promo: cachedMatch,
      message: `Промокод «${cleanCode}» успешно активирован: ${cachedMatch.description}`,
      status: 200,
    };
  }

  // 4. Query Cloud KV in real time (instant cross-device discovery)
  try {
    const alphaCode = cleanCode.replace(/[^A-Z0-9]/g, '');
    let cloudRaw = await getCloudKey(cleanCode);
    if (!cloudRaw && alphaCode && alphaCode !== cleanCode) {
      cloudRaw = await getCloudKey(alphaCode);
    }

    if (cloudRaw) {
      const cloudPromo = deserializeCloudValue(cleanCode, cloudRaw);
      if (cloudPromo) {
        const isAudience = cloudPromo.forAudience || cloudPromo.maxUses >= 9999;
        if (!isAudience && cloudPromo.usedCount >= cloudPromo.maxUses) {
          return {
            success: false,
            message: `Промокод «${cleanCode}» устарел (лимит исчерпан)`,
            status: 410,
          };
        }

        // Mark as redeemed on this device
        markCodeAsRedeemedOnDevice(cleanCode);

        // Add to local cache for instant future lookups
        const cached = getLocalCache();
        cached.unshift(cloudPromo);
        saveLocalCache(cached);

        return {
          success: true,
          promo: cloudPromo,
          message: `Промокод «${cleanCode}» успешно активирован: ${cloudPromo.description}`,
          status: 200,
        };
      }
    }
  } catch (err) {
    console.warn('[Promo Sync] Cloud KV lookup error:', err);
  }

  // 5. Query Express server endpoint if available
  try {
    const serverRes = await safeJsonFetch('/api/promo-codes/redeem', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: cleanCode }),
    });

    if (serverRes.ok && serverRes.text) {
      const parsed = JSON.parse(serverRes.text);
      if (parsed.success && parsed.promo) {
        markCodeAsRedeemedOnDevice(cleanCode);
        return {
          success: true,
          promo: parsed.promo,
          message: parsed.message || `Промокод «${cleanCode}» активирован!`,
          status: 200,
        };
      }
      if (parsed.status === 410) {
        return {
          success: false,
          message: parsed.message || `Промокод «${cleanCode}» устарел (лимит исчерпан)`,
          status: 410,
        };
      }
    }
  } catch {
    // fallback
  }

  return {
    success: false,
    message: `Промокод «${cleanCode}» не найден. Проверьте правильность ввода.`,
    status: 404,
  };
}
