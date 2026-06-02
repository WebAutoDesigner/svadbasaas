import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { createAgencyWithOwner } from "@/lib/agency/create";
import { createWedding } from "@/lib/wedding/wedding";
import {
  addContact,
  deleteContact,
  listContacts,
  updateContact,
} from "@/lib/wedding/contact";
import { addNote, deleteNote, listNotes } from "@/lib/wedding/note";
import {
  addPayment,
  deletePayment,
  financeSummary,
  listPayments,
  updateAgencyFee,
  updatePayment,
} from "@/lib/wedding/finance";

const PREFIX = "atool-test-";

async function cleanup() {
  const childWhere = { wedding: { agency: { name: { startsWith: PREFIX } } } };
  await db.weddingContact.deleteMany({ where: childWhere });
  await db.weddingNote.deleteMany({ where: childWhere });
  await db.agencyPayment.deleteMany({ where: childWhere });
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
  if (!a.ok) throw new Error("agency setup failed");
  const w = await createWedding(a.data.agencyId, {
    brideName: "Анна",
    groomName: "Пётр",
    date: "2026-08-15",
    timezone: "Europe/Moscow",
    budget: 0,
    source: "Instagram",
  });
  if (!w.ok) throw new Error("wedding setup failed");
  return { agencyId: a.data.agencyId, weddingId: w.data.id };
}

describe("agency tools", () => {
  beforeEach(cleanup);
  afterAll(cleanup);

  it("contacts: add, list, update, delete + cross-agency block", async () => {
    const { agencyId, weddingId } = await setup("contact");
    const c = await addContact(agencyId, weddingId, { label: "Мария", value: "+7900" });
    if (!c.ok) throw new Error("add");
    expect(await listContacts(agencyId, weddingId)).toHaveLength(1);
    expect((await updateContact(agencyId, weddingId, c.data.id, { label: "Мария (WA)", value: "+7901" })).ok).toBe(true);

    const other = await setup("contact2");
    expect((await addContact(other.agencyId, weddingId, { label: "x", value: "y" })).ok).toBe(false);
    expect(await listContacts(other.agencyId, weddingId)).toHaveLength(0);

    expect((await deleteContact(agencyId, weddingId, c.data.id)).ok).toBe(true);
    expect(await listContacts(agencyId, weddingId)).toHaveLength(0);
  });

  it("source persisted on wedding", async () => {
    const { agencyId, weddingId } = await setup("src");
    const w = await db.wedding.findFirst({ where: { id: weddingId, agencyId } });
    expect(w?.source).toBe("Instagram");
  });

  it("notes: add with author, list newest-first, delete", async () => {
    const { agencyId, weddingId } = await setup("note");
    await addNote(agencyId, weddingId, "созвонились", "Координатор");
    await addNote(agencyId, weddingId, "выбрали площадку", "Координатор");
    const list = await listNotes(agencyId, weddingId);
    expect(list).toHaveLength(2);
    expect(list[0]!.body).toBe("выбрали площадку"); // newest first
    expect(list[0]!.authorName).toBe("Координатор");
    expect((await deleteNote(agencyId, weddingId, list[0]!.id)).ok).toBe(true);
    expect(await listNotes(agencyId, weddingId)).toHaveLength(1);
  });

  it("finance: fee + payments summary", async () => {
    const { agencyId, weddingId } = await setup("fin");
    expect((await updateAgencyFee(agencyId, weddingId, 150000)).ok).toBe(true);
    await addPayment(agencyId, weddingId, { amount: 50000, paidOn: "2026-05-01", note: "предоплата" });
    const p2 = await addPayment(agencyId, weddingId, { amount: 30000, paidOn: "2026-06-01" });
    if (!p2.ok) throw new Error("add");

    let s = await financeSummary(agencyId, weddingId);
    expect(s.fee).toBe(150000);
    expect(s.paid).toBe(80000);
    expect(s.remaining).toBe(70000);

    expect((await updatePayment(agencyId, weddingId, p2.data.id, { amount: 40000, paidOn: "2026-06-02" })).ok).toBe(true);
    s = await financeSummary(agencyId, weddingId);
    expect(s.paid).toBe(90000);
    expect(await listPayments(agencyId, weddingId)).toHaveLength(2);

    expect((await deletePayment(agencyId, weddingId, p2.data.id)).ok).toBe(true);
    s = await financeSummary(agencyId, weddingId);
    expect(s.paid).toBe(50000);
  });

  it("finance: cross-agency block", async () => {
    const a = await setup("finx1");
    const b = await setup("finx2");
    expect((await updateAgencyFee(b.agencyId, a.weddingId, 999)).ok).toBe(false);
    expect((await addPayment(b.agencyId, a.weddingId, { amount: 1, paidOn: "2026-01-01" })).ok).toBe(false);
    expect(await listPayments(b.agencyId, a.weddingId)).toHaveLength(0);
    expect((await financeSummary(b.agencyId, a.weddingId)).fee).toBe(0);
  });
});
