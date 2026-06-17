import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { db, getDb, runWithDb } from "@/lib/db";
import { createAgencyWithOwner } from "@/lib/agency/create";
import { createWedding } from "@/lib/wedding/wedding";

/**
 * Доказательство, что Postgres RLS реально режет чужое: внутри контекста
 * агентства A выполняем НАМЕРЕННО НЕСКОУПЛЕННЫЕ запросы (без WHERE agencyId/
 * weddingId). Если бы RLS не работал — вернулись бы и строки агентства B.
 * Это и есть «страховка от забытого фильтра».
 */

const PREFIX = "rls-test-";

async function cleanup() {
  const childWhere = { wedding: { agency: { name: { startsWith: PREFIX } } } };
  await db.budgetItem.deleteMany({ where: childWhere });
  await db.wedding.deleteMany({ where: { agency: { name: { startsWith: PREFIX } } } });
  await db.agencyMember.deleteMany({ where: { user: { email: { startsWith: PREFIX } } } });
  await db.account.deleteMany({ where: { user: { email: { startsWith: PREFIX } } } });
  await db.user.deleteMany({ where: { email: { startsWith: PREFIX } } });
  await db.agency.deleteMany({ where: { name: { startsWith: PREFIX } } });
}

/** Повторяет внутренности withAgency() без сессии: tx + app.agency_id + getDb-скоуп. */
async function asAgency<T>(agencyId: string, fn: () => Promise<T>): Promise<T> {
  return db.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT set_config('app.agency_id', ${agencyId}, true)`;
    return runWithDb(tx, fn);
  });
}

describe("Postgres RLS enforces tenant isolation even on unscoped queries", () => {
  beforeEach(cleanup);
  afterAll(cleanup);

  let aAgency: string;
  let aWedding: string;
  let bWedding: string;

  beforeEach(async () => {
    const a = await createAgencyWithOwner({
      agencyName: `${PREFIX}A`,
      ownerPhone: `7${Math.floor(1e9 + Math.random() * 8.9e9)}`,
      ownerName: "A",
      ownerPassword: "password-123-456",
    });
    const b = await createAgencyWithOwner({
      agencyName: `${PREFIX}B`,
      ownerPhone: `7${Math.floor(1e9 + Math.random() * 8.9e9)}`,
      ownerName: "B",
      ownerPassword: "password-123-456",
    });
    if (!a.ok || !b.ok) throw new Error("setup failed");
    aAgency = a.data.agencyId;

    const wa = await createWedding(a.data.agencyId, {
      brideName: "A", groomName: "A", date: "2026-08-15", timezone: "Europe/Moscow", budget: 0,
    });
    const wb = await createWedding(b.data.agencyId, {
      brideName: "B", groomName: "B", date: "2026-08-15", timezone: "Europe/Moscow", budget: 0,
    });
    if (!wa.ok || !wb.ok) throw new Error("wedding setup failed");
    aWedding = wa.data.id;
    bWedding = wb.data.id;

    // Бюджетные строки на обе свадьбы (через global db, без GUC — RLS пропускает)
    await db.budgetItem.create({ data: { weddingId: aWedding, name: "A-item" } });
    await db.budgetItem.create({ data: { weddingId: bWedding, name: "B-item" } });
  });

  it("unscoped wedding.findMany returns only the current agency's weddings", async () => {
    await asAgency(aAgency, async () => {
      const all = await getDb().wedding.findMany({}); // НЕТ where — нарочно
      expect(all.length).toBeGreaterThan(0);
      expect(all.every((w) => w.agencyId === aAgency)).toBe(true);
      expect(all.some((w) => w.id === aWedding)).toBe(true);
      expect(all.some((w) => w.id === bWedding)).toBe(false); // чужое не видно
    });
  });

  it("unscoped budgetItem.findMany returns only the current agency's items", async () => {
    await asAgency(aAgency, async () => {
      const items = await getDb().budgetItem.findMany({}); // НЕТ where — нарочно
      expect(items.length).toBeGreaterThan(0);
      expect(items.every((i) => i.weddingId === aWedding)).toBe(true);
      expect(items.some((i) => i.name === "B-item")).toBe(false); // чужое не видно
    });
  });

  it("outside agency context (no GUC) RLS allows all — couple/super-admin paths keep working", async () => {
    const all = await db.wedding.findMany({
      where: { agency: { name: { startsWith: PREFIX } } },
    });
    // оба агентства видны, т.к. контекст не задан (safe default)
    expect(all.some((w) => w.id === aWedding)).toBe(true);
    expect(all.some((w) => w.id === bWedding)).toBe(true);
  });
});
