# Svadba Plus — 4 модуля: Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Добавить в Svadba Plus 4 модуля — Гости+RSVP, Рассадка, База подрядчиков агентства, События свадьбы — строго по утверждённым спекам в `docs/specs/2026-06-01-*.md`.

**Architecture:** Повторяем существующий per-wedding CRUD-паттерн (эталон — `lib/wedding/vendor.ts` + `app/app/weddings/[id]/vendors/*`): слой данных через `getDb()/tenantScope(agencyId)/assertWedding`, мутации через Server Actions с `requireAgencyContext`, Zod-валидаторы в `lib/validators/*` (без `import db`), RSC-страница + один client-board. Новое для проекта: (1) кабинет пары впервые получает право **писать** (гости, рассадка) — отдельный couple-write путь; (2) подсистема «пара внесла изменения» (бейдж + список непросмотренного).

**Tech Stack:** Next.js 16 (App Router, Server Actions), React 19, Prisma 7 + Postgres (адаптер pg, RLS через app.agency_id), Better-Auth (агентство), couple magic-link сессия, Tailwind v4, Vitest (реальная тест-БД), date-fns-tz.

---

## Принципы и правила (НЕ нарушать)

- **Multi-tenant:** каждая функция слоя данных — `tenantScope(agencyId, async () => { if (!(await assertWedding(agencyId, weddingId))) return ...; getDb()... })`. Никогда не импортировать `db` в слой per-wedding данных — только `getDb()`.
- **Couple-write путь:** пара авторизована через `requireCoupleForWedding(weddingId)`. У couple-сессии нет agencyId — берём его из свадьбы (`coupleAgencyId(weddingId)` helper, см. Task 0.3), затем зовём тот же слой данных с этим agencyId. RLS остаётся активной.
- **Валидаторы:** одна Zod-схема, в `lib/validators/*`, БЕЗ `import db` (иначе pg попадёт в браузерный бандл — грабля проекта).
- **Даты:** UTC в БД, рендер через `lib/dates.ts` (есть `parseDateInput`, `toDateInputValue`, `formatShortDate`).
- **TDD:** сначала падающий тест на слой данных (Vitest, реальная БД, паттерн `tests/vendor.test.ts`), потом реализация. UI тестами не покрываем (как и сейчас).
- **Mobile-first:** Tailwind базовый = телефон. ⚠️ Рассадка — назначение гостя за стол делаем **кликом/выбором**, не drag-and-drop (HTML5 DnD не работает на тач). Drag — опциональное desktop-улучшение (Task 2.7, можно пропустить).
- **Frequent commits:** коммит после каждой завершённой задачи. Формат как в репо. Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>.
- **После каждой миграции, добавляющей таблицу:** в DEPLOY.md уже есть `ALTER DEFAULT PRIVILEGES` для роли `svadba_app` — новые таблицы, созданные владельцем, покрываются автоматически. Проверить локально, что RLS-тест проходит.

---

## File Structure

### Module 1 — Гости + RSVP
- Create: `lib/validators/guest.ts` — Zod-схема + enum-метки (без db)
- Create: `lib/wedding/guest.ts` — слой данных (CRUD + summary), agency + couple варианты
- Create: `app/app/weddings/[id]/guests/actions.ts` — Server Actions (агентство)
- Create: `app/app/weddings/[id]/guests/page.tsx` — RSC
- Create: `app/app/weddings/[id]/guests/guests-board.tsx` — client board (таблица, быстрый ввод, фильтры, inline-статус)
- Create: `app/couple/[weddingId]/guests/page.tsx` — RSC (couple)
- Create: `app/couple/[weddingId]/guests/couple-guests-board.tsx` — client board (couple-версия)
- Create: `app/couple/[weddingId]/guests/actions.ts` — couple Server Actions
- Create: `tests/guest.test.ts`
- Modify: `prisma/schema.prisma` — модель `Guest`, enums `GuestStatus`/`GuestSide`
- Modify: `app/app/weddings/[id]/wedding-tabs.tsx` — добавить вкладку «Гости»
- Modify: `app/couple/[weddingId]/couple-nav.tsx` — добавить вкладку «Гости»

### Shared — Подсистема «изменения пары»
- Create: `lib/wedding/couple-activity.ts` — запись couple-правок + чтение непросмотренного + mark-seen
- Create: `app/app/weddings/[id]/couple-changes-badge.tsx` — client (показывает список, на mount зовёт mark-seen)
- Create: `app/app/weddings/[id]/mark-seen-action.ts` — Server Action mark-seen
- Modify: `prisma/schema.prisma` — модель `CoupleActivity`, enum `CoupleArea`, поля `Wedding.guestsSeenByAgencyAt`/`seatingSeenByAgencyAt`
- Create: `tests/couple-activity.test.ts`

### Module 2 — Рассадка
- Create: `lib/validators/seating.ts`
- Create: `lib/wedding/seating.ts` — столы CRUD + назначение гостя за стол (agency + couple)
- Create: `app/app/weddings/[id]/seating/actions.ts`
- Create: `app/app/weddings/[id]/seating/page.tsx`
- Create: `app/app/weddings/[id]/seating/seating-board.tsx`
- Create: `app/couple/[weddingId]/seating/page.tsx` + `couple-seating-board.tsx` + `actions.ts`
- Create: `tests/seating.test.ts`
- Modify: `prisma/schema.prisma` — модель `SeatingTable`, поле `Guest.tableId`
- Modify: оба nav-файла — вкладка «Рассадка»

