import { fileTypeFromBuffer } from "file-type";
import { getDb, tenantScope } from "@/lib/db";
import { err, ok, type Result } from "@/lib/result";
import { assertWedding } from "@/lib/wedding/guard";
import { makeStorageKey, putObject, deleteObject } from "@/lib/storage";

export const MAX_ATTACH_SIZE = 50 * 1024 * 1024;
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

const withQA = {
  questions: { orderBy: { sortOrder: "asc" } as const },
  attachments: { orderBy: { createdAt: "asc" } as const },
};

export async function listRequests(agencyId: string, weddingId: string) {
  return tenantScope(agencyId, async () => {
    if (!(await assertWedding(agencyId, weddingId))) return [];
    return getDb().coupleRequest.findMany({
      where: { weddingId },
      orderBy: { createdAt: "desc" },
      include: withQA,
    });
  });
}

export async function openRequestsCount(agencyId: string, weddingId: string) {
  return tenantScope(agencyId, async () => {
    if (!(await assertWedding(agencyId, weddingId))) return 0;
    return getDb().coupleRequest.count({
      where: { weddingId, status: "OPEN" },
    });
  });
}

export async function openRequestForSection(
  agencyId: string,
  weddingId: string,
  slug: string,
) {
  return tenantScope(agencyId, async () => {
    if (!(await assertWedding(agencyId, weddingId))) return null;
    return getDb().coupleRequest.findFirst({
      where: { weddingId, status: "OPEN", linkTo: slug },
      orderBy: { createdAt: "desc" },
      select: { id: true, title: true },
    });
  });
}

export async function getRequest(
  agencyId: string,
  weddingId: string,
  requestId: string,
) {
  return tenantScope(agencyId, async () => {
    if (!(await assertWedding(agencyId, weddingId))) return null;
    return getDb().coupleRequest.findFirst({
      where: { id: requestId, weddingId },
      include: withQA,
    });
  });
}

export async function createQuestionnaire(
  agencyId: string,
  weddingId: string,
  input: { title: string; message?: string | undefined; questions: string[] },
): Promise<Result<{ id: string }, "NOT_FOUND">> {
  return tenantScope(agencyId, async () => {
    if (!(await assertWedding(agencyId, weddingId))) return err("NOT_FOUND");
    const r = await getDb().coupleRequest.create({
      data: {
        weddingId,
        kind: "QUESTIONNAIRE",
        title: input.title,
        message: input.message || null,
        questions: {
          create: input.questions.map((prompt, i) => ({
            prompt,
            sortOrder: i,
          })),
        },
      },
    });
    return ok({ id: r.id });
  });
}

export async function createTask(
  agencyId: string,
  weddingId: string,
  input: { title: string; message?: string | undefined; linkTo?: string | undefined },
): Promise<Result<{ id: string }, "NOT_FOUND">> {
  return tenantScope(agencyId, async () => {
    if (!(await assertWedding(agencyId, weddingId))) return err("NOT_FOUND");
    const r = await getDb().coupleRequest.create({
      data: {
        weddingId,
        kind: "TASK",
        title: input.title,
        message: input.message || null,
        linkTo: input.linkTo || null,
      },
    });
    return ok({ id: r.id });
  });
}

export async function deleteRequest(
  agencyId: string,
  weddingId: string,
  requestId: string,
): Promise<Result<true, "NOT_FOUND">> {
  return tenantScope(agencyId, async () => {
    if (!(await assertWedding(agencyId, weddingId))) return err("NOT_FOUND");
    // удалить файлы из хранилища (best-effort), затем запись (каскад снимет дочерние)
    const atts = await getDb().requestAttachment.findMany({
      where: { request: { id: requestId, weddingId } },
      select: { storageKey: true },
    });
    const del = await getDb().coupleRequest.deleteMany({
      where: { id: requestId, weddingId },
    });
    if (del.count === 0) return err("NOT_FOUND");
    for (const a of atts) await deleteObject(a.storageKey);
    return ok(true);
  });
}

