"use server";

import { revalidatePath } from "next/cache";
import { requireAgencyContext } from "@/lib/tenant";
import {
  addBudgetItem,
  deleteBudgetItem,
  updateBudgetItem,
} from "@/lib/wedding/budget";
import { applyTemplate } from "@/lib/wedding/apply-template";
import {
  addBudgetItemSchema,
  updateBudgetItemSchema,
} from "@/lib/validators/budget";

function revalidate(weddingId: string) {
  revalidatePath(`/app/weddings/${weddingId}/budget`);
  revalidatePath(`/app/weddings/${weddingId}`);
}

export async function applyBudgetTemplateAction(
  weddingId: string,
  templateId: string,
): Promise<{ error?: string }> {
  const ctx = await requireAgencyContext();
  const res = await applyTemplate(ctx.agencyId, weddingId, templateId);
  if (!res.ok) return { error: "Не удалось применить шаблон" };
  revalidate(weddingId);
  return {};
}

export async function addBudgetItemAction(
  weddingId: string,
  input: { name: string; planned: number; actual: number },
): Promise<{ error?: string }> {
  const ctx = await requireAgencyContext();
  const parsed = addBudgetItemSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Некорректные данные" };
  }
  const res = await addBudgetItem(ctx.agencyId, weddingId, parsed.data);
  if (!res.ok) return { error: "Свадьба не найдена" };
  revalidate(weddingId);
  return {};
}

export async function updateBudgetItemAction(
  weddingId: string,
  itemId: string,
  input: { planned: number; actual: number },
): Promise<{ error?: string }> {
  const ctx = await requireAgencyContext();
  const parsed = updateBudgetItemSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Некорректные данные" };
  }
  const res = await updateBudgetItem(ctx.agencyId, weddingId, itemId, parsed.data);
  if (!res.ok) return { error: "Не найдено" };
  revalidate(weddingId);
  return {};
}

export async function deleteBudgetItemAction(
  weddingId: string,
  itemId: string,
): Promise<{ error?: string }> {
  const ctx = await requireAgencyContext();
  const res = await deleteBudgetItem(ctx.agencyId, weddingId, itemId);
  if (!res.ok) return { error: "Не найдено" };
  revalidate(weddingId);
  return {};
}