### Module 3 — База подрядчиков агентства
- Create: `lib/validators/agency-vendor.ts`
- Create: `lib/agency/vendor-directory.ts` — слой данных (скоуп по agencyId, без weddingId)
- Create: `app/app/vendors/actions.ts`
- Create: `app/app/vendors/page.tsx`
- Create: `app/app/vendors/vendor-directory-board.tsx`
- Create: `tests/agency-vendor.test.ts`
- Modify: `prisma/schema.prisma` — модель `AgencyVendor`
- Modify: `app/app/weddings/[id]/vendors/vendors-board.tsx` — кнопка «Выбрать из базы» (префилл формы)
- Modify: `app/app/weddings/[id]/vendors/page.tsx` — передать список AgencyVendor в board
- Modify: `app/app/layout.tsx` (или общая агентская навигация) — ссылка на «Подрядчики»

### Module 4 — События свадьбы
- Create: `lib/validators/wedding-event.ts`
- Create: `lib/wedding/event.ts`
- Create: `app/app/weddings/[id]/events/actions.ts`
- Create: `app/app/weddings/[id]/events/page.tsx`
- Create: `app/app/weddings/[id]/events/events-board.tsx`
- Create: `app/couple/[weddingId]/schedule/page.tsx` — read-only «Расписание свадьбы»
- Create: `tests/wedding-event.test.ts`
- Modify: `prisma/schema.prisma` — модель `WeddingEvent`
- Modify: оба nav-файла — «События» (агентство) / «Расписание» (пара)
- Add: `lib/couple/data.ts` — `coupleVisibleEvents(weddingId)`

---

## Task 0 — Подготовка схемы и инфраструктуры

### Task 0.1: Prisma — все новые модели одной миграцией

**Files:** Modify `prisma/schema.prisma`

- [ ] **Step 1:** Добавить enums и модели (полный текст):

```prisma
enum GuestStatus {
  COMING
  NOT_COMING
  MAYBE
  NO_ANSWER
}

enum GuestSide {
  BRIDE
  GROOM
  COMMON
}

enum CoupleArea {
  GUESTS
  SEATING
}

model Guest {
  id         String       @id @default(cuid())
  weddingId  String
  wedding    Wedding      @relation(fields: [weddingId], references: [id], onDelete: Cascade)
  name       String
  status     GuestStatus  @default(NO_ANSWER)
  side       GuestSide?
  groupLabel String?
  tableId    String?
  table      SeatingTable? @relation(fields: [tableId], references: [id], onDelete: SetNull)
  sortOrder  Int          @default(0)
  createdAt  DateTime     @default(now())
  updatedAt  DateTime     @updatedAt

  @@index([weddingId])
  @@index([tableId])
}

model SeatingTable {
  id        String   @id @default(cuid())
  weddingId String
  wedding   Wedding  @relation(fields: [weddingId], references: [id], onDelete: Cascade)
  name      String
  capacity  Int      @default(0)
  sortOrder Int      @default(0)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  guests    Guest[]

  @@index([weddingId])
}

model CoupleActivity {
  id        String     @id @default(cuid())
  weddingId String
  wedding   Wedding    @relation(fields: [weddingId], references: [id], onDelete: Cascade)
  area      CoupleArea
  summary   String
  createdAt DateTime   @default(now())

  @@index([weddingId, area, createdAt])
}

model AgencyVendor {
  id        String   @id @default(cuid())
  agencyId  String
  agency    Agency   @relation(fields: [agencyId], references: [id], onDelete: Cascade)
  name      String
  service   String
  contact   String?
  link      String?
  priceNote String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([agencyId])
}

model WeddingEvent {
  id              String   @id @default(cuid())
  weddingId       String
  wedding         Wedding  @relation(fields: [weddingId], references: [id], onDelete: Cascade)
  title           String
  date            DateTime
  startMinutes    Int?
  description     String?
  visibleToCouple Boolean  @default(false)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([weddingId, date])
}
```

- [ ] **Step 2:** В модель `Wedding` добавить обратные связи и seen-поля:

```prisma
  // внутри model Wedding, рядом с остальными relation-полями:
  guests              Guest[]
  seatingTables       SeatingTable[]
  coupleActivities    CoupleActivity[]
  events              WeddingEvent[]
  guestsSeenByAgencyAt  DateTime?
  seatingSeenByAgencyAt DateTime?
```

- [ ] **Step 3:** В модель `Agency` добавить:

```prisma
  vendorDirectory AgencyVendor[]
```

- [ ] **Step 4:** Создать миграцию и сгенерировать клиент.

Run: `npx prisma migrate dev --name guests_seating_vendors_events`
Expected: миграция применена, `Generated Prisma Client`.

- [ ] **Step 5:** Прогнать существующие тесты — ничего не сломалось.

Run: `npm test`
Expected: все прежние тесты PASS (61).

- [ ] **Step 6:** Commit.

```bash
git add prisma/ && git commit -m "feat(db): схема для гостей, рассадки, базы подрядчиков, событий"
```

### Task 0.2: helper `coupleAgencyId` (для couple-write пути)

**Files:** Modify `lib/couple/data.ts`

- [ ] **Step 1:** Добавить функцию:

```ts
/** agencyId свадьбы — нужен couple-мутациям, чтобы звать tenant-слой данных. */
export async function coupleAgencyId(weddingId: string): Promise<string | null> {
  const w = await db.wedding.findFirst({
    where: { id: weddingId, deletedAt: null },
    select: { agencyId: true },
  });
  return w?.agencyId ?? null;
}
```

- [ ] **Step 2:** Commit.

```bash
git add lib/couple/data.ts && git commit -m "feat(couple): helper coupleAgencyId для couple-мутаций"
```

---

## Module 1 — Гости + RSVP

Спек: `docs/specs/2026-06-01-guests-rsvp-design.md`.

### Task 1.1: Валидатор гостя

**Files:** Create `lib/validators/guest.ts`

