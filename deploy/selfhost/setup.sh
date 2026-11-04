#!/usr/bin/env bash
# MediHub Pakistan - one-command setup for self-hosting on Manjaro / Arch Linux.
# Usage:  bash deploy/selfhost/setup.sh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

say()  { printf '\n\033[1;32m==> %s\033[0m\n' "$1"; }
warn() { printf '\n\033[1;33m!!  %s\033[0m\n' "$1"; }

# ---------------------------------------------------------------- 1. Docker
if ! command -v docker >/dev/null 2>&1; then
  say "Installing Docker (you may be asked for your password)"
  sudo pacman -Sy --needed --noconfirm docker docker-compose
  sudo systemctl enable --now docker
else
  sudo systemctl enable --now docker >/dev/null 2>&1 || true
fi

if ! docker compose version >/dev/null 2>&1; then
  warn "Docker Compose is missing."
  echo "   Install it with:  sudo pacman -S docker-compose"
  echo "   Then run this script again."
  exit 1
fi

# ---------------------------------------------------------------- 2. Swap
# The old PC has little RAM, so give it breathing room on disk.
MEM_MB=$(awk '/MemTotal/{print int($2/1024)}' /proc/meminfo)
if [ "$MEM_MB" -lt 8000 ] && ! swapon --show 2>/dev/null | grep -q .; then
  say "Adding 4 GB swap (this PC has ${MEM_MB} MB RAM)"
  sudo fallocate -l 4G /swapfile 2>/dev/null || sudo dd if=/dev/zero of=/swapfile bs=1M count=4096 status=none
  sudo chmod 600 /swapfile
  sudo mkswap -q /swapfile
  sudo swapon /swapfile
  grep -q '^/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab >/dev/null
fi

# ---------------------------------------------------------------- 3. Folders + settings
say "Creating folders"
mkdir -p data/files backups

if [ ! -f .env ]; then
  say "Creating settings file (.env)"
  JWT=$(openssl rand -hex 32 2>/dev/null || head -c 32 /dev/urandom | od -An -tx1 | tr -d ' \n')
  cat > .env <<EOF
JWT_SECRET=$JWT
SEED_ADMIN_EMAIL=admin@medihub.pk
SEED_ADMIN_PASSWORD=ChangeMe!2024
CLIENT_ORIGIN=http://localhost
WEB_APP_URL=http://localhost
API_URL=http://localhost
EOF
  chmod 600 .env
else
  say "Keeping the existing settings file (.env)"
fi

# ---------------------------------------------------------------- 4. Build + start
say "Building and starting the website"
echo "   The first run can take 10-20 minutes on this PC. Please wait..."
sudo docker compose --env-file .env -f docker-compose.yml up -d --build

# ---------------------------------------------------------------- 5. Wait for it
say "Waiting for the website to answer"
ok=0
for _ in $(seq 1 60); do
  if curl -fsS http://localhost/api/health >/dev/null 2>&1; then ok=1; break; fi
  sleep 3
done

IP=$(hostname -I 2>/dev/null | awk '{print $1}')
[ -n "${IP:-}" ] || IP="your-pc-ip"

echo
if [ "$ok" = "1" ]; then
  echo "==============================================================="
  echo " Website is running"
  echo
  echo "   On this PC          : http://localhost"
  echo "   On your Wi-Fi        : http://$IP"
  echo "   Admin login          : http://$IP/admin/login"
  echo "   Admin email          : admin@medihub.pk"
  echo "   Admin password       : ChangeMe!2024   <-- change it after login"
  echo
  echo "   Backup               : bash $SCRIPT_DIR/backup.sh"
  echo "   Stop                 : sudo docker compose -f $SCRIPT_DIR/docker-compose.yml down"
  echo "   Start again          : sudo docker compose -f $SCRIPT_DIR/docker-compose.yml up -d"
  echo "   View logs            : sudo docker compose -f $SCRIPT_DIR/docker-compose.yml logs -f api"
  echo "==============================================================="
else
  warn "The website did not answer yet."
  echo "   Check the error messages with:"
  echo "   sudo docker compose -f $SCRIPT_DIR/docker-compose.yml logs -f api"
  exit 1
fi
