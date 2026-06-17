import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { createAgencyWithOwner } from "@/lib/agency/create";

const TEST_PREFIX = "iso-test-";

async function cleanup() {
  // Удаляем всё что создано в этом тесте по префиксу email/имени
  await db.agencyMember.deleteMany({
    where: { user: { email: { startsWith: TEST_PREFIX } } },
  });
  await db.account.deleteMany({
    where: { user: { email: { startsWith: TEST_PREFIX } } },
  });
  await db.user.deleteMany({
    where: { email: { startsWith: TEST_PREFIX } },
  });
  await db.agency.deleteMany({
    where: { name: { startsWith: TEST_PREFIX } },
  });
}

describe("multi-tenancy: agency isolation", () => {
  beforeEach(cleanup);
  afterAll(cleanup);

  it("each agency has its own scoped data via agency_id", async () => {
    const agencyA = await createAgencyWithOwner({
      agencyName: `${TEST_PREFIX}A`,
      ownerPhone: `7${Math.floor(1e9 + Math.random() * 8.9e9)}`,
      ownerName: "Owner A",
      ownerPassword: "passwordA-12345",
    });
    const agencyB = await createAgencyWithOwner({
      agencyName: `${TEST_PREFIX}B`,
      ownerPhone: `7${Math.floor(1e9 + Math.random() * 8.9e9)}`,
      ownerName: "Owner B",
      ownerPassword: "passwordB-12345",
    });

    expect(agencyA.ok).toBe(true);
    expect(agencyB.ok).toBe(true);
    if (!agencyA.ok || !agencyB.ok) return;

    // Когда мы фильтруем по agencyId, видим только своё
    const aMembers = await db.agencyMember.findMany({
      where: { agencyId: agencyA.data.agencyId },
    });
    const bMembers = await db.agencyMember.findMany({
      where: { agencyId: agencyB.data.agencyId },
    });

    expect(aMembers).toHaveLength(1);
    expect(bMembers).toHaveLength(1);
    expect(aMembers[0]?.userId).toBe(agencyA.data.userId);
    expect(bMembers[0]?.userId).toBe(agencyB.data.userId);

    // Кросс-проверка: владелец A не числится в агентстве B и наоборот
    const crossA = await db.agencyMember.findFirst({
      where: {
        agencyId: agencyB.data.agencyId,
        userId: agencyA.data.userId,
      },
    });
    const crossB = await db.agencyMember.findFirst({
      where: {
        agencyId: agencyA.data.agencyId,
        userId: agencyB.data.userId,
      },
    });
    expect(crossA).toBeNull();
    expect(crossB).toBeNull();
  });

  it("rejects duplicate owner phone", async () => {
    const dupPhone = `7${Math.floor(1e9 + Math.random() * 8.9e9)}`;
    const first = await createAgencyWithOwner({
      agencyName: `${TEST_PREFIX}First`,
      ownerPhone: dupPhone,
      ownerName: "First",
      ownerPassword: "password-123-45",
    });
    expect(first.ok).toBe(true);

    const second = await createAgencyWithOwner({
      agencyName: `${TEST_PREFIX}Second`,
      ownerPhone: dupPhone,
      ownerName: "Second",
      ownerPassword: "password-678-90",
    });
    expect(second.ok).toBe(false);
    if (!second.ok) expect(second.error).toBe("PHONE_TAKEN");
  });
});