- [ ] **Step 1:** Полный файл:

```ts
import { z } from "zod";
import type { GuestStatus, GuestSide } from "@prisma/client";

export const guestStatusEnum = z.enum(["COMING", "NOT_COMING", "MAYBE", "NO_ANSWER"]);
export const guestSideEnum = z.enum(["BRIDE", "GROOM", "COMMON"]);

export const GUEST_STATUS_LABELS: Record<GuestStatus, string> = {
  COMING: "Придёт",
  NOT_COMING: "Не придёт",
  MAYBE: "Под вопросом",
  NO_ANSWER: "Не ответил",
};

export const GUEST_SIDE_LABELS: Record<GuestSide, string> = {
  BRIDE: "Невеста",
  GROOM: "Жених",
  COMMON: "Общие",
};

// Полная схема (создание/редактирование одного гостя)
export const guestSchema = z.object({
  name: z.string().min(1, "Введите имя").max(200),
  status: guestStatusEnum.default("NO_ANSWER"),
  side: guestSideEnum.optional().or(z.literal("")),
  groupLabel: z.string().max(120).optional().or(z.literal("")),
});
export type GuestInput = z.infer<typeof guestSchema>;

// Быстрый ввод — только имя
export const guestQuickSchema = z.object({ name: z.string().min(1).max(200) });

// Только статус (inline-смена)
export const guestStatusSchema = z.object({ status: guestStatusEnum });
```

- [ ] **Step 2:** Проверка типов. Run: `npx tsc --noEmit` → PASS.
- [ ] **Step 3:** Commit. `git add lib/validators/guest.ts && git commit -m "feat(guests): zod-валидатор"`

### Task 1.2: Слой данных — тест (падающий)

**Files:** Create `tests/guest.test.ts`

- [ ] **Step 1:** Написать тест по образцу `tests/vendor.test.ts` (тот же `setup`/`cleanup` с префиксом `guest-test-`, чистка `db.guest.deleteMany`):

```ts
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { createAgencyWithOwner } from "@/lib/agency/create";
import { createWedding } from "@/lib/wedding/wedding";
import { addGuest, listGuests, updateGuest, setGuestStatus, deleteGuest, guestsSummary } from "@/lib/wedding/guest";

const PREFIX = "guest-test-";
async function cleanup() {
  await db.guest.deleteMany({ where: { wedding: { agency: { name: { startsWith: PREFIX } } } } });
  await db.wedding.deleteMany({ where: { agency: { name: { startsWith: PREFIX } } } });
  await db.agencyMember.deleteMany({ where: { user: { email: { startsWith: PREFIX } } } });
  await db.account.deleteMany({ where: { user: { email: { startsWith: PREFIX } } } });
  await db.user.deleteMany({ where: { email: { startsWith: PREFIX } } });
  await db.agency.deleteMany({ where: { name: { startsWith: PREFIX } } });
}
async function setup(suffix: string) {
  const a = await createAgencyWithOwner({ agencyName: `${PREFIX}${suffix}`, ownerEmail: `${PREFIX}${suffix}@example.com`, ownerName: "Owner", ownerPassword: "password-123-456" });
  if (!a.ok) throw new Error("agency");
  const w = await createWedding(a.data.agencyId, { brideName: "Анна", groomName: "Пётр", date: "2026-08-15", timezone: "Europe/Moscow", budget: 0 });
  if (!w.ok) throw new Error("wedding");
  return { agencyId: a.data.agencyId, weddingId: w.data.id };
}

describe("guests", () => {
  beforeEach(cleanup);
  afterAll(cleanup);

  it("adds, lists, summarizes by status", async () => {
    const { agencyId, weddingId } = await setup("sum");
    await addGuest(agencyId, weddingId, { name: "Иван", status: "COMING" });
    await addGuest(agencyId, weddingId, { name: "Мария", status: "COMING" });
    await addGuest(agencyId, weddingId, { name: "Петя", status: "NO_ANSWER" });
    const s = await guestsSummary(agencyId, weddingId);
    expect(s.total).toBe(3);
    expect(s.coming).toBe(2);
    expect(s.noAnswer).toBe(1);
    expect(await listGuests(agencyId, weddingId)).toHaveLength(3);
  });

  it("updates status inline and full edit", async () => {
    const { agencyId, weddingId } = await setup("upd");
    const g = await addGuest(agencyId, weddingId, { name: "Иван" });
    if (!g.ok) throw new Error("add");
    expect((await setGuestStatus(agencyId, weddingId, g.data.id, "NOT_COMING")).ok).toBe(true);
    expect((await updateGuest(agencyId, weddingId, g.data.id, { name: "Иван И.", status: "COMING", side: "GROOM", groupLabel: "друзья" })).ok).toBe(true);
    const list = await listGuests(agencyId, weddingId);
    expect(list[0]!.side).toBe("GROOM");
  });

  it("blocks cross-agency access", async () => {
    const a = await setup("x1");
    const b = await setup("x2");
    const res = await addGuest(b.agencyId, a.weddingId, { name: "X" });
    expect(res.ok).toBe(false);
    expect(await listGuests(b.agencyId, a.weddingId)).toHaveLength(0);
  });
});
```

- [ ] **Step 2:** Run: `npm test -- guest` → FAIL (модуль `@/lib/wedding/guest` не существует).

### Task 1.3: Слой данных — реализация

**Files:** Create `lib/wedding/guest.ts`

- [ ] **Step 1:** Полный файл (зеркало `vendor.ts`, поля гостя; `side`/`groupLabel` → null если пусто):

