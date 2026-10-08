#!/usr/bin/env bash
# Setup awal VPS Ubuntu 24.04 untuk R9host
# Struktur:
#   /var/www/r9host/app      → kode aplikasi (git clone / update)
#   /var/www/r9host/storage  → upload persisten (tidak ikut git pull)
# Jalankan sebagai root: bash deploy/setup-vps.sh
set -euo pipefail

BASE_DIR="${BASE_DIR:-/var/www/r9host}"
APP_DIR="${APP_DIR:-${BASE_DIR}/app}"
STORAGE_DIR="${STORAGE_DIR:-${BASE_DIR}/storage/uploads}"
REPO_URL="${REPO_URL:-https://github.com/Rhyru9/TopupGames.git}"
DB_NAME="${DB_NAME:-r9host_topup}"
DB_USER="${DB_USER:-r9host}"
NODE_MAJOR="${NODE_MAJOR:-20}"

echo "==> Update paket sistem"
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get upgrade -y

echo "==> Install dependensi dasar"
apt-get install -y curl git nginx redis-server postgresql postgresql-contrib certbot python3-certbot-nginx ufw

echo "==> Node.js ${NODE_MAJOR}.x"
if ! command -v node >/dev/null 2>&1 || [[ "$(node -v | cut -d. -f1 | tr -d v)" -lt "${NODE_MAJOR}" ]]; then
  curl -fsSL "https://deb.nodesource.com/setup_${NODE_MAJOR}.x" | bash -
  apt-get install -y nodejs
fi

echo "==> PM2 global"
npm install -g pm2

echo "==> Redis & PostgreSQL aktif"
# Persist a generated password so rerunning bootstrap does not rotate Redis credentials.
REDIS_PASSWORD_FILE="/etc/redis/r9host-password"
if [[ ! -s "${REDIS_PASSWORD_FILE}" ]]; then
  (umask 077; openssl rand -hex 32 > "${REDIS_PASSWORD_FILE}")
fi
REDIS_APP_PASSWORD="$(cat "${REDIS_PASSWORD_FILE}")"
if [[ ! "${REDIS_APP_PASSWORD}" =~ ^[a-f0-9]{64}$ ]]; then
  echo "Invalid Redis bootstrap password file."
  exit 1
fi
sed -i '/^requirepass /d' /etc/redis/redis.conf
printf '\nrequirepass %s\n' "${REDIS_APP_PASSWORD}" >> /etc/redis/redis.conf
systemctl enable --now redis-server
systemctl restart redis-server
systemctl enable --now postgresql
systemctl enable --now nginx

echo "==> Firewall (SSH + Nginx)"
ufw allow OpenSSH
ufw allow "Nginx Full"
ufw --force enable || true

echo "==> Database (interaktif — siapkan password user DB)"
read -r -p "Password PostgreSQL untuk user '${DB_USER}': " DB_PASS
if [[ -z "${DB_PASS}" ]]; then
  echo "Password DB wajib diisi."
  exit 1
fi

sudo -u postgres psql -v ON_ERROR_STOP=1 -c "DO \$\$ BEGIN IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '${DB_USER}') THEN CREATE ROLE ${DB_USER} LOGIN PASSWORD '${DB_PASS}'; END IF; END \$\$;"
sudo -u postgres psql -v ON_ERROR_STOP=1 -c "SELECT 1 FROM pg_database WHERE datname = '${DB_NAME}'" | grep -q 1 || sudo -u postgres psql -v ON_ERROR_STOP=1 -c "CREATE DATABASE ${DB_NAME} OWNER ${DB_USER};"
sudo -u postgres psql -v ON_ERROR_STOP=1 -d "${DB_NAME}" -c "GRANT ALL ON SCHEMA public TO ${DB_USER};"

echo "==> Storage persisten: ${STORAGE_DIR}"
mkdir -p "${STORAGE_DIR}"
chmod -R 775 "${BASE_DIR}/storage"

