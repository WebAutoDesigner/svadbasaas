"use server";

import { revalidatePath } from "next/cache";
import { requireAgencyContext } from "@/lib/tenant";
import {
  addTemplate,
  deleteTemplate,
  updateTemplate,
} from "@/lib/agency/templates";
import { questionnaireTemplateSchema } from "@/lib/validators/template";

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