```ts
import { getDb, tenantScope } from "@/lib/db";
import { err, ok, type Result } from "@/lib/result";
import { assertWedding } from "@/lib/wedding/guard";
import type { GuestStatus, GuestSide } from "@prisma/client";

export type GuestData = {
  name: string;
  status: GuestStatus;
  side?: GuestSide | undefined;
  groupLabel?: string | undefined;
};

export async function listGuests(agencyId: string, weddingId: string) {
  return tenantScope(agencyId, async () => {
    if (!(await assertWedding(agencyId, weddingId))) return [];
    return getDb().guest.findMany({
      where: { weddingId },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });
  });
}

export type GuestsSummary = { total: number; coming: number; notComing: number; maybe: number; noAnswer: number };

export async function guestsSummary(agencyId: string, weddingId: string): Promise<GuestsSummary> {
  return tenantScope(agencyId, async () => {
    const empty = { total: 0, coming: 0, notComing: 0, maybe: 0, noAnswer: 0 };
    if (!(await assertWedding(agencyId, weddingId))) return empty;
    const rows = await getDb().guest.groupBy({ by: ["status"], where: { weddingId }, _count: true });
    const out = { ...empty };
    for (const r of rows) {
      const n = r._count as number;
      out.total += n;
      if (r.status === "COMING") out.coming = n;
      else if (r.status === "NOT_COMING") out.notComing = n;
      else if (r.status === "MAYBE") out.maybe = n;
      else if (r.status === "NO_ANSWER") out.noAnswer = n;
    }
    return out;
  });
}

export async function addGuest(agencyId: string, weddingId: string, input: GuestData): Promise<Result<{ id: string }, "NOT_FOUND">> {
  return tenantScope(agencyId, async () => {
    if (!(await assertWedding(agencyId, weddingId))) return err("NOT_FOUND");
    const max = await getDb().guest.aggregate({ where: { weddingId }, _max: { sortOrder: true } });
    const g = await getDb().guest.create({
      data: {
        weddingId,
        name: input.name,
        status: input.status,
        side: input.side ?? null,
        groupLabel: input.groupLabel || null,
        sortOrder: (max._max.sortOrder ?? 0) + 1,
      },
    });
    return ok({ id: g.id });
  });
}

export async function updateGuest(agencyId: string, weddingId: string, guestId: string, input: GuestData): Promise<Result<true, "NOT_FOUND">> {
  return tenantScope(agencyId, async () => {
    if (!(await assertWedding(agencyId, weddingId))) return err("NOT_FOUND");
    const upd = await getDb().guest.updateMany({
      where: { id: guestId, weddingId },
      data: { name: input.name, status: input.status, side: input.side ?? null, groupLabel: input.groupLabel || null },
    });
    return upd.count === 0 ? err("NOT_FOUND") : ok(true);
  });
}

export async function setGuestStatus(agencyId: string, weddingId: string, guestId: string, status: GuestStatus): Promise<Result<true, "NOT_FOUND">> {
  return tenantScope(agencyId, async () => {
    if (!(await assertWedding(agencyId, weddingId))) return err("NOT_FOUND");
    const upd = await getDb().guest.updateMany({ where: { id: guestId, weddingId }, data: { status } });
    return upd.count === 0 ? err("NOT_FOUND") : ok(true);
  });
}

export async function deleteGuest(agencyId: string, weddingId: string, guestId: string): Promise<Result<true, "NOT_FOUND">> {
  return tenantScope(agencyId, async () => {
    if (!(await assertWedding(agencyId, weddingId))) return err("NOT_FOUND");
    const del = await getDb().guest.deleteMany({ where: { id: guestId, weddingId } });
    return del.count === 0 ? err("NOT_FOUND") : ok(true);
  });
}
```

- [ ] **Step 2:** Run: `npm test -- guest` → PASS.
- [ ] **Step 3:** Run: `npx tsc --noEmit` → PASS.
- [ ] **Step 4:** Commit. `git add lib/wedding/guest.ts tests/guest.test.ts && git commit -m "feat(guests): слой данных + тесты"`

### Task 1.4: Server Actions (агентство)

**Files:** Create `app/app/weddings/[id]/guests/actions.ts`

- [ ] **Step 1:** По образцу `vendors/actions.ts`. `requireAgencyContext()`, `normalize()` через `guestSchema`, экшены: `addGuestAction`, `quickAddGuestAction` (через `guestQuickSchema`, status NO_ANSWER), `updateGuestAction`, `setGuestStatusAction` (через `guestStatusSchema`), `deleteGuestAction`. Каждый `revalidatePath('/app/weddings/${weddingId}/guests')`. Полный код — зеркало vendor actions с полями гостя.
- [ ] **Step 2:** `npx tsc --noEmit` → PASS.
- [ ] **Step 3:** Commit. `git commit -am "feat(guests): server actions (агентство)"`

### Task 1.5: RSC-страница + client board (агентство)

**Files:** Create `app/app/weddings/[id]/guests/page.tsx`, `guests-board.tsx`

- [ ] **Step 1:** `page.tsx` — по образцу `vendors/page.tsx`: `requireAgencyContext`, `getWedding`, `notFound` если нет; `Promise.all([listGuests, guestsSummary, getUnseenCoupleChanges(agencyId, id, "GUESTS")])` (последнее — из Task S.2, см. ниже; до её выполнения передавать пустой массив). Передать в board.
- [ ] **Step 2:** `guests-board.tsx` (`"use client"`) по образцу `vendors-board.tsx`:
  - Счётчики сверху: Всего / Придут / Не придут / Под вопросом / Не ответили.
  - Быстрый ввод: `<input>` + Enter → `quickAddGuestAction`.
  - Список строк: имя · статус (через `<select>` inline → `setGuestStatusAction`) · сторона · группа; кнопки Изменить/Удалить.
  - Фильтры (client-side useState): по стороне, по группе.
  - Форма создания/редактирования (имя, статус, сторона select с пустым вариантом, группа).
  - Сверху — `<CoupleChangesBadge area="GUESTS" .../>` (Task S.3).
