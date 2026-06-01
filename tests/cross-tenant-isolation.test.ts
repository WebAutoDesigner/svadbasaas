import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { createAgencyWithOwner } from "@/lib/agency/create";
import {
  createWedding,
  getWedding,
  softDeleteWedding,
  updateWedding,
} from "@/lib/wedding/wedding";
import { addItem, deleteItem, listChecklist, toggleItem } from "@/lib/wedding/checklist";
import {
  addBudgetItem,
  deleteBudgetItem,
  listBudget,
  updateBudgetItem,
} from "@/lib/wedding/budget";
import { addVendor, deleteVendor, listVendors, updateVendor } from "@/lib/wedding/vendor";
import { addEvent, deleteEvent, listTimeline, updateEvent } from "@/lib/wedding/timeline";

/**
 * «Робот-проверяльщик» изоляции арендаторов: для каждого раздела свадьбы
 * убеждаемся, что агентство B не может ни прочитать, ни изменить, ни удалить
 * данные агентства A. Покрывает два вектора утечки:
 *   1) B обращается к ЧУЖОЙ свадьбе своим agencyId  → assertWedding падает.
 *   2) B обращается к ЧУЖОЙ записи через свою свадьбу → where weddingId не совпал.
 */

const PREFIX = "xtenant-test-";

async function cleanup() {
  const childWhere = { wedding: { agency: { name: { startsWith: PREFIX } } } };
  await db.checklistItem.deleteMany({ where: childWhere });
  await db.budgetItem.deleteMany({ where: childWhere });
  await db.vendor.deleteMany({ where: childWhere });
  await db.timelineEvent.deleteMany({ where: childWhere });
  await db.wedding.deleteMany({ where: { agency: { name: { startsWith: PREFIX } } } });
  await db.agencyMember.deleteMany({ where: { user: { email: { startsWith: PREFIX } } } });
  await db.account.deleteMany({ where: { user: { email: { startsWith: PREFIX } } } });
  await db.user.deleteMany({ where: { email: { startsWith: PREFIX } } });
  await db.agency.deleteMany({ where: { name: { startsWith: PREFIX } } });
}

async function makeAgencyWithWedding(suffix: string) {
  const agency = await createAgencyWithOwner({
    agencyName: `${PREFIX}${suffix}`,
    ownerEmail: `${PREFIX}${suffix}@example.com`,
    ownerName: "Owner",
    ownerPassword: "password-123-456",
  });
  if (!agency.ok) throw new Error("agency setup failed");
  const wedding = await createWedding(agency.data.agencyId, {
    brideName: "Анна",
    groomName: "Пётр",
    date: "2026-08-15",
    timezone: "Europe/Moscow",
    budget: 100000,
  });
  if (!wedding.ok) throw new Error("wedding setup failed");
  return { agencyId: agency.data.agencyId, weddingId: wedding.data.id };
}

