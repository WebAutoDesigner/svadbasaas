import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { createAgencyWithOwner } from "@/lib/agency/create";
import { createWedding } from "@/lib/wedding/wedding";
import {
  addVendor,
  deleteVendor,
  listVendors,
  updateVendor,
  vendorsSummary,
} from "@/lib/wedding/vendor";

const PREFIX = "ven-test-";

async function cleanup() {
  await db.vendor.deleteMany({
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

async function setup(suffix: string): Promise<{ agencyId: string; weddingId: string }> {
  const a = await createAgencyWithOwner({
    agencyName: `${PREFIX}${suffix}`,
    ownerEmail: `${PREFIX}${suffix}@example.com`,
    ownerName: "Owner",
    ownerPassword: "password-123-456",
  });
  if (!a.ok) throw new Error("agency setup failed");
  const w = await createWedding(a.data.agencyId, {
    brideName: "Анна",
    groomName: "Пётр",
    date: "2026-08-15",
    timezone: "Europe/Moscow",
    budget: 0,
  });
  if (!w.ok) throw new Error("wedding setup failed");
  return { agencyId: a.data.agencyId, weddingId: w.data.id };
}

const base = {
  name: "Иван Ведущий",
  service: "Ведущий",
  amount: 80000,
  paymentStatus: "NOT_PAID" as const,
};

describe("vendors", () => {
  beforeEach(cleanup);
  afterAll(cleanup);

  it("adds and summarizes vendors", async () => {
    const { agencyId, weddingId } = await setup("sum");
    await addVendor(agencyId, weddingId, base);
    await addVendor(agencyId, weddingId, {
      name: "Фотограф",
      service: "Фото",
      amount: 60000,
      paymentStatus: "PAID",
    });

    const s = await vendorsSummary(agencyId, weddingId);
    expect(s.count).toBe(2);
    expect(s.total).toBe(140000);
    expect(s.paid).toBe(60000);
  });

  it("updates and deletes scoped", async () => {
    const { agencyId, weddingId } = await setup("ops");
    const v = await addVendor(agencyId, weddingId, base);
    if (!v.ok) throw new Error("add failed");

    const upd = await updateVendor(agencyId, weddingId, v.data.id, {
      ...base,
      paymentStatus: "PAID",
      amount: 90000,
    });
    expect(upd.ok).toBe(true);

    const s = await vendorsSummary(agencyId, weddingId);
    expect(s.paid).toBe(90000);

    const del = await deleteVendor(agencyId, weddingId, v.data.id);
    expect(del.ok).toBe(true);
    expect(await listVendors(agencyId, weddingId)).toHaveLength(0);
  });

  it("blocks cross-agency vendor access", async () => {
    const a = await setup("x1");
    const b = await setup("x2");
    const res = await addVendor(b.agencyId, a.weddingId, base);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toBe("NOT_FOUND");
    expect(await listVendors(b.agencyId, a.weddingId)).toHaveLength(0);
  });
});