- [ ] **Step 3:** Добавить вкладку в `wedding-tabs.tsx`: `{ slug: "guests", label: "Гости" }` (после «Подрядчики»).
- [ ] **Step 4:** Запустить приложение, открыть `/app/weddings/<id>/guests`, проверить руками: добавить, сменить статус, отфильтровать, удалить. Run: `npm run dev`.
- [ ] **Step 5:** Commit. `git commit -am "feat(guests): экран агентства + вкладка"`

### Task 1.6: Couple-сторона (write)

**Files:** Create `app/couple/[weddingId]/guests/{page.tsx,couple-guests-board.tsx,actions.ts}`; Modify `couple-nav.tsx`

- [ ] **Step 1:** `actions.ts` (couple): каждый экшен — `requireCoupleForWedding(weddingId)` → `coupleAgencyId(weddingId)` (если null → ошибка) → вызвать тот же `lib/wedding/guest.ts` с этим agencyId → **записать couple-активность** `recordCoupleActivity(weddingId, "GUESTS", summary)` (Task S.1, summary вида `Добавлен гость: Иван`) → `revalidatePath('/couple/${weddingId}/guests')` и `revalidatePath('/app/weddings/${weddingId}/guests')`.
- [ ] **Step 2:** `page.tsx` — `requireCoupleForWedding`, `coupleGuests(weddingId)` (добавить в `lib/couple/data.ts`: findMany по weddingId), отрисовать couple-board.
- [ ] **Step 3:** `couple-guests-board.tsx` — как агентский board, но зовёт couple-экшены; без бейджа изменений.
- [ ] **Step 4:** `couple-nav.tsx` — вкладка `{ slug: "guests", label: "Гости" }`.
- [ ] **Step 5:** Руками: войти парой, добавить гостя; убедиться, что у агентства появился бейдж «пара внесла изменения» (после Task S.*).
- [ ] **Step 6:** Commit. `git commit -am "feat(guests): кабинет пары (запись) + couple-активность"`

---

## Shared — подсистема «изменения пары» (делать вместе с Module 1)

Спек-механизм: дедицированная таблица `CoupleActivity` (weddingId, area, summary, createdAt) + `Wedding.{guests,seating}SeenByAgencyAt`. Бейдж = записи area за период `createdAt > seenAt`. Открыл вкладку → seenAt=now.

### Task S.1: запись + чтение couple-активности — тест и реализация

**Files:** Create `lib/wedding/couple-activity.ts`, `tests/couple-activity.test.ts`

- [ ] **Step 1 (тест, падающий):** `tests/couple-activity.test.ts` — setup как в guest-тесте (префикс `cact-test-`):
  - `recordCoupleActivity(weddingId, "GUESTS", "Добавлен гость: Иван")` ×2;
  - `getUnseenCoupleChanges(agencyId, weddingId, "GUESTS")` → `{ count: 2, items: [..2..] }`;
  - `markCoupleChangesSeen(agencyId, weddingId, "GUESTS")`;
  - снова `getUnseenCoupleChanges` → `{ count: 0, items: [] }`.

  Run: `npm test -- couple-activity` → FAIL.

- [ ] **Step 2 (реализация):** полный файл:

```ts
import { db, getDb, tenantScope } from "@/lib/db";
import { assertWedding } from "@/lib/wedding/guard";
import type { CoupleArea } from "@prisma/client";

const SEEN_FIELD: Record<CoupleArea, "guestsSeenByAgencyAt" | "seatingSeenByAgencyAt"> = {
  GUESTS: "guestsSeenByAgencyAt",
  SEATING: "seatingSeenByAgencyAt",
};

/** Пишется из couple-мутаций. Без агентского контекста (пара) — глобальный db. */
export async function recordCoupleActivity(weddingId: string, area: CoupleArea, summary: string): Promise<void> {
  try {
    await db.coupleActivity.create({ data: { weddingId, area, summary } });
  } catch (e) {
    console.error("[couple-activity] failed", e);
  }
}

export type UnseenChanges = { count: number; items: { summary: string; createdAt: Date }[] };

export async function getUnseenCoupleChanges(agencyId: string, weddingId: string, area: CoupleArea): Promise<UnseenChanges> {
  return tenantScope(agencyId, async () => {
    if (!(await assertWedding(agencyId, weddingId))) return { count: 0, items: [] };
    const w = await getDb().wedding.findFirst({ where: { id: weddingId }, select: { [SEEN_FIELD[area]]: true } as never });
    const seenAt = (w as Record<string, Date | null> | null)?.[SEEN_FIELD[area]] ?? null;
    const where = { weddingId, area, ...(seenAt ? { createdAt: { gt: seenAt } } : {}) };
    const [count, items] = await Promise.all([
      getDb().coupleActivity.count({ where }),
      getDb().coupleActivity.findMany({ where, orderBy: { createdAt: "desc" }, take: 10, select: { summary: true, createdAt: true } }),
    ]);
    return { count, items };
  });
}

export async function markCoupleChangesSeen(agencyId: string, weddingId: string, area: CoupleArea): Promise<void> {
  await tenantScope(agencyId, async () => {
    if (!(await assertWedding(agencyId, weddingId))) return;
    await getDb().wedding.updateMany({ where: { id: weddingId }, data: { [SEEN_FIELD[area]]: new Date() } });
  });
}
```

- [ ] **Step 3:** Run: `npm test -- couple-activity` → PASS. `npx tsc --noEmit` → PASS.
- [ ] **Step 4:** Commit. `git commit -am "feat(couple-activity): запись и чтение непросмотренных правок пары"`

