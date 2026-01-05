const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3001;

const IS_PROD = process.env.NODE_ENV === 'production';
const SESSION_TTL_HOURS_RAW = parseInt(process.env.SESSION_TTL_HOURS || '168', 10);
const SESSION_TTL_HOURS = Number.isFinite(SESSION_TTL_HOURS_RAW) && SESSION_TTL_HOURS_RAW > 0 ? SESSION_TTL_HOURS_RAW : 168; // 7 days

function sha256Hex(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function isValidEmail(email) {
  if (typeof email !== 'string') return false;
  const normalized = email.trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized);
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function normalizeString(value) {
  return String(value || '').trim();
}

function isValidRole(role) {
  return role === 'admin' || role === 'user';
}

function toNonNegativeInt(value) {
  const numberValue = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numberValue)) return null;
  const asInt = Math.trunc(numberValue);
  if (asInt < 0) return null;
  return asInt;
}

function toPositiveInt(value) {
  const numberValue = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numberValue)) return null;
  const asInt = Math.trunc(numberValue);
  if (asInt <= 0) return null;
  return asInt;
}

function toNonNegativeNumber(value) {
  const numberValue = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numberValue)) return null;
  if (numberValue < 0) return null;
  return numberValue;
}

function getCorsOptions() {
  const raw = normalizeString(process.env.CORS_ORIGIN);
  if (!raw) {
    return {
      origin: IS_PROD ? false : true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      maxAge: 86400,
    };
  }
  const allowed = raw
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  return {
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (allowed.includes(origin)) return callback(null, true);
      return callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86400,
  };
}

function getDbConfig() {
  const host = process.env.DB_HOST || '127.0.0.1';
  const port = parseInt(process.env.DB_PORT || '5432', 10);
  const user = process.env.DB_USER || 'myuser';
  const password = process.env.DB_PASSWORD || 'mysecret';
  const database = process.env.DB_NAME || 'orderapp';

  if (IS_PROD) {
    const missing = [];
    if (!process.env.DB_HOST) missing.push('DB_HOST');
    if (!process.env.DB_USER) missing.push('DB_USER');
    if (!process.env.DB_PASSWORD) missing.push('DB_PASSWORD');
    if (!process.env.DB_NAME) missing.push('DB_NAME');
    if (missing.length > 0) {
      throw new Error(`Missing required env vars in production: ${missing.join(', ')}`);
    }
  }

  return { host, port, user, password, database };
}

const pool = new Pool({
  ...getDbConfig(),
});

app.disable('x-powered-by');
app.use(cors(getCorsOptions()));
app.use(express.json({ limit: '1mb' }));

const initialProducts = [
  { name: 'Mie Instan Goreng', code: 'MIG001', price: 3500, stock: 500, unit: 'pcs' },
  { name: 'Mie Instan Kuah', code: 'MIK001', price: 3000, stock: 450, unit: 'pcs' },
  { name: 'Kopi Sachet', code: 'KOP001', price: 2000, stock: 800, unit: 'pcs' },
  { name: 'Teh Botol', code: 'TEH001', price: 5000, stock: 300, unit: 'botol' },
  { name: 'Air Mineral 600ml', code: 'AIR001', price: 3500, stock: 600, unit: 'botol' },
  { name: 'Biskuit Kaleng', code: 'BIS001', price: 15000, stock: 150, unit: 'kaleng' },
  { name: 'Wafer Coklat', code: 'WAF001', price: 8000, stock: 200, unit: 'pcs' },
  { name: 'Keripik Kentang', code: 'KER001', price: 10000, stock: 180, unit: 'pcs' },
];

