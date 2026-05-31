"use server";

import { revalidatePath } from "next/cache";
import { requireAgencyContext } from "@/lib/tenant";
import {
  deleteDocument,
  uploadDocument,
  MAX_FILE_SIZE,
} from "@/lib/wedding/document";

export async function uploadDocumentAction(
  weddingId: string,
  formData: FormData,
): Promise<{ error?: string }> {
  const ctx = await requireAgencyContext();
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Файл не выбран" };
  }
  if (file.size > MAX_FILE_SIZE) {
    return { error: "Файл больше 50 МБ" };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const res = await uploadDocument(
    ctx.agencyId,
    weddingId,
    { name: file.name, buffer },
    ctx.userId,
  );
  if (!res.ok) {
    if (res.error === "TOO_LARGE") return { error: "Файл больше 50 МБ" };
    if (res.error === "BAD_TYPE")
      return { error: "Недопустимый тип файла (PDF, фото, Office, zip)" };
    return { error: "Свадьба не найдена" };
  }
  revalidatePath(`/app/weddings/${weddingId}/documents`);
  return {};
}

export async function deleteDocumentAction(
  weddingId: string,
  documentId: string,
): Promise<{ error?: string }> {
  const ctx = await requireAgencyContext();
  const res = await deleteDocument(ctx.agencyId, weddingId, documentId);
  if (!res.ok) return { error: "Не найдено" };
  revalidatePath(`/app/weddings/${weddingId}/documents`);
  return {};
}
