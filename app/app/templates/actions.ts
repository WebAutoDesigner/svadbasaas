"use server";

import { revalidatePath } from "next/cache";
import { requireAgencyContext } from "@/lib/tenant";
import {
  addTemplate,
  deleteTemplate,
  updateTemplate,
} from "@/lib/agency/templates";
import {
  budgetTemplateSchema,
  checklistTemplateSchema,
  questionnaireTemplateSchema,
  timelineTemplateSchema,
} from "@/lib/validators/template";

function hhmm(t: string): number {
  const [h, m] = t.split(":");
  return Number(h) * 60 + Number(m);
}

export async function addQuestionnaireTemplateAction(
  input: unknown,
): Promise<{ error?: string }> {
  const ctx = await requireAgencyContext();
  const parsed = questionnaireTemplateSchema.safeParse(input);
  if (!parsed.success) return { error: "Введите название и хотя бы один вопрос" };
  await addTemplate(ctx.agencyId, {
    type: "QUESTIONNAIRE",
    name: parsed.data.name,
    content: { questions: parsed.data.questions },
  });
  revalidatePath("/app/templates");
  return {};
}

export async function updateQuestionnaireTemplateAction(
  templateId: string,
  input: unknown,
): Promise<{ error?: string }> {
  const ctx = await requireAgencyContext();
  const parsed = questionnaireTemplateSchema.safeParse(input);
  if (!parsed.success) return { error: "Введите название и хотя бы один вопрос" };
  const res = await updateTemplate(ctx.agencyId, templateId, {
    name: parsed.data.name,
    content: { questions: parsed.data.questions },
  });
  if (!res.ok) return { error: "Не найдено" };
  revalidatePath("/app/templates");
  return {};
}

export async function deleteTemplateAction(
  templateId: string,
): Promise<{ error?: string }> {
  const ctx = await requireAgencyContext();
  const res = await deleteTemplate(ctx.agencyId, templateId);
  if (!res.ok) return { error: "Не найдено" };
  revalidatePath("/app/templates");
  return {};
}

// ── Чек-лист ──────────────────────────────────────────────────────────────
export async function saveChecklistTemplateAction(
  templateId: string | null,
  input: unknown,
): Promise<{ error?: string }> {
  const ctx = await requireAgencyContext();
  const parsed = checklistTemplateSchema.safeParse(input);
  if (!parsed.success) return { error: "Название и хотя бы один пункт" };
  const content = { items: parsed.data.items };
  const res = templateId
    ? await updateTemplate(ctx.agencyId, templateId, { name: parsed.data.name, content })
    : await addTemplate(ctx.agencyId, { type: "CHECKLIST", name: parsed.data.name, content });
  if (!res.ok) return { error: "Не найдено" };
  revalidatePath("/app/templates");
  return {};
}

// ── Тайминг ───────────────────────────────────────────────────────────────
export async function saveTimelineTemplateAction(
  templateId: string | null,
  input: unknown,
): Promise<{ error?: string }> {
  const ctx = await requireAgencyContext();
  const parsed = timelineTemplateSchema.safeParse(input);
  if (!parsed.success) return { error: "Название и хотя бы одно событие" };
  const content = {
    items: parsed.data.items.map((it) => ({
      startMinutes: hhmm(it.time),
      durationMin: it.durationMin,
      title: it.title,
    })),
  };
  const res = templateId
    ? await updateTemplate(ctx.agencyId, templateId, { name: parsed.data.name, content })
    : await addTemplate(ctx.agencyId, { type: "TIMELINE", name: parsed.data.name, content });
  if (!res.ok) return { error: "Не найдено" };
  revalidatePath("/app/templates");
  return {};
}

// ── Бюджет ────────────────────────────────────────────────────────────────
export async function saveBudgetTemplateAction(
  templateId: string | null,
  input: unknown,
): Promise<{ error?: string }> {
  const ctx = await requireAgencyContext();
  const parsed = budgetTemplateSchema.safeParse(input);
  if (!parsed.success) return { error: "Название и хотя бы одна статья" };
  const content = { items: parsed.data.items };
  const res = templateId
    ? await updateTemplate(ctx.agencyId, templateId, { name: parsed.data.name, content })
    : await addTemplate(ctx.agencyId, { type: "BUDGET", name: parsed.data.name, content });
  if (!res.ok) return { error: "Не найдено" };
  revalidatePath("/app/templates");
  return {};
}
