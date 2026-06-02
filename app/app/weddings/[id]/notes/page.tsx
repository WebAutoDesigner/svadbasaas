import { notFound } from "next/navigation";
import { requireAgencyContext } from "@/lib/tenant";
import { getWedding } from "@/lib/wedding/wedding";
import { listNotes } from "@/lib/wedding/note";
import { NotesBoard } from "./notes-board";

export const dynamic = "force-dynamic";

export default async function NotesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await requireAgencyContext();
  const { id } = await params;
  const wedding = await getWedding(ctx.agencyId, id);
  if (!wedding) notFound();

  const notes = await listNotes(ctx.agencyId, id);

  return (
    <NotesBoard
      weddingId={id}
      notes={notes.map((n) => ({
        id: n.id,
        body: n.body,
        authorName: n.authorName,
        createdAt: n.createdAt.toISOString(),
      }))}
    />
  );
}
