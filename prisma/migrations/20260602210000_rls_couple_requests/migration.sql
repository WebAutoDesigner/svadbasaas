-- RLS-паритет для шаблонов и запросов паре.

-- Template: прямой agencyId
ALTER TABLE "Template" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Template" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "Template"
  USING (current_agency_id() IS NULL OR "agencyId" = current_agency_id())
  WITH CHECK (current_agency_id() IS NULL OR "agencyId" = current_agency_id());

-- CoupleRequest: через Wedding.agencyId
ALTER TABLE "CoupleRequest" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CoupleRequest" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "CoupleRequest"
  USING (
    current_agency_id() IS NULL
    OR EXISTS (SELECT 1 FROM "Wedding" w WHERE w.id = "CoupleRequest"."weddingId" AND w."agencyId" = current_agency_id())
  )
  WITH CHECK (
    current_agency_id() IS NULL
    OR EXISTS (SELECT 1 FROM "Wedding" w WHERE w.id = "CoupleRequest"."weddingId" AND w."agencyId" = current_agency_id())
  );

-- RequestQuestion: через CoupleRequest → Wedding
ALTER TABLE "RequestQuestion" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RequestQuestion" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "RequestQuestion"
  USING (
    current_agency_id() IS NULL
    OR EXISTS (
      SELECT 1 FROM "CoupleRequest" r
      JOIN "Wedding" w ON w.id = r."weddingId"
      WHERE r.id = "RequestQuestion"."requestId" AND w."agencyId" = current_agency_id()
    )
  )
  WITH CHECK (
    current_agency_id() IS NULL
    OR EXISTS (
      SELECT 1 FROM "CoupleRequest" r
      JOIN "Wedding" w ON w.id = r."weddingId"
      WHERE r.id = "RequestQuestion"."requestId" AND w."agencyId" = current_agency_id()
    )
  );

-- RequestAttachment: через CoupleRequest → Wedding
ALTER TABLE "RequestAttachment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RequestAttachment" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "RequestAttachment"
  USING (
    current_agency_id() IS NULL
    OR EXISTS (
      SELECT 1 FROM "CoupleRequest" r
      JOIN "Wedding" w ON w.id = r."weddingId"
      WHERE r.id = "RequestAttachment"."requestId" AND w."agencyId" = current_agency_id()
    )
  )
  WITH CHECK (
    current_agency_id() IS NULL
    OR EXISTS (
      SELECT 1 FROM "CoupleRequest" r
      JOIN "Wedding" w ON w.id = r."weddingId"
      WHERE r.id = "RequestAttachment"."requestId" AND w."agencyId" = current_agency_id()
    )
  );
