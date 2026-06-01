import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { createAgencyWithOwner } from "@/lib/agency/create";
import { createWedding } from "@/lib/wedding/wedding";
import {
  getUnseenCoupleChanges,
  markCoupleChangesSeen,
  recordCoupleActivity,
} from "@/lib/wedding/couple-activity";

const PREFIX = "cact-test-";

async function cleanup() {
  await db.coupleActivity.deleteMany({
    where: { wedding: { agency: { name: { startsWith: PREFIX } } } },
  });
  await db.wedding.deleteMany({
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

describe("couple-activity", () => {
  beforeEach(cleanup);
  afterAll(cleanup);

  it("records, reads unseen, then marks seen", async () => {
    const { agencyId, weddingId } = await setup("flow");
    await recordCoupleActivity(weddingId, "GUESTS", "Добавлен гость: Иван");
    await recordCoupleActivity(weddingId, "GUESTS", "Добавлен гость: Мария");

    const before = await getUnseenCoupleChanges(agencyId, weddingId, "GUESTS");
    expect(before.count).toBe(2);
    expect(before.items).toHaveLength(2);

    await markCoupleChangesSeen(agencyId, weddingId, "GUESTS");

    const after = await getUnseenCoupleChanges(agencyId, weddingId, "GUESTS");
    expect(after.count).toBe(0);
    expect(after.items).toHaveLength(0);
  });

  it("separates areas", async () => {
    const { agencyId, weddingId } = await setup("areas");
    await recordCoupleActivity(weddingId, "GUESTS", "г1");
    await recordCoupleActivity(weddingId, "SEATING", "р1");

    expect((await getUnseenCoupleChanges(agencyId, weddingId, "GUESTS")).count).toBe(1);
    expect((await getUnseenCoupleChanges(agencyId, weddingId, "SEATING")).count).toBe(1);

    await markCoupleChangesSeen(agencyId, weddingId, "GUESTS");
    expect((await getUnseenCoupleChanges(agencyId, weddingId, "GUESTS")).count).toBe(0);
    expect((await getUnseenCoupleChanges(agencyId, weddingId, "SEATING")).count).toBe(1);
  });

  it("blocks cross-agency read", async () => {
    const a = await setup("x1");
    const b = await setup("x2");
    await recordCoupleActivity(a.weddingId, "GUESTS", "secret");
    const res = await getUnseenCoupleChanges(b.agencyId, a.weddingId, "GUESTS");
    expect(res.count).toBe(0);
  });
});
