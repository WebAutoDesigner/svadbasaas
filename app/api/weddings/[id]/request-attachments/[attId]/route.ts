import { type NextRequest, NextResponse } from "next/server";
import { requireAgencyContext } from "@/lib/tenant";
import { getAttachmentForAccess } from "@/lib/wedding/request";
import { getObjectBuffer } from "@/lib/storage";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; attId: string }> },
) {
  const ctx = await requireAgencyContext();
  const { id, attId } = await params;
  const att = await getAttachmentForAccess(ctx.agencyId, id, attId);
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
