import { getDb, tenantScope } from "@/lib/db";
import { err, ok, type Result } from "@/lib/result";
import { assertWedding } from "@/lib/wedding/guard";

export async function listNotes(agencyId: string, weddingId: string) {
  return tenantScope(agencyId, async () => {
    if (!(await assertWedding(agencyId, weddingId))) return [];
    return getDb().weddingNote.findMany({
      where: { weddingId },
      orderBy: { createdAt: "desc" },
    });
  });
}

export async function addNote(
  agencyId: string,
  weddingId: string,
  body: string,
  authorName: string | null,
): Promise<Result<{ id: string }, "NOT_FOUND">> {
  return tenantScope(agencyId, async () => {
    if (!(await assertWedding(agencyId, weddingId))) return err("NOT_FOUND");
    const n = await getDb().weddingNote.create({
      data: { weddingId, body, authorName },
    });
    return ok({ id: n.id });
  });
}

export async function deleteNote(
  agencyId: string,
  weddingId: string,
  noteId: string,
): Promise<Result<true, "NOT_FOUND">> {
  return tenantScope(agencyId, async () => {
    if (!(await assertWedding(agencyId, weddingId))) return err("NOT_FOUND");
    const del = await getDb().weddingNote.deleteMany({
      where: { id: noteId, weddingId },
    });
    if (del.count === 0) return err("NOT_FOUND");
    return ok(true);
  });
}
