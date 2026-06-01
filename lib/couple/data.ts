import { db } from "@/lib/db";

/**
 * Read-only фетчеры для ЛК пары. Скоупятся по weddingId, который берётся из
 * couple-сессии (она уже доказывает право доступа к этой свадьбе).
 */

export async function coupleWedding(weddingId: string) {
  return db.wedding.findFirst({
    where: { id: weddingId, deletedAt: null },
    include: { coordinator: { select: { name: true } } },
  });
}

/** agencyId свадьбы — нужен couple-мутациям, чтобы звать tenant-слой данных. */
export async function coupleAgencyId(weddingId: string): Promise<string | null> {
  const w = await db.wedding.findFirst({
    where: { id: weddingId, deletedAt: null },
    select: { agencyId: true },
  });
  return w?.agencyId ?? null;
}

export async function coupleChecklist(weddingId: string) {
  return db.checklistItem.findMany({
    where: { weddingId },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
}

export async function coupleChecklistProgress(weddingId: string) {
  const [total, done] = await Promise.all([
    db.checklistItem.count({ where: { weddingId } }),
    db.checklistItem.count({ where: { weddingId, done: true } }),
  ]);
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);
  return { total, done, percent };
}

export async function coupleBudget(weddingId: string) {
  return db.budgetItem.findMany({
    where: { weddingId },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
}

export async function coupleVendors(weddingId: string) {
  return db.vendor.findMany({
    where: { weddingId },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
}

export async function coupleGuests(weddingId: string) {
  return db.guest.findMany({
    where: { weddingId },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
}

export async function coupleTimeline(weddingId: string) {
  return db.timelineEvent.findMany({
    where: { weddingId },
    orderBy: { startMinutes: "asc" },
  });
}

export async function coupleDocuments(weddingId: string) {
  return db.document.findMany({
    where: { weddingId },
    orderBy: { createdAt: "desc" },
  });
}

/** Документ для скачивания парой — только если принадлежит её свадьбе */
export async function coupleDocumentForAccess(
  weddingId: string,
  documentId: string,
) {
  return db.document.findFirst({ where: { id: documentId, weddingId } });
}
