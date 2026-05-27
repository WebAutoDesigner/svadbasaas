<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Svadba Plus — Project Rules

Vertical SaaS-платформа для свадебных агентств.
Спек: `D:\claude\thoughts\shared\specs\2026-05-25-wedding-agency-saas.md`
План: `D:\claude\docs\superpowers\plans\2026-05-25-wedding-agency-mvp.md`

## Stack

Next.js 16 (App Router, TS strict) · Tailwind v4 · shadcn/ui · Prisma · Postgres 16 · Better-Auth · локальный FS для файлов · Yandex SMTP · Vitest · Docker · Caddy.

## Architecture rules — НЕ нарушать

### 1. Multi-tenancy: всегда через `withAgency()` helper

Каждый запрос в БД должен быть отскоупирован по `agencyId`. Не использовать `db.X.findMany()` напрямую в route/Server Action — только через helper:

```ts
import { withAgency } from "@/lib/tenant";

export async function listWeddings() {
  return withAgency(({ agencyId, db }) =>
    db.wedding.findMany({ where: { agencyId } })
  );
}
```

Дополнительно — Postgres RLS на критичных таблицах как страховка.

### 2. Даты: UTC в БД, рендер через `date-fns-tz`

Всё в БД — UTC. У `wedding` есть поле `timezone`. На фронте — рендер через `date-fns-tz` с учётом TZ свадьбы. Никаких `new Date()` без явного TZ.

### 3. Формы: react-hook-form + Zod resolver, не сырой `<form>`

Одна Zod-схема используется в `<Form>` (resolver) и в API/Server Action (валидация). Источник правды — `lib/validators/`.

### 4. Mutations через Server Actions, не отдельные API routes

Server Action по умолчанию. API route — только когда нужен публичный HTTP-эндпоинт (webhook, файл-стрим, magic-link verification).

### 5. shadcn/ui компоненты из `components/ui/` — не писать свои

Если нужен компонент — добавить через `npx shadcn@latest add <name>`. Не дублировать.

### 6. Server-first, Client when needed

По умолчанию RSC. `"use client"` только при необходимости (hooks, state, browser API, event handlers).

### 7. Структура компонентов

- `components/ui/` — generic (от shadcn)
- `components/domain/` — бизнес (WeddingCard, ChecklistItem, BudgetRow)
- `app/.../components/` — page-specific (используется только в одном роуте)

Никаких `lib/components/shared/` свалок.

## Cross-cutting practices

- **Mobile-first** вёрстка (Tailwind базовый = телефон, `md:`/`lg:` для бόльших). Touch ≥ 44px. Никаких hover-only взаимодействий.
- **Skeleton loading states** (`<Skeleton>` из shadcn) для всех async загрузок
- **Toast уведомления** через `sonner` для всех мутаций ("Свадьба создана", "Ошибка сохранения")
- **Result type** или structured Errors вместо throw везде
- **Audit log** — каждое мутирующее действие пишется в `audit_log` (helper `lib/audit.ts`)

## Security — НЕ нарушать

- Rate-limit на login, magic-link request, contact form (5 попыток / 5 мин)
- Magic-link: 15 мин TTL, одноразовый, bcrypt-хэш кода в БД, lockout после 5 неверных
- File upload: проверка magic bytes (не только расширение), белый список mime, max 50 МБ
- IDOR: всегда проверять что user имеет доступ к ресурсу (через `withAgency` для агентства, `withCoupleSession` для пары)
- Никаких `dangerouslySetInnerHTML` от пользовательского контента
- `.env` в `.gitignore`, секреты только через env vars
- Bcrypt cost ≥ 12 (Better-Auth дефолт)

## Testing

- **Unit (Vitest):** валидаторы, утилы, чистые функции — 60% покрытия
- **Integration (Vitest + test DB):** API/Server Actions с реальной БД — 30% — самые ценные
- **E2E (Playwright):** критичные user flows — login, create wedding, couple view — 10%
- **Обязательны:** multi-tenancy isolation тест для каждой сущности, auth-flow тесты
- БД в тестах НЕ мокать. Реальная test-database (через Docker в CI).

## AI/Vibe-coding discipline

- **YAGNI жёсткое** — не добавлять фичи "на вырост". Только то что нужно сейчас.
- **DRY после 3-го раза** — сначала дублировать. После 3-го использования вынести в helper.
- **Не чинить симптомы** — если тест падает, пишется тест с reproduction и потом фикс.
- **Не моки вместо реальных запросов** — integration-тесты с real DB.
- **Не "улучшать" соседний код** — каждое изменение должно трейситься к задаче.

## Команды

```bash
npm run dev          # dev-сервер
npm run build        # production build (включает TS check)
npm test             # один прогон тестов
npm run test:watch   # watch mode
npm run lint         # ESLint
```

## Бизнес-правила

- **Биллинг НЕ в коде** — владелец продукта активирует агентства руками через супер-админку
- **Три зоны:** `/super-admin/*` · `/app/*` (агентство) · `/couple/*` (пара по magic link)
- **Soft delete** для свадеб (флаг `deletedAt`)
- **Cron cleanup** — раз в неделю удаляет файлы документов в БД помеченных как deleted старше 30 дней
