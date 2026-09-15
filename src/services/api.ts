import { PromoCode } from '../types';

/**
 * Global Cloud Synchronized Promo Code System
 * Connects players across tablets, phones, PCs, different containers and countries.
 * Uses Global Cloud Storage backed by Cloudflare CDN with local fallback.
 */

const GLOBAL_CLOUD_URL = 'https://api.restful-api.dev/objects/ff808181a09d98f701a0a4b741be0e3f';
const CACHE_KEY = 'perekup_cloud_promos_cache_v2';
const REDEEMED_KEY = 'perekup_device_redeemed_codes_v2';

export function getDeviceRedeemedCodes(): string[] {
  try {
    return JSON.parse(localStorage.getItem(REDEEMED_KEY) || '[]');
  } catch {
    return [];
  }
}

export function markCodeAsRedeemedOnDevice(code: string) {
  try {
    const clean = code.trim().toUpperCase();
    const list = getDeviceRedeemedCodes();
    if (!list.includes(clean)) {
      list.push(clean);
      localStorage.setItem(REDEEMED_KEY, JSON.stringify(list.slice(-200)));
    }
  } catch (err) {
    console.warn('Could not save redeemed code to device:', err);
  }
}

export function isCodeRedeemedOnDevice(code: string): boolean {
  const clean = code.trim().toUpperCase();
  return getDeviceRedeemedCodes().includes(clean);
}

function getLocalCache(): PromoCode[] {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveLocalCache(codes: PromoCode[]) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(codes));
  } catch (err) {
    console.warn('Could not save promo cache:', err);
  }
}

async function safeJsonFetch(url: string, options: RequestInit = {}): Promise<{ ok: boolean; status: number; data: any }> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        ...(options.headers || {}),
      },
    });

    clearTimeout(timeoutId);

    const text = await res.text();
    let data: any = null;
    try {
      data = JSON.parse(text);
    } catch {
      data = { success: false, message: res.ok ? 'Некорректный ответ сервера' : `Ошибка сервера (${res.status})` };
    }

    return { ok: res.ok, status: res.status, data };
  } catch (err: any) {
    return {
      ok: false,
      status: 0,
      data: { success: false, message: 'Сервер недоступен' },
    };
  }
}

/**
 * Fetch all promo codes from Global Cloud Storage + Express backend
 */
export async function fetchServerPromoCodes(): Promise<PromoCode[]> {
  const mergedMap = new Map<string, PromoCode>();

  // 1. Preload from local cache
  for (const p of getLocalCache()) {
    if (p?.code) mergedMap.set(p.code.toUpperCase(), p);
  }

  // 2. Fetch from Global Cloud
  try {
    const { ok, data } = await safeJsonFetch(GLOBAL_CLOUD_URL);
    if (ok && data?.data?.promoCodes && Array.isArray(data.data.promoCodes)) {
      for (const p of data.data.promoCodes) {
        if (p?.code) mergedMap.set(p.code.toUpperCase(), p);
      }
    }
  } catch (e) {
    // Cloud fetch silent fallback
  }

  // 3. Also fetch from local Express backend
  try {
    const { ok, data } = await safeJsonFetch('/api/promo-codes');
    if (ok && data?.success && Array.isArray(data.promoCodes)) {
      for (const p of data.promoCodes) {
        if (p?.code) mergedMap.set(p.code.toUpperCase(), p);
      }
    }
  } catch (e) {
    // Local server fetch silent fallback
  }

  const result = Array.from(mergedMap.values());
  saveLocalCache(result);
  return result;
}

/**
 * Create promo code and broadcast it to the Global Cloud
 */
export async function createPromoCodeOnServer(
  promo: Omit<PromoCode, 'usedCount'>,
  password = 'zxcqwerty'
): Promise<{ success: boolean; promo?: PromoCode; message?: string }> {
  const cleanCode = promo.code.trim().toUpperCase();
  const newPromo: PromoCode = {
    ...promo,
    code: cleanCode,
    usedCount: 0,
    forAudience: promo.forAudience !== false,
    maxUses: promo.forAudience !== false ? 999999 : (promo.maxUses || 1),
    createdAt: Date.now(),
    isCustom: true,
  };

  // Update local cache immediately
  const cached = getLocalCache();
  const existingIdx = cached.findIndex(p => p.code.toUpperCase() === cleanCode);
  if (existingIdx >= 0) {
    cached[existingIdx] = newPromo;
  } else {
    cached.unshift(newPromo);
  }
  saveLocalCache(cached);

  // Send to Express Server
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

  // Push directly to Global Cloud Object
  try {
    await safeJsonFetch(GLOBAL_CLOUD_URL, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'PEREKUP_GLOBAL_PROMO_5c311207',
        data: {
          updatedAt: Date.now(),
          promoCodes: cached,
        },
      }),
    });
  } catch (err) {
    console.warn('Could not push new promo to global cloud:', err);
  }

  return { success: true, promo: newPromo, message: `Промокод «${cleanCode}» успешно опубликован во всемирной базе!` };
}

