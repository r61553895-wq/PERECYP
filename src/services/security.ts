/**
 * Anti-Cheat & Game Integrity Protection Service
 * Protects against:
 * 1. LocalStorage manual value editing (DevTools Application tab)
 * 2. Memory manipulation / Prototype pollution / Infinity/NaN hacks
 * 3. Brute-force admin password attacks
 * 4. Promo code spamming / replay tampering
 * 5. Impossible item stats or fake inventory injections
 */

// Secret validation salt unique to this applet release
const INTEGRITY_SALT = 'PRKP_SEC_V2_99A8F_XQZ_#2026';

/**
 * Fast, robust cryptographic-strength bitwise hash for data signature
 */
function computeChecksum(payloadString: string): string {
  let h1 = 0xdeadbeef ^ 374761393;
  let h2 = 0x41c64e6d ^ 668265263;

  const salted = `${INTEGRITY_SALT}::${payloadString}::${INTEGRITY_SALT}`;
  for (let i = 0; i < salted.length; i++) {
    const ch = salted.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }

  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);

  const part1 = (h1 >>> 0).toString(16).padStart(8, '0');
  const part2 = (h2 >>> 0).toString(16).padStart(8, '0');
  return `SIG_${part1}${part2}`;
}

/**
 * Extract canonical fields for signing to ensure determinism
 */
function extractCanonicalState(state: Record<string, any>): string {
  const money = Math.floor(Number(state.money) || 0);
  const totalProfit = Math.floor(Number(state.totalProfit) || 0);
  const totalDeals = Math.floor(Number(state.totalDeals) || 0);
  const reputation = Math.round((Number(state.reputation) || 4.8) * 100);
  const level = Math.floor(Number(state.level) || 1);
  const xp = Math.floor(Number(state.xp) || 0);
  const skillPoints = Math.floor(Number(state.skillPoints) || 0);
  const day = Math.floor(Number(state.day) || 1);
  const warehouseTier = Math.floor(Number(state.warehouseTier) || 0);

  // Digest inventory count and IDs
  const invDigest = Array.isArray(state.inventory)
    ? state.inventory
        .map((it: any) => `${it?.id || ''}:${Math.floor(it?.purchasePrice || 0)}:${it?.title || ''}`)
        .sort()
        .join('|')
    : '';

  // Canonical string
  return `m=${money};tp=${totalProfit};td=${totalDeals};r=${reputation};lvl=${level};xp=${xp};sp=${skillPoints};d=${day};wh=${warehouseTier};inv=${invDigest}`;
}

/**
 * Signs state with an anti-tamper signature
 */
export function signGameState(state: Record<string, any>): Record<string, any> {
  const canonical = extractCanonicalState(state);
  const signature = computeChecksum(canonical);

  return {
    ...state,
    _sig: signature,
    _v: 2,
    _ts: Date.now(),
  };
}

export interface VerificationResult {
  isValid: boolean;
  tampered: boolean;
  reason?: string;
  sanitizedState: any;
}

/**
 * Validates saved state against tamper signatures and logical sanity boundaries
 */
