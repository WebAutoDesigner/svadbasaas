import { type NextRequest, NextResponse } from "next/server";
import { requireAgencyContext } from "@/lib/tenant";
import { getDocumentForAccess } from "@/lib/wedding/document";
import { getObjectBuffer } from "@/lib/storage";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; docId: string }> },
) {
  const { id, docId } = await params;

  // requireAgencyContext редиректит на /login если нет сессии — для API
  // обернём в try/catch и вернём 401 вместо редиректа.
  let agencyId: string;
  try {
    const ctx = await requireAgencyContext();
    agencyId = ctx.agencyId;
  } catch {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const doc = await getDocumentForAccess(agencyId, id, docId);
  if (!doc) return new NextResponse("Not found", { status: 404 });

  const buffer = await getObjectBuffer(doc.storageKey);
  const inline = req.nextUrl.searchParams.get("inline") === "1";
  const disposition = inline ? "inline" : "attachment";

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": doc.mime,
      "Content-Length": String(doc.size),
      "Content-Disposition": `${disposition}; filename*=UTF-8''${encodeURIComponent(doc.name)}`,
      "Cache-Control": "private, no-store",
    },
  });
}
