import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { createAgencyWithOwner } from "@/lib/agency/create";
import {
  createWedding,
  getWedding,
  listWeddings,
  softDeleteWedding,
  updateWedding,
} from "@/lib/wedding/wedding";
import { daysUntil, parseDateInput } from "@/lib/dates";

const PREFIX = "wed-test-";

async function cleanup() {
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

async function makeAgency(suffix: string): Promise<{ agencyId: string; userId: string }> {
  const res = await createAgencyWithOwner({
    agencyName: `${PREFIX}${suffix}`,
    ownerPhone: `7${Math.floor(1e9 + Math.random() * 8.9e9)}`,
    ownerName: "Owner",
    ownerPassword: "password-123-456",
  });
  if (!res.ok) throw new Error("setup failed");
  return res.data;
}

const baseInput = {
  brideName: "Анна",
  groomName: "Пётр",
  date: "2026-08-15",
  timezone: "Europe/Moscow",
  budget: 500000,
};

describe("date utils", () => {
  it("parseDateInput produces UTC midnight", () => {
    const d = parseDateInput("2026-08-15");
    expect(d.toISOString()).toBe("2026-08-15T00:00:00.000Z");
  });

  it("daysUntil is 0 for today", () => {
    const today = new Date();
    const iso = today.toISOString().slice(0, 10);
    expect(daysUntil(parseDateInput(iso))).toBe(0);
  });
});

describe("wedding CRUD", () => {
  beforeEach(cleanup);
  afterAll(cleanup);

  it("creates and reads a wedding scoped to agency", async () => {
    const { agencyId } = await makeAgency("crud");
    const created = await createWedding(agencyId, baseInput);
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    const w = await getWedding(agencyId, created.data.id);
    expect(w?.brideName).toBe("Анна");
    expect(w?.budget).toBe(500000);
  });

  it("does not leak weddings across agencies", async () => {
    const a1 = await makeAgency("leak1");
    const a2 = await makeAgency("leak2");
    const created = await createWedding(a1.agencyId, baseInput);
    if (!created.ok) throw new Error("create failed");

    // a2 не видит свадьбу a1
    const fromA2 = await getWedding(a2.agencyId, created.data.id);
    expect(fromA2).toBeNull();

    const listA2 = await listWeddings(a2.agencyId);
    expect(listA2).toHaveLength(0);
    const listA1 = await listWeddings(a1.agencyId);
    expect(listA1).toHaveLength(1);
  });

  it("rejects coordinator from another agency", async () => {
    const a1 = await makeAgency("coord1");
    const a2 = await makeAgency("coord2");
    const res = await createWedding(a1.agencyId, {
      ...baseInput,
      coordinatorId: a2.userId, // чужой
    });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toBe("BAD_COORDINATOR");
  });

  it("accepts coordinator from same agency", async () => {
    const a1 = await makeAgency("coordok");
    const res = await createWedding(a1.agencyId, {
      ...baseInput,
      coordinatorId: a1.userId,
    });
    expect(res.ok).toBe(true);
  });

  it("soft delete hides from list and get", async () => {
    const { agencyId } = await makeAgency("del");
    const created = await createWedding(agencyId, baseInput);
    if (!created.ok) throw new Error("create failed");

    const del = await softDeleteWedding(agencyId, created.data.id);
    expect(del.ok).toBe(true);

    expect(await getWedding(agencyId, created.data.id)).toBeNull();
    expect(await listWeddings(agencyId, { includeCompleted: true })).toHaveLength(0);
  });

  it("update changes fields", async () => {
    const { agencyId } = await makeAgency("upd");
    const created = await createWedding(agencyId, baseInput);
    if (!created.ok) throw new Error("create failed");

    const upd = await updateWedding(agencyId, created.data.id, {
      ...baseInput,
      brideName: "Мария",
      budget: 700000,
      status: "COMPLETED",
    });
    expect(upd.ok).toBe(true);

    const w = await getWedding(agencyId, created.data.id);
    expect(w?.brideName).toBe("Мария");
    expect(w?.budget).toBe(700000);
    expect(w?.status).toBe("COMPLETED");
  });

  it("update rejects cross-agency wedding", async () => {
    const a1 = await makeAgency("updx1");
    const a2 = await makeAgency("updx2");
    const created = await createWedding(a1.agencyId, baseInput);
    if (!created.ok) throw new Error("create failed");

    const upd = await updateWedding(a2.agencyId, created.data.id, {
      ...baseInput,
      status: "PLANNING",
    });
    expect(upd.ok).toBe(false);
    if (!upd.ok) expect(upd.error).toBe("NOT_FOUND");
  });
});