### Task S.2: подключить чтение в guests page

- [ ] **Step 1:** В `app/app/weddings/[id]/guests/page.tsx` добавить `getUnseenCoupleChanges(ctx.agencyId, id, "GUESTS")` в `Promise.all`, передать в board.
- [ ] **Step 2:** Commit. `git commit -am "feat(guests): показ непросмотренных правок пары"`

### Task S.3: бейдж + auto mark-seen

**Files:** Create `app/app/weddings/[id]/couple-changes-badge.tsx`, `mark-seen-action.ts`

- [ ] **Step 1:** `mark-seen-action.ts`:

```ts
"use server";
import { requireAgencyContext } from "@/lib/tenant";
import { markCoupleChangesSeen } from "@/lib/wedding/couple-activity";
import type { CoupleArea } from "@prisma/client";

export async function markSeenAction(weddingId: string, area: CoupleArea): Promise<void> {
  const ctx = await requireAgencyContext();
  await markCoupleChangesSeen(ctx.agencyId, weddingId, area);
}
```

- [ ] **Step 2:** `couple-changes-badge.tsx` (`"use client"`): принимает `weddingId`, `area`, `unseen: UnseenChanges`. Держит `unseen` в локальном state (чтобы список не исчезал при mark-seen). На `useEffect`(mount) — если `count>0` зовёт `markSeenAction(weddingId, area)`. Рендерит блок «⚠ Пара внесла N изменений» + список `items[].summary`. Если count=0 — ничего.
- [ ] **Step 3:** Встроить `<CoupleChangesBadge>` в `guests-board.tsx`.
- [ ] **Step 4:** Руками: пара меняет → агентство видит бейдж со списком; обновил страницу второй раз → бейдж пуст.
- [ ] **Step 5:** Commit. `git commit -am "feat(couple-activity): бейдж изменений пары + auto mark-seen"`

---

## Module 2 — Рассадка

Спек: `docs/specs/2026-06-01-seating-design.md`. Назначение — кликом (mobile-first), не drag.

### Task 2.1: Валидатор стола

**Files:** Create `lib/validators/seating.ts`

- [ ] **Step 1:**

```ts
import { z } from "zod";
export const tableSchema = z.object({
  name: z.string().min(1, "Введите название").max(120),
  capacity: z.coerce.number().int().min(0).max(100).default(0),
});
export type TableInput = z.infer<typeof tableSchema>;
```

- [ ] **Step 2:** Commit. `git commit -am "feat(seating): валидатор стола"`

### Task 2.2: Слой данных — тест (падающий)

**Files:** Create `tests/seating.test.ts` (префикс `seat-test-`)

- [ ] **Step 1:** Тест: `addTable`, `listTables`, `assignGuestToTable(agencyId, weddingId, guestId, tableId)`, `unassignGuest(...,guestId)`, `renameTable`/`updateTable`, `deleteTable` (после удаления стола гость → tableId null, проверить), cross-agency блок. Использовать `addGuest` из Module 1 для подготовки гостей.

  Run: `npm test -- seating` → FAIL.

### Task 2.3: Слой данных — реализация

**Files:** Create `lib/wedding/seating.ts`

- [ ] **Step 1:** Функции (полный код, паттерн как vendor/guest):
  - `listTables(agencyId, weddingId)` — столы + `include: { guests: { select: { id, name, status, side, groupLabel } } }`, orderBy sortOrder.
  - `listSeatableGuests(agencyId, weddingId)` — все гости (для пула); фильтр «только придут» делаем на клиенте.
  - `addTable / updateTable / deleteTable` — как vendor CRUD (deleteTable: `guest.updateMany({where:{tableId}, data:{tableId:null}})` затем `table.deleteMany`).
  - `assignGuestToTable(agencyId, weddingId, guestId, tableId)` — проверить `assertWedding`; проверить что стол принадлежит свадьбе (`table.findFirst({id:tableId, weddingId})`); `guest.updateMany({ where:{id:guestId, weddingId}, data:{ tableId } })`.
  - `unassignGuest(agencyId, weddingId, guestId)` — `data:{ tableId: null }`.
  - Все — внутри `tenantScope`. Возврат `Result<..., "NOT_FOUND">`.
- [ ] **Step 2:** Run: `npm test -- seating` → PASS. `npx tsc --noEmit` → PASS.
- [ ] **Step 3:** Commit. `git commit -am "feat(seating): слой данных + тесты"`

### Task 2.4: Server Actions (агентство)

**Files:** Create `app/app/weddings/[id]/seating/actions.ts`

- [ ] **Step 1:** `addTableAction`, `updateTableAction`, `deleteTableAction`, `assignGuestAction(weddingId, guestId, tableId)`, `unassignGuestAction(weddingId, guestId)`. Все `requireAgencyContext`, revalidate `/seating`.
- [ ] **Step 2:** `npx tsc --noEmit` → PASS. Commit.

### Task 2.5: Экран агентства (доска столов, клик-назначение)

**Files:** Create `seating/page.tsx`, `seating-board.tsx`; Modify `wedding-tabs.tsx`, подключить `CoupleChangesBadge area="SEATING"`

- [ ] **Step 1:** `page.tsx`: `Promise.all([listTables, listSeatableGuests, getUnseenCoupleChanges(...,"SEATING")])`.
- [ ] **Step 2:** `seating-board.tsx`:
  - Слева пул «не рассажены» (гости с `tableId == null`): чекбокс «только придут» (client-фильтр status==COMING), у каждого — статус/сторона/группа, кнопка «За стол ▾» (выпадающий список столов → `assignGuestAction`).
  - Справа карточки столов: название, `занято/capacity` (подсветка ⚠ если `> capacity`), список гостей с кнопкой «убрать» (`unassignGuestAction`). Кнопки «+ добавить стол», переименовать/мест/удалить.
  - Счётчики сверху: столов, рассажено/всего.
  - Бейдж `CoupleChangesBadge area="SEATING"`.
