#!/usr/bin/env bash
# Финал деплоя svadba-plus на VPS: миграции, сиды, RLS-роль, рестарт, смоук.
# Идемпотентный — безопасно гонять повторно. Запуск: bash deploy-finish.sh
set -uo pipefail
cd /root/svadba-src

echo "== 1. builder image (cache) =="
docker build -q --target builder -t svadba-builder -f docker/Dockerfile . || exit 1

NET=$(docker network ls --format '{{.Name}}' | grep _default | head -1)
echo "network: $NET"

echo "== 2. migrate deploy =="
docker run --rm --network "$NET" --env-file .env svadba-builder \
  npx prisma migrate deploy 2>&1 | grep -vE 'npm (notice|warn)' | tail -5
docker exec svadba_pg psql -U svadba -d svadba -tAc \
  "SELECT count(*) FROM pg_tables WHERE schemaname='public'" | xargs echo "tables:"

echo "== 3. seeds (super-admin + demo) =="
docker run --rm --network "$NET" --env-file .env svadba-builder \
  sh -c "npx tsx prisma/seed-super-admin.ts && npx tsx prisma/seed-demo.ts" \
  2>&1 | grep -vE 'npm (notice|warn)'

echo "== 4. RLS role svadba_app =="
if ! grep -q '^APP_DATABASE_URL=' .env; then
  APPPW=$(openssl rand -hex 16)
  docker exec svadba_pg psql -U svadba -d svadba -v ON_ERROR_STOP=1 \
    -c "CREATE ROLE svadba_app LOGIN PASSWORD '$APPPW' NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE" \
    -c "GRANT USAGE ON SCHEMA public TO svadba_app" \
    -c "GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO svadba_app" \
    -c "GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO svadba_app" \
    -c "GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO svadba_app" \
    -c "ALTER DEFAULT PRIVILEGES FOR ROLE svadba IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO svadba_app" \
    -c "ALTER DEFAULT PRIVILEGES FOR ROLE svadba IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO svadba_app" \
    && echo "APP_DATABASE_URL=postgresql://svadba_app:$APPPW@postgres:5432/svadba" >> .env \
    && echo "role created"
else
  echo "role already configured"
fi

echo "== 5. restart app =="
docker compose -f docker/docker-compose.prod.yml -f docker/compose.extra.yml \
  --env-file .env up -d app < /dev/null 2>&1 | tail -1

echo "== 6. smoke =="
sleep 6
for path in /login /couple/login; do
  echo "$path -> $(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:3012$path)"
done
echo DONE