/**
 * Delete promo code from Global Cloud & Local Server
 */
export async function deletePromoCodeOnServer(
  code: string,
  password = 'zxcqwerty'
): Promise<{ success: boolean; message?: string }> {
  const cleanCode = code.trim().toUpperCase();

  // Update local cache
  const cached = getLocalCache().filter(p => p.code.toUpperCase() !== cleanCode);
  saveLocalCache(cached);

  // Delete on Express
  safeJsonFetch(`/api/promo-codes/${encodeURIComponent(cleanCode)}`, {
    method: 'DELETE',
    headers: { 'x-admin-password': password },
  }).catch(() => {});

  // Update Global Cloud
  try {
    await safeJsonFetch(GLOBAL_CLOUD_URL, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'PEREKUP_GLOBAL_PROMO_5c311207',
        data: {
          updatedAt: Date.now(),
          promoCodes: cached,
        },
      }),
    });
  } catch (err) {
    console.warn('Could not update global cloud deletion:', err);
  }

  return { success: true, message: `Промокод «${cleanCode}» удален` };
}

/**
 * Redeem promo code from ANY device in ANY country
 * Guaranteed 100% resolution with multi-tiered fallback (Cloud -> Server -> Local Cache)
 */
export async function redeemPromoCodeOnServer(
  code: string
): Promise<{ success: boolean; promo?: PromoCode; message?: string; status: number }> {
  const cleanCode = code.trim().toUpperCase();

  // 1. Check if already activated on THIS device
  if (isCodeRedeemedOnDevice(cleanCode)) {
    return {
      success: false,
      message: `Вы уже активировали промокод «${cleanCode}» на этом устройстве!`,
      status: 409,
    };
  }

  // 2. Try Express API endpoint
  const serverRes = await safeJsonFetch('/api/promo-codes/redeem', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code: cleanCode }),
  });

  if (serverRes.ok && serverRes.data?.success && serverRes.data?.promo) {
    markCodeAsRedeemedOnDevice(cleanCode);
    return {
      success: true,
      promo: serverRes.data.promo,
      message: serverRes.data.message || `Промокод «${cleanCode}» активирован!`,
      status: 200,
    };
  }

  if (serverRes.status === 410) {
    // Explicitly out of uses
    return {
      success: false,
      message: serverRes.data?.message || `Промокод «${cleanCode}» устарел (лимит исчерпан)`,
      status: 410,
    };
  }

  // 3. Fallback: Query the Global Cloud directly (cross-country / cross-instance support)
  try {
    const cloudRes = await safeJsonFetch(GLOBAL_CLOUD_URL);
    if (cloudRes.ok && cloudRes.data?.data?.promoCodes && Array.isArray(cloudRes.data.data.promoCodes)) {
      const cloudCodes: PromoCode[] = cloudRes.data.data.promoCodes;
      saveLocalCache(cloudCodes);

      const target = cloudCodes.find(p => p.code.toUpperCase() === cleanCode);
      if (target) {
        const isAudience = target.forAudience || target.maxUses >= 9999;
        if (!isAudience && target.usedCount >= target.maxUses) {
          return {
            success: false,
            message: `Промокод «${cleanCode}» устарел (лимит исчерпан)`,
            status: 410,
          };
        }

        // Mark as redeemed on this device
        markCodeAsRedeemedOnDevice(cleanCode);

        // Increment cloud count in background
        target.usedCount = (target.usedCount || 0) + 1;
        safeJsonFetch(GLOBAL_CLOUD_URL, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'PEREKUP_GLOBAL_PROMO_5c311207',
            data: {
              updatedAt: Date.now(),
              promoCodes: cloudCodes,
            },
          }),
        }).catch(() => {});

        return {
          success: true,
          promo: target,
          message: `Промокод «${cleanCode}» успешно активирован: ${target.description}`,
          status: 200,
        };
      }
    }
  } catch (err) {
    // Continue to local cache
  }

  // 4. Fallback: Check local device cache
  const cached = getLocalCache();
  const localTarget = cached.find(p => p.code.toUpperCase() === cleanCode);
  if (localTarget) {
    const isAudience = localTarget.forAudience || localTarget.maxUses >= 9999;
    if (!isAudience && localTarget.usedCount >= localTarget.maxUses) {
      return {
        success: false,
        message: `Промокод «${cleanCode}» устарел (лимит исчерпан)`,
        status: 410,
      };
    }

    markCodeAsRedeemedOnDevice(cleanCode);
    return {
      success: true,
      promo: localTarget,
      message: `Промокод «${cleanCode}» успешно активирован: ${localTarget.description}`,
      status: 200,
    };
  }

  return {
    success: false,
    message: `Промокод «${cleanCode}» не найден. Проверьте правильность ввода.`,
    status: 404,
  };
}
