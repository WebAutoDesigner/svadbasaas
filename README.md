# Svadba Plus

Vertical SaaS-платформа для свадебных агентств. Управление свадьбами, чек-листы, бюджет, подрядчики, документы, тайминг — и личный кабинет молодожёнов с прозрачным прогрессом.

**Спек:** `D:\claude\thoughts\shared\specs\2026-05-25-wedding-agency-saas.md`
**План:** `D:\claude\docs\superpowers\plans\2026-05-25-wedding-agency-mvp.md`
**Архитектурные правила:** [AGENTS.md](./AGENTS.md)

## Stack

Next.js 16 (App Router, TS strict) · Tailwind v4 · shadcn/ui · Prisma · Postgres 16 · Better-Auth · локальный FS (`/data/uploads`) · Yandex SMTP · Vitest · Docker · Caddy.

## Локальный запуск

```bash
# 1. Зависимости
npm install

# 2. Поднять Postgres локально (требуется Docker Desktop)
docker compose -f docker/docker-compose.dev.yml up -d

# 3. Накатить миграции (когда Prisma schema будет готова — Phase 2)
npx prisma migrate dev

# 4. Запустить dev-сервер
npm run dev
```

Открыть http://localhost:3000

## Тесты

```bash
npm test          # один прогон
npm run test:watch
```

## Production build (локально)

```bash
npm run build
```

## Деплой

Docker compose на VPS 85.239.59.252 (рядом с cvit/berloga/42studio), Caddy reverse-proxy с авто-SSL. Подробности — Phase 11 плана.
