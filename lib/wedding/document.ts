import { fileTypeFromBuffer } from "file-type";
import { db } from "@/lib/db";
import { err, ok, type Result } from "@/lib/result";
import { assertWedding } from "@/lib/wedding/guard";
import {
  deleteObject,
  makeStorageKey,
  putObject,
} from "@/lib/storage";

export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 МБ

/**
 * Разрешённые типы. Ключ — mime, который должен подтвердиться по magic bytes
 * (кроме текстовых, у file-type нет сигнатур для txt/csv).
 */
const ALLOWED_MIME = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/zip",
]);

export type UploadError = "NOT_FOUND" | "TOO_LARGE" | "BAD_TYPE";

export async function listDocuments(agencyId: string, weddingId: string) {
  if (!(await assertWedding(agencyId, weddingId))) return [];
  return db.document.findMany({
    where: { weddingId },
    orderBy: { createdAt: "desc" },
  });
}

export async function uploadDocument(
  agencyId: string,
  weddingId: string,
  file: { name: string; buffer: Buffer },
  uploadedById: string | null,
): Promise<Result<{ id: string }, UploadError>> {
  if (!(await assertWedding(agencyId, weddingId))) return err("NOT_FOUND");
  if (file.buffer.length > MAX_FILE_SIZE) return err("TOO_LARGE");

  // Проверка по magic bytes, а не по расширению
  const detected = await fileTypeFromBuffer(file.buffer);
  if (!detected || !ALLOWED_MIME.has(detected.mime)) {
    return err("BAD_TYPE");
  }

  const storageKey = makeStorageKey(weddingId, file.name);
  await putObject(storageKey, file.buffer);

  const doc = await db.document.create({
    data: {
      weddingId,
      name: file.name.slice(0, 255),
      storageKey,
      mime: detected.mime,
      size: file.buffer.length,
      uploadedById,
    },
  });
  return ok({ id: doc.id });
}

/** Возвращает документ если он принадлежит свадьбе агентства — для скачивания */
export async function getDocumentForAccess(
  agencyId: string,
  weddingId: string,
  documentId: string,
) {
  if (!(await assertWedding(agencyId, weddingId))) return null;
  return db.document.findFirst({
    where: { id: documentId, weddingId },
  });
}

export async function deleteDocument(
  agencyId: string,
  weddingId: string,
  documentId: string,
): Promise<Result<true, "NOT_FOUND">> {
  if (!(await assertWedding(agencyId, weddingId))) return err("NOT_FOUND");
  const doc = await db.document.findFirst({
    where: { id: documentId, weddingId },
  });
  if (!doc) return err("NOT_FOUND");

  await deleteObject(doc.storageKey);
  await db.document.delete({ where: { id: doc.id } });
  return ok(true);
}