async function ensureSchema() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(`
      CREATE TABLE IF NOT EXISTS app_users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'user',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        token TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        expires_at TIMESTAMPTZ
      );
    `);
    await client.query('ALTER TABLE sessions ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;');
    await client.query('CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON sessions(user_id);');
    await client.query('CREATE INDEX IF NOT EXISTS sessions_expires_at_idx ON sessions(expires_at);');
    await client.query(`
      CREATE TABLE IF NOT EXISTS locations (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        code TEXT NOT NULL UNIQUE,
        address TEXT,
        type TEXT
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        code TEXT NOT NULL UNIQUE,
        price NUMERIC NOT NULL,
        stock INTEGER NOT NULL,
        unit TEXT NOT NULL,
        location_id TEXT REFERENCES locations(id)
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS salesmen (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        code TEXT NOT NULL UNIQUE,
        phone TEXT,
        status TEXT
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS sales (
        id TEXT PRIMARY KEY,
        salesman_name TEXT NOT NULL,
        salesman_id TEXT,
        customer_name TEXT NOT NULL,
        date TIMESTAMPTZ NOT NULL,
        total_amount NUMERIC NOT NULL
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS sale_items (
        id SERIAL PRIMARY KEY,
        sale_id TEXT NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
        product_id TEXT,
        product_name TEXT NOT NULL,
        product_code TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        price NUMERIC NOT NULL,
        total NUMERIC NOT NULL
      );
    `);

    // Migrate legacy session tokens (UUID) -> SHA-256 hex to avoid storing tokens in plaintext.
    const { rows: legacySessions } = await client.query(
      "SELECT token FROM sessions WHERE token IS NOT NULL AND token !~ '^[0-9a-f]{64}$';"
    );
    for (const { token } of legacySessions) {
      const hashed = sha256Hex(token);
      try {
        await client.query('UPDATE sessions SET token = $1 WHERE token = $2;', [hashed, token]);
      } catch (e) {
        // If a rare hash collision causes PK conflict, drop the older session.
        await client.query('DELETE FROM sessions WHERE token = $1;', [token]);
      }
    }

    // Ensure legacy sessions have an expiry.
    await client.query("UPDATE sessions SET expires_at = NOW() + INTERVAL '7 days' WHERE expires_at IS NULL;");

    // Optional admin seeding for local/dev.
    const seedEmail = normalizeEmail(process.env.SEED_ADMIN_EMAIL);
    const seedPassword = process.env.SEED_ADMIN_PASSWORD;
    const seedName = normalizeString(process.env.SEED_ADMIN_NAME || 'Admin');
    if (seedEmail && seedPassword) {
      const { rows } = await client.query('SELECT COUNT(*)::int AS count FROM app_users;');
      if (rows[0].count === 0) {
        if (!isValidEmail(seedEmail)) {
          throw new Error('SEED_ADMIN_EMAIL is invalid');
        }
        if (String(seedPassword).length < 8) {
          throw new Error('SEED_ADMIN_PASSWORD must be at least 8 characters');
        }
        const adminId = crypto.randomUUID();
        const hash = await bcrypt.hash(String(seedPassword), 10);
        await client.query(
          'INSERT INTO app_users (id, email, name, password_hash, role) VALUES ($1, $2, $3, $4, $5);',
          [adminId, seedEmail, seedName || 'Admin', hash, 'admin']
        );
      }
    }

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Schema init error:', error);
    throw error;
  } finally {
    client.release();
  }
}

ensureSchema().catch((err) => {
  console.error('Failed to ensure schema', err);
  process.exit(1);
});

async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace('Bearer ', '').trim();
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  const tokenHash = sha256Hex(token);

  try {
    // Clean up expired sessions opportunistically.
    await pool.query('DELETE FROM sessions WHERE expires_at IS NOT NULL AND expires_at <= NOW();');

    const { rows } = await pool.query(
      `SELECT
         s.token AS session_token,
         s.expires_at,
         a.id,
         a.email,
         a.name,
         a.role,
         a.created_at
       FROM sessions s
       JOIN app_users a ON a.id = s.user_id
       WHERE s.token = $1 OR s.token = $2
       LIMIT 1;`,
      [tokenHash, token]
    );
    if (rows.length === 0) return res.status(401).json({ error: 'Invalid token' });

    const session = rows[0];
    if (session.expires_at && new Date(session.expires_at) <= new Date()) {
      try {
        await pool.query('DELETE FROM sessions WHERE token = $1;', [session.session_token]);
      } catch (_) {}
      return res.status(401).json({ error: 'Session expired' });
    }

    // If we matched a legacy plaintext token, migrate it to hashed.
    if (session.session_token === token) {
      await pool.query('UPDATE sessions SET token = $1 WHERE token = $2;', [tokenHash, token]);
      session.session_token = tokenHash;
    }

    // Ensure expiry is set.
    if (!session.expires_at) {
      const expiresAt = new Date(Date.now() + SESSION_TTL_HOURS * 60 * 60 * 1000);
      await pool.query('UPDATE sessions SET expires_at = $1 WHERE token = $2;', [expiresAt, session.session_token]);
      session.expires_at = expiresAt;
    }

    req.user = {
      id: session.id,
      email: session.email,
      name: session.name,
      role: session.role,
      created_at: session.created_at,
    };
    req.tokenHash = tokenHash;
    next();
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  next();
}

