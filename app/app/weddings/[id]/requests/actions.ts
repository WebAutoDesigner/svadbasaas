"use server";

import { revalidatePath } from "next/cache";
import { requireAgencyContext } from "@/lib/tenant";
import { getTemplate } from "@/lib/agency/templates";
import {
  createQuestionnaire,
  createTask,
  deleteRequest,
} from "@/lib/wedding/request";
import {
  createQuestionnaireSchema,
  createTaskSchema,
} from "@/lib/validators/request";

function revalidate(weddingId: string) {
  revalidatePath(`/app/weddings/${weddingId}/requests`);
}

export async function createQuestionnaireRequestAction(
  weddingId: string,
  input: unknown,
): Promise<{ error?: string }> {
  const ctx = await requireAgencyContext();
  const parsed = createQuestionnaireSchema.safeParse(input);
  if (!parsed.success) return { error: "Введите название и хотя бы один вопрос" };
  const res = await createQuestionnaire(ctx.agencyId, weddingId, {
    title: parsed.data.title,
    message: parsed.data.message || undefined,
    questions: parsed.data.questions,
  });
  if (!res.ok) return { error: "Свадьба не найдена" };
  revalidate(weddingId);
  return {};
}

export async function createFromTemplateAction(
  weddingId: string,
  templateId: string,
): Promise<{ error?: string }> {
  const ctx = await requireAgencyContext();
  const tpl = await getTemplate(ctx.agencyId, templateId);
  if (!tpl || tpl.type !== "QUESTIONNAIRE") return { error: "Шаблон не найден" };
  const questions = (tpl.content as { questions?: string[] }).questions ?? [];
  if (questions.length === 0) return { error: "В шаблоне нет вопросов" };
  const res = await createQuestionnaire(ctx.agencyId, weddingId, {
    title: tpl.name,
    questions,
  });
  if (!res.ok) return { error: "Свадьба не найдена" };
  revalidate(weddingId);
  return {};
}

export async function createTaskRequestAction(
  weddingId: string,
  input: unknown,
): Promise<{ error?: string }> {
  const ctx = await requireAgencyContext();
  const parsed = createTaskSchema.safeParse(input);
  if (!parsed.success) return { error: "Введите название" };
  const res = await createTask(ctx.agencyId, weddingId, {
    title: parsed.data.title,
    message: parsed.data.message || undefined,
    linkTo: parsed.data.linkTo || undefined,
  });
  if (!res.ok) return { error: "Свадьба не найдена" };
  revalidate(weddingId);
  return {};
}

export async function deleteRequestAction(
  weddingId: string,
  requestId: string,
): Promise<{ error?: string }> {
  const ctx = await requireAgencyContext();
  const res = await deleteRequest(ctx.agencyId, weddingId, requestId);
  if (!res.ok) return { error: "Не найдено" };
  revalidate(weddingId);
  return {};
}
