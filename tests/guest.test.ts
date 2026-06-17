import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { createAgencyWithOwner } from "@/lib/agency/create";
import { createWedding } from "@/lib/wedding/wedding";
import {
  addGuest,
  deleteGuest,
  guestsSummary,
  listGuests,
  setGuestStatus,
  updateGuest,
} from "@/lib/wedding/guest";

const PREFIX = "guest-test-";

async function cleanup() {
  await db.guest.deleteMany({
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
    budget: 0,
  });
  if (!w.ok) throw new Error("wedding setup failed");
  return { agencyId: a.data.agencyId, weddingId: w.data.id };
}

describe("guests", () => {
  beforeEach(cleanup);
  afterAll(cleanup);

  it("adds, lists, summarizes by status", async () => {
    const { agencyId, weddingId } = await setup("sum");
    await addGuest(agencyId, weddingId, { name: "Иван", status: "COMING" });
    await addGuest(agencyId, weddingId, { name: "Мария", status: "COMING" });
    await addGuest(agencyId, weddingId, { name: "Петя", status: "NO_ANSWER" });

    const s = await guestsSummary(agencyId, weddingId);
    expect(s.total).toBe(3);
    expect(s.coming).toBe(2);
    expect(s.noAnswer).toBe(1);
    expect(await listGuests(agencyId, weddingId)).toHaveLength(3);
  });

  it("updates status inline and full edit", async () => {
    const { agencyId, weddingId } = await setup("upd");
    const g = await addGuest(agencyId, weddingId, {
      name: "Иван",
      status: "NO_ANSWER",
    });
    if (!g.ok) throw new Error("add");

    expect(
      (await setGuestStatus(agencyId, weddingId, g.data.id, "NOT_COMING")).ok,
    ).toBe(true);
    expect(
      (
        await updateGuest(agencyId, weddingId, g.data.id, {
          name: "Иван И.",
          status: "COMING",
          side: "GROOM",
          groupLabel: "друзья",
        })
      ).ok,
    ).toBe(true);

    const list = await listGuests(agencyId, weddingId);
    expect(list[0]!.side).toBe("GROOM");
    expect(list[0]!.status).toBe("COMING");
    expect(list[0]!.groupLabel).toBe("друзья");
  });

  it("deletes guest", async () => {
    const { agencyId, weddingId } = await setup("del");
    const g = await addGuest(agencyId, weddingId, {
      name: "Иван",
      status: "COMING",
    });
    if (!g.ok) throw new Error("add");
    expect((await deleteGuest(agencyId, weddingId, g.data.id)).ok).toBe(true);
    expect(await listGuests(agencyId, weddingId)).toHaveLength(0);
  });

  it("blocks cross-agency access", async () => {
    const a = await setup("x1");
    const b = await setup("x2");
    const res = await addGuest(b.agencyId, a.weddingId, {
      name: "X",
      status: "COMING",
    });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toBe("NOT_FOUND");
    expect(await listGuests(b.agencyId, a.weddingId)).toHaveLength(0);
  });
});
