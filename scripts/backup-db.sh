#!/usr/bin/env bash
# Бэкап БД svadba: pg_dump из контейнера + ротация 7 дней.
# Cron: 0 3 * * *  /root/svadba-src/scripts/backup-db.sh
set -euo pipefail

BACKUP_DIR=/root/backups/svadba
CONTAINER=svadba_pg
DB_USER="${POSTGRES_USER:-svadba}"
DB_NAME="${POSTGRES_DB:-svadba}"
STAMP=$(date +%Y%m%d-%H%M%S)

mkdir -p "$BACKUP_DIR"
docker exec "$CONTAINER" pg_dump -U "$DB_USER" "$DB_NAME" | gzip > "$BACKUP_DIR/db-$STAMP.sql.gz"

# Ротация: оставить последние 7
ls -1t "$BACKUP_DIR"/db-*.sql.gz | tail -n +8 | xargs -r rm -f
echo "[backup-db] готово: db-$STAMP.sql.gz"
