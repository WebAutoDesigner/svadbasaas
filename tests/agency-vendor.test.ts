import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { createAgencyWithOwner } from "@/lib/agency/create";
import {
  addAgencyVendor,
  deleteAgencyVendor,
  listAgencyVendors,
  updateAgencyVendor,
} from "@/lib/agency/vendor-directory";

const PREFIX = "avd-test-";

async function cleanup() {
  await db.agencyVendor.deleteMany({
    where: { agency: { name: { startsWith: PREFIX } } },
  });
  await db.agencyMember.deleteMany({
    where: { user: { email: { startsWith: PREFIX } } },
  });
  await db.account.deleteMany({
    where: { user: { email: { startsWith: PREFIX } } },
  });
  await db.user.deleteMany({ where: { email: { startsWith: PREFIX } } });
  await db.agency.deleteMany({ where: { name: { startsWith: PREFIX } } });
}

async function setup(suffix: string) {
  const a = await createAgencyWithOwner({
    agencyName: `${PREFIX}${suffix}`,
    ownerEmail: `${PREFIX}${suffix}@example.com`,
    ownerName: "Owner",
    ownerPassword: "password-123-456",
  });
  if (!a.ok) throw new Error("agency setup failed");
  return { agencyId: a.data.agencyId };
}

describe("agency vendor directory", () => {
  beforeEach(cleanup);
  afterAll(cleanup);

  it("adds, lists, filters, updates, deletes", async () => {
    const { agencyId } = await setup("ops");
    await addAgencyVendor(agencyId, { name: "Иван Фото", service: "Фотограф" });
    const v = await addAgencyVendor(agencyId, {
      name: "Пётр Вед",
      service: "Ведущий",
      contact: "+7900",
      link: "https://t.me/x",
      priceNote: "от 50т",
    });
    if (!v.ok) throw new Error("add");

    expect(await listAgencyVendors(agencyId)).toHaveLength(2);
    expect(await listAgencyVendors(agencyId, { service: "Ведущий" })).toHaveLength(1);
    expect(await listAgencyVendors(agencyId, { search: "иван" })).toHaveLength(1);

    expect(
      (await updateAgencyVendor(agencyId, v.data.id, { name: "Пётр В.", service: "Ведущий" })).ok,
    ).toBe(true);
    expect((await deleteAgencyVendor(agencyId, v.data.id)).ok).toBe(true);
    expect(await listAgencyVendors(agencyId)).toHaveLength(1);
  });

  it("blocks cross-agency access", async () => {
    const a = await setup("x1");
    const b = await setup("x2");
    const v = await addAgencyVendor(a.agencyId, { name: "A vendor", service: "Фото" });
    if (!v.ok) throw new Error("add");

    expect(await listAgencyVendors(b.agencyId)).toHaveLength(0);
    expect((await updateAgencyVendor(b.agencyId, v.data.id, { name: "hack", service: "x" })).ok).toBe(false);
    expect((await deleteAgencyVendor(b.agencyId, v.data.id)).ok).toBe(false);
  });
});