- [ ] **Step 3:** Вкладка «Рассадка» в `wedding-tabs.tsx`.
- [ ] **Step 4:** Руками проверить назначение/снятие/переполнение.
- [ ] **Step 5:** Commit. `git commit -am "feat(seating): доска столов (агентство)"`

### Task 2.6: Couple-сторона рассадки (write)

**Files:** Create `app/couple/[weddingId]/seating/{page.tsx,couple-seating-board.tsx,actions.ts}`; Modify `couple-nav.tsx`; add `coupleTables` в `lib/couple/data.ts`

- [ ] **Step 1:** couple actions — как в Task 1.6: `requireCoupleForWedding` → `coupleAgencyId` → слой данных → `recordCoupleActivity(weddingId, "SEATING", summary)` → revalidate обоих путей.
- [ ] **Step 2:** couple board — те же карточки/пул, зовёт couple-экшены, без бейджа.
- [ ] **Step 3:** Вкладка в `couple-nav.tsx`. Commit. `git commit -am "feat(seating): кабинет пары (запись)"`

### Task 2.7 (ОПЦИОНАЛЬНО, desktop-enhancement): drag-and-drop

- [ ] HTML5 DnD поверх клик-механики: `draggable` на госте пула, `onDrop` на карточке стола → тот же `assignGuestAction`. На тач не работает — клик остаётся основным. Делать только если останется время. Commit отдельно.

---

## Module 3 — База подрядчиков агентства

Спек: `docs/specs/2026-06-01-vendor-directory-design.md`. Скоуп по agencyId (не per-wedding). Связь со свадьбой — только префилл (копия).

### Task 3.1: Валидатор

**Files:** Create `lib/validators/agency-vendor.ts`

```ts
import { z } from "zod";
export const agencyVendorSchema = z.object({
  name: z.string().min(1, "Введите имя").max(200),
  service: z.string().min(1, "Укажите услугу").max(120),
  contact: z.string().max(300).optional().or(z.literal("")),
  link: z.string().max(500).optional().or(z.literal("")),
  priceNote: z.string().max(200).optional().or(z.literal("")),
});
export type AgencyVendorInput = z.infer<typeof agencyVendorSchema>;
```

- [ ] Commit.

### Task 3.2: Слой данных — тест + реализация

**Files:** Create `lib/agency/vendor-directory.ts`, `tests/agency-vendor.test.ts` (префикс `avd-test-`)

- [ ] **Step 1 (тест, падающий):** `listAgencyVendors(agencyId, {search?, service?})`, `addAgencyVendor`, `updateAgencyVendor`, `deleteAgencyVendor`; cross-agency: B не видит/не правит подрядчика A.
- [ ] **Step 2 (реализация):** скоуп по agencyId через `tenantScope(agencyId, ...)` + `getDb().agencyVendor`. БЕЗ assertWedding (это не per-wedding). `where: { agencyId, ...(search ? { name: { contains: search, mode: "insensitive" } } : {}), ...(service ? { service } : {}) }`. Мутации — `updateMany/deleteMany` с `where:{ id, agencyId }`.
- [ ] **Step 3:** Run `npm test -- agency-vendor` → PASS. Commit.

### Task 3.3: Server Actions + экран агентства

**Files:** Create `app/app/vendors/{actions.ts,page.tsx,vendor-directory-board.tsx}`; Modify `app/app/layout.tsx` (ссылка на «Подрядчики» в шапке агентства)

- [ ] **Step 1:** actions — `requireAgencyContext`, CRUD, revalidate `/app/vendors`.
- [ ] **Step 2:** page — `listAgencyVendors(ctx.agencyId)`, search через `searchParams`.
- [ ] **Step 3:** board — таблица (имя·тип·контакт·ссылка·прайс), поиск, фильтр по типу, CRUD-форма (паттерн vendors-board).
- [ ] **Step 4:** Ссылка «Подрядчики» в агентской навигации (`app/app/layout.tsx` — посмотреть как сделана ссылка на /app/team, добавить рядом).
- [ ] **Step 5:** Руками. Commit. `git commit -am "feat(vendor-directory): раздел агентства"`

### Task 3.4: Префилл из базы в форме подрядчика свадьбы

**Files:** Modify `app/app/weddings/[id]/vendors/page.tsx`, `vendors-board.tsx`

- [ ] **Step 1:** В `page.tsx` дополнительно `listAgencyVendors(ctx.agencyId)` → передать `directory` в board.
- [ ] **Step 2:** В `VendorForm` (vendors-board) — `<select>` «Выбрать из базы»: при выборе подставляет `name/service/contact` (и `link`→в note? нет — у wedding-Vendor нет поля link; подставляем только name/service/contact). Это чистый client-префилл значений формы (управляемые поля или `ref`), сабмит — прежним `addVendorAction`. Никаких изменений схемы/связей.
- [ ] **Step 3:** Руками: на свадьбе выбрать из базы → поля заполнились → сохранить. Commit. `git commit -am "feat(vendor-directory): префилл в форме подрядчика свадьбы"`

---

## Module 4 — События свадьбы

Спек: `docs/specs/2026-06-01-wedding-events-design.md`. Per-wedding, агентство пишет, пара видит только `visibleToCouple`.

### Task 4.1: Валидатор

**Files:** Create `lib/validators/wedding-event.ts`

