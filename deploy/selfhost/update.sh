#!/usr/bin/env bash
# Downloads the newest version from GitHub and restarts the website.
# Usage:  bash deploy/selfhost/update.sh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$REPO_DIR"

echo "Downloading the newest version..."
git pull

echo "Rebuilding and restarting..."
sudo docker compose --env-file deploy/selfhost/.env -f deploy/selfhost/docker-compose.yml up -d --build

echo "Done."
