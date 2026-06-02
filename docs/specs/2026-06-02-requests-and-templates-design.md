# Дизайн: «Запросы паре» + «Шаблоны»

Дата: 2026-06-02
Статус: утверждён пользователем, ждёт реализации. Самый крупный модуль — строится в 2 захода.
Стек: Next.js 16 / Prisma 7 / Postgres, multi-tenant (withAgency/assertWedding), couple-write путь
(coupleAgencyId), загрузка файлов как у Document (lib/storage.ts, magic-bytes, лимит), RLS-паритет.

## Концепция

Единый канал **агентство → пара**: агентство шлёт паре **запрос**; пока нет ответа — он «горит»
во вкладке «Запросы» кабинета пары + колокольчик-счётчик открытых. После ответа — уходит в
краткую историю, счётчик гаснет. В «Запросах» = всё, на что ещё нет ответа пары.

## Этап 1 — ЯДРО: Запросы + анкеты + инбокс + вложения

### Типы запроса (RequestKind)
- **QUESTIONNAIRE (анкета)** — набор вопросов; пара отвечает **свободным текстом** по каждому.
  Создаётся с нуля или из шаблона-анкеты. Закрывается, когда пара отправит ответы.
- **TASK (просьба/задача)** — заголовок + текст-просьба, опц. **привязка к разделу** (`linkTo`:
  напр. `seating`, `guests`). Пара отмечает «Выполнено» (+ опц. короткий текст-ответ).

### Данные (Prisma)
- `CoupleRequest` { id, weddingId→Wedding cascade, kind: RequestKind, title, message String?,
  linkTo String?, status: RequestStatus (OPEN|DONE) @default(OPEN), createdAt, respondedAt DateTime? }
  @@index([weddingId, status])
- `RequestQuestion` { id, requestId→CoupleRequest cascade, prompt, answerText String?, sortOrder }
  @@index([requestId]) — только для анкет.
- `RequestAttachment` { id, requestId→CoupleRequest cascade, storageKey, name, mime, size, createdAt }
  @@index([requestId]) — файлы, которые пара приложила к ответу (переиспуем lib/storage.ts).
- enums: `RequestKind { QUESTIONNAIRE TASK }`, `RequestStatus { OPEN DONE }`
- `Template` { id, agencyId→Agency cascade, type: TemplateType, name, content Json, createdAt, updatedAt }
  @@index([agencyId, type]). В этапе 1 используется только `type = QUESTIONNAIRE`,
  content = `{ questions: string[] }`. enum `TemplateType { QUESTIONNAIRE CHECKLIST TIMELINE BUDGET }`.

### Счётчик (колокольчик)
`count(CoupleRequest where weddingId, status=OPEN)`. Открытые — наверху списка, отвеченные — в истории.

### Поток
- **Агентство** (вкладка свадьбы «Запросы»): создаёт запрос —
  - анкета: с нуля (ввод вопросов) или «из шаблона» (подставляет вопросы из Template QUESTIONNAIRE);
  - задача: заголовок + текст + опц. «привязать к разделу» (выбор из guests/seating/…).
  Видит список со статусом, ответы пары, скачивает вложения.
- **Пара** (вкладка «Запросы» 🔔N): открытые запросы с действием:
  - анкета → форма с вопросами (textarea на каждый) + прикрепить файлы → «Отправить» → DONE;
  - задача → текст просьбы + опц. ответ/файлы → «Выполнено» → DONE.
  Ниже — история отвеченных (свёрнуто, не горит). Ответы пары можно правит из истории (статус
  остаётся DONE; счётчик считает только никогда-не-отвеченные → OPEN).
- **Привязка к разделу**: если у открытого запроса `linkTo` = текущий раздел (рассадка/гости),
  на странице раздела у пары — плашка «Агентство просит: <title>» со ссылкой в «Запросы».
  Закрытие запроса убирает плашку.

### Couple-write
Все couple-действия (ответ, отметка «выполнено», загрузка файла) — через `requireCoupleForWedding`
→ `coupleAgencyId` → слой данных под agencyId (RLS активна). Запись/чтение запросов агентством —
через `withAgency`/`assertWedding`.

## Этап 2 — редактируемые шаблоны-списки

`Template` типов CHECKLIST / TIMELINE / BUDGET:
- content: CHECKLIST `{ items: {period, title}[] }`, TIMELINE `{ items: {startMinutes, durationMin, title}[] }`,
  BUDGET `{ items: {name}[] }`.
- Раздел агентства «Шаблоны»: CRUD по всем типам (анкеты из этапа 1 + эти три).
- На вкладке свадьбы (Чек-лист/Тайминг/Бюджет) — «Применить шаблон» → выбор из шаблонов агентства →
  пункты **добавляются** (append) в свадьбу. Только вручную.
- **Стартовые шаблоны**: при создании агентства засеять редактируемые «Классическая свадьба»
  (CHECKLIST, из текущего lib/templates/checklist.ts) и «Стандартный бюджет» (BUDGET, из
  lib/templates/budget.ts). Зашитые дефолты заменяются этими редактируемыми.
- Убрать авто-наполнение бюджета при первом открытии вкладки (теперь только вручную).
- Заменить текущий хардкод `applyTemplate`(checklist) на применение из Template-таблицы.

## RLS
Политики tenant_isolation: `CoupleRequest`/`RequestQuestion`/`RequestAttachment` (через Wedding.agencyId,
для дочерних — через requestId→request→wedding), `Template` (прямой agencyId).

## Чего НЕ делаем
- Типов вопросов нет — только свободный текст.
- Условной логики/ветвления нет.
- Авто-применения шаблонов нет (только кнопка).
- Вложения — только на стороне ответа пары (этап 1), не в шаблонах.

## Открытых вопросов нет.
