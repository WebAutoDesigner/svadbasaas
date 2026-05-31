#!/usr/bin/env bash
# Бэкап загруженных документов + ротация 7 дней.
# Cron: 30 3 * * *  /root/svadba-src/scripts/backup-files.sh
set -euo pipefail

BACKUP_DIR=/root/backups/svadba
UPLOADS=/data/svadba-uploads
STAMP=$(date +%Y%m%d-%H%M%S)

mkdir -p "$BACKUP_DIR"
if [ -d "$UPLOADS" ]; then
  tar czf "$BACKUP_DIR/files-$STAMP.tar.gz" -C "$(dirname "$UPLOADS")" "$(basename "$UPLOADS")"
  ls -1t "$BACKUP_DIR"/files-*.tar.gz | tail -n +8 | xargs -r rm -f
  echo "[backup-files] готово: files-$STAMP.tar.gz"
else
  echo "[backup-files] папка $UPLOADS не найдена, пропуск"
fi
