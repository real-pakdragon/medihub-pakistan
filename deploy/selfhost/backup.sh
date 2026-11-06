#!/usr/bin/env bash
# Makes one backup of the database and all uploaded files, then removes old ones.
# Usage:  bash deploy/selfhost/backup.sh
# Safe to run from a systemd timer (see install-backup-timer.sh).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Inside the systemd timer we already run as root.
SUDO=""
[ "$(id -u)" -eq 0 ] || SUDO="sudo"

KEEP=14 # how many daily backups to keep

STAMP=$(date +%F-%H%M)
mkdir -p backups

echo "Backing up the database..."
${SUDO} docker exec medihub-db pg_dump -U postgres medihub > "backups/database-$STAMP.sql"

echo "Backing up the uploaded files..."
${SUDO} tar czf "backups/files-$STAMP.tar.gz" -C data files

echo "Removing backups older than the last $KEEP..."
prune() {
  local pattern="$1"
  # shellcheck disable=SC2012
  ls -1t $pattern 2>/dev/null | tail -n +$((KEEP + 1)) | while read -r old; do
    rm -f "$old"
  done
}
prune "backups/database-*.sql"
prune "backups/files-*.tar.gz"

DB_SIZE=$(du -h "backups/database-$STAMP.sql" | cut -f1)
FILES_SIZE=$(du -h "backups/files-$STAMP.tar.gz" | cut -f1)

echo
echo "==============================================================="
echo " Backup finished ($(date '+%Y-%m-%d %H:%M'))"
echo "   backups/database-$STAMP.sql       ($DB_SIZE)"
echo "   backups/files-$STAMP.tar.gz       ($FILES_SIZE)"
echo "   Keeping the newest $KEEP sets."
echo
echo " Copy them off this PC occasionally (USB drive, Google Drive,"
echo " or pull them to your laptop with rsync/scp)."
echo "==============================================================="
