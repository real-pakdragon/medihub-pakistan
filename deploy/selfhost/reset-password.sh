#!/usr/bin/env bash
# Sets a new admin password on the running website.
# Usage:  bash deploy/selfhost/reset-password.sh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

read -r -p "Admin email [admin@medihub.pk]: " EMAIL
EMAIL=${EMAIL:-admin@medihub.pk}

read -r -s -p "New password (at least 6 characters): " PASS
echo
read -r -s -p "Type the new password again: " PASS2
echo

if [ "$PASS" != "$PASS2" ]; then
  echo "The two passwords do not match. Nothing was changed."
  exit 1
fi

if [ "${#PASS}" -lt 6 ]; then
  echo "The password is too short (minimum 6 characters). Nothing was changed."
  exit 1
fi

sudo docker exec -e ADMIN_EMAIL="$EMAIL" -e ADMIN_PASSWORD="$PASS" medihub-api \
  node prisma/set-admin-password.js

echo
echo "Done. Use the new password at /admin/login"
