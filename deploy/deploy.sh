#!/usr/bin/env bash
# Update / redeploy setelah git push
# Hanya update /var/www/r9host/app — storage di ../storage tidak disentuh
# Jalankan: bash /var/www/r9host/app/deploy/deploy.sh
set -euo pipefail

BASE_DIR="${BASE_DIR:-/var/www/r9host}"
APP_DIR="${APP_DIR:-${BASE_DIR}/app}"
STORAGE_DIR="${STORAGE_DIR:-${BASE_DIR}/storage/uploads}"

cd "${APP_DIR}"

mkdir -p "${STORAGE_DIR}"
chmod -R 775 "${BASE_DIR}/storage" || true

echo "==> Git pull (app only)"
git fetch origin master
git reset --hard origin/master

echo "==> Install dependencies"
npm ci

echo "==> Stop PM2 (bebaskan koneksi DB sebelum migrate)"
pm2 stop all || true

echo "==> Database PostgreSQL siap (pool di aplikasi, tanpa restart DB)"

echo "==> Database migrate"
npx prisma migrate deploy

echo "==> Build"
npm run build

echo "==> Restart PM2"
pm2 reload deploy/ecosystem.config.cjs --update-env || pm2 start deploy/ecosystem.config.cjs
pm2 save

echo "Deploy selesai. Upload tetap di: ${STORAGE_DIR}"
pm2 status
