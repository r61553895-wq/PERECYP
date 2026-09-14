import { PromoCode } from '../types';

/**
 * Cloud API Service for Synchronizing Promo Codes across devices (tablet, phone, PC)
 */

export async function fetchServerPromoCodes(): Promise<PromoCode[]> {
  try {
    const res = await fetch('/api/promo-codes');
    if (!res.ok) return [];
    const data = await res.json();
    if (data.success && Array.isArray(data.promoCodes)) {
      return data.promoCodes;
    }
  } catch (err) {
    console.warn('Could not fetch server promo codes (offline mode):', err);
  }
  return [];
}

export async function createPromoCodeOnServer(
  promo: Omit<PromoCode, 'usedCount'>,
  password = 'zxcqwerty'
): Promise<{ success: boolean; promo?: PromoCode; message?: string }> {
  try {
    const res = await fetch('/api/promo-codes', {
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
    const data = await res.json();
    return data;
  } catch (err: any) {
    console.error('Failed to create promo code on server:', err);
    return { success: false, message: 'Ошибка связи с сервером. Сохранено локально.' };
  }
}

export async function deletePromoCodeOnServer(
  code: string,
  password = 'zxcqwerty'
): Promise<{ success: boolean; message?: string }> {
  try {
    const res = await fetch(`/api/promo-codes/${encodeURIComponent(code)}`, {
      method: 'DELETE',
      headers: {
        'x-admin-password': password,
      },
    });
    const data = await res.json();
    return data;
  } catch (err: any) {
    console.error('Failed to delete promo code on server:', err);
    return { success: false, message: 'Ошибка сети при удалении на сервере' };
  }
}

export async function redeemPromoCodeOnServer(
  code: string
): Promise<{ success: boolean; promo?: PromoCode; message?: string; status?: number }> {
  try {
    const res = await fetch('/api/promo-codes/redeem', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code }),
    });
    const data = await res.json();
    return { ...data, status: res.status };
  } catch (err: any) {
    console.error('Failed to redeem promo code on server:', err);
    return { success: false, message: 'Ошибка сети при проверке кода', status: 500 };
  }
}
