"use server";

import { revalidatePath } from "next/cache";
import { requireAgencyContext } from "@/lib/tenant";
import {
  addTable,
  assignGuestToTable,
  deleteTable,
  unassignGuest,
  updateTable,
} from "@/lib/wedding/seating";
import { tableSchema } from "@/lib/validators/seating";

function revalidate(weddingId: string) {
  revalidatePath(`/app/weddings/${weddingId}/seating`);
}

export async function addTableAction(
  weddingId: string,
  input: unknown,
): Promise<{ error?: string }> {
  const ctx = await requireAgencyContext();
  const parsed = tableSchema.safeParse(input);
  if (!parsed.success) return { error: "Проверьте поля формы" };
  const res = await addTable(ctx.agencyId, weddingId, parsed.data);
  if (!res.ok) return { error: "Свадьба не найдена" };
  revalidate(weddingId);
  return {};
}

export async function updateTableAction(
  weddingId: string,
  tableId: string,
  input: unknown,
): Promise<{ error?: string }> {
  const ctx = await requireAgencyContext();
  const parsed = tableSchema.safeParse(input);
  if (!parsed.success) return { error: "Проверьте поля формы" };
  const res = await updateTable(ctx.agencyId, weddingId, tableId, parsed.data);
  if (!res.ok) return { error: "Не найдено" };
  revalidate(weddingId);
  return {};
}

export async function deleteTableAction(
  weddingId: string,
  tableId: string,
): Promise<{ error?: string }> {
  const ctx = await requireAgencyContext();
  const res = await deleteTable(ctx.agencyId, weddingId, tableId);
  if (!res.ok) return { error: "Не найдено" };
  revalidate(weddingId);
  return {};
}

export async function assignGuestAction(
  weddingId: string,
  guestId: string,
  tableId: string,
): Promise<{ error?: string }> {
  const ctx = await requireAgencyContext();
  const res = await assignGuestToTable(ctx.agencyId, weddingId, guestId, tableId);
  if (!res.ok) return { error: "Не найдено" };
  revalidate(weddingId);
  return {};
}

export async function unassignGuestAction(
  weddingId: string,
  guestId: string,
): Promise<{ error?: string }> {
  const ctx = await requireAgencyContext();
  const res = await unassignGuest(ctx.agencyId, weddingId, guestId);
  if (!res.ok) return { error: "Не найдено" };
  revalidate(weddingId);
  return {};
}
