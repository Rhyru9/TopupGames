#!/usr/bin/env bash
# Satu kali di VPS — agar git pull tanpa token (Deploy Key GitHub)
# Jalankan: bash deploy/setup-vps-git-ssh.sh
set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/r9host/app}"
REPO="git@github.com:Rhyru9/TopupGames.git"
KEY="$HOME/.ssh/github_r9host_deploy"

if [[ ! -d "${APP_DIR}/.git" ]]; then
  echo "Folder ${APP_DIR} belum git clone. Clone dulu."
  exit 1
fi

mkdir -p "$HOME/.ssh"
chmod 700 "$HOME/.ssh"

if [[ ! -f "${KEY}" ]]; then
  ssh-keygen -t ed25519 -C "vps-r9host-deploy" -f "${KEY}" -N ""
fi

if ! grep -q "Host github.com" "$HOME/.ssh/config" 2>/dev/null; then
  cat >> "$HOME/.ssh/config" <<EOF

Host github.com
  HostName github.com
  User git
  IdentityFile ${KEY}
  IdentitiesOnly yes
EOF
  chmod 600 "$HOME/.ssh/config"
fi

cd "${APP_DIR}"
git remote set-url origin "${REPO}"

echo ""
echo "=== TAMBAHKAN DEPLOY KEY INI DI GITHUB ==="
echo "Repo → Settings → Deploy keys → Add deploy key"
echo "Title: VPS r9host | Allow write: OFF (read-only cukup)"
echo ""
cat "${KEY}.pub"
echo ""
echo "Setelah deploy key ditambahkan, tes:"
echo "  cd ${APP_DIR} && git pull origin master"
echo ""
