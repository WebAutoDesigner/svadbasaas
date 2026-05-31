import { db } from "@/lib/db";
import { err, ok, type Result } from "@/lib/result";
import { assertWedding } from "@/lib/wedding/guard";
import { DEFAULT_BUDGET_CATEGORIES } from "@/lib/templates/budget";

export async function listBudget(agencyId: string, weddingId: string) {
  if (!(await assertWedding(agencyId, weddingId))) return [];
  return db.budgetItem.findMany({
    where: { weddingId },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
}

export type BudgetSummary = {
  totalPlanned: number;
  totalActual: number;
  weddingBudget: number;
  remaining: number; // weddingBudget - totalActual
};

export async function budgetSummary(
  agencyId: string,
  weddingId: string,
): Promise<BudgetSummary> {
  const wedding = await db.wedding.findFirst({
    where: { id: weddingId, agencyId, deletedAt: null },
    select: { budget: true },
  });
  if (!wedding) {
    return { totalPlanned: 0, totalActual: 0, weddingBudget: 0, remaining: 0 };
  }
  const agg = await db.budgetItem.aggregate({
    where: { weddingId },
    _sum: { planned: true, actual: true },
  });
  const totalPlanned = agg._sum.planned ?? 0;
  const totalActual = agg._sum.actual ?? 0;
  return {
    totalPlanned,
    totalActual,
    weddingBudget: wedding.budget,
    remaining: wedding.budget - totalActual,
  };
}

/** Создаёт стандартные статьи, если бюджет пуст. Идемпотентно. */
export async function ensureDefaultCategories(
  agencyId: string,
  weddingId: string,
): Promise<Result<{ created: number }, "NOT_FOUND">> {
  if (!(await assertWedding(agencyId, weddingId))) return err("NOT_FOUND");
  const count = await db.budgetItem.count({ where: { weddingId } });
  if (count > 0) return ok({ created: 0 });

  await db.budgetItem.createMany({
    data: DEFAULT_BUDGET_CATEGORIES.map((name, idx) => ({
      weddingId,
      name,
      sortOrder: idx + 1,
    })),
  });
  return ok({ created: DEFAULT_BUDGET_CATEGORIES.length });
}

export async function addBudgetItem(
  agencyId: string,
  weddingId: string,
  input: { name: string; planned: number; actual: number },
): Promise<Result<{ id: string }, "NOT_FOUND">> {
  if (!(await assertWedding(agencyId, weddingId))) return err("NOT_FOUND");
  const max = await db.budgetItem.aggregate({
    where: { weddingId },
    _max: { sortOrder: true },
  });
  const item = await db.budgetItem.create({
    data: {
      weddingId,
      name: input.name,
      planned: input.planned,
      actual: input.actual,
      sortOrder: (max._max.sortOrder ?? 0) + 1,
    },
  });
  return ok({ id: item.id });
}

export async function updateBudgetItem(
  agencyId: string,
  weddingId: string,
  itemId: string,
  input: { planned: number; actual: number },
): Promise<Result<true, "NOT_FOUND">> {
  if (!(await assertWedding(agencyId, weddingId))) return err("NOT_FOUND");
  const updated = await db.budgetItem.updateMany({
    where: { id: itemId, weddingId },
    data: { planned: input.planned, actual: input.actual },
  });
  if (updated.count === 0) return err("NOT_FOUND");
  return ok(true);
}

export async function deleteBudgetItem(
  agencyId: string,
  weddingId: string,
  itemId: string,
): Promise<Result<true, "NOT_FOUND">> {
  if (!(await assertWedding(agencyId, weddingId))) return err("NOT_FOUND");
  const deleted = await db.budgetItem.deleteMany({
    where: { id: itemId, weddingId },
  });
  if (deleted.count === 0) return err("NOT_FOUND");
  return ok(true);
}
