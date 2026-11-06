#!/usr/bin/env bash
# Runs backup.sh automatically every night at 03:00 and at boot if a run was missed.
# Usage:  sudo bash deploy/selfhost/install-backup-timer.sh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

[ "$(id -u)" -eq 0 ] || {
  echo "Run this with sudo:  sudo bash $0"
  exit 1
}

echo "Creating the nightly backup service..."
cat > /etc/systemd/system/medihub-backup.service <<EOF
[Unit]
Description=MediHub backup (database + uploaded files)
After=docker.service
Requires=docker.service

[Service]
Type=oneshot
WorkingDirectory=$SCRIPT_DIR
ExecStart=/bin/bash $SCRIPT_DIR/backup.sh
EOF

echo "Creating the timer..."
cat > /etc/systemd/system/medihub-backup.timer <<EOF
[Unit]
Description=Run the MediHub backup every night

[Timer]
OnCalendar=*-*-* 03:00:00
Persistent=true
RandomizedDelaySec=300

[Install]
WantedBy=timers.target
EOF

systemctl daemon-reload
systemctl enable --now medihub-backup.timer

echo
echo "==============================================================="
echo " Automatic backups are on."
echo
echo "   Every night at 03:00 (and after boot if a run was missed)."
echo "   Keeps the newest 14 sets in:"
echo "     $SCRIPT_DIR/backups"
echo
echo "   Check it:      systemctl list-timers medihub-backup.timer"
echo "   Run one now:   sudo systemctl start medihub-backup.service"
echo "   See the log:   journalctl -u medihub-backup.service -n 30"
echo "==============================================================="
