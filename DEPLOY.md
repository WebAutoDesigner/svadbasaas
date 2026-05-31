# Деплой Svadba Plus на VPS (85.239.59.252)

Рядом с cvit/berloga/42studio. Контейнеры: `svadba_app` (порт 3012), `svadba_pg` (5434).

## 0. Подготовка домена

1. Купить домен, A-запись `@` и `www` → `85.239.59.252`.
2. Дождаться DNS-пропагации (`nslookup домен`).

## 1. Доставка кода на сервер

```bash
ssh root@85.239.59.252
mkdir -p /root/svadba-src && cd /root/svadba-src
git clone https://github.com/WebAutoDesigner/svadbasaas.git .
# или rsync/sftp с локальной машины
```

## 2. Каталоги под файлы

```bash
mkdir -p /data/svadba-uploads && chmod 700 /data/svadba-uploads
mkdir -p /root/backups/svadba
```

## 3. Production .env

```bash
cp .env.production.example .env
nano .env   # заполнить пароли, BETTER_AUTH_SECRET (openssl rand -base64 32), домен, Yandex SMTP
```

## 4. Запуск контейнеров

```bash
docker compose -f docker/docker-compose.prod.yml --env-file .env up -d --build
docker exec svadba_app npx prisma migrate deploy
```

## 5. Первый супер-админ

```bash
docker exec -e DATABASE_URL="$(grep ^DATABASE_URL .env | cut -d= -f2-)" svadba_app \
  node -e "require('child_process')" 2>/dev/null || true
# проще — выполнить seed на хосте с пробросом DATABASE_URL на 127.0.0.1:5434:
DATABASE_URL="postgresql://svadba:ПАРОЛЬ@127.0.0.1:5434/svadba" npx tsx prisma/seed-super-admin.ts \
  --email you@example.com --password НАДЁЖНЫЙ_ПАРОЛЬ --name "Никита"
```

## 6. Caddy

Добавить блок в `/etc/caddy/Caddyfile` (см. `Caddyfile.example`, заменить домен):

```caddy
твой-домен.ru, www.твой-домен.ru {
    reverse_proxy 127.0.0.1:3012
    encode gzip zstd
    header {
        Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
        X-Frame-Options "SAMEORIGIN"
        X-Content-Type-Options "nosniff"
        -Server
    }
}
```

```bash
caddy reload --config /etc/caddy/Caddyfile
```

## 7. Бэкапы (cron)

```bash
chmod +x /root/svadba-src/scripts/backup-db.sh /root/svadba-src/scripts/backup-files.sh
crontab -e
```

```cron
0 3 * * *  cd /root/svadba-src && set -a && . ./.env && bash scripts/backup-db.sh
30 3 * * * cd /root/svadba-src && bash scripts/backup-files.sh
0 4 * * 0  cd /root/svadba-src && docker exec svadba_app npx tsx scripts/cleanup-orphan-files.ts
```

## 8. Мониторинг

- **Uptime Robot**: HTTPS-monitor на `https://домен/api/health` каждые 5 мин, алерт на email.
- (Опц.) **Sentry**: создать проект, вписать `SENTRY_DSN` в `.env`, передеплоить.

## 9. Smoke-тест

1. `https://домен/super-admin/login` → войти супер-админом.
2. Создать агентство → получить логин/пароль владельца.
3. `https://домен/login` → войти агентством → создать свадьбу.
4. Заполнить чек-лист/бюджет/подрядчиков, загрузить документ.
5. На свадьбе «Пригласить пару» → email.
6. `https://домен/couple/login` → ввести email → код (придёт письмом) → проверить ЛК пары.

## Обновление версии

```bash
cd /root/svadba-src && git pull
docker compose -f docker/docker-compose.prod.yml --env-file .env up -d --build
docker exec svadba_app npx prisma migrate deploy
```
