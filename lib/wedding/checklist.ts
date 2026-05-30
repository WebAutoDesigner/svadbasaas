import { db } from "@/lib/db";
import { err, ok, type Result } from "@/lib/result";
import { getTemplate } from "@/lib/templates/checklist";
import type { ChecklistPeriod } from "@prisma/client";

/** Проверяет, что свадьба принадлежит агентству (tenant guard для дочерних сущностей) */
async function assertWedding(
  agencyId: string,
  weddingId: string,
): Promise<boolean> {
  const w = await db.wedding.findFirst({
    where: { id: weddingId, agencyId, deletedAt: null },
    select: { id: true },
  });
  return Boolean(w);
}

export async function listChecklist(agencyId: string, weddingId: string) {
  if (!(await assertWedding(agencyId, weddingId))) return [];
  return db.checklistItem.findMany({
    where: { weddingId },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
}

export type ChecklistProgress = { done: number; total: number; percent: number };

export async function checklistProgress(
  agencyId: string,
  weddingId: string,
): Promise<ChecklistProgress> {
  if (!(await assertWedding(agencyId, weddingId))) {
    return { done: 0, total: 0, percent: 0 };
  }
  const [total, done] = await Promise.all([
    db.checklistItem.count({ where: { weddingId } }),
    db.checklistItem.count({ where: { weddingId, done: true } }),
  ]);
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);
  return { done, total, percent };
}

export async function addItem(
  agencyId: string,
  weddingId: string,
  input: { title: string; period: ChecklistPeriod; note?: string | undefined },
): Promise<Result<{ id: string }, "NOT_FOUND">> {
  if (!(await assertWedding(agencyId, weddingId))) return err("NOT_FOUND");

  const max = await db.checklistItem.aggregate({
    where: { weddingId, period: input.period },
    _max: { sortOrder: true },
  });
  const sortOrder = (max._max.sortOrder ?? 0) + 1;

  const item = await db.checklistItem.create({
    data: {
      weddingId,
      title: input.title,
      period: input.period,
      note: input.note || null,
      sortOrder,
    },
  });
  return ok({ id: item.id });
}

export async function toggleItem(
  agencyId: string,
  weddingId: string,
  itemId: string,
  done: boolean,
): Promise<Result<true, "NOT_FOUND">> {
  if (!(await assertWedding(agencyId, weddingId))) return err("NOT_FOUND");
  const updated = await db.checklistItem.updateMany({
    where: { id: itemId, weddingId },
    data: { done },
  });
  if (updated.count === 0) return err("NOT_FOUND");
  return ok(true);
}

export async function deleteItem(
  agencyId: string,
  weddingId: string,
  itemId: string,
): Promise<Result<true, "NOT_FOUND">> {
  if (!(await assertWedding(agencyId, weddingId))) return err("NOT_FOUND");
  const deleted = await db.checklistItem.deleteMany({
    where: { id: itemId, weddingId },
  });
  if (deleted.count === 0) return err("NOT_FOUND");
  return ok(true);
}

export async function applyTemplate(
  agencyId: string,
  weddingId: string,
  templateId: string,
): Promise<Result<{ added: number }, "NOT_FOUND" | "BAD_TEMPLATE">> {
  if (!(await assertWedding(agencyId, weddingId))) return err("NOT_FOUND");
  const template = getTemplate(templateId);
  if (!template) return err("BAD_TEMPLATE");

  await db.checklistItem.createMany({
    data: template.items.map((item, idx) => ({
      weddingId,
      title: item.title,
      period: item.period,
      sortOrder: idx + 1,
    })),
  });
  return ok({ added: template.items.length });
}
