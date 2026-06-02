-- RLS-паритет для таблиц удобства агентства (per-wedding, скоуп через Wedding.agencyId).

ALTER TABLE "WeddingContact" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "WeddingContact" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "WeddingContact"
  USING (
    current_agency_id() IS NULL
    OR EXISTS (SELECT 1 FROM "Wedding" w WHERE w.id = "WeddingContact"."weddingId" AND w."agencyId" = current_agency_id())
  )
  WITH CHECK (
    current_agency_id() IS NULL
    OR EXISTS (SELECT 1 FROM "Wedding" w WHERE w.id = "WeddingContact"."weddingId" AND w."agencyId" = current_agency_id())
  );

ALTER TABLE "WeddingNote" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "WeddingNote" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "WeddingNote"
  USING (
    current_agency_id() IS NULL
    OR EXISTS (SELECT 1 FROM "Wedding" w WHERE w.id = "WeddingNote"."weddingId" AND w."agencyId" = current_agency_id())
  )
  WITH CHECK (
    current_agency_id() IS NULL
    OR EXISTS (SELECT 1 FROM "Wedding" w WHERE w.id = "WeddingNote"."weddingId" AND w."agencyId" = current_agency_id())
  );

ALTER TABLE "AgencyPayment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AgencyPayment" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "AgencyPayment"
  USING (
    current_agency_id() IS NULL
    OR EXISTS (SELECT 1 FROM "Wedding" w WHERE w.id = "AgencyPayment"."weddingId" AND w."agencyId" = current_agency_id())
  )
  WITH CHECK (
    current_agency_id() IS NULL
    OR EXISTS (SELECT 1 FROM "Wedding" w WHERE w.id = "AgencyPayment"."weddingId" AND w."agencyId" = current_agency_id())
  );
