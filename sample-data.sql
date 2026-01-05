BEGIN;

-- Pastikan schema/table sudah ada (kalau belum pernah menjalankan `npm run server`)
CREATE TABLE IF NOT EXISTS app_users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON sessions(user_id);
CREATE INDEX IF NOT EXISTS sessions_expires_at_idx ON sessions(expires_at);

CREATE TABLE IF NOT EXISTS locations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  address TEXT,
  type TEXT
);

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  price NUMERIC NOT NULL,
  stock INTEGER NOT NULL,
  unit TEXT NOT NULL,
  location_id TEXT REFERENCES locations(id)
);

CREATE TABLE IF NOT EXISTS salesmen (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  phone TEXT,
  status TEXT
);

CREATE TABLE IF NOT EXISTS sales (
  id TEXT PRIMARY KEY,
  salesman_name TEXT NOT NULL,
  salesman_id TEXT,
  customer_name TEXT NOT NULL,
  date TIMESTAMPTZ NOT NULL,
  total_amount NUMERIC NOT NULL
);

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

-- Hapus data lama (opsional, jalankan jika ingin mereset)
-- DELETE FROM sale_items;
-- DELETE FROM sales;
-- DELETE FROM products;
-- DELETE FROM locations;
-- DELETE FROM salesmen;
-- DELETE FROM app_users;

-- User sample (password: password123)
INSERT INTO app_users (id, email, name, password_hash, role)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'admin@example.com', 'Admin Sample', '$2b$10$VUej6RAMOLLZ.gpLSLNaPOQ0X6Kr9uU8Iz8HQodkXGoIoIQ2AZHcq', 'admin'),
  ('22222222-2222-2222-2222-222222222222', 'user@example.com', 'User Sample', '$2b$10$VUej6RAMOLLZ.gpLSLNaPOQ0X6Kr9uU8Iz8HQodkXGoIoIQ2AZHcq', 'user')
ON CONFLICT (id) DO NOTHING;

-- Lokasi
INSERT INTO locations (id, name, code, address, type) VALUES
  ('loc-001', 'Gudang Utama', 'GDG001', 'Jl. Raya Industri No.1', 'warehouse'),
  ('loc-002', 'Toko Pusat', 'TOK001', 'Jl. Merdeka No.10', 'store')
ON CONFLICT (id) DO NOTHING;

-- Produk
INSERT INTO products (id, name, code, price, stock, unit, location_id) VALUES
  ('prod-001', 'Mie Instan Goreng', 'MIG001', 3500, 500, 'pcs', 'loc-001'),
  ('prod-002', 'Mie Instan Kuah', 'MIK001', 3000, 450, 'pcs', 'loc-001'),
  ('prod-003', 'Kopi Sachet', 'KOP001', 2000, 800, 'pcs', 'loc-002'),
  ('prod-004', 'Teh Botol', 'TEH001', 5000, 300, 'botol', 'loc-002'),
  ('prod-005', 'Air Mineral 600ml', 'AIR001', 3500, 600, 'botol', 'loc-002')
ON CONFLICT (id) DO NOTHING;

-- Salesman
INSERT INTO salesmen (id, name, code, phone, status) VALUES
  ('sm-001', 'Budi Santoso', 'SM001', '081234567890', 'active'),
  ('sm-002', 'Agus Pratama', 'SM002', '081298765432', 'active')
ON CONFLICT (id) DO NOTHING;

-- Penjualan + item
INSERT INTO sales (id, salesman_name, salesman_id, customer_name, date, total_amount) VALUES
  ('sale-001', 'Budi Santoso', 'sm-001', 'PT Sinar Jaya', NOW() - INTERVAL '2 day', 120000),
  ('sale-002', 'Agus Pratama', 'sm-002', 'CV Makmur', NOW() - INTERVAL '1 day', 85000)
ON CONFLICT (id) DO NOTHING;

INSERT INTO sale_items (sale_id, product_id, product_name, product_code, quantity, price, total) VALUES
  ('sale-001', 'prod-001', 'Mie Instan Goreng', 'MIG001', 20, 3500, 70000),
  ('sale-001', 'prod-003', 'Kopi Sachet', 'KOP001', 25, 2000, 50000),
  ('sale-002', 'prod-004', 'Teh Botol', 'TEH001', 10, 5000, 50000),
  ('sale-002', 'prod-005', 'Air Mineral 600ml', 'AIR001', 10, 3500, 35000)
ON CONFLICT DO NOTHING;

COMMIT;
