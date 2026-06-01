-- RLS-паритет для новых таблиц (гости, столы, события, couple-активность,
-- база подрядчиков). Тот же принцип: app.agency_id NULL → пропускаем всё;
-- задан → режем чужое. Per-wedding таблицы скоупятся через Wedding.agencyId,
-- AgencyVendor — по прямому agencyId.

-- ── Guest ────────────────────────────────────────────────────────────────────
ALTER TABLE "Guest" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Guest" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "Guest"
  USING (
    current_agency_id() IS NULL
    OR EXISTS (SELECT 1 FROM "Wedding" w WHERE w.id = "Guest"."weddingId" AND w."agencyId" = current_agency_id())
  )
  WITH CHECK (
    current_agency_id() IS NULL
    OR EXISTS (SELECT 1 FROM "Wedding" w WHERE w.id = "Guest"."weddingId" AND w."agencyId" = current_agency_id())
  );

-- ── SeatingTable ───────────────────────────────────────────────────────────────
ALTER TABLE "SeatingTable" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SeatingTable" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "SeatingTable"
  USING (
    current_agency_id() IS NULL
    OR EXISTS (SELECT 1 FROM "Wedding" w WHERE w.id = "SeatingTable"."weddingId" AND w."agencyId" = current_agency_id())
  )
  WITH CHECK (
    current_agency_id() IS NULL
    OR EXISTS (SELECT 1 FROM "Wedding" w WHERE w.id = "SeatingTable"."weddingId" AND w."agencyId" = current_agency_id())
  );

-- ── WeddingEvent ───────────────────────────────────────────────────────────────
ALTER TABLE "WeddingEvent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "WeddingEvent" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "WeddingEvent"
  USING (
    current_agency_id() IS NULL
    OR EXISTS (SELECT 1 FROM "Wedding" w WHERE w.id = "WeddingEvent"."weddingId" AND w."agencyId" = current_agency_id())
  )
  WITH CHECK (
    current_agency_id() IS NULL
    OR EXISTS (SELECT 1 FROM "Wedding" w WHERE w.id = "WeddingEvent"."weddingId" AND w."agencyId" = current_agency_id())
  );

-- ── CoupleActivity ───────────────────────────────────────────────────────────
ALTER TABLE "CoupleActivity" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CoupleActivity" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "CoupleActivity"
  USING (
    current_agency_id() IS NULL
    OR EXISTS (SELECT 1 FROM "Wedding" w WHERE w.id = "CoupleActivity"."weddingId" AND w."agencyId" = current_agency_id())
  )
  WITH CHECK (
    current_agency_id() IS NULL
    OR EXISTS (SELECT 1 FROM "Wedding" w WHERE w.id = "CoupleActivity"."weddingId" AND w."agencyId" = current_agency_id())
  );

-- ── AgencyVendor (прямой agencyId) ─────────────────────────────────────────────
ALTER TABLE "AgencyVendor" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AgencyVendor" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "AgencyVendor"
  USING (current_agency_id() IS NULL OR "agencyId" = current_agency_id())
  WITH CHECK (current_agency_id() IS NULL OR "agencyId" = current_agency_id());
