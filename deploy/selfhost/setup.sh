#!/usr/bin/env bash
# MediHub Pakistan - one-command setup for self-hosting on Fedora / Linux.
# Usage:  bash deploy/selfhost/setup.sh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

say()  { printf '\n\033[1;32m==> %s\033[0m\n' "$1"; }
warn() { printf '\n\033[1;33m!!  %s\033[0m\n' "$1"; }

# ---------------------------------------------------------------- 1. Docker
if ! command -v docker >/dev/null 2>&1; then
  say "Installing Docker (you may be asked for your password)"
  if command -v dnf >/dev/null 2>&1; then
    # Official Docker install script: works on Fedora and includes Compose.
    curl -fsSL https://get.docker.com | sudo sh
  elif command -v pacman >/dev/null 2>&1; then
    sudo pacman -S --needed --noconfirm docker docker-compose
  elif command -v apt-get >/dev/null 2>&1; then
    sudo apt-get update -y
    sudo apt-get install -y docker.io docker-compose-v2
  else
    warn "Could not detect your package manager."
    echo "   Install Docker manually, then run this script again."
    exit 1
  fi
fi

sudo systemctl enable --now docker >/dev/null 2>&1 || true

# Find a working compose command.
if docker compose version >/dev/null 2>&1; then
  COMPOSE=(sudo docker compose)
elif command -v docker-compose >/dev/null 2>&1; then
  COMPOSE=(sudo docker-compose)
else
  warn "Docker Compose is missing."
  echo "   Fedora:  sudo dnf install -y docker-compose-plugin"
  echo "   Then run this script again."
  exit 1
fi

# ---------------------------------------------------------------- 2. Swap
# The old PC has little RAM, so give it breathing room on disk.
RAM_MB=$(awk '/MemTotal/{print int($2/1024)}' /proc/meminfo)
if [ "$RAM_MB" -lt 8000 ] && [ ! -f /swapfile ]; then
  say "Adding 4 GB swap (this PC has ${RAM_MB} MB RAM)"
  sudo fallocate -l 4G /swapfile 2>/dev/null || sudo dd if=/dev/zero of=/swapfile bs=1M count=4096 status=none
  sudo chmod 600 /swapfile
  sudo mkswap -q /swapfile
  sudo swapon /swapfile
  grep -q '^/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab >/dev/null
fi

# ---------------------------------------------------------------- 3. Firewall
# Fedora enables firewalld. Open the website port (80) for other devices.
if command -v firewall-cmd >/dev/null 2>&1 && systemctl is-active --quiet firewalld 2>/dev/null; then
  say "Opening port 80 in the firewall"
  sudo firewall-cmd --permanent --add-service=http >/dev/null 2>&1 || true
  sudo firewall-cmd --reload >/dev/null 2>&1 || true
fi

# ---------------------------------------------------------------- 4. Folders + settings
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

# ---------------------------------------------------------------- 5. Build + start
say "Building and starting the website"
echo "   The first run can take 10-20 minutes on this PC. Please wait..."
"${COMPOSE[@]}" --env-file .env -f docker-compose.yml up -d --build

# ---------------------------------------------------------------- 6. Wait for it
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
  echo "   Admin password       : ChangeMe!2024   <-- change it with reset-password.sh"
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
