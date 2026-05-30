"use server";

import { revalidatePath } from "next/cache";
import { requireAgencyContext } from "@/lib/tenant";
import {
  addItem,
  deleteItem,
  toggleItem,
  applyTemplate,
} from "@/lib/wedding/checklist";
import { addItemSchema } from "@/lib/validators/checklist";
import type { ChecklistPeriod } from "@prisma/client";

function revalidate(weddingId: string) {
  revalidatePath(`/app/weddings/${weddingId}/checklist`);
  revalidatePath(`/app/weddings/${weddingId}`);
}

export async function addItemAction(
  weddingId: string,
  input: { title: string; period: ChecklistPeriod; note?: string },
): Promise<{ error?: string }> {
  const ctx = await requireAgencyContext();
  const parsed = addItemSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Некорректные данные" };
  }
  const res = await addItem(ctx.agencyId, weddingId, {
    title: parsed.data.title,
    period: parsed.data.period,
    note: parsed.data.note || undefined,
  });
  if (!res.ok) return { error: "Свадьба не найдена" };
  revalidate(weddingId);
  return {};
}

export async function toggleItemAction(
  weddingId: string,
  itemId: string,
  done: boolean,
): Promise<{ error?: string }> {
  const ctx = await requireAgencyContext();
  const res = await toggleItem(ctx.agencyId, weddingId, itemId, done);
  if (!res.ok) return { error: "Не найдено" };
  revalidate(weddingId);
  return {};
}

export async function deleteItemAction(
  weddingId: string,
  itemId: string,
): Promise<{ error?: string }> {
  const ctx = await requireAgencyContext();
  const res = await deleteItem(ctx.agencyId, weddingId, itemId);
  if (!res.ok) return { error: "Не найдено" };
  revalidate(weddingId);
  return {};
}

export async function applyTemplateAction(
  weddingId: string,
  templateId: string,
): Promise<{ error?: string }> {
  const ctx = await requireAgencyContext();
  const res = await applyTemplate(ctx.agencyId, weddingId, templateId);
  if (!res.ok) return { error: "Не удалось применить шаблон" };
  revalidate(weddingId);
  return {};
}