if [[ -d "${APP_DIR}/storage/uploads" ]] && [[ -n "$(ls -A "${APP_DIR}/storage/uploads" 2>/dev/null)" ]]; then
  echo "Migrasi upload lama dari app/storage/uploads → ${STORAGE_DIR}"
  cp -a "${APP_DIR}/storage/uploads/." "${STORAGE_DIR}/"
fi

echo "==> Direktori aplikasi: ${APP_DIR}"
mkdir -p "${BASE_DIR}"
if [[ -d "${APP_DIR}/.git" ]]; then
  echo "Repo sudah ada — git pull"
  cd "${APP_DIR}"
  git pull --ff-only origin master || true
elif [[ -d "${APP_DIR}" ]] && [[ -n "$(ls -A "${APP_DIR}" 2>/dev/null)" ]] && [[ ! -d "${APP_DIR}/.git" ]]; then
  BACKUP="${APP_DIR}.bak.$(date +%Y%m%d%H%M%S)"
  echo "Folder ${APP_DIR} sudah berisi file (bukan git). Pindah ke ${BACKUP}"
  mv "${APP_DIR}" "${BACKUP}"
  git clone "${REPO_URL}" "${APP_DIR}"
  cd "${APP_DIR}"
else
  mkdir -p "${APP_DIR}"
  if [[ ! -d "${APP_DIR}/.git" ]]; then
    git clone "${REPO_URL}" "${APP_DIR}"
  fi
  cd "${APP_DIR}"
fi

if [[ ! -f .env ]]; then
  cp .env.example .env
  AUTH_SECRET="$(openssl rand -base64 32)"
  sed -i "s|^DATABASE_URL=.*|DATABASE_URL=\"postgresql://${DB_USER}:${DB_PASS}@127.0.0.1:5432/${DB_NAME}?schema=public\"|" .env
  sed -i "s|^AUTH_SECRET=.*|AUTH_SECRET=\"${AUTH_SECRET}\"|" .env
  sed -i 's|^AUTH_TRUST_HOST=.*|AUTH_TRUST_HOST="true"|' .env
  sed -i "s|^REDIS_URL=.*|REDIS_URL=\"redis://:${REDIS_APP_PASSWORD}@127.0.0.1:6379\"|" .env
  sed -i 's|^TRUST_PROXY_HEADERS=.*|TRUST_PROXY_HEADERS="true"|' .env
  sed -i "s|^UPLOAD_DIR=.*|UPLOAD_DIR=\"${STORAGE_DIR}\"|" .env
  sed -i 's|^PUBLIC_UPLOAD_URL=.*|PUBLIC_UPLOAD_URL="/uploads"|' .env
  echo ""
  echo "File .env dibuat. Edit APP_URL / domain jika perlu: nano ${APP_DIR}/.env"
else
  if ! grep -q "^UPLOAD_DIR=" .env; then
    echo "UPLOAD_DIR=\"${STORAGE_DIR}\"" >> .env
  fi
fi

# Existing installs also need the Redis URL to match requirepass.
if grep -q '^REDIS_URL=' .env; then
  sed -i "s|^REDIS_URL=.*|REDIS_URL=\"redis://:${REDIS_APP_PASSWORD}@127.0.0.1:6379\"|" .env
else
  printf '\nREDIS_URL="redis://:%s@127.0.0.1:6379"\n' "${REDIS_APP_PASSWORD}" >> .env
fi
chmod 600 .env

echo "==> Install & build aplikasi"
npm ci
npx prisma migrate deploy
npm run build

echo "==> PM2"
pm2 start deploy/ecosystem.config.cjs
pm2 save
pm2 startup systemd -u root --hp /root || true

echo ""
echo "Setup selesai."
echo "Struktur:"
echo "  App     → ${APP_DIR}"
echo "  Upload  → ${STORAGE_DIR}"
echo ""
echo "Langkah berikutnya:"
echo "  1. cd ${APP_DIR} && npm run admin:create"
echo "  2. Atur Nginx + SSL (deploy/nginx-r9host.conf)"
echo "  3. Isi URL website di Console → Pengaturan → Website"
