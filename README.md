
# Taking Order App

This is a code bundle for Taking Order App. The original project is available at https://www.figma.com/design/EqRH9tpiCel2bOaF4fbygv/Taking-Order-App.

## Running the code

Run `npm i` to install the dependencies.

Run `npm run dev` to start the development server.

## API server (Express + Postgres)

- Copy `.env.example` to `.env` and set `DB_*` sesuai Postgres kamu.
- Jalankan API: `npm run server` (default `http://127.0.0.1:3001`, script ini otomatis load `.env` via `node --env-file` / butuh Node 20.6+).
- Frontend pakai `VITE_API_URL` (default `http://127.0.0.1:3001`), jadi kalau server di port lain set di `.env`.

### Customer

- Halaman `Customer` ada di tab admin untuk CRUD master customer.
- Saat entry penjualan, customer bisa dipilih dari daftar (autocomplete) atau diketik manual.

### Seed admin (opsional, untuk lokal)

Kalau tabel `app_users` masih kosong dan kamu butuh akun admin awal, set:
- `SEED_ADMIN_EMAIL`
- `SEED_ADMIN_PASSWORD` (min 8 karakter)
- `SEED_ADMIN_NAME` (opsional)

Lalu start ulang `npm run server`.

## Seed data demo (SQL)

- `sample-data.sql`: contoh seed default.
- `seed-toko-besi.sql`: contoh seed untuk toko besi (paku, bendrat, besi, dll).
  
