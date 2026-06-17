import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { createAgencyWithOwner } from "@/lib/agency/create";
import { createWedding } from "@/lib/wedding/wedding";
import {
  addEvent,
  deleteEvent,
  hhmmToMinutes,
  listTimeline,
  minutesToHHMM,
} from "@/lib/wedding/timeline";

const PREFIX = "tl-test-";

async function cleanup() {
  await db.timelineEvent.deleteMany({
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

describe("time helpers", () => {
  it("converts minutes <-> HH:MM", () => {
    expect(minutesToHHMM(0)).toBe("00:00");
    expect(minutesToHHMM(90)).toBe("01:30");
    expect(minutesToHHMM(19 * 60 + 42)).toBe("19:42");
    expect(hhmmToMinutes("19:42")).toBe(19 * 60 + 42);
    expect(hhmmToMinutes("9:05")).toBe(9 * 60 + 5);
  });

  it("rejects invalid time", () => {
    expect(hhmmToMinutes("25:00")).toBeNull();
    expect(hhmmToMinutes("12:99")).toBeNull();
    expect(hhmmToMinutes("abc")).toBeNull();
  });
});

describe("timeline", () => {
  beforeEach(cleanup);
  afterAll(cleanup);

  it("adds events sorted by time", async () => {
    const { agencyId, weddingId } = await setup("sort");
    await addEvent(agencyId, weddingId, {
      startMinutes: 19 * 60,
      durationMin: 60,
      title: "Банкет",
    });
    await addEvent(agencyId, weddingId, {
      startMinutes: 15 * 60,
      durationMin: 30,
      title: "Регистрация",
    });

    const list = await listTimeline(agencyId, weddingId);
    expect(list).toHaveLength(2);
    expect(list[0]?.title).toBe("Регистрация"); // 15:00 раньше 19:00
    expect(list[1]?.title).toBe("Банкет");
  });

  it("blocks cross-agency timeline access", async () => {
    const a = await setup("x1");
    const b = await setup("x2");
    const res = await addEvent(b.agencyId, a.weddingId, {
      startMinutes: 600,
      durationMin: 0,
      title: "hack",
    });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toBe("NOT_FOUND");
    expect(await listTimeline(b.agencyId, a.weddingId)).toHaveLength(0);
  });

  it("deletes event", async () => {
    const { agencyId, weddingId } = await setup("del");
    const ev = await addEvent(agencyId, weddingId, {
      startMinutes: 600,
      durationMin: 0,
      title: "X",
    });
    if (!ev.ok) throw new Error("add failed");
    const del = await deleteEvent(agencyId, weddingId, ev.data.id);
    expect(del.ok).toBe(true);
    expect(await listTimeline(agencyId, weddingId)).toHaveLength(0);
  });
});
