# Deploy R9host → VPS (manual)

Auto-deploy GitHub Actions **dimatikan**. Update produksi cukup jalankan skrip di VPS setelah push ke `master`.

## Alur

```
1. git push origin master          (dari lokal)
2. SSH ke VPS
3. bash /var/www/r9host/app/deploy/deploy.sh
```

`deploy.sh` akan:
- `git pull` (reset ke `origin/master`)
- `npm ci`
- `prisma migrate deploy`
- `npm run build`
- `pm2 reload`

Upload di `/var/www/r9host/storage/uploads` **tidak disentuh**.

## Deploy sekarang

```bash
bash /var/www/r9host/app/deploy/deploy.sh
```

## Satu kali — siapkan VPS

### 1. Bootstrap server

Ikuti setup Node 20, PostgreSQL, Redis, PM2, Nginx, SSL.

Struktur:

```
/var/www/r9host/app/       ← git repo
/var/www/r9host/storage/   ← upload persisten
```

### 2. Deploy key GitHub (supaya `git pull` di VPS tanpa token)

Di VPS:

```bash
cd /var/www/r9host/app
bash deploy/setup-vps-git-ssh.sh
```

Copy **public key** yang muncul → GitHub repo → **Settings → Deploy keys → Add** (read-only).

Tes:

```bash
cd /var/www/r9host/app
git fetch origin master
```

## Cron SKU availability (VPS)

Jangan `curl` ke Next untuk cron produksi — sync memuat katalog provider ke memory proses web dan bisa memicu OOM/restart PM2.

Pakai CLI (setelah deploy):

```bash
crontab -e
```

```cron
*/30 * * * * cd /var/www/r9host/app && flock -n /tmp/r9host-sku-cron.lock timeout 25m npx tsx scripts/sync-sku-availability.ts >> /var/log/r9host-sku-cron.log 2>&1
```

`flock` mencegah dua sync jalan bersamaan, `timeout` mematikan proses yang macet.

Atau: `npm run cron:sku-availability` dari root app.

Endpoint HTTP `/api/cron/sku-availability` tetap ada untuk tes manual (response tanpa `items[]` penuh).

## Patch keamanan checkout

Terapkan migrasi `20261008010000_checkout_security` sebelum menjalankan kode baru. Invoice kini memerlukan sesi pemilik atau verifikasi email checkout; cron HTTP hanya menerima header `Authorization: Bearer ...`.

Redis production wajib AUTH: atur `requirepass`/ACL dan `REDIS_URL=redis://:PASSWORD@127.0.0.1:6379` pada web serta worker. Bootstrap VPS menghasilkan password persisten di `/etc/redis/r9host-password`; jangan menjalankan bootstrap hanya untuk update aplikasi. Ganti password contoh lokal sebelum deployment.

Set `TRUST_PROXY_HEADERS=true` setelah memasang Nginx yang menimpa X-Real-IP dan memastikan port Next hanya listen localhost. Jalankan cron expire-unpaid agar reservasi flash/voucher dan poin dilepas saat invoice kedaluwarsa. Pengujian regresi checkout tersedia di [tests](../tests/).

## Health check

```bash
curl -fsS https://r9host.com/api/health
```

Harus `{"ok":true,"db":true,...}`. Pantau juga `pm2 status` (restart count) setelah ganti cron.
