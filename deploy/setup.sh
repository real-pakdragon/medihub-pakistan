#!/usr/bin/env bash
# MediHub Pakistan — one-command EC2 deployment
# Installs Docker (if needed), pulls prebuilt images from Docker Hub,
# and starts Postgres + API + nginx web. Safe to re-run (idempotent).
set -euo pipefail

APP_DIR=/opt/medihub

[ "$(id -u)" -eq 0 ] || { echo "Run as root: sudo bash $0"; exit 1; }

echo "== [1/5] Installing Docker =="
command -v curl >/dev/null 2>&1 || {
  if command -v apt-get >/dev/null 2>&1; then apt-get update -y && apt-get install -y curl
  else dnf install -y curl || yum install -y curl; fi
}
if ! command -v docker >/dev/null 2>&1 || ! docker compose version >/dev/null 2>&1; then
  curl -fsSL https://get.docker.com | sh
fi
systemctl enable --now docker >/dev/null 2>&1 || true

echo "== [2/5] Adding swap (small instances) =="
MEM_MB=$(awk '/MemTotal/{print int($2/1024)}' /proc/meminfo)
if [ "$MEM_MB" -le 2500 ] && ! swapon --show 2>/dev/null | grep -q swap; then
  fallocate -l 2G /swapfile || dd if=/dev/zero of=/swapfile bs=1M count=2048 status=none
  chmod 600 /swapfile && mkswap -q /swapfile && swapon /swapfile
  grep -q '^/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
  echo "   2G swap enabled"
fi

echo "== [3/5] Writing configuration ($APP_DIR) =="
mkdir -p "$APP_DIR" && cd "$APP_DIR"

if [ ! -f .env ]; then
  JWT=$(openssl rand -hex 32 2>/dev/null || head -c 32 /dev/urandom | od -An -tx1 | tr -d ' \n')
  cat > .env <<EOF
JWT_SECRET=$JWT
EOF
  echo "   generated .env with random JWT_SECRET"
else
  echo "   keeping existing .env"
fi

cat > docker-compose.prod.yml <<'EOF'
name: medihub

x-logging: &logging
  driver: json-file
  options:
    max-size: "10m"
    max-file: "3"

services:
  db:
    image: docker.io/library/postgres:16-alpine
    container_name: medihub-db
    restart: unless-stopped
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: medihub
    volumes:
      - medihub_pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres -d medihub"]
      interval: 5s
      timeout: 5s
      retries: 10
    logging: *logging

  api:
    image: docker.io/irfanjat/medihub-api:latest
    container_name: medihub-api
    restart: unless-stopped
    environment:
      DATABASE_URL: postgresql://postgres:postgres@db:5432/medihub?schema=public
      CLIENT_ORIGIN: "http://3.239.246.221"
      JWT_SECRET: ${JWT_SECRET:?set JWT_SECRET in .env}
      PORT: "5000"
      MAIL_FROM: "MediHub Pakistan <no-reply@medihub.pk>"
      # SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASS: unset = emails logged to `docker logs medihub-api`
    volumes:
      - ./data/files:/app/data/files
    depends_on:
      db:
        condition: service_healthy
    logging: *logging

  web:
    image: docker.io/irfanjat/medihub-web:latest
    container_name: medihub-web
    restart: unless-stopped
    ports:
      - "80:8080"
    depends_on:
      - api
    logging: *logging

volumes:
  medihub_pgdata:
EOF

echo "== [4/5] Pulling images and starting stack =="
docker compose -f docker-compose.prod.yml pull --quiet
docker compose -f docker-compose.prod.yml up -d

echo "== [5/5] Waiting for the API =="
for i in $(seq 1 30); do
  if curl -fsS http://localhost/api/health >/dev/null 2>&1; then break; fi
  sleep 2
done

IP=$(curl -fsS --max-time 4 https://checkip.amazonaws.com 2>/dev/null || hostname -I | awk '{print $1}')
echo
echo "==============================================================="
echo " MediHub Pakistan is running"
echo "   Site : http://$IP"
echo "   Admin: http://$IP/admin/login  (admin@medihub.pk)"
echo "   Default admin password: ChangeMe!2024  -> change it after login,"
echo "   or set SEED_ADMIN_PASSWORD in .env before first DB seed."
echo
echo " Logs : docker compose -f $APP_DIR/docker-compose.prod.yml logs -f api"
echo " NOTE : open inbound TCP port 80 (HTTP) in this instance's"
echo "        security group, otherwise the site is unreachable."
echo "==============================================================="
