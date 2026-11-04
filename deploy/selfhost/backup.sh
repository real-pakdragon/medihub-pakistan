#!/usr/bin/env bash
# Makes one backup of the database and all uploaded files.
# Usage:  bash deploy/selfhost/backup.sh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

STAMP=$(date +%F-%H%M)
mkdir -p backups

echo "Backing up the database..."
sudo docker exec medihub-db pg_dump -U postgres medihub > "backups/database-$STAMP.sql"

echo "Backing up the uploaded files..."
tar czf "backups/files-$STAMP.tar.gz" -C data files

echo
echo "==============================================================="
echo " Backup finished. Two files were created:"
echo "   $SCRIPT_DIR/backups/database-$STAMP.sql"
echo "   $SCRIPT_DIR/backups/files-$STAMP.tar.gz"
echo
echo " Copy these two files somewhere safe (USB drive or cloud)."
echo "==============================================================="
