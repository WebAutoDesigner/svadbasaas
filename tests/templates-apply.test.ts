import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { createAgencyWithOwner } from "@/lib/agency/create";
import { createWedding } from "@/lib/wedding/wedding";
import { addTemplate, listTemplates } from "@/lib/agency/templates";
import { applyTemplate } from "@/lib/wedding/apply-template";
import { listChecklist } from "@/lib/wedding/checklist";
import { listBudget } from "@/lib/wedding/budget";
import { listTimeline } from "@/lib/wedding/timeline";
import { getTemplate } from "@/lib/templates/checklist";
import { DEFAULT_BUDGET_CATEGORIES } from "@/lib/templates/budget";

const PREFIX = "tapply-test-";

async function cleanup() {
  const w = { wedding: { agency: { name: { startsWith: PREFIX } } } };
  await db.checklistItem.deleteMany({ where: w });
  await db.budgetItem.deleteMany({ where: w });
  await db.timelineEvent.deleteMany({ where: w });
  await db.template.deleteMany({ where: { agency: { name: { startsWith: PREFIX } } } });
  await db.wedding.deleteMany({ where: { agency: { name: { startsWith: PREFIX } } } });
  await db.agencyMember.deleteMany({ where: { user: { email: { startsWith: PREFIX } } } });
  await db.account.deleteMany({ where: { user: { email: { startsWith: PREFIX } } } });
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
  if (!a.ok) throw new Error("agency");
  const wed = await createWedding(a.data.agencyId, {
    brideName: "Анна",
    groomName: "Пётр",
    date: "2026-08-15",
    timezone: "Europe/Moscow",
    budget: 0,
  });
  if (!wed.ok) throw new Error("wedding");
  return { agencyId: a.data.agencyId, weddingId: wed.data.id };
}

describe("templates apply (этап 2)", () => {
  beforeEach(cleanup);
  afterAll(cleanup);

  it("seeds editable checklist + budget templates for new agency", async () => {
    const { agencyId } = await setup("seed");
    const all = await listTemplates(agencyId);
    expect(all.some((t) => t.type === "CHECKLIST")).toBe(true);
    expect(all.some((t) => t.type === "BUDGET")).toBe(true);
  });

  it("applies checklist + budget seeded templates (append)", async () => {
    const { agencyId, weddingId } = await setup("cb");
    const cl = (await listTemplates(agencyId, "CHECKLIST"))[0]!;
    const bd = (await listTemplates(agencyId, "BUDGET"))[0]!;

    expect((await applyTemplate(agencyId, weddingId, cl.id)).ok).toBe(true);
    expect((await applyTemplate(agencyId, weddingId, bd.id)).ok).toBe(true);

    expect(await listChecklist(agencyId, weddingId)).toHaveLength(getTemplate("classic")!.items.length);
    expect(await listBudget(agencyId, weddingId)).toHaveLength(DEFAULT_BUDGET_CATEGORIES.length);

    // повторное применение — append (удваивает бюджет)
    await applyTemplate(agencyId, weddingId, bd.id);
    expect(await listBudget(agencyId, weddingId)).toHaveLength(DEFAULT_BUDGET_CATEGORIES.length * 2);
  });

  it("applies a timeline template", async () => {
    const { agencyId, weddingId } = await setup("tl");
    const t = await addTemplate(agencyId, {
      type: "TIMELINE",
      name: "День",
      content: {
        items: [
          { startMinutes: 600, durationMin: 60, title: "Сбор" },
          { startMinutes: 840, durationMin: 30, title: "Роспись" },
        ],
      },
    });
    if (!t.ok) throw new Error("tpl");
    expect((await applyTemplate(agencyId, weddingId, t.data.id)).ok).toBe(true);
    expect(await listTimeline(agencyId, weddingId)).toHaveLength(2);
  });

  it("blocks cross-agency apply", async () => {
    const a = await setup("x1");
    const b = await setup("x2");
    const cl = (await listTemplates(a.agencyId, "CHECKLIST"))[0]!;
    // b применяет ШАБЛОН A к СВАДЬБЕ A — нет доступа к свадьбе
    expect((await applyTemplate(b.agencyId, a.weddingId, cl.id)).ok).toBe(false);
    // b применяет к СВОЕЙ свадьбе ЧУЖОЙ шаблон — шаблон не найден
    expect((await applyTemplate(b.agencyId, b.weddingId, cl.id)).ok).toBe(false);
  });
});
