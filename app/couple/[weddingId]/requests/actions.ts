"use server";

import { revalidatePath } from "next/cache";
import { requireCoupleForWedding } from "@/lib/couple/session";
import { coupleAgencyId } from "@/lib/couple/data";
import {
  addAttachment,
  answerQuestionnaire,
  completeTask,
  deleteAttachment,
  MAX_ATTACH_SIZE,
} from "@/lib/wedding/request";
import { answerSchema, completeTaskSchema } from "@/lib/validators/request";

function revalidate(weddingId: string) {
  revalidatePath(`/couple/${weddingId}/requests`);
  revalidatePath(`/app/weddings/${weddingId}/requests`);
}

async function agency(weddingId: string): Promise<string | null> {
  await requireCoupleForWedding(weddingId);
  return coupleAgencyId(weddingId);
}

export async function coupleAnswerAction(
  weddingId: string,
  requestId: string,
  input: unknown,
): Promise<{ error?: string }> {
  const agencyId = await agency(weddingId);
  if (!agencyId) return { error: "Свадьба не найдена" };
  const parsed = answerSchema.safeParse(input);
  if (!parsed.success) return { error: "Проверьте ответы" };
  const res = await answerQuestionnaire(agencyId, weddingId, requestId, parsed.data.answers);
  if (!res.ok) return { error: "Не найдено" };
  revalidate(weddingId);
  return {};
}

export async function coupleCompleteTaskAction(
  weddingId: string,
  requestId: string,
  input: unknown,
): Promise<{ error?: string }> {
  const agencyId = await agency(weddingId);
  if (!agencyId) return { error: "Свадьба не найдена" };
  const parsed = completeTaskSchema.safeParse(input);
  if (!parsed.success) return { error: "Проверьте ответ" };
  const res = await completeTask(agencyId, weddingId, requestId, parsed.data.reply || undefined);
  if (!res.ok) return { error: "Не найдено" };
  revalidate(weddingId);
  return {};
}

export async function coupleUploadAttachmentAction(
  weddingId: string,
  requestId: string,
  formData: FormData,
): Promise<{ error?: string }> {
  const agencyId = await agency(weddingId);
  if (!agencyId) return { error: "Свадьба не найдена" };
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "Файл не выбран" };
  if (file.size > MAX_ATTACH_SIZE) return { error: "Файл больше 50 МБ" };
  const buffer = Buffer.from(await file.arrayBuffer());
  const res = await addAttachment(agencyId, weddingId, requestId, { name: file.name, buffer });
  if (!res.ok) {
    if (res.error === "TOO_LARGE") return { error: "Файл больше 50 МБ" };
    if (res.error === "BAD_TYPE") return { error: "Недопустимый тип файла (PDF, фото, Office, zip)" };
    return { error: "Не найдено" };
  }
  revalidate(weddingId);
  return {};
}

export async function coupleDeleteAttachmentAction(
  weddingId: string,
  attachmentId: string,
): Promise<{ error?: string }> {
  const agencyId = await agency(weddingId);
  if (!agencyId) return { error: "Свадьба не найдена" };
  const res = await deleteAttachment(agencyId, weddingId, attachmentId);
  if (!res.ok) return { error: "Не найдено" };
  revalidate(weddingId);
  return {};
}
