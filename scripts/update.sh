#!/usr/bin/env bash
# Обновление прод-версии svadba-plus на VPS: пересборка образа + миграции + пересев демо.
# Идемпотентно. Запуск: bash /root/update.sh
set -uo pipefail
cd /root/svadba-src
NET=docker_default

echo "== 1. rebuild app (new code) =="
docker compose -f docker/docker-compose.prod.yml -f docker/compose.extra.yml --env-file .env up -d --build app < /dev/null 2>&1 | tail -3

echo "== 2. builder image =="
docker build -q --target builder -t svadba-builder -f docker/Dockerfile . > /dev/null

echo "== 3. migrate deploy =="
docker run --rm --network "$NET" --env-file .env svadba-builder \
  npx prisma migrate deploy 2>&1 | grep -viE 'npm (notice|warn)' | tail -6

echo "== 4. seed demo (телефон+пароль) =="
docker run --rm --network "$NET" --env-file .env svadba-builder \
  npx tsx prisma/seed-demo.ts 2>&1 | grep -viE 'npm (notice|warn)' | tail -5

echo "== 5. smoke =="
sleep 6
for path in / /login /couple/login /super-admin/login; do
  echo "$path -> $(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:3012$path)"
done
echo DONE
