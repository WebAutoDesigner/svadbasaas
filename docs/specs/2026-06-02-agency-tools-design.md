# Дизайн: 3 фичи удобства агентства

Дата: 2026-06-02
Статус: утверждён пользователем, ждёт реализации
Контекст: приложение в первую очередь для агентства («вести всю инфу о свадьбах»).
Все 3 — agency-only (пара не видит). Паттерн как у существующих per-wedding модулей
(vendor/guest): слой данных через getDb()/tenantScope/assertWedding, Server Actions,
Zod-валидаторы без import db, RLS-паритет.

## 1. Контакты пары + источник

Блок на странице «Обзор» свадьбы (это карточка свадьбы).

- **Список контактов** (`WeddingContact`): `label` (пометка: «Мария», «WhatsApp жениха»),
  `value` (номер/ник/email). Добавить / изменить / удалить. Каждый человек/канал — строка.
- **Источник** — новое поле `Wedding.source` (String?, «откуда пришли»: Instagram, сарафан…).
  Редактируется в существующем overview-editor.

## 2. Заметки по свадьбе — вкладка «Заметки»

Лента записей (`WeddingNote`): `body` (текст), `authorName` (кто написал — имя участника
агентства), `createdAt`. Новые сверху. Добавить / удалить. Только агентство.

## 3. Деньги агентства — вкладка «Финансы»

- **Гонорар** — поле `Wedding.agencyFee` (Int, ₽, редактируется).
- **Платежи от пары** (`AgencyPayment`): `amount` (Int ₽), `paidOn` (дата), `note` (String?).
  Добавить / изменить / удалить.
- Сводка сверху (живой подсчёт): **Гонорар / Заплачено (сумма платежей) / Осталось (гонорар − заплачено)**.
- Отдельно от вкладки «Бюджет» (та — расходы пары на подрядчиков). Только агентство.

## Модели (Prisma)

- `Wedding` + `source String?`, `agencyFee Int @default(0)`
- `WeddingContact` { id, weddingId→Wedding cascade, label, value, sortOrder Int @default(0), createdAt, updatedAt } @@index([weddingId])
- `WeddingNote` { id, weddingId→Wedding cascade, body, authorName String?, createdAt } @@index([weddingId, createdAt])
- `AgencyPayment` { id, weddingId→Wedding cascade, amount Int @default(0), paidOn DateTime, note String?, createdAt } @@index([weddingId, paidOn])

RLS: политики tenant_isolation для всех 3 новых таблиц (как у guest/seating).

## Явно НЕ делаем

- Пара ничего из этого не видит (нет couple-страниц, нет couple-write, нет бейджа изменений).
- Напоминаний / чеков / выставления счетов — нет.
- Связи денег с бюджетом свадьбы — нет.
- Редактирования заметок — нет (только добавить/удалить); правка платежей — да (сумма/дата/заметка).

## Открытых вопросов нет.
