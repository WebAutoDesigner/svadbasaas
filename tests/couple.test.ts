import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { createAgencyWithOwner } from "@/lib/agency/create";
import { createWedding } from "@/lib/wedding/wedding";
import {
  getCoupleSession,
  upsertCoupleAccess,
  verifyCouplePassword,
} from "@/lib/couple/auth";
import { coupleChecklist } from "@/lib/couple/data";
import { addItem } from "@/lib/wedding/checklist";

const PREFIX = "cpl-test-";
const PASSWORD = "couple-pass-123";

function randPhone(): string {
  return `7900${Math.floor(1_000_000 + Math.random() * 8_999_999)}`;
}

async function cleanup() {
  // Каскад: удаление свадьбы убирает coupleAccess + сессии + чек-лист.
  await db.wedding.deleteMany({
    where: { agency: { name: { startsWith: PREFIX } } },
  });
  await db.agencyMember.deleteMany({
    where: { agency: { name: { startsWith: PREFIX } } },
  });
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

describe("couple access (телефон + пароль)", () => {
  beforeEach(cleanup);
  afterAll(cleanup);

  it("full login: invite → verify password → session", async () => {
    const { weddingId } = await setup("flow");
    const phone = randPhone();
    await upsertCoupleAccess(weddingId, phone, PASSWORD, "Анна и Пётр");

    const verify = await verifyCouplePassword(phone, PASSWORD);
    expect(verify.ok).toBe(true);
    if (!verify.ok) return;
    expect(verify.data.weddingId).toBe(weddingId);

    const session = await getCoupleSession(verify.data.sessionId);
    expect(session?.weddingId).toBe(weddingId);
    expect(session?.phone).toBe(phone);
  });

  it("rejects wrong password", async () => {
    const { weddingId } = await setup("wrong");
    const phone = randPhone();
    await upsertCoupleAccess(weddingId, phone, PASSWORD, null);

    const verify = await verifyCouplePassword(phone, "nope-wrong-pass");
    expect(verify.ok).toBe(false);
    if (!verify.ok) expect(verify.error).toBe("INVALID");
  });

  it("re-invite resets password", async () => {
    const { weddingId } = await setup("reset");
    const phone = randPhone();
    await upsertCoupleAccess(weddingId, phone, PASSWORD, null);
    await upsertCoupleAccess(weddingId, phone, "new-pass-456", null);

    expect((await verifyCouplePassword(phone, PASSWORD)).ok).toBe(false);
    expect((await verifyCouplePassword(phone, "new-pass-456")).ok).toBe(true);
  });

  it("locks after 5 failed attempts", async () => {
    const { weddingId } = await setup("lock");
    const phone = randPhone();
    await upsertCoupleAccess(weddingId, phone, PASSWORD, null);

    for (let i = 0; i < 5; i++) {
      await verifyCouplePassword(phone, "bad-attempt");
    }
    const locked = await verifyCouplePassword(phone, PASSWORD);
    expect(locked.ok).toBe(false);
    if (!locked.ok) expect(locked.error).toBe("LOCKED");
  });

  it("unknown phone → INVALID (без раскрытия существования)", async () => {
    const res = await verifyCouplePassword(randPhone(), PASSWORD);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toBe("INVALID");
  });

  it("couple data fetchers are scoped to their wedding", async () => {
    const a = await setup("data1");
    const b = await setup("data2");
    await addItem(a.agencyId, a.weddingId, {
      title: "Только для A",
      period: "SIX_MONTHS",
    });

    expect(await coupleChecklist(a.weddingId)).toHaveLength(1);
    expect(await coupleChecklist(b.weddingId)).toHaveLength(0);
  });
});
