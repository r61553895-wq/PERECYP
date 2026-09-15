import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

// Enable CORS for all origins, headers, and OPTIONS preflight requests
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-admin-password'
  );
  res.header('Access-Control-Max-Age', '86400');

  // Respond immediately to OPTIONS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

app.use(express.json());

// Persistent server-side promo codes store with Global Cloud Sync
const DATA_DIR = path.join(process.cwd(), 'server_data');
const PROMO_CODES_FILE = path.join(DATA_DIR, 'promo_codes.json');
const PLAYER_SAVES_DIR = path.join(DATA_DIR, 'player_saves');
const CODE_MAP_FILE = path.join(DATA_DIR, 'save_codes.json');
const GLOBAL_CLOUD_URL = 'https://api.restful-api.dev/objects/ff808181a09d98f701a0a4b741be0e3f';

function ensureDataFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(PROMO_CODES_FILE)) {
    fs.writeFileSync(PROMO_CODES_FILE, JSON.stringify([], null, 2), 'utf-8');
  }
  if (!fs.existsSync(PLAYER_SAVES_DIR)) {
    fs.mkdirSync(PLAYER_SAVES_DIR, { recursive: true });
  }
  if (!fs.existsSync(CODE_MAP_FILE)) {
    fs.writeFileSync(CODE_MAP_FILE, JSON.stringify({}), 'utf-8');
  }
}

function readCodeMap(): Record<string, string> {
  try {
    ensureDataFile();
    return JSON.parse(fs.readFileSync(CODE_MAP_FILE, 'utf-8')) || {};
  } catch {
    return {};
  }
}

function saveCodeMap(map: Record<string, string>) {
  try {
    ensureDataFile();
    fs.writeFileSync(CODE_MAP_FILE, JSON.stringify(map, null, 2), 'utf-8');
  } catch (e) {
    console.warn('Error saving code map:', e);
  }
}

function readPromoCodes(): any[] {
  try {
    ensureDataFile();
    const content = fs.readFileSync(PROMO_CODES_FILE, 'utf-8');
    return JSON.parse(content) || [];
  } catch (e) {
    console.error('Error reading promo codes:', e);
    return [];
  }
}

function savePromoCodes(codes: any[]) {
  try {
    ensureDataFile();
    fs.writeFileSync(PROMO_CODES_FILE, JSON.stringify(codes, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error writing promo codes:', e);
  }
}

async function syncWithGlobalCloud(): Promise<any[]> {
  try {
    const res = await fetch(GLOBAL_CLOUD_URL, { signal: AbortSignal.timeout(4000) });
    if (res.ok) {
      const json: any = await res.json();
      if (json?.data?.promoCodes && Array.isArray(json.data.promoCodes)) {
        const cloudCodes = json.data.promoCodes;
        const localCodes = readPromoCodes();
        const map = new Map<string, any>();
        for (const c of localCodes) {
          if (c && c.code) map.set(c.code.toUpperCase(), c);
        }
        for (const c of cloudCodes) {
          if (c && c.code) map.set(c.code.toUpperCase(), c);
        }
        const merged = Array.from(map.values());
        savePromoCodes(merged);
        return merged;
      }
    }
  } catch (err) {
    // Cloud sync fallback
  }
  return readPromoCodes();
}

async function pushToGlobalCloud(codes: any[]) {
  try {
    await fetch(GLOBAL_CLOUD_URL, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'PEREKUP_GLOBAL_PROMO_5c311207',
        data: {
          updatedAt: Date.now(),
          promoCodes: codes,
        },
      }),
      signal: AbortSignal.timeout(5000),
    });
  } catch (err) {
    console.warn('Could not push to global cloud:', err);
  }
}

// Initial sync on boot
syncWithGlobalCloud().catch(() => {});

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// GET player save by playerId or saveCode (for cross-browser, cross-device, or reload recovery)
app.get('/api/player-save/:id', (req, res) => {
  try {
    ensureDataFile();
    const rawId = req.params.id.trim().toUpperCase();
    const map = readCodeMap();
    const targetPlayerId = map[rawId] || rawId;

    const safePlayerId = targetPlayerId.replace(/[^a-zA-Z0-9_-]/g, '');
    const filePath = path.join(PLAYER_SAVES_DIR, `${safePlayerId}.json`);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'Сохранение не найдено' });
    }

    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    return res.json({ success: true, save: data });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Ошибка чтения сохранения на сервере' });
  }
});

