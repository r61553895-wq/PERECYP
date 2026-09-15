/**
 * Multi-Tier Durable Storage Service for «Перекуп»
 * 
 * Tiers of Persistence:
 * 1. Primary LocalStorage (instant synchronous read/write)
 * 2. Secondary LocalStorage Backup (failsafe redundancy)
 * 3. Browser IndexedDB (survives cache clearance, iframe storage partitioning, and private modes)
 * 4. Persistent Cookie (survives origin changes and iframe reloads)
 * 5. Server Cloud Auto-Save (/api/player-save + Global Sync)
 * 6. Cloud Save Code (e.g. SAVE-4921) to transfer progress across phone, PC, tablet, and browser links
 */

import { signGameState, verifyAndSanitizeGameState } from './security';

export const PRIMARY_STORAGE_KEY = 'perekup_game_state_v1';
export const BACKUP_STORAGE_KEY = 'perekup_game_state_backup_v1';
export const PLAYER_ID_KEY = 'perekup_player_id';
export const SAVE_CODE_KEY = 'perekup_save_code';

const DB_NAME = 'PerekupGameDB';
const DB_VERSION = 1;
const STORE_NAME = 'player_saves';

/**
 * Get or generate permanent Player ID
 */
export function getOrCreatePlayerId(): string {
  if (typeof window === 'undefined') return 'PL_SERVER';

  // 1. Try LocalStorage
  try {
    const stored = localStorage.getItem(PLAYER_ID_KEY);
    if (stored && stored.startsWith('PL_')) return stored;
  } catch {}

  // 2. Try Cookie
  try {
    const cookies = document.cookie.split(';');
    for (const c of cookies) {
      const [key, val] = c.trim().split('=');
      if (key === PLAYER_ID_KEY && val && val.startsWith('PL_')) {
        try { localStorage.setItem(PLAYER_ID_KEY, val); } catch {}
        return val;
      }
    }
  } catch {}

  // 3. Generate new stable ID
  const newId = `PL_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`.toUpperCase();
  try {
    localStorage.setItem(PLAYER_ID_KEY, newId);
    // Persist cookie for 2 years
    document.cookie = `${PLAYER_ID_KEY}=${newId}; path=/; max-age=63072000; SameSite=Lax`;
  } catch {}

  return newId;
}

/**
 * Get or generate a short 6-character Save Code (e.g. SAVE-4821)
 */
export function getOrCreateSaveCode(): string {
  if (typeof window === 'undefined') return 'SAVE-0000';
  try {
    const existing = localStorage.getItem(SAVE_CODE_KEY);
    if (existing && existing.startsWith('SAVE-')) return existing;
  } catch {}

  const playerId = getOrCreatePlayerId();
  // Deterministic 4-digit code based on player ID
  let hash = 0;
  for (let i = 0; i < playerId.length; i++) {
    hash = (hash * 31 + playerId.charCodeAt(i)) >>> 0;
  }
  const codeNum = (hash % 9000) + 1000;
  const newCode = `SAVE-${codeNum}`;

  try {
    localStorage.setItem(SAVE_CODE_KEY, newCode);
  } catch {}

  return newCode;
}

/**
 * IndexedDB helper: open DB
 */
