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

// Persistent server-side promo codes store
const DATA_DIR = path.join(process.cwd(), 'server_data');
const PROMO_CODES_FILE = path.join(DATA_DIR, 'promo_codes.json');

function ensureDataFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(PROMO_CODES_FILE)) {
    fs.writeFileSync(PROMO_CODES_FILE, JSON.stringify([], null, 2), 'utf-8');
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

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// GET all promo codes (for sync across tablet, phone, PC)
app.get('/api/promo-codes', (_req, res) => {
  const codes = readPromoCodes();
  res.json({ success: true, promoCodes: codes });
});

// POST create promo code (admin only)
app.post('/api/promo-codes', (req, res) => {
  const { code, rewardType, rewardValue, description, maxUses, password } = req.body;

  const authHeader = req.headers['x-admin-password'];
  if (password !== 'zxcqwerty' && authHeader !== 'zxcqwerty') {
    return res.status(403).json({ success: false, message: 'Доступ запрещен: неверный пароль администратора' });
  }

  if (!code || typeof code !== 'string') {
    return res.status(400).json({ success: false, message: 'Не указан промокод' });
  }

  const cleanCode = code.trim().toUpperCase();
  const codes = readPromoCodes();

  const existingIndex = codes.findIndex((p: any) => p.code.toUpperCase() === cleanCode);

  const newPromo = {
    code: cleanCode,
    rewardType: rewardType || 'money',
    rewardValue: rewardValue ?? 50000,
    description: description || 'Специальный ключ',
    maxUses: Math.max(1, parseInt(maxUses) || 1),
    usedCount: existingIndex >= 0 ? codes[existingIndex].usedCount : 0,
    isCustom: true,
    createdAt: Date.now(),
  };

  if (existingIndex >= 0) {
    codes[existingIndex] = newPromo;
  } else {
    codes.unshift(newPromo);
  }

  savePromoCodes(codes);
  res.json({ success: true, promo: newPromo });
});

// DELETE promo code (admin only)
app.delete('/api/promo-codes/:code', (req, res) => {
  const authHeader = req.headers['x-admin-password'];
  const queryPass = req.query.password;
  if (authHeader !== 'zxcqwerty' && queryPass !== 'zxcqwerty') {
    return res.status(403).json({ success: false, message: 'Доступ запрещен' });
  }

  const codeToDelete = req.params.code.trim().toUpperCase();
  let codes = readPromoCodes();
  codes = codes.filter((p: any) => p.code.toUpperCase() !== codeToDelete);
  savePromoCodes(codes);

  res.json({ success: true, message: 'Промокод успешно удален' });
});

// POST redeem promo code (from ANY device: tablet, phone, PC)
app.post('/api/promo-codes/redeem', (req, res) => {
  const { code } = req.body;
  if (!code || typeof code !== 'string') {
    return res.status(400).json({ success: false, message: 'Введите код' });
  }

  const cleanCode = code.trim().toUpperCase();
  const codes = readPromoCodes();
  const promo = codes.find((p: any) => p.code.toUpperCase() === cleanCode);

  if (!promo) {
    return res.status(404).json({
      success: false,
      message: `Промокод «${cleanCode}» не существует на сервере`,
    });
  }

  if (promo.usedCount >= promo.maxUses) {
    return res.status(410).json({
      success: false,
      message: `Промокод «${cleanCode}» устарел (лимит активаций ${promo.maxUses} исчерпан)`,
    });
  }

  // Increment usage count and persist to server
  promo.usedCount = (promo.usedCount || 0) + 1;
  savePromoCodes(codes);

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
