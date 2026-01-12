BEGIN;

-- Seed demo untuk "Toko Besi"
-- Cara restore manual:
--   1) Pastikan database sudah ada (contoh: orderapp)
--   2) Jalankan:
--        psql -d orderapp -f seed-toko-besi.sql
--
-- Catatan:
-- - File ini juga membuat schema/table jika belum ada (aman untuk lokal/dev).
-- - Kalau mau reset total data, lihat blok DELETE/TRUNCATE di bawah (masih dikomentari).

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
  area TEXT NOT NULL DEFAULT '',
  status TEXT
);
ALTER TABLE salesmen ADD COLUMN IF NOT EXISTS area TEXT NOT NULL DEFAULT '';

CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE,
  name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sales (
  id TEXT PRIMARY KEY,
  salesman_name TEXT NOT NULL,
  salesman_id TEXT,
  customer_id TEXT REFERENCES customers(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  date TIMESTAMPTZ NOT NULL,
  total_amount NUMERIC NOT NULL
);
ALTER TABLE sales ADD COLUMN IF NOT EXISTS customer_id TEXT;
DO $$
BEGIN
  ALTER TABLE sales
    ADD CONSTRAINT sales_customer_id_fkey
    FOREIGN KEY (customer_id) REFERENCES customers(id)
    ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

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

-- Reset data (opsional, hati-hati!)
-- TRUNCATE TABLE sale_items RESTART IDENTITY CASCADE;
-- TRUNCATE TABLE sales RESTART IDENTITY CASCADE;
-- TRUNCATE TABLE products RESTART IDENTITY CASCADE;
-- TRUNCATE TABLE locations RESTART IDENTITY CASCADE;
-- TRUNCATE TABLE salesmen RESTART IDENTITY CASCADE;
-- TRUNCATE TABLE customers RESTART IDENTITY CASCADE;
-- TRUNCATE TABLE sessions RESTART IDENTITY CASCADE;
-- TRUNCATE TABLE app_users RESTART IDENTITY CASCADE;

-- User demo
-- Email: admin@tokobesi.local / Password: besi12345
-- Email: user@tokobesi.local  / Password: besi12345
INSERT INTO app_users (id, email, name, password_hash, role)
VALUES
  ('besi-user-admin', 'admin@tokobesi.local', 'Admin Toko Besi', '$2b$10$5s0qkSBxhmTLxpjBhAYe7uT5ZBqXOVLec/WvBsUCgEqnLAoRWI47a', 'admin'),
  ('besi-user-001', 'user@tokobesi.local', 'User Toko Besi', '$2b$10$5s0qkSBxhmTLxpjBhAYe7uT5ZBqXOVLec/WvBsUCgEqnLAoRWI47a', 'user')
ON CONFLICT (email) DO NOTHING;

-- Lokasi
INSERT INTO locations (id, name, code, address, type) VALUES
  ('loc-besi-001', 'Gudang Besi Utama', 'GDG-BESI', 'Jl. Industri Baja No. 7', 'warehouse'),
  ('loc-besi-002', 'Toko Besi Pusat', 'TOK-BESI', 'Jl. Raya Konstruksi No. 12', 'store'),
  ('loc-besi-003', 'Toko Besi Cabang', 'TOK-BESI-02', 'Jl. Perintis No. 88', 'store')
ON CONFLICT (code) DO NOTHING;

-- Produk toko besi
INSERT INTO products (id, name, code, price, stock, unit, location_id) VALUES
  ('prod-besi-001', 'Paku 1 inch', 'PKU-001', 28000, 200, 'kg', 'loc-besi-002'),
  ('prod-besi-002', 'Paku 2 inch', 'PKU-002', 30000, 180, 'kg', 'loc-besi-002'),
  ('prod-besi-003', 'Paku Beton 2 inch', 'PKB-002', 45000, 80, 'kg', 'loc-besi-002'),
  ('prod-besi-004', 'Paku Roofing', 'PKR-001', 38000, 90, 'kg', 'loc-besi-002'),
  ('prod-besi-005', 'Paku Bendrat (Kawat Ikat)', 'KWB-001', 22000, 300, 'kg', 'loc-besi-002'),
  ('prod-besi-006', 'Sekrup Gypsum 1 inch', 'SKG-001', 150, 10000, 'pcs', 'loc-besi-002'),
  ('prod-besi-007', 'Baut Hex M10 x 50', 'BHT-010', 2500, 2000, 'pcs', 'loc-besi-002'),
  ('prod-besi-008', 'Mur Hex M10', 'MRH-010', 800, 4000, 'pcs', 'loc-besi-002'),
  ('prod-besi-009', 'Dynabolt M10', 'DNB-010', 6500, 800, 'pcs', 'loc-besi-002'),
  ('prod-besi-010', 'Besi Siku 40x40x4mm (6m)', 'BSK-4040', 175000, 120, 'batang', 'loc-besi-001'),
  ('prod-besi-011', 'Besi Hollow 40x40x1.6mm (6m)', 'BHL-4040', 130000, 150, 'batang', 'loc-besi-001'),
  ('prod-besi-012', 'Plat Besi 1.2mm (1.2x2.4m)', 'PLT-012', 450000, 35, 'lembar', 'loc-besi-001'),
  ('prod-besi-013', 'Wiremesh M6 (2.1x5.4m)', 'WRM-006', 550000, 25, 'lembar', 'loc-besi-001'),
  ('prod-besi-014', 'Mata Gerinda Potong 4 inch', 'GRD-004', 15000, 500, 'pcs', 'loc-besi-003'),
  ('prod-besi-015', 'Elektroda Las RB-26 (2.6mm)', 'LAS-026', 65000, 120, 'kg', 'loc-besi-003')
ON CONFLICT (code) DO NOTHING;

-- Salesman
INSERT INTO salesmen (id, name, code, phone, area, status) VALUES
  ('sm-besi-001', 'Rizky Firmansyah', 'SM-BESI-01', '0812-1111-2222', 'Kota', 'active'),
  ('sm-besi-002', 'Siti Aisyah', 'SM-BESI-02', '0813-3333-4444', 'Kabupaten', 'active')
ON CONFLICT (code) DO NOTHING;

-- Customer (kontraktor/toko bangunan)
INSERT INTO customers (id, code, name, phone, address, status) VALUES
  ('cust-besi-001', 'CUST-BESI-001', 'CV Baja Abadi', '021-7001001', 'Jl. Proyek No. 3', 'active'),
  ('cust-besi-002', 'CUST-BESI-002', 'PT Konstruksi Maju', '021-7001002', 'Jl. Beton Raya No. 10', 'active'),
  ('cust-besi-003', 'CUST-BESI-003', 'Toko Bangunan Sejahtera', '021-7001003', 'Jl. Perumahan Baru Blok A1', 'active')
ON CONFLICT (code) DO NOTHING;

-- Penjualan demo
INSERT INTO sales (id, salesman_name, salesman_id, customer_id, customer_name, date, total_amount) VALUES
  ('sale-besi-001', 'Rizky Firmansyah', 'sm-besi-001', 'cust-besi-001', 'CV Baja Abadi', NOW() - INTERVAL '3 days', 770000),
  ('sale-besi-002', 'Siti Aisyah', 'sm-besi-002', 'cust-besi-002', 'PT Konstruksi Maju', NOW() - INTERVAL '1 days', 7400000),
  ('sale-besi-003', 'Rizky Firmansyah', 'sm-besi-001', 'cust-besi-003', 'Toko Bangunan Sejahtera', NOW() - INTERVAL '10 hours', 1950000)
ON CONFLICT (id) DO NOTHING;

-- Item penjualan (dibuat idempotent via WHERE NOT EXISTS per (sale_id, product_id))
INSERT INTO sale_items (sale_id, product_id, product_name, product_code, quantity, price, total)
SELECT 'sale-besi-001', 'prod-besi-003', 'Paku Beton 2 inch', 'PKB-002', 5, 45000, 225000
WHERE NOT EXISTS (SELECT 1 FROM sale_items WHERE sale_id='sale-besi-001' AND product_id='prod-besi-003');

INSERT INTO sale_items (sale_id, product_id, product_name, product_code, quantity, price, total)
SELECT 'sale-besi-001', 'prod-besi-005', 'Paku Bendrat (Kawat Ikat)', 'KWB-001', 10, 22000, 220000
WHERE NOT EXISTS (SELECT 1 FROM sale_items WHERE sale_id='sale-besi-001' AND product_id='prod-besi-005');

INSERT INTO sale_items (sale_id, product_id, product_name, product_code, quantity, price, total)
SELECT 'sale-besi-001', 'prod-besi-009', 'Dynabolt M10', 'DNB-010', 50, 6500, 325000
WHERE NOT EXISTS (SELECT 1 FROM sale_items WHERE sale_id='sale-besi-001' AND product_id='prod-besi-009');

INSERT INTO sale_items (sale_id, product_id, product_name, product_code, quantity, price, total)
SELECT 'sale-besi-002', 'prod-besi-010', 'Besi Siku 40x40x4mm (6m)', 'BSK-4040', 20, 175000, 3500000
WHERE NOT EXISTS (SELECT 1 FROM sale_items WHERE sale_id='sale-besi-002' AND product_id='prod-besi-010');

INSERT INTO sale_items (sale_id, product_id, product_name, product_code, quantity, price, total)
SELECT 'sale-besi-002', 'prod-besi-011', 'Besi Hollow 40x40x1.6mm (6m)', 'BHL-4040', 30, 130000, 3900000
WHERE NOT EXISTS (SELECT 1 FROM sale_items WHERE sale_id='sale-besi-002' AND product_id='prod-besi-011');

INSERT INTO sale_items (sale_id, product_id, product_name, product_code, quantity, price, total)
SELECT 'sale-besi-003', 'prod-besi-006', 'Sekrup Gypsum 1 inch', 'SKG-001', 2000, 150, 300000
WHERE NOT EXISTS (SELECT 1 FROM sale_items WHERE sale_id='sale-besi-003' AND product_id='prod-besi-006');

INSERT INTO sale_items (sale_id, product_id, product_name, product_code, quantity, price, total)
SELECT 'sale-besi-003', 'prod-besi-008', 'Mur Hex M10', 'MRH-010', 500, 800, 400000
WHERE NOT EXISTS (SELECT 1 FROM sale_items WHERE sale_id='sale-besi-003' AND product_id='prod-besi-008');

INSERT INTO sale_items (sale_id, product_id, product_name, product_code, quantity, price, total)
SELECT 'sale-besi-003', 'prod-besi-007', 'Baut Hex M10 x 50', 'BHT-010', 500, 2500, 1250000
WHERE NOT EXISTS (SELECT 1 FROM sale_items WHERE sale_id='sale-besi-003' AND product_id='prod-besi-007');

COMMIT;