export async function answerQuestionnaire(
  agencyId: string,
  weddingId: string,
  requestId: string,
  answers: { questionId: string; text: string }[],
): Promise<Result<true, "NOT_FOUND">> {
  return tenantScope(agencyId, async () => {
    if (!(await assertWedding(agencyId, weddingId))) return err("NOT_FOUND");
    const req = await getDb().coupleRequest.findFirst({
      where: { id: requestId, weddingId, kind: "QUESTIONNAIRE" },
      select: { id: true },
    });
    if (!req) return err("NOT_FOUND");
    for (const a of answers) {
      await getDb().requestQuestion.updateMany({
        where: { id: a.questionId, requestId },
        data: { answerText: a.text || null },
      });
    }
    await getDb().coupleRequest.update({
      where: { id: requestId },
      data: { status: "DONE", respondedAt: new Date() },
    });
    return ok(true);
  });
}

export async function completeTask(
  agencyId: string,
  weddingId: string,
  requestId: string,
  reply: string | undefined,
): Promise<Result<true, "NOT_FOUND">> {
  return tenantScope(agencyId, async () => {
    if (!(await assertWedding(agencyId, weddingId))) return err("NOT_FOUND");
    const upd = await getDb().coupleRequest.updateMany({
      where: { id: requestId, weddingId, kind: "TASK" },
      data: { status: "DONE", coupleReply: reply || null, respondedAt: new Date() },
    });
    if (upd.count === 0) return err("NOT_FOUND");
    return ok(true);
  });
}

export type AttachError = "NOT_FOUND" | "TOO_LARGE" | "BAD_TYPE";

export async function addAttachment(
  agencyId: string,
  weddingId: string,
  requestId: string,
  file: { name: string; buffer: Buffer },
): Promise<Result<{ id: string }, AttachError>> {
  return tenantScope(agencyId, async () => {
    if (!(await assertWedding(agencyId, weddingId))) return err("NOT_FOUND");
    const req = await getDb().coupleRequest.findFirst({
      where: { id: requestId, weddingId },
      select: { id: true },
    });
    if (!req) return err("NOT_FOUND");
    if (file.buffer.length > MAX_ATTACH_SIZE) return err("TOO_LARGE");

    const bytes = new Uint8Array(
      file.buffer.buffer,
      file.buffer.byteOffset,
      file.buffer.byteLength,
    );
    const detected = await fileTypeFromBuffer(bytes);
    if (!detected || !ALLOWED_MIME.has(detected.mime)) return err("BAD_TYPE");

    const storageKey = makeStorageKey(weddingId, file.name);
    await putObject(storageKey, file.buffer);
    const a = await getDb().requestAttachment.create({
      data: {
        requestId,
        storageKey,
        name: file.name.slice(0, 255),
        mime: detected.mime,
        size: file.buffer.length,
      },
    });
    return ok({ id: a.id });
  });
}

export async function getAttachmentForAccess(
  agencyId: string,
  weddingId: string,
  attachmentId: string,
) {
  return tenantScope(agencyId, async () => {
    if (!(await assertWedding(agencyId, weddingId))) return null;
    return getDb().requestAttachment.findFirst({
      where: { id: attachmentId, request: { weddingId } },
    });
  });
}

export async function deleteAttachment(
  agencyId: string,
  weddingId: string,
  attachmentId: string,
): Promise<Result<true, "NOT_FOUND">> {
  return tenantScope(agencyId, async () => {
    if (!(await assertWedding(agencyId, weddingId))) return err("NOT_FOUND");
    const a = await getDb().requestAttachment.findFirst({
      where: { id: attachmentId, request: { weddingId } },
    });
    if (!a) return err("NOT_FOUND");
    await getDb().requestAttachment.delete({ where: { id: a.id } });
    await deleteObject(a.storageKey);
    return ok(true);
  });
}