function requireSelfOrAdmin(req, res, next) {
  const targetId = req.params.id;
  if (!targetId) return res.status(400).json({ error: 'Missing user id' });
  if (req.user?.role === 'admin' || req.user?.id === targetId) return next();
  return res.status(403).json({ error: 'Forbidden' });
}

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.post('/auth/signup', async (req, res) => {
  const email = normalizeEmail(req.body?.email);
  const password = String(req.body?.password || '');
  const name = normalizeString(req.body?.name);
  const role = 'user';

  if (!email || !password || !name) return res.status(400).json({ error: 'Email, password, dan name wajib diisi' });
  if (!isValidEmail(email)) return res.status(400).json({ error: 'Format email tidak valid' });
  if (password.length < 6) return res.status(400).json({ error: 'Password minimal 6 karakter' });
  try {
    const hash = await bcrypt.hash(password, 10);
    const userId = crypto.randomUUID();
    const insertResult = await pool.query(
      'INSERT INTO app_users (id, email, name, password_hash, role) VALUES ($1, $2, $3, $4, $5) RETURNING created_at;',
      [userId, email, name, hash, role]
    );
    const token = crypto.randomUUID();
    const tokenHash = sha256Hex(token);
    const expiresAt = new Date(Date.now() + SESSION_TTL_HOURS * 60 * 60 * 1000);
    await pool.query('INSERT INTO sessions (token, user_id, expires_at) VALUES ($1, $2, $3);', [
      tokenHash,
      userId,
      expiresAt,
    ]);
    res.json({ user: { id: userId, email, name, role, created_at: insertResult.rows[0].created_at }, token });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Email sudah terdaftar' });
    }
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/auth/login', async (req, res) => {
  const email = normalizeEmail(req.body?.email);
  const password = String(req.body?.password || '');
  if (!email || !password) return res.status(400).json({ error: 'Email dan password wajib diisi' });
  if (!isValidEmail(email)) return res.status(400).json({ error: 'Email atau password salah' });
  try {
    const { rows } = await pool.query('SELECT * FROM app_users WHERE email = $1;', [email]);
    if (rows.length === 0) return res.status(400).json({ error: 'Email atau password salah' });
    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(400).json({ error: 'Email atau password salah' });
    const token = crypto.randomUUID();
    const tokenHash = sha256Hex(token);
    const expiresAt = new Date(Date.now() + SESSION_TTL_HOURS * 60 * 60 * 1000);
    await pool.query('INSERT INTO sessions (token, user_id, expires_at) VALUES ($1, $2, $3);', [
      tokenHash,
      user.id,
      expiresAt,
    ]);
    res.json({ user: { id: user.id, email: user.email, name: user.name, role: user.role, created_at: user.created_at }, token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/auth/logout', authMiddleware, async (req, res) => {
  try {
    await pool.query('DELETE FROM sessions WHERE token = $1;', [req.tokenHash]);
    res.json({ message: 'Logged out' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/auth/me', authMiddleware, (req, res) => {
  res.json({ user: req.user });
});

app.post('/init-products', authMiddleware, async (_req, res) => {
  try {
    const { rows } = await pool.query('SELECT COUNT(*)::int AS count FROM products;');
    if (rows[0].count > 0) return res.json({ message: 'Products already initialized' });
    const values = initialProducts.map((p) => [
      crypto.randomUUID(),
      p.name,
      p.code,
      p.price,
      p.stock,
      p.unit,
      null,
    ]);
    const placeholders = values
      .map(
        (_row, idx) =>
          `($${idx * 7 + 1}, $${idx * 7 + 2}, $${idx * 7 + 3}, $${idx * 7 + 4}, $${idx * 7 + 5}, $${idx * 7 + 6}, $${idx * 7 + 7})`
      )
      .join(',');
    await pool.query(
      `INSERT INTO products (id, name, code, price, stock, unit, location_id) VALUES ${placeholders};`,
      values.flat()
    );
    res.json({ message: 'Products initialized' });
  } catch (error) {
    console.error('Init products error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/products', authMiddleware, async (_req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, name, code, price::float8 AS price, stock, unit, location_id FROM products ORDER BY name ASC;'
    );
    const products = rows.map((p) => ({
      id: p.id,
      name: p.name,
      code: p.code,
      price: Number(p.price) || 0,
      stock: Number(p.stock) || 0,
      unit: p.unit,
      locationId: p.location_id || null,
    }));
    res.json({ products });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/products', authMiddleware, async (req, res) => {
  const name = normalizeString(req.body?.name);
  const code = normalizeString(req.body?.code).toUpperCase();
  const price = toNonNegativeNumber(req.body?.price);
  const stock = toNonNegativeInt(req.body?.stock);
  const unit = normalizeString(req.body?.unit);
  const locationId = normalizeString(req.body?.locationId) || null;
  if (!name || !code || price == null || stock == null || !unit) {
    return res.status(400).json({ error: 'Data produk belum lengkap' });
  }
  try {
    const id = crypto.randomUUID();
    await pool.query(
      'INSERT INTO products (id, name, code, price, stock, unit, location_id) VALUES ($1, $2, $3, $4, $5, $6, $7);',
      [id, name, code, price, stock, unit, locationId || null]
    );
    res.json({ message: 'Product added', id });
  } catch (error) {
    if (error.code === '23505') return res.status(400).json({ error: 'Kode produk sudah ada' });
    console.error('Add product error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/products/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const name = normalizeString(req.body?.name);
  const code = normalizeString(req.body?.code).toUpperCase();
  const price = toNonNegativeNumber(req.body?.price);
  const stock = toNonNegativeInt(req.body?.stock);
  const unit = normalizeString(req.body?.unit);
  const locationId = normalizeString(req.body?.locationId) || null;
  if (!id) return res.status(400).json({ error: 'Invalid product id' });
  if (!name || !code || price == null || stock == null || !unit) {
    return res.status(400).json({ error: 'Data produk belum lengkap' });
  }
  try {
    await pool.query(
      'UPDATE products SET name=$1, code=$2, price=$3, stock=$4, unit=$5, location_id=$6 WHERE id=$7;',
      [name, code, price, stock, unit, locationId || null, id]
    );
    res.json({ message: 'Product updated' });
  } catch (error) {
    if (error.code === '23505') return res.status(400).json({ error: 'Kode produk sudah ada' });
    console.error('Update product error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/products/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  if (!id) return res.status(400).json({ error: 'Invalid product id' });
  try {
    await pool.query('DELETE FROM products WHERE id = $1;', [id]);
    res.json({ message: 'Product deleted' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/locations', authMiddleware, async (_req, res) => {
  try {
    const { rows } = await pool.query('SELECT id, name, code, address, type FROM locations ORDER BY name ASC;');
    res.json({ locations: rows });
  } catch (error) {
    console.error('Get locations error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/locations', authMiddleware, requireAdmin, async (req, res) => {
  const name = normalizeString(req.body?.name);
  const code = normalizeString(req.body?.code).toUpperCase();
  const address = normalizeString(req.body?.address);
  const type = normalizeString(req.body?.type) || 'warehouse';
  if (!name || !code) return res.status(400).json({ error: 'Nama dan kode lokasi wajib diisi' });
  try {
    const id = crypto.randomUUID();
    await pool.query(
      'INSERT INTO locations (id, name, code, address, type) VALUES ($1, $2, $3, $4, $5);',
      [id, name, code, address || '', type || 'warehouse']
    );
    res.json({ message: 'Location added', id });
  } catch (error) {
    if (error.code === '23505') return res.status(400).json({ error: 'Kode lokasi sudah ada' });
    console.error('Add location error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/locations/:id', authMiddleware, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const name = normalizeString(req.body?.name);
  const code = normalizeString(req.body?.code).toUpperCase();
  const address = normalizeString(req.body?.address);
  const type = normalizeString(req.body?.type) || 'warehouse';
  if (!id) return res.status(400).json({ error: 'Invalid location id' });
  if (!name || !code) return res.status(400).json({ error: 'Nama dan kode lokasi wajib diisi' });
  try {
    await pool.query(
      'UPDATE locations SET name=$1, code=$2, address=$3, type=$4 WHERE id=$5;',
      [name, code, address || '', type || 'warehouse', id]
    );
    res.json({ message: 'Location updated' });
  } catch (error) {
    if (error.code === '23505') return res.status(400).json({ error: 'Kode lokasi sudah ada' });
    console.error('Update location error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/locations/:id', authMiddleware, requireAdmin, async (req, res) => {
  const { id } = req.params;
  if (!id) return res.status(400).json({ error: 'Invalid location id' });
  try {
    await pool.query('DELETE FROM locations WHERE id = $1;', [id]);
    res.json({ message: 'Location deleted' });
  } catch (error) {
    console.error('Delete location error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/salesmen', authMiddleware, async (_req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM salesmen ORDER BY name ASC;');
    res.json({ salesmen: rows });
  } catch (error) {
    console.error('Get salesmen error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/salesmen', authMiddleware, requireAdmin, async (req, res) => {
  const name = normalizeString(req.body?.name);
  const code = normalizeString(req.body?.code).toUpperCase();
  const phone = normalizeString(req.body?.phone);
  const status = normalizeString(req.body?.status) || 'active';
  if (!name || !code) return res.status(400).json({ error: 'Nama dan kode salesman wajib diisi' });
  try {
    const id = crypto.randomUUID();
    await pool.query(
      'INSERT INTO salesmen (id, name, code, phone, status) VALUES ($1, $2, $3, $4, $5);',
      [id, name, code, phone || '', status || 'active']
    );
    res.json({ message: 'Salesman added', id });
  } catch (error) {
    if (error.code === '23505') return res.status(400).json({ error: 'Kode salesman sudah ada' });
    console.error('Add salesman error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/salesmen/:id', authMiddleware, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const name = normalizeString(req.body?.name);
  const code = normalizeString(req.body?.code).toUpperCase();
  const phone = normalizeString(req.body?.phone);
  const status = normalizeString(req.body?.status) || 'active';
  if (!id) return res.status(400).json({ error: 'Invalid salesman id' });
  if (!name || !code) return res.status(400).json({ error: 'Nama dan kode salesman wajib diisi' });
  try {
    await pool.query(
      'UPDATE salesmen SET name=$1, code=$2, phone=$3, status=$4 WHERE id=$5;',
      [name, code, phone || '', status || 'active', id]
    );
    res.json({ message: 'Salesman updated' });
  } catch (error) {
    if (error.code === '23505') return res.status(400).json({ error: 'Kode salesman sudah ada' });
    console.error('Update salesman error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/salesmen/:id', authMiddleware, requireAdmin, async (req, res) => {
  const { id } = req.params;
  if (!id) return res.status(400).json({ error: 'Invalid salesman id' });
  try {
    await pool.query('DELETE FROM salesmen WHERE id = $1;', [id]);
    res.json({ message: 'Salesman deleted' });
  } catch (error) {
    console.error('Delete salesman error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/sales', authMiddleware, async (req, res) => {
  const salesmanName = normalizeString(req.body?.salesmanName);
  const salesmanId = normalizeString(req.body?.salesmanId);
  const customerName = normalizeString(req.body?.customerName);
  const items = Array.isArray(req.body?.items) ? req.body.items : null;
  if (!salesmanName || !customerName || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Data penjualan tidak lengkap' });
  }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const saleId = crypto.randomUUID();
    let totalAmount = 0;
    const normalizedItems = [];

    for (const item of items) {
      const productId = normalizeString(item?.productId);
      const quantity = toPositiveInt(item?.quantity);
      if (!productId || !quantity) throw new Error('Item penjualan tidak valid');

      const { rows } = await client.query(
        'SELECT id, name, code, price::float8 AS price, stock FROM products WHERE id = $1 FOR UPDATE;',
        [productId]
      );
      if (rows.length === 0) throw new Error(`Produk ${productId} tidak ditemukan`);
      const product = rows[0];
      const stock = Number(product.stock) || 0;
      if (stock < quantity) throw new Error(`Stok produk ${product.code} tidak mencukupi`);

      const price = Number(product.price) || 0;
      const total = price * quantity;
      totalAmount += total;

      normalizedItems.push({
        productId: product.id,
        productName: product.name,
        productCode: product.code,
        quantity,
        price,
        total,
      });

      await client.query('UPDATE products SET stock = stock - $1 WHERE id = $2;', [quantity, productId]);
    }
    await client.query(
      'INSERT INTO sales (id, salesman_name, salesman_id, customer_name, date, total_amount) VALUES ($1, $2, $3, $4, NOW(), $5);',
      [saleId, salesmanName, salesmanId || '', customerName, totalAmount]
    );
    for (const item of normalizedItems) {
      await client.query(
        'INSERT INTO sale_items (sale_id, product_id, product_name, product_code, quantity, price, total) VALUES ($1, $2, $3, $4, $5, $6, $7);',
        [saleId, item.productId, item.productName, item.productCode, item.quantity, item.price, item.total]
      );
    }
    await client.query('COMMIT');
    res.json({ message: 'Sale saved', saleId });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Save sale error:', error);
    res.status(400).json({ error: error.message });
  } finally {
    client.release();
  }
});

app.get('/sales', authMiddleware, async (_req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        s.id,
        s.salesman_name AS "salesmanName",
        s.salesman_id AS "salesmanId",
        s.customer_name AS "customerName",
        s.date,
        s.total_amount::float8 AS "totalAmount",
        COALESCE(
          json_agg(
            json_build_object(
              'id', si.id,
              'saleId', si.sale_id,
              'productId', si.product_id,
              'productName', si.product_name,
              'productCode', si.product_code,
              'quantity', si.quantity,
              'price', (si.price::float8),
              'total', (si.total::float8)
            )
            ORDER BY si.id
          ) FILTER (WHERE si.id IS NOT NULL),
          '[]'
        ) AS items
      FROM sales s
      LEFT JOIN sale_items si ON si.sale_id = s.id
      GROUP BY s.id
      ORDER BY s.date DESC;
    `);
    res.json({ sales: rows });
  } catch (error) {
    console.error('Get sales error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/users', authMiddleware, requireAdmin, async (_req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, email, name, role, created_at FROM app_users ORDER BY created_at DESC;'
    );
    res.json({ users: rows });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/users', authMiddleware, requireAdmin, async (req, res) => {
  const email = normalizeEmail(req.body?.email);
  const password = String(req.body?.password || '');
  const name = normalizeString(req.body?.name);
  const role = req.body?.role;
  if (!email || !password || !name) return res.status(400).json({ error: 'Data user tidak lengkap' });
  if (!isValidEmail(email)) return res.status(400).json({ error: 'Format email tidak valid' });
  if (password.length < 6) return res.status(400).json({ error: 'Password minimal 6 karakter' });
  if (role && !isValidRole(role)) return res.status(400).json({ error: 'Role tidak valid' });
  try {
    const hash = await bcrypt.hash(password, 10);
    const id = crypto.randomUUID();
    await pool.query(
      'INSERT INTO app_users (id, email, name, password_hash, role) VALUES ($1, $2, $3, $4, $5);',
      [id, email, name, hash, role || 'user']
    );
    res.json({ message: 'User created', id });
  } catch (error) {
    if (error.code === '23505') return res.status(400).json({ error: 'Email sudah terdaftar' });
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/users/:id', authMiddleware, requireSelfOrAdmin, async (req, res) => {
  const { id } = req.params;
  const name = req.body?.name != null ? normalizeString(req.body?.name) : null;
  const role = req.body?.role;
  const password = req.body?.password != null ? String(req.body?.password || '') : null;
  try {
    const updates = [];
    const params = [];
    let idx = 1;
    if (name) {
      updates.push(`name=$${idx++}`);
      params.push(name);
    }
    // Only admins can change roles.
    if (role != null && req.user?.role === 'admin') {
      if (!isValidRole(role)) return res.status(400).json({ error: 'Role tidak valid' });
      updates.push(`role=$${idx++}`);
      params.push(role);
    }
    if (password) {
      if (password.length < 6) return res.status(400).json({ error: 'Password minimal 6 karakter' });
      const hash = await bcrypt.hash(password, 10);
      updates.push(`password_hash=$${idx++}`);
      params.push(hash);
    }
    if (updates.length === 0) return res.status(400).json({ error: 'Tidak ada data yang diubah' });
    params.push(id);
    await pool.query(`UPDATE app_users SET ${updates.join(', ')} WHERE id=$${idx};`, params);
    res.json({ message: 'User updated' });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/users/:id', authMiddleware, requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM app_users WHERE id=$1;', [id]);
    res.json({ message: 'User deleted' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(PORT, () => {
  console.log(`API server listening on http://127.0.0.1:${PORT}`);
});
