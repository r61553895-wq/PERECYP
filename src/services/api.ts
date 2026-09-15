import { PromoCode } from '../types';

/**
 * Cloud API Service for Synchronizing Promo Codes across devices (tablet, phone, PC)
 * Enhanced with safe JSON decoding, CORS headers, and offline tolerance.
 */

async function safeJsonFetch(url: string, options: RequestInit = {}): Promise<{ ok: boolean; status: number; data: any }> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
      credentials: 'same-origin',
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
    console.warn(`Network error fetching ${url}:`, err);
    return {
      ok: false,
      status: 0,
      data: { success: false, message: 'Сервер временно недоступен или отсутствует подключение' },
    };
  }
}

export async function fetchServerPromoCodes(): Promise<PromoCode[]> {
  const { ok, data } = await safeJsonFetch('/api/promo-codes');
  if (ok && data?.success && Array.isArray(data.promoCodes)) {
    return data.promoCodes;
  }
  return [];
}

export async function createPromoCodeOnServer(
  promo: Omit<PromoCode, 'usedCount'>,
  password = 'zxcqwerty'
): Promise<{ success: boolean; promo?: PromoCode; message?: string }> {
  const { data } = await safeJsonFetch('/api/promo-codes', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-password': password,
    },
    body: JSON.stringify({
      ...promo,
      password,
    }),
  });

  return data || { success: false, message: 'Не удалось сохранить промокод на сервере' };
}

export async function deletePromoCodeOnServer(
  code: string,
  password = 'zxcqwerty'
): Promise<{ success: boolean; message?: string }> {
  const { data } = await safeJsonFetch(`/api/promo-codes/${encodeURIComponent(code)}`, {
    method: 'DELETE',
    headers: {
      'x-admin-password': password,
    },
  });

  return data || { success: false, message: 'Не удалось удалить промокод на сервере' };
}

export async function redeemPromoCodeOnServer(
  code: string
): Promise<{ success: boolean; promo?: PromoCode; message?: string; status: number }> {
  const { ok, status, data } = await safeJsonFetch('/api/promo-codes/redeem', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ code: code.trim().toUpperCase() }),
  });

  if (ok && data?.success) {
    return { success: true, promo: data.promo, message: data.message, status: status || 200 };
  }

  return {
    success: false,
    message: data?.message || (status === 0 ? 'Сервер недоступен' : `Ошибка проверки (${status})`),
    status: status || 0,
  };
}
