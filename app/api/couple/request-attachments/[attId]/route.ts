import { type NextRequest, NextResponse } from "next/server";
import { getCoupleFromCookie } from "@/lib/couple/session";
import { coupleAgencyId } from "@/lib/couple/data";
import { getAttachmentForAccess } from "@/lib/wedding/request";
import { getObjectBuffer } from "@/lib/storage";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ attId: string }> },
) {
  const { attId } = await params;
  const session = await getCoupleFromCookie();
  if (!session) return new NextResponse("Unauthorized", { status: 401 });

  const agencyId = await coupleAgencyId(session.weddingId);
  if (!agencyId) return new NextResponse("Not found", { status: 404 });
  const att = await getAttachmentForAccess(agencyId, session.weddingId, attId);
  if (!att) return new NextResponse("Not found", { status: 404 });

  const buffer = await getObjectBuffer(att.storageKey);
  const inline = req.nextUrl.searchParams.get("inline") === "1";
  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": att.mime,
      "Content-Length": String(att.size),
      "Content-Disposition": `${inline ? "inline" : "attachment"}; filename*=UTF-8''${encodeURIComponent(att.name)}`,
      "Cache-Control": "private, no-store",
    },
  });
}