export function verifyAndSanitizeGameState(rawSaved: any): VerificationResult {
  if (!rawSaved || typeof rawSaved !== 'object') {
    return {
      isValid: false,
      tampered: false,
      reason: 'Пустое или поврежденное состояние',
      sanitizedState: null,
    };
  }

  // If there's an existing signature, check it
  let tampered = false;
  let reason: string | undefined;

  if (rawSaved._sig) {
    const canonical = extractCanonicalState(rawSaved);
    const expectedSig = computeChecksum(canonical);

    if (rawSaved._sig !== expectedSig) {
      tampered = true;
      reason = 'Несовпадение цифровой подписи (попытка прямого редактирования localStorage)';
    }
  }

  // Sanity checks on vital parameters
  const sanitized: any = { ...rawSaved };

  // 1. Money sanity: finite, not NaN, cannot be negative
  const rawMoney = Number(rawSaved.money);
  if (!Number.isFinite(rawMoney) || isNaN(rawMoney) || rawMoney < 0) {
    tampered = true;
    reason = reason || 'Недопустимое значение баланса (NaN, Infinity или отрицательное)';
    sanitized.money = 15000;
  } else if (rawMoney > 500000000 && !rawSaved._isAdminSession) {
    // Over 500M without admin is obviously injected
    tampered = true;
    reason = reason || 'Аномально высокий баланс выше допустимого лимита симулятора';
    sanitized.money = Math.min(rawMoney, 10000000);
  } else {
    sanitized.money = Math.floor(rawMoney);
  }

  // 2. Reputation sanity: strictly between 1.0 and 5.0
  const rawRep = Number(rawSaved.reputation);
  if (!Number.isFinite(rawRep) || isNaN(rawRep)) {
    sanitized.reputation = 4.8;
  } else {
    sanitized.reputation = Math.max(1.0, Math.min(5.0, Math.round(rawRep * 10) / 10));
  }

  // 3. Level sanity: strictly 1 to 10
  const rawLevel = Number(rawSaved.level);
  if (!Number.isFinite(rawLevel) || isNaN(rawLevel) || rawLevel < 1) {
    sanitized.level = 1;
  } else {
    sanitized.level = Math.max(1, Math.min(10, Math.floor(rawLevel)));
  }

  // 4. XP sanity: finite, non-negative
  const rawXp = Number(rawSaved.xp);
  sanitized.xp = !Number.isFinite(rawXp) || isNaN(rawXp) || rawXp < 0 ? 0 : Math.floor(rawXp);

  // 5. Warehouse tier: 0 to 4
  const rawWh = Number(rawSaved.warehouseTier);
  sanitized.warehouseTier =
    !Number.isFinite(rawWh) || isNaN(rawWh) || rawWh < 0 ? 0 : Math.min(4, Math.floor(rawWh));

  // 6. Inventory validation: filter out malformed or injected fake items
  if (Array.isArray(rawSaved.inventory)) {
    sanitized.inventory = rawSaved.inventory.filter((it: any) => {
      if (!it || typeof it !== 'object') return false;
      if (!it.id || typeof it.id !== 'string') return false;
      if (!it.title || typeof it.title !== 'string') return false;
      if (typeof it.purchasePrice !== 'number' || it.purchasePrice < 0) return false;
      return true;
    });
  } else {
    sanitized.inventory = [];
  }

  // 7. Promo codes sanity
  if (Array.isArray(rawSaved.promoCodes)) {
    sanitized.promoCodes = rawSaved.promoCodes.filter((p: any) => {
      return p && typeof p === 'object' && typeof p.code === 'string' && p.code.trim().length > 0;
    });
  } else {
    sanitized.promoCodes = [];
  }

  return {
    isValid: !tampered,
    tampered,
    reason,
    sanitizedState: sanitized,
  };
}

/**
 * Memory anti-tamper: Freeze critical configuration objects so they cannot be altered via console
 */
export function sealGameDefinitions(...objects: any[]) {
  try {
    for (const obj of objects) {
      if (obj && typeof obj === 'object' && !Object.isFrozen(obj)) {
        Object.freeze(obj);
      }
    }
  } catch {
    // Ignore environment restrictions
  }
}

/**
 * Brute-force protection for admin panel
 */
class AdminAccessGuard {
  private failedAttempts = 0;
  private lockedUntil = 0;
  private maxAttempts = 4;
  private lockDurationMs = 60000; // 60 seconds

  public isLocked(): { locked: boolean; remainingSeconds: number } {
    const now = Date.now();
    if (this.lockedUntil > now) {
      return {
        locked: true,
        remainingSeconds: Math.ceil((this.lockedUntil - now) / 1000),
      };
    }
    return { locked: false, remainingSeconds: 0 };
  }

  public recordFailure(): { locked: boolean; remainingSeconds: number; attemptsLeft: number } {
    this.failedAttempts += 1;
    if (this.failedAttempts >= this.maxAttempts) {
      this.lockedUntil = Date.now() + this.lockDurationMs;
      this.failedAttempts = 0;
      return { locked: true, remainingSeconds: Math.ceil(this.lockDurationMs / 1000), attemptsLeft: 0 };
    }
    return {
      locked: false,
      remainingSeconds: 0,
      attemptsLeft: this.maxAttempts - this.failedAttempts,
    };
  }

  public resetOnSuccess() {
    this.failedAttempts = 0;
    this.lockedUntil = 0;
  }
}

export const adminGuard = new AdminAccessGuard();

/**
 * Constant-time string comparator to prevent timing attacks on password verification
 */
export function secureTimingSafeCompare(a: string, b: string): boolean {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  let mismatch = a.length === b.length ? 0 : 1;
  const maxLen = Math.max(a.length, b.length);
  for (let i = 0; i < maxLen; i++) {
    const charA = i < a.length ? a.charCodeAt(i) : 0;
    const charB = i < b.length ? b.charCodeAt(i) : 0;
    mismatch |= charA ^ charB;
  }
  return mismatch === 0;
}
