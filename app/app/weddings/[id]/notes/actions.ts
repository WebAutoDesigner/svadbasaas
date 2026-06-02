"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAgencyContext } from "@/lib/tenant";
import { addNote, deleteNote } from "@/lib/wedding/note";
import { noteSchema } from "@/lib/validators/note";

export async function addNoteAction(
  weddingId: string,
  input: unknown,
): Promise<{ error?: string }> {
  const ctx = await requireAgencyContext();
  const parsed = noteSchema.safeParse(input);
  if (!parsed.success) return { error: "Введите заметку" };
  const user = await db.user.findUnique({
    where: { id: ctx.userId },
    select: { name: true },
  });
  const res = await addNote(
    ctx.agencyId,
    weddingId,
    parsed.data.body,
    user?.name ?? null,
  );
  if (!res.ok) return { error: "Свадьба не найдена" };
  revalidatePath(`/app/weddings/${weddingId}/notes`);
  return {};
}

export async function deleteNoteAction(
  weddingId: string,
  noteId: string,
): Promise<{ error?: string }> {
  const ctx = await requireAgencyContext();
  const res = await deleteNote(ctx.agencyId, weddingId, noteId);
  if (!res.ok) return { error: "Не найдено" };
  revalidatePath(`/app/weddings/${weddingId}/notes`);
  return {};
}