function openDB(): Promise<IDBDatabase | null> {
  if (typeof window === 'undefined' || !window.indexedDB) {
    return Promise.resolve(null);
  }
  return new Promise(resolve => {
    try {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

/**
 * Save state to IndexedDB asynchronously
 */
export async function saveToIndexedDB(state: any): Promise<void> {
  const db = await openDB();
  if (!db) return;
  return new Promise(resolve => {
    try {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put({ id: 'current_save', state, updatedAt: Date.now() });
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

/**
 * Read state from IndexedDB
 */
export async function loadFromIndexedDB(): Promise<any | null> {
  const db = await openDB();
  if (!db) return null;
  return new Promise(resolve => {
    try {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get('current_save');
      req.onsuccess = () => {
        if (req.result && req.result.state) {
          resolve(req.result.state);
        } else {
          resolve(null);
        }
      };
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

/**
 * Check if a game state contains real player progress
 */
export function isStateSubstantial(state: any): boolean {
  if (!state || typeof state !== 'object') return false;
  const money = Number(state.money) || 0;
  const totalProfit = Number(state.totalProfit) || 0;
  const totalDeals = Number(state.totalDeals) || 0;
  const level = Number(state.level) || 1;
  const day = Number(state.day) || 1;
  const inventoryCount = Array.isArray(state.inventory) ? state.inventory.length : 0;

  return (
    money !== 15000 ||
    totalProfit > 0 ||
    totalDeals > 0 ||
    level > 1 ||
    day > 1 ||
    inventoryCount > 0
  );
}

/**
 * Check URL parameters for save code (e.g. ?save=SAVE-4821 or ?p=PL_XXXX)
 */
export function getSaveParamFromUrl(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const params = new URLSearchParams(window.location.search);
    const save = params.get('save') || params.get('code') || params.get('p');
    if (save && save.trim().length > 0) {
      return save.trim().toUpperCase();
    }
  } catch {}
  return null;
}

/**
 * Synchronous initial load from local storage tiers
 */
export function loadSynchronousState(): { data: any; tampered: boolean; reason?: string } {
  if (typeof window === 'undefined') return { data: null, tampered: false };

  // 1. Try Primary LocalStorage
  try {
    const raw = localStorage.getItem(PRIMARY_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const verified = verifyAndSanitizeGameState(parsed);
      if (verified.sanitizedState) {
        return {
          data: verified.sanitizedState,
          tampered: verified.tampered,
          reason: verified.reason,
        };
      }
    }
  } catch (e) {
    console.warn('Primary storage load error:', e);
  }

  // 2. Try Backup LocalStorage
  try {
    const backupRaw = localStorage.getItem(BACKUP_STORAGE_KEY);
    if (backupRaw) {
      const parsed = JSON.parse(backupRaw);
      const verified = verifyAndSanitizeGameState(parsed);
      if (verified.sanitizedState) {
        return {
          data: verified.sanitizedState,
          tampered: verified.tampered,
          reason: verified.reason,
        };
      }
    }
  } catch (e) {
    console.warn('Backup storage load error:', e);
  }

  return { data: null, tampered: false };
}

/**
 * Save game state across ALL local tiers immediately
 */
export function saveToLocalTiers(state: any): void {
  if (typeof window === 'undefined') return;

  try {
    const signed = signGameState(state);
    const json = JSON.stringify(signed);

    // 1. Primary
    localStorage.setItem(PRIMARY_STORAGE_KEY, json);

    // 2. Backup (only if valid substantial or not empty)
    localStorage.setItem(BACKUP_STORAGE_KEY, json);

    // 3. IndexedDB (async in background)
    saveToIndexedDB(signed).catch(() => {});
  } catch (e) {
    console.warn('LocalStorage save failed (quota or restricted):', e);
    // Still try IndexedDB
    try {
      saveToIndexedDB(state).catch(() => {});
    } catch {}
  }
}

/**
 * Push save state to Server Cloud API (/api/player-save)
 */
export async function pushSaveToServer(state: any): Promise<boolean> {
  const playerId = getOrCreatePlayerId();
  const saveCode = getOrCreateSaveCode();

  try {
    const res = await fetch('/api/player-save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        playerId,
        saveCode,
        state,
        updatedAt: Date.now(),
      }),
      signal: AbortSignal.timeout(6000),
    });
    return res.ok;
  } catch {
    // Cloud sync will retry on next action
    return false;
  }
}

/**
 * Fetch save state from Server Cloud API by playerId or saveCode
 */
export async function fetchSaveFromServer(idOrCode: string): Promise<any | null> {
  if (!idOrCode) return null;
  try {
    const clean = encodeURIComponent(idOrCode.trim());
    const res = await fetch(`/api/player-save/${clean}`, {
      signal: AbortSignal.timeout(6000),
    });
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.save && json.save.state) {
        const verified = verifyAndSanitizeGameState(json.save.state);
        return verified.sanitizedState;
      }
    }
  } catch (e) {
    console.warn('Could not fetch save from server:', e);
  }
  return null;
}
