-- Row-Level Security как страховка изоляции арендаторов (agency).
-- Принцип безопасного включения: если переменная сессии app.agency_id НЕ задана
-- (couple-портал, супер-админ, auth, тесты, миграции) — правило пропускает всё,
-- поведение как раньше. Как только агентский путь задаёт app.agency_id (через
-- транзакцию в withAgency) — БД физически режет чужие строки, даже если код
-- забыл WHERE agencyId. FORCE нужен потому, что приложение ходит под владельцем
-- таблиц (владелец иначе обходит RLS).

-- Хелпер: текущий агентский контекст (NULL = контекст не задан = пропускать всё).
CREATE OR REPLACE FUNCTION current_agency_id() RETURNS text
  LANGUAGE sql STABLE AS $$
    SELECT NULLIF(current_setting('app.agency_id', true), '')
$$;

-- ── Корневая сущность: Wedding (есть прямой agencyId) ────────────────────────
ALTER TABLE "Wedding" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Wedding" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "Wedding"
  USING (current_agency_id() IS NULL OR "agencyId" = current_agency_id())
  WITH CHECK (current_agency_id() IS NULL OR "agencyId" = current_agency_id());

-- ── Дочерние сущности (скоуп через Wedding.agencyId) ─────────────────────────
ALTER TABLE "ChecklistItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ChecklistItem" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "ChecklistItem"
  USING (
    current_agency_id() IS NULL
    OR EXISTS (SELECT 1 FROM "Wedding" w WHERE w.id = "ChecklistItem"."weddingId" AND w."agencyId" = current_agency_id())
  )
  WITH CHECK (
    current_agency_id() IS NULL
    OR EXISTS (SELECT 1 FROM "Wedding" w WHERE w.id = "ChecklistItem"."weddingId" AND w."agencyId" = current_agency_id())
  );

ALTER TABLE "BudgetItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BudgetItem" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "BudgetItem"
  USING (
    current_agency_id() IS NULL
    OR EXISTS (SELECT 1 FROM "Wedding" w WHERE w.id = "BudgetItem"."weddingId" AND w."agencyId" = current_agency_id())
  )
  WITH CHECK (
    current_agency_id() IS NULL
    OR EXISTS (SELECT 1 FROM "Wedding" w WHERE w.id = "BudgetItem"."weddingId" AND w."agencyId" = current_agency_id())
  );

ALTER TABLE "Vendor" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Vendor" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "Vendor"
  USING (
    current_agency_id() IS NULL
    OR EXISTS (SELECT 1 FROM "Wedding" w WHERE w.id = "Vendor"."weddingId" AND w."agencyId" = current_agency_id())
  )
  WITH CHECK (
    current_agency_id() IS NULL
    OR EXISTS (SELECT 1 FROM "Wedding" w WHERE w.id = "Vendor"."weddingId" AND w."agencyId" = current_agency_id())
  );

ALTER TABLE "Document" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Document" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "Document"
  USING (
    current_agency_id() IS NULL
    OR EXISTS (SELECT 1 FROM "Wedding" w WHERE w.id = "Document"."weddingId" AND w."agencyId" = current_agency_id())
  )
  WITH CHECK (
    current_agency_id() IS NULL
    OR EXISTS (SELECT 1 FROM "Wedding" w WHERE w.id = "Document"."weddingId" AND w."agencyId" = current_agency_id())
  );

ALTER TABLE "TimelineEvent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TimelineEvent" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "TimelineEvent"
  USING (
    current_agency_id() IS NULL
    OR EXISTS (SELECT 1 FROM "Wedding" w WHERE w.id = "TimelineEvent"."weddingId" AND w."agencyId" = current_agency_id())
  )
  WITH CHECK (
    current_agency_id() IS NULL
    OR EXISTS (SELECT 1 FROM "Wedding" w WHERE w.id = "TimelineEvent"."weddingId" AND w."agencyId" = current_agency_id())
  );
