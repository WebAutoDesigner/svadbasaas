import { notFound } from "next/navigation";
import { requireAgencyContext } from "@/lib/tenant";
import { getWedding } from "@/lib/wedding/wedding";
import { listDocuments } from "@/lib/wedding/document";
import { DocumentsBoard } from "./documents-board";

export const dynamic = "force-dynamic";

export default async function DocumentsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await requireAgencyContext();
  const { id } = await params;
  const wedding = await getWedding(ctx.agencyId, id);
  if (!wedding) notFound();

  const docs = await listDocuments(ctx.agencyId, id);

  return (
    <DocumentsBoard
      weddingId={id}
      documents={docs.map((d) => ({
        id: d.id,
        name: d.name,
        mime: d.mime,
        size: d.size,
        createdAt: d.createdAt.toISOString(),
      }))}
    />
  );
}
