import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { createAgencyWithOwner } from "@/lib/agency/create";
import { createWedding } from "@/lib/wedding/wedding";
import { addGuest } from "@/lib/wedding/guest";
import {
  addTable,
  assignGuestToTable,
  deleteTable,
  listSeatableGuests,
  listTables,
  unassignGuest,
  updateTable,
} from "@/lib/wedding/seating";

const PREFIX = "seat-test-";

async function cleanup() {
  await db.guest.deleteMany({
    where: { wedding: { agency: { name: { startsWith: PREFIX } } } },
  });
  await db.seatingTable.deleteMany({
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

describe("seating", () => {
  beforeEach(cleanup);
  afterAll(cleanup);

  it("creates tables and assigns/unassigns guests", async () => {
    const { agencyId, weddingId } = await setup("flow");
    const t = await addTable(agencyId, weddingId, { name: "Стол 1", capacity: 8 });
    if (!t.ok) throw new Error("table");
    const g = await addGuest(agencyId, weddingId, { name: "Иван", status: "COMING" });
    if (!g.ok) throw new Error("guest");

    expect((await assignGuestToTable(agencyId, weddingId, g.data.id, t.data.id)).ok).toBe(true);
    let tables = await listTables(agencyId, weddingId);
    expect(tables[0]!.guests).toHaveLength(1);
    expect(tables[0]!.guests[0]!.name).toBe("Иван");

    expect((await unassignGuest(agencyId, weddingId, g.data.id)).ok).toBe(true);
    tables = await listTables(agencyId, weddingId);
    expect(tables[0]!.guests).toHaveLength(0);
  });

  it("renames table and frees guests on delete", async () => {
    const { agencyId, weddingId } = await setup("del");
    const t = await addTable(agencyId, weddingId, { name: "Стол", capacity: 4 });
    if (!t.ok) throw new Error("table");
    const g = await addGuest(agencyId, weddingId, { name: "Мария", status: "COMING" });
    if (!g.ok) throw new Error("guest");
    await assignGuestToTable(agencyId, weddingId, g.data.id, t.data.id);

    expect((await updateTable(agencyId, weddingId, t.data.id, { name: "VIP", capacity: 6 })).ok).toBe(true);
    expect((await deleteTable(agencyId, weddingId, t.data.id)).ok).toBe(true);

    const pool = await listSeatableGuests(agencyId, weddingId);
    expect(pool).toHaveLength(1);
    expect(pool[0]!.tableId).toBeNull();
  });

  it("blocks cross-agency assignment", async () => {
    const a = await setup("x1");
    const b = await setup("x2");
    const t = await addTable(a.agencyId, a.weddingId, { name: "Стол", capacity: 8 });
    if (!t.ok) throw new Error("table");
    const g = await addGuest(a.agencyId, a.weddingId, { name: "Иван", status: "COMING" });
    if (!g.ok) throw new Error("guest");

    const res = await assignGuestToTable(b.agencyId, a.weddingId, g.data.id, t.data.id);
    expect(res.ok).toBe(false);
    expect(await listTables(b.agencyId, a.weddingId)).toHaveLength(0);
  });
});