// POST save player state to durable server disk & memory
app.post('/api/player-save', (req, res) => {
  try {
    const { playerId, saveCode, state, updatedAt } = req.body;
    if (!playerId || !state) {
      return res.status(400).json({ success: false, message: 'Не переданы данные для сохранения' });
    }

    ensureDataFile();
    const safePlayerId = String(playerId).trim().replace(/[^a-zA-Z0-9_-]/g, '');
    const filePath = path.join(PLAYER_SAVES_DIR, `${safePlayerId}.json`);

    const payload = {
      playerId: safePlayerId,
      saveCode: saveCode ? String(saveCode).trim().toUpperCase() : undefined,
      state,
      updatedAt: updatedAt || Date.now(),
    };

    fs.writeFileSync(filePath, JSON.stringify(payload, null, 2), 'utf-8');

    if (saveCode) {
      const cleanCode = String(saveCode).trim().toUpperCase();
      const map = readCodeMap();
      map[cleanCode] = safePlayerId;
      saveCodeMap(map);
    }

    return res.json({ success: true, message: 'Прогресс успешно сохранен' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Ошибка записи сохранения на сервере' });
  }
});

// GET all promo codes (for sync across tablet, phone, PC and other countries)
app.get('/api/promo-codes', async (_req, res) => {
  const codes = await syncWithGlobalCloud();
  res.json({ success: true, promoCodes: codes });
});

// POST create promo code (admin only)
app.post('/api/promo-codes', async (req, res) => {
  const { code, rewardType, rewardValue, description, maxUses, forAudience, password } = req.body;

  const authHeader = req.headers['x-admin-password'];
  if (password !== 'zxcqwerty' && authHeader !== 'zxcqwerty') {
    return res.status(403).json({ success: false, message: 'Доступ запрещен: неверный пароль администратора' });
  }

  if (!code || typeof code !== 'string') {
    return res.status(400).json({ success: false, message: 'Не указан промокод' });
  }

  const cleanCode = code.trim().toUpperCase();
  const codes = await syncWithGlobalCloud();

  const existingIndex = codes.findIndex((p: any) => p.code.toUpperCase() === cleanCode);

  const isAudience = forAudience !== false; // Default true: available to audience
  const calculatedMaxUses = isAudience ? 999999 : Math.max(1, parseInt(maxUses) || 1);

  const newPromo = {
    code: cleanCode,
    rewardType: rewardType || 'money',
    rewardValue: rewardValue ?? 50000,
    description: description || 'Специальный ключ для игроков',
    maxUses: calculatedMaxUses,
    usedCount: existingIndex >= 0 ? codes[existingIndex].usedCount : 0,
    forAudience: isAudience,
    isCustom: true,
    createdAt: Date.now(),
  };

  if (existingIndex >= 0) {
    codes[existingIndex] = newPromo;
  } else {
    codes.unshift(newPromo);
  }

  savePromoCodes(codes);
  pushToGlobalCloud(codes).catch(() => {});

  res.json({ success: true, promo: newPromo });
});

// DELETE promo code (admin only)
app.delete('/api/promo-codes/:code', async (req, res) => {
  const authHeader = req.headers['x-admin-password'];
  const queryPass = req.query.password;
  if (authHeader !== 'zxcqwerty' && queryPass !== 'zxcqwerty') {
    return res.status(403).json({ success: false, message: 'Доступ запрещен' });
  }

  const codeToDelete = req.params.code.trim().toUpperCase();
  let codes = await syncWithGlobalCloud();
  codes = codes.filter((p: any) => p.code.toUpperCase() !== codeToDelete);
  savePromoCodes(codes);
  pushToGlobalCloud(codes).catch(() => {});

  res.json({ success: true, message: 'Промокод успешно удален' });
});

// POST redeem promo code (from ANY device: tablet, phone, PC, any country)
app.post('/api/promo-codes/redeem', async (req, res) => {
  const { code } = req.body;
  if (!code || typeof code !== 'string') {
    return res.status(400).json({ success: false, message: 'Введите код' });
  }

  const cleanCode = code.trim().toUpperCase();
  let codes = readPromoCodes();
  let promo = codes.find((p: any) => p.code.toUpperCase() === cleanCode);

  if (!promo) {
    // If not found in local cache, do a fresh sync with the global cloud
    codes = await syncWithGlobalCloud();
    promo = codes.find((p: any) => p.code.toUpperCase() === cleanCode);
  }

  if (!promo) {
    return res.status(404).json({
      success: false,
      message: `Промокод «${cleanCode}» не найден. Проверьте правильность кода.`,
    });
  }

  const isUnlimited = promo.forAudience || promo.maxUses >= 9999;

  if (!isUnlimited && promo.usedCount >= promo.maxUses) {
    return res.status(410).json({
      success: false,
      message: `Промокод «${cleanCode}» устарел (лимит активаций ${promo.maxUses} исчерпан)`,
    });
  }

  // Increment usage count and persist to server + global cloud
  promo.usedCount = (promo.usedCount || 0) + 1;
  savePromoCodes(codes);
  pushToGlobalCloud(codes).catch(() => {});

  return res.json({
    success: true,
    promo,
    message: `Промокод «${cleanCode}» успешно активирован: ${promo.description}`,
  });
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