```ts
import { z } from "zod";
export const weddingEventSchema = z.object({
  title: z.string().min(1, "Введите название").max(200),
  date: z.string().min(1, "Укажите дату"), // YYYY-MM-DD
  time: z.string().optional().or(z.literal("")), // HH:MM
  description: z.string().max(2000).optional().or(z.literal("")),
  visibleToCouple: z.coerce.boolean().default(false),
});
export type WeddingEventInput = z.infer<typeof weddingEventSchema>;
```

- [ ] Commit.

### Task 4.2: Слой данных — тест + реализация

**Files:** Create `lib/wedding/event.ts`, `tests/wedding-event.test.ts` (префикс `wev-test-`)

- [ ] **Step 1 (тест):** `addEvent` (date "2026-10-20", time "14:00" → startMinutes 840), `listEvents` (сорт по date asc, затем startMinutes), `updateEvent`, `deleteEvent`, `listVisibleEvents` (только visibleToCouple), cross-agency блок.
- [ ] **Step 2 (реализация):** конвертация: `date` → `parseDateInput(date)` (UTC-полночь, из `lib/dates.ts`); `time "HH:MM"` → `startMinutes = h*60+m` или null. Сорт `orderBy: [{date:"asc"},{startMinutes:"asc"}]`. `EventData = { title, date: string, startMinutes: number|null, description?, visibleToCouple }` — конвертацию строки даты делать в слое данных (как `createWedding` принимает строку даты — свериться с `lib/wedding/wedding.ts`). `listVisibleEvents(weddingId)` — глобальный db (для пары, без agency-контекста) `where:{ weddingId, visibleToCouple:true }`.
- [ ] **Step 3:** Run `npm test -- wedding-event` → PASS. Commit.

### Task 4.3: Server Actions + экран агентства

**Files:** Create `app/app/weddings/[id]/events/{actions.ts,page.tsx,events-board.tsx}`; Modify `wedding-tabs.tsx`

- [ ] **Step 1:** actions — CRUD, `requireAgencyContext`, revalidate.
- [ ] **Step 2:** page — `listEvents(ctx.agencyId, id)`.
- [ ] **Step 3:** board — список, сортировка ближайшие сверху (прошедшие — `daysUntil(date) < 0` → приглушить класс `opacity-60`, ниже). Бейдж видимости 🔒/👁. Форма: название, дата (date-input), время (time-input, опц.), описание (textarea), чекбокс «Показать паре». Рендер даты — `formatShortDate`, время — из startMinutes.
- [ ] **Step 4:** Вкладка «События» в `wedding-tabs.tsx`. Руками. Commit. `git commit -am "feat(events): экран агентства"`

### Task 4.4: Couple «Расписание свадьбы» (read-only)

**Files:** Create `app/couple/[weddingId]/schedule/page.tsx`; Modify `couple-nav.tsx`; add `coupleVisibleEvents` в `lib/couple/data.ts`

- [ ] **Step 1:** `lib/couple/data.ts`: `coupleVisibleEvents(weddingId)` → `db.weddingEvent.findMany({ where:{ weddingId, visibleToCouple:true }, orderBy:[{date:"asc"},{startMinutes:"asc"}] })`.
- [ ] **Step 2:** `schedule/page.tsx` — `requireCoupleForWedding`, рендер списка read-only (название, дата+время, описание). Пусто → «Расписание появится позже».
- [ ] **Step 3:** Вкладка `{ slug:"schedule", label:"Расписание" }` в `couple-nav.tsx`. Commit. `git commit -am "feat(events): расписание в кабинете пары"`

---

## Финальная проверка

- [ ] **Step 1:** `npm test` — все тесты PASS (старые 61 + новые: guest, couple-activity, seating, agency-vendor, wedding-event).
- [ ] **Step 2:** `npm run build` — production build (включает tsc) PASS.
- [ ] **Step 3:** RLS-страховка: добавить в `tests/cross-tenant-isolation.test.ts` проверки для Guest / SeatingTable / WeddingEvent / AgencyVendor (по образцу существующих) — чужое агентство не достаёт. PASS.
- [ ] **Step 4:** Обновить `app/app/weddings/[id]/page.tsx` (обзор) — при желании добавить мини-счётчик гостей (опционально, YAGNI — только если просто).
- [ ] **Step 5:** Финальный commit + push в main.

---

## Self-Review (выполнено при написании плана)

1. **Spec coverage:** Гости(M1)·Рассадка(M2)·Подрядчики(M3)·События(M4) — каждый спек покрыт задачами; «изменения пары» из спеков гостей/рассадки → Shared S.1–S.3; couple-write (новое) → Task 0.2 + couple actions; couple read-only расписание → 4.4.
2. **Placeholder scan:** код для схемы, валидаторов, слоёв данных, couple-activity, mark-seen — полный. Для повторяющегося CRUD UI и actions дана точная инструкция «зеркало vendor.* + перечисленные поля» (эталонные файлы реальны и прочитаны). Дрэг-н-дроп явно помечен опциональным.
3. **Type consistency:** enums `GuestStatus/GuestSide/CoupleArea` совпадают между schema.prisma, валидаторами и слоем данных; `GuestData`/`TableInput`/`EventData` согласованы с экшенами; seen-поля `Wedding.{guests,seating}SeenByAgencyAt` совпадают с `SEEN_FIELD` мапой.

## Известные отклонения от спеков (подтвердить у пользователя)

- **Рассадка — клик вместо drag-and-drop** как основное взаимодействие (mobile-first; HTML5 DnD не работает на тач). Drag оставлен опциональным desktop-улучшением (Task 2.7). Спек рисовал «перетаскивание» — поведение «посадить за стол» сохранено, меняется только способ.
