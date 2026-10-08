# R9host

Platform top up game dengan checkout, pembayaran DOKU, saldo dan poin member, voucher, flash sale, serta console admin.

Repository: [Rhyru9/TopupGames](https://github.com/Rhyru9/TopupGames).

## Stack

- Next.js 16, React 19, TypeScript, dan Tailwind CSS.
- Prisma 7 dengan PostgreSQL 16.
- Redis 8 dan BullMQ untuk antrean fulfillment.
- DOKU untuk pembayaran; SMTP untuk email transaksi.
- Docker Compose untuk PostgreSQL dan Redis lokal.

## Menjalankan proyek

Gunakan Node.js 22.12+ pada seri 22, atau Node.js 24+, npm, dan Docker Compose.

### 1. Siapkan environment

```bash
git clone https://github.com/Rhyru9/TopupGames.git
cd TopupGames
cp .env.example .env
```

Isi `POSTGRES_PASSWORD`, `REDIS_PASSWORD`, dan `AUTH_SECRET` dengan nilai baru. Samakan kredensial `DATABASE_URL` dengan variabel PostgreSQL, serta `REDIS_URL` dengan password Redis. Gunakan URL encoding untuk karakter khusus pada password di URL koneksi.

```bash
openssl rand -hex 32
openssl rand -base64 32
```

`.env`, backup, upload pengguna, dan hasil build tidak disertakan dalam repository.

### 2. Jalankan database dan Redis

```bash
docker compose up -d --wait
```

Database default bernama `r9host_topup`. PostgreSQL tersedia di `127.0.0.1:5432` dan Redis di `127.0.0.1:6379`; keduanya menggunakan password dan volume persisten.

Pada instalasi yang sudah berisi data, pertahankan volume yang digunakan. `POSTGRES_VOLUME_NAME` dan `REDIS_VOLUME_NAME` dapat menentukan volume yang sudah ada. Mengubah environment inisialisasi tidak otomatis mengganti user atau database pada volume lama.

### 3. Install dan terapkan migration

```bash
npm ci
npx prisma migrate deploy
npm run admin:create
```

`npm ci` juga menghasilkan Prisma Client. Perintah `admin:create` meminta nama, email, dan password secara interaktif. Untuk pengembangan schema baru, gunakan `npm run db:migrate`.

### 4. Jalankan web dan worker

```bash
npm run dev
```

Di terminal terpisah:

```bash
npm run worker:fulfillment
```

Buka [localhost:3000](http://localhost:3000). Console admin tersedia di `/console/login`.

Atur website, payment gateway DOKU, provider fulfillment, SMTP, dan penyimpanan upload melalui console sebelum menerima transaksi.

## Build produksi

```bash
npm run build -- --webpack
npm run start
```

Jalankan worker fulfillment sebagai proses terpisah. Panduan VPS, PM2, Nginx, dan cron tersedia di [deploy/DEPLOY.md](deploy/DEPLOY.md).

## Perintah operasional

| Perintah | Kegunaan |
| --- | --- |
| `npm run db:generate` | Menghasilkan ulang Prisma Client |
| `npm run db:studio` | Membuka Prisma Studio |
| `npm run db:seed` | Mengisi katalog contoh; gunakan pada database pengembangan |
| `npm run db:seed-articles` | Mengisi artikel contoh |
| `npm run cron:sku-availability` | Sinkronisasi ketersediaan SKU |
| `npm run cron:expire-unpaid` | Memproses invoice yang kedaluwarsa |
| `npm run lint` | Memeriksa source dengan ESLint |

## Pengujian

```bash
node --import tsx --test tests/checkout-security.test.ts
```

Tes integrasi checkout dan invoice tersedia di `tests/`. Tes tersebut memerlukan database terpisah bernama `r9host_checkout_audit` melalui `TEST_DATABASE_URL`; jangan gunakan database toko untuk menjalankan fixture pengujian.

## Struktur utama

```text
app/          Halaman, API, dan server actions
components/   Komponen storefront, member, dan console
lib/          Checkout, pembayaran, wallet, provider, dan konfigurasi
prisma/       Schema dan migration PostgreSQL
workers/      Worker fulfillment
scripts/      Admin, seed, cron, dan pembuatan ikon
public/       Aset statis R9host dan katalog
styles/       Style komponen dan halaman
tests/        Pengujian keamanan dan integrasi
deploy/       Konfigurasi dan skrip deployment VPS
```

## Lisensi

[MIT](LICENSE) — Copyright (c) 2026 rhyru9.
