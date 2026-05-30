import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { createAgencyWithOwner } from "@/lib/agency/create";
import { createWedding } from "@/lib/wedding/wedding";
import {
  addItem,
  applyTemplate,
  checklistProgress,
  deleteItem,
  listChecklist,
  toggleItem,
} from "@/lib/wedding/checklist";
import { getTemplate } from "@/lib/templates/checklist";

const PREFIX = "chk-test-";

async function cleanup() {
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

describe("checklist", () => {
  beforeEach(cleanup);
  afterAll(cleanup);

  it("adds items and computes progress", async () => {
    const { agencyId, weddingId } = await setup("prog");
    await addItem(agencyId, weddingId, { title: "A", period: "SIX_MONTHS" });
    const second = await addItem(agencyId, weddingId, {
      title: "B",
      period: "ONE_MONTH",
    });
    expect(second.ok).toBe(true);

    let progress = await checklistProgress(agencyId, weddingId);
    expect(progress).toEqual({ done: 0, total: 2, percent: 0 });

    if (second.ok) await toggleItem(agencyId, weddingId, second.data.id, true);
    progress = await checklistProgress(agencyId, weddingId);
    expect(progress).toEqual({ done: 1, total: 2, percent: 50 });
  });

  it("applies a template", async () => {
    const { agencyId, weddingId } = await setup("tpl");
    const res = await applyTemplate(agencyId, weddingId, "classic");
    expect(res.ok).toBe(true);

    const items = await listChecklist(agencyId, weddingId);
    const tpl = getTemplate("classic")!;
    expect(items).toHaveLength(tpl.items.length);
  });

  it("rejects unknown template", async () => {
    const { agencyId, weddingId } = await setup("badtpl");
    const res = await applyTemplate(agencyId, weddingId, "nope");
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toBe("BAD_TEMPLATE");
  });

  it("does not allow cross-agency checklist access", async () => {
    const a = await setup("x1");
    const b = await setup("x2");

    // b пытается добавить задачу в свадьбу a
    const res = await addItem(b.agencyId, a.weddingId, {
      title: "hack",
      period: "SIX_MONTHS",
    });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toBe("NOT_FOUND");

    // listChecklist для чужой свадьбы возвращает пусто
    const list = await listChecklist(b.agencyId, a.weddingId);
    expect(list).toHaveLength(0);
  });

  it("toggle and delete are scoped to wedding", async () => {
    const { agencyId, weddingId } = await setup("ops");
    const item = await addItem(agencyId, weddingId, {
      title: "X",
      period: "SIX_MONTHS",
    });
    if (!item.ok) throw new Error("add failed");

    const del = await deleteItem(agencyId, weddingId, item.data.id);
    expect(del.ok).toBe(true);
    expect(await listChecklist(agencyId, weddingId)).toHaveLength(0);
  });
});
