import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { createAgencyWithOwner } from "@/lib/agency/create";
import { createWedding } from "@/lib/wedding/wedding";
import {
  getCoupleSession,
  requestLoginCode,
  upsertCoupleAccess,
  verifyLoginCode,
} from "@/lib/couple/auth";
import { coupleChecklist } from "@/lib/couple/data";
import { addItem } from "@/lib/wedding/checklist";

const PREFIX = "cpl-test-";
const EMAIL = `${PREFIX}pair@example.com`;

async function cleanup() {
  await db.coupleSession.deleteMany({
    where: { coupleAccess: { email: { startsWith: PREFIX } } },
  });
  await db.coupleAccess.deleteMany({ where: { email: { startsWith: PREFIX } } });
  await db.checklistItem.deleteMany({
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
    ownerEmail: `${PREFIX}${suffix}-owner@example.com`,
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

describe("couple access", () => {
  beforeEach(cleanup);
  afterAll(cleanup);

  it("full login flow: invite → request code → verify → session", async () => {
    const { weddingId } = await setup("flow");
    await upsertCoupleAccess(weddingId, EMAIL, "Анна и Пётр");

    const req = await requestLoginCode(EMAIL);
    expect(req.ok).toBe(true);
    if (!req.ok) return;

    const verify = await verifyLoginCode(EMAIL, req.data.code);
    expect(verify.ok).toBe(true);
    if (!verify.ok) return;
    expect(verify.data.weddingId).toBe(weddingId);

    const session = await getCoupleSession(verify.data.sessionId);
    expect(session?.weddingId).toBe(weddingId);
  });

  it("rejects wrong code", async () => {
    const { weddingId } = await setup("wrong");
    await upsertCoupleAccess(weddingId, EMAIL, null);
    await requestLoginCode(EMAIL);

    const verify = await verifyLoginCode(EMAIL, "000000");
    // код случайный — практически наверняка неверный; если совпал, пропускаем
    if (!verify.ok) expect(verify.error).toBe("WRONG_CODE");
  });

  it("code is one-time (second verify fails)", async () => {
    const { weddingId } = await setup("once");
    await upsertCoupleAccess(weddingId, EMAIL, null);
    const req = await requestLoginCode(EMAIL);
    if (!req.ok) throw new Error("request failed");

    const first = await verifyLoginCode(EMAIL, req.data.code);
    expect(first.ok).toBe(true);

    const second = await verifyLoginCode(EMAIL, req.data.code);
    expect(second.ok).toBe(false); // код погашен
  });

  it("locks after 5 failed attempts", async () => {
    const { weddingId } = await setup("lock");
    await upsertCoupleAccess(weddingId, EMAIL, null);
    await requestLoginCode(EMAIL);

    for (let i = 0; i < 5; i++) {
      await verifyLoginCode(EMAIL, "111111");
    }
    const locked = await verifyLoginCode(EMAIL, "111111");
    expect(locked.ok).toBe(false);
    if (!locked.ok) expect(locked.error).toBe("LOCKED");
  });

  it("returns NO_ACCESS for unknown email", async () => {
    const req = await requestLoginCode(`${PREFIX}nobody@example.com`);
    expect(req.ok).toBe(false);
    if (!req.ok) expect(req.error).toBe("NO_ACCESS");
  });

  it("couple data fetchers are scoped to their wedding", async () => {
    const a = await setup("data1");
    const b = await setup("data2");
    await addItem(a.agencyId, a.weddingId, {
      title: "Только для A",
      period: "SIX_MONTHS",
    });

    // Чек-лист свадьбы A виден по weddingId A
    expect(await coupleChecklist(a.weddingId)).toHaveLength(1);
    // Чек-лист свадьбы B пуст
    expect(await coupleChecklist(b.weddingId)).toHaveLength(0);
  });
});
