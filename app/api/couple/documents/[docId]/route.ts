import { type NextRequest, NextResponse } from "next/server";
import { getCoupleFromCookie } from "@/lib/couple/session";
import { coupleDocumentForAccess } from "@/lib/couple/data";
import { getObjectBuffer } from "@/lib/storage";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ docId: string }> },
) {
  const { docId } = await params;
  const session = await getCoupleFromCookie();
  if (!session) return new NextResponse("Unauthorized", { status: 401 });

  const doc = await coupleDocumentForAccess(session.weddingId, docId);
  if (!doc) return new NextResponse("Not found", { status: 404 });

  const buffer = await getObjectBuffer(doc.storageKey);
  const inline = req.nextUrl.searchParams.get("inline") === "1";
  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": doc.mime,
      "Content-Length": String(doc.size),
      "Content-Disposition": `${inline ? "inline" : "attachment"}; filename*=UTF-8''${encodeURIComponent(doc.name)}`,
      "Cache-Control": "private, no-store",
    },
  });
}