describe("cross-tenant isolation: agency B cannot touch agency A's data", () => {
  beforeEach(cleanup);
  afterAll(cleanup);

  let a: { agencyId: string; weddingId: string };
  let b: { agencyId: string; weddingId: string };

  beforeEach(async () => {
    a = await makeAgencyWithWedding("a");
    b = await makeAgencyWithWedding("b");
  });

  it("wedding: B cannot read, update or soft-delete A's wedding", async () => {
    expect(await getWedding(b.agencyId, a.weddingId)).toBeNull();

    const upd = await updateWedding(b.agencyId, a.weddingId, {
      brideName: "Взлом",
      groomName: "Взлом",
      date: "2027-01-01",
      timezone: "Europe/Moscow",
      budget: 0,
      status: "CANCELLED",
    });
    expect(upd.ok).toBe(false);

    const del = await softDeleteWedding(b.agencyId, a.weddingId);
    expect(del.ok).toBe(false);

    // А-свадьба не пострадала
    expect(await getWedding(a.agencyId, a.weddingId)).not.toBeNull();
  });

  it("checklist: B cannot add to, list, toggle or delete A's items", async () => {
    const added = await addItem(a.agencyId, a.weddingId, {
      title: "Платье",
      period: "SIX_MONTHS",
    });
    if (!added.ok) throw new Error("setup add failed");

    expect((await addItem(b.agencyId, a.weddingId, { title: "x", period: "ONE_DAY" })).ok).toBe(false);
    expect(await listChecklist(b.agencyId, a.weddingId)).toEqual([]);
    expect((await toggleItem(b.agencyId, a.weddingId, added.data.id, true)).ok).toBe(false);
    expect((await toggleItem(b.agencyId, b.weddingId, added.data.id, true)).ok).toBe(false);
    expect((await deleteItem(b.agencyId, b.weddingId, added.data.id)).ok).toBe(false);

    // Запись А цела и не отмечена
    const aItems = await listChecklist(a.agencyId, a.weddingId);
    expect(aItems).toHaveLength(1);
    expect(aItems[0]?.done).toBe(false);
  });

  it("budget: B cannot add to, list, update or delete A's items", async () => {
    const added = await addBudgetItem(a.agencyId, a.weddingId, {
      name: "Зал",
      planned: 50000,
      actual: 0,
    });
    if (!added.ok) throw new Error("setup add failed");

    expect((await addBudgetItem(b.agencyId, a.weddingId, { name: "x", planned: 1, actual: 1 })).ok).toBe(false);
    expect(await listBudget(b.agencyId, a.weddingId)).toEqual([]);
    expect((await updateBudgetItem(b.agencyId, a.weddingId, added.data.id, { planned: 0, actual: 999 })).ok).toBe(false);
    expect((await updateBudgetItem(b.agencyId, b.weddingId, added.data.id, { planned: 0, actual: 999 })).ok).toBe(false);
    expect((await deleteBudgetItem(b.agencyId, b.weddingId, added.data.id)).ok).toBe(false);

    const aItems = await listBudget(a.agencyId, a.weddingId);
    expect(aItems).toHaveLength(1);
    expect(aItems[0]?.actual).toBe(0);
  });

  it("vendor: B cannot add to, list, update or delete A's vendors", async () => {
    const added = await addVendor(a.agencyId, a.weddingId, {
      name: "Фотограф",
      service: "Фото",
      amount: 30000,
      paymentStatus: "NOT_PAID",
    });
    if (!added.ok) throw new Error("setup add failed");

    expect((await addVendor(b.agencyId, a.weddingId, { name: "x", service: "y", amount: 1, paymentStatus: "PAID" })).ok).toBe(false);
    expect(await listVendors(b.agencyId, a.weddingId)).toEqual([]);
    expect((await updateVendor(b.agencyId, a.weddingId, added.data.id, { name: "z", service: "z", amount: 0, paymentStatus: "PAID" })).ok).toBe(false);
    expect((await deleteVendor(b.agencyId, b.weddingId, added.data.id)).ok).toBe(false);

    expect(await listVendors(a.agencyId, a.weddingId)).toHaveLength(1);
  });

  it("timeline: B cannot add to, list, update or delete A's events", async () => {
    const added = await addEvent(a.agencyId, a.weddingId, {
      startMinutes: 600,
      durationMin: 60,
      title: "Сбор гостей",
    });
    if (!added.ok) throw new Error("setup add failed");

    expect((await addEvent(b.agencyId, a.weddingId, { startMinutes: 0, durationMin: 0, title: "x" })).ok).toBe(false);
    expect(await listTimeline(b.agencyId, a.weddingId)).toEqual([]);
    expect((await updateEvent(b.agencyId, a.weddingId, added.data.id, { startMinutes: 0, durationMin: 0, title: "z" })).ok).toBe(false);
    expect((await deleteEvent(b.agencyId, b.weddingId, added.data.id)).ok).toBe(false);

    expect(await listTimeline(a.agencyId, a.weddingId)).toHaveLength(1);
  });
});
