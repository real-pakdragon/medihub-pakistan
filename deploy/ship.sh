#!/usr/bin/env bash
# One-command local deploy: build -> push to Docker Hub -> update EC2.
# Usage: bash deploy/ship.sh "optional note"
set -euo pipefail

export DOCKER_HOST=unix:///run/user/$UID/podman/podman.sock
HOST_KEY=${EC2_KEY:-$HOME/Downloads/mypair.pem}
EC2_HOST=${EC2_HOST:-ubuntu@3.239.246.221}
APP_DIR=/opt/medihub

cd "$(dirname "$0")/.."

echo "== Building images =="
docker compose -f docker-compose.yml build api web

echo "== Pushing to Docker Hub =="
docker tag medihub-api:latest docker.io/irfanjat/medihub-api:latest
docker tag medihub-web:latest docker.io/irfanjat/medihub-web:latest
docker push docker.io/irfanjat/medihub-api:latest
docker push docker.io/irfanjat/medihub-web:latest

echo "== Updating EC2 ($EC2_HOST) =="
ssh -i "$HOST_KEY" "$EC2_HOST" "cd $APP_DIR && sudo docker compose -f docker-compose.prod.yml pull && sudo docker compose -f docker-compose.prod.yml up -d --remove-orphans && sudo docker image prune -f"

echo
echo "== Health check =="
sleep 4
curl -fsS http://3.239.246.221/api/health && echo " <- API OK"
echo "Deploy complete ${1:+— $1}"
