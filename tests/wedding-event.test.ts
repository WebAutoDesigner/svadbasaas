import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { createAgencyWithOwner } from "@/lib/agency/create";
import { createWedding } from "@/lib/wedding/wedding";
import {
  addEvent,
  deleteEvent,
  listEvents,
  updateEvent,
} from "@/lib/wedding/event";
import { coupleVisibleEvents } from "@/lib/couple/data";
import { timeToMinutes } from "@/lib/validators/wedding-event";

const PREFIX = "wev-test-";

async function cleanup() {
  await db.weddingEvent.deleteMany({
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
    date: "2026-10-20",
    timezone: "Europe/Moscow",
    budget: 0,
  });
  if (!w.ok) throw new Error("wedding setup failed");
  return { agencyId: a.data.agencyId, weddingId: w.data.id };
}

describe("wedding events", () => {
  beforeEach(cleanup);
  afterAll(cleanup);

  it("converts time and sorts by date", () => {
    expect(timeToMinutes("14:00")).toBe(840);
    expect(timeToMinutes("")).toBeNull();
  });

  it("adds, lists sorted, filters visible", async () => {
    const { agencyId, weddingId } = await setup("flow");
    await addEvent(agencyId, weddingId, {
      title: "Банкет",
      date: "2026-10-20",
      startMinutes: 1020,
      visibleToCouple: true,
    });
    await addEvent(agencyId, weddingId, {
      title: "Сборы",
      date: "2026-10-18",
      startMinutes: 540,
      visibleToCouple: false,
    });

    const list = await listEvents(agencyId, weddingId);
    expect(list).toHaveLength(2);
    expect(list[0]!.title).toBe("Сборы"); // 18-е раньше 20-го

    const visible = await coupleVisibleEvents(weddingId);
    expect(visible).toHaveLength(1);
    expect(visible[0]!.title).toBe("Банкет");
  });

  it("updates and deletes", async () => {
    const { agencyId, weddingId } = await setup("ops");
    const e = await addEvent(agencyId, weddingId, {
      title: "Роспись",
      date: "2026-10-20",
      startMinutes: 840,
      visibleToCouple: false,
    });
    if (!e.ok) throw new Error("add");
    expect(
      (
        await updateEvent(agencyId, weddingId, e.data.id, {
          title: "Роспись",
          date: "2026-10-20",
          startMinutes: 840,
          visibleToCouple: true,
        })
      ).ok,
    ).toBe(true);
    expect(await coupleVisibleEvents(weddingId)).toHaveLength(1);
    expect((await deleteEvent(agencyId, weddingId, e.data.id)).ok).toBe(true);
    expect(await listEvents(agencyId, weddingId)).toHaveLength(0);
  });

  it("blocks cross-agency access", async () => {
    const a = await setup("x1");
    const b = await setup("x2");
    const res = await addEvent(b.agencyId, a.weddingId, {
      title: "X",
      date: "2026-10-20",
      startMinutes: null,
      visibleToCouple: false,
    });
    expect(res.ok).toBe(false);
    expect(await listEvents(b.agencyId, a.weddingId)).toHaveLength(0);
  });
});
