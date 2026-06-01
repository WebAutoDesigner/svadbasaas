"use server";

import { revalidatePath } from "next/cache";
import { requireCoupleForWedding } from "@/lib/couple/session";
import { coupleAgencyId } from "@/lib/couple/data";
import {
  addTable,
  assignGuestToTable,
  deleteTable,
  unassignGuest,
  updateTable,
} from "@/lib/wedding/seating";
import { recordCoupleActivity } from "@/lib/wedding/couple-activity";
import { tableSchema } from "@/lib/validators/seating";

function revalidate(weddingId: string) {
  revalidatePath(`/couple/${weddingId}/seating`);
  revalidatePath(`/app/weddings/${weddingId}/seating`);
}

async function ctx(weddingId: string): Promise<string | null> {
  await requireCoupleForWedding(weddingId);
  return coupleAgencyId(weddingId);
}

export async function coupleAddTableAction(
  weddingId: string,
  input: unknown,
): Promise<{ error?: string }> {
  const agencyId = await ctx(weddingId);
  if (!agencyId) return { error: "Свадьба не найдена" };
  const parsed = tableSchema.safeParse(input);
  if (!parsed.success) return { error: "Проверьте поля формы" };
  const res = await addTable(agencyId, weddingId, parsed.data);
  if (!res.ok) return { error: "Не удалось" };
  await recordCoupleActivity(weddingId, "SEATING", `Добавлен стол: ${parsed.data.name}`);
  revalidate(weddingId);
  return {};
}

export async function coupleUpdateTableAction(
  weddingId: string,
  tableId: string,
  input: unknown,
): Promise<{ error?: string }> {
  const agencyId = await ctx(weddingId);
  if (!agencyId) return { error: "Свадьба не найдена" };
  const parsed = tableSchema.safeParse(input);
  if (!parsed.success) return { error: "Проверьте поля формы" };
  const res = await updateTable(agencyId, weddingId, tableId, parsed.data);
  if (!res.ok) return { error: "Не найдено" };
  await recordCoupleActivity(weddingId, "SEATING", `Изменён стол: ${parsed.data.name}`);
  revalidate(weddingId);
  return {};
}

export async function coupleDeleteTableAction(
  weddingId: string,
  tableId: string,
): Promise<{ error?: string }> {
  const agencyId = await ctx(weddingId);
  if (!agencyId) return { error: "Свадьба не найдена" };
  const res = await deleteTable(agencyId, weddingId, tableId);
  if (!res.ok) return { error: "Не найдено" };
  await recordCoupleActivity(weddingId, "SEATING", "Удалён стол");
  revalidate(weddingId);
  return {};
}

export async function coupleAssignGuestAction(
  weddingId: string,
  guestId: string,
  tableId: string,
): Promise<{ error?: string }> {
  const agencyId = await ctx(weddingId);
  if (!agencyId) return { error: "Свадьба не найдена" };
  const res = await assignGuestToTable(agencyId, weddingId, guestId, tableId);
  if (!res.ok) return { error: "Не найдено" };
  await recordCoupleActivity(weddingId, "SEATING", "Гость посажен за стол");
  revalidate(weddingId);
  return {};
}

export async function coupleUnassignGuestAction(
  weddingId: string,
  guestId: string,
): Promise<{ error?: string }> {
  const agencyId = await ctx(weddingId);
  if (!agencyId) return { error: "Свадьба не найдена" };
  const res = await unassignGuest(agencyId, weddingId, guestId);
  if (!res.ok) return { error: "Не найдено" };
  await recordCoupleActivity(weddingId, "SEATING", "Гость снят со стола");
  revalidate(weddingId);
  return {};
}
