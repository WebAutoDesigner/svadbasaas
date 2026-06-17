import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { createAgencyWithOwner } from "@/lib/agency/create";
import { createWedding } from "@/lib/wedding/wedding";
import {
  addBudgetItem,
  budgetSummary,
  deleteBudgetItem,
  ensureDefaultCategories,
  listBudget,
  updateBudgetItem,
} from "@/lib/wedding/budget";
import { DEFAULT_BUDGET_CATEGORIES } from "@/lib/templates/budget";

const PREFIX = "bud-test-";

async function cleanup() {
  await db.budgetItem.deleteMany({
    where: { wedding: { agency: { name: { startsWith: PREFIX } } } },
  });
  await db.wedding.deleteMany({ where: { agency: { name: { startsWith: PREFIX } } } });
  await db.agencyMember.deleteMany({
    where: { user: { email: { startsWith: PREFIX } } },
  });
  await db.account.deleteMany({
    where: { user: { email: { startsWith: PREFIX } } },
  });
  await db.user.deleteMany({ where: { email: { startsWith: PREFIX } } });
  await db.agency.deleteMany({ where: { name: { startsWith: PREFIX } } });
}

async function setup(
  suffix: string,
  budget = 1000000,
): Promise<{ agencyId: string; weddingId: string }> {
  const a = await createAgencyWithOwner({
    agencyName: `${PREFIX}${suffix}`,
    ownerPhone: `7${Math.floor(1e9 + Math.random() * 8.9e9)}`,
    ownerName: "Owner",
    ownerPassword: "password-123-456",
  });
  if (!a.ok) throw new Error("agency setup failed");
  const w = await createWedding(a.data.agencyId, {
    brideName: "Анна",
    groomName: "Пётр",
    date: "2026-08-15",
    timezone: "Europe/Moscow",
    budget,
  });
  if (!w.ok) throw new Error("wedding setup failed");
  return { agencyId: a.data.agencyId, weddingId: w.data.id };
}

describe("budget", () => {
  beforeEach(cleanup);
  afterAll(cleanup);

  it("ensureDefaultCategories is idempotent", async () => {
    const { agencyId, weddingId } = await setup("def");
    const first = await ensureDefaultCategories(agencyId, weddingId);
    expect(first.ok).toBe(true);
    if (first.ok) expect(first.data.created).toBe(DEFAULT_BUDGET_CATEGORIES.length);

    const second = await ensureDefaultCategories(agencyId, weddingId);
    expect(second.ok).toBe(true);
    if (second.ok) expect(second.data.created).toBe(0);

    expect(await listBudget(agencyId, weddingId)).toHaveLength(
      DEFAULT_BUDGET_CATEGORIES.length,
    );
  });

  it("computes summary with remaining", async () => {
    const { agencyId, weddingId } = await setup("sum", 1000000);
    const a = await addBudgetItem(agencyId, weddingId, {
      name: "Площадка",
      planned: 400000,
      actual: 300000,
    });
    const b = await addBudgetItem(agencyId, weddingId, {
      name: "Кейтеринг",
      planned: 300000,
      actual: 250000,
    });
    expect(a.ok && b.ok).toBe(true);

    const s = await budgetSummary(agencyId, weddingId);
    expect(s.totalPlanned).toBe(700000);
    expect(s.totalActual).toBe(550000);
    expect(s.weddingBudget).toBe(1000000);
    expect(s.remaining).toBe(450000);
  });

  it("remaining goes negative when over budget", async () => {
    const { agencyId, weddingId } = await setup("over", 100000);
    await addBudgetItem(agencyId, weddingId, {
      name: "Площадка",
      planned: 200000,
      actual: 150000,
    });
    const s = await budgetSummary(agencyId, weddingId);
    expect(s.remaining).toBe(-50000);
  });

  it("update and delete are scoped", async () => {
    const { agencyId, weddingId } = await setup("ops");
    const item = await addBudgetItem(agencyId, weddingId, {
      name: "X",
      planned: 100,
      actual: 0,
    });
    if (!item.ok) throw new Error("add failed");

    const upd = await updateBudgetItem(agencyId, weddingId, item.data.id, {
      planned: 500,
      actual: 200,
    });
    expect(upd.ok).toBe(true);

    const del = await deleteBudgetItem(agencyId, weddingId, item.data.id);
    expect(del.ok).toBe(true);
    expect(await listBudget(agencyId, weddingId)).toHaveLength(0);
  });

  it("blocks cross-agency budget access", async () => {
    const a = await setup("x1");
    const b = await setup("x2");
    const res = await addBudgetItem(b.agencyId, a.weddingId, {
      name: "hack",
      planned: 1,
      actual: 0,
    });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toBe("NOT_FOUND");
    expect(await listBudget(b.agencyId, a.weddingId)).toHaveLength(0);
  });
});
