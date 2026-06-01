import { getDb, tenantScope } from "@/lib/db";
import { err, ok, type Result } from "@/lib/result";
import { assertWedding } from "@/lib/wedding/guard";

export type TableData = { name: string; capacity: number };

export async function listTables(agencyId: string, weddingId: string) {
  return tenantScope(agencyId, async () => {
    if (!(await assertWedding(agencyId, weddingId))) return [];
    return getDb().seatingTable.findMany({
      where: { weddingId },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      include: {
        guests: {
          select: { id: true, name: true, status: true, side: true, groupLabel: true },
          orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        },
      },
    });
  });
}

/** Все гости свадьбы — для пула рассадки (фильтр «только придут» — на клиенте). */
export async function listSeatableGuests(agencyId: string, weddingId: string) {
  return tenantScope(agencyId, async () => {
    if (!(await assertWedding(agencyId, weddingId))) return [];
    return getDb().guest.findMany({
      where: { weddingId },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      select: {
        id: true,
        name: true,
        status: true,
        side: true,
        groupLabel: true,
        tableId: true,
      },
    });
  });
}

export async function addTable(
  agencyId: string,
  weddingId: string,
  input: TableData,
): Promise<Result<{ id: string }, "NOT_FOUND">> {
  return tenantScope(agencyId, async () => {
    if (!(await assertWedding(agencyId, weddingId))) return err("NOT_FOUND");
    const max = await getDb().seatingTable.aggregate({
      where: { weddingId },
      _max: { sortOrder: true },
    });
    const t = await getDb().seatingTable.create({
      data: {
        weddingId,
        name: input.name,
        capacity: input.capacity,
        sortOrder: (max._max.sortOrder ?? 0) + 1,
      },
    });
    return ok({ id: t.id });
  });
}

export async function updateTable(
  agencyId: string,
  weddingId: string,
  tableId: string,
  input: TableData,
): Promise<Result<true, "NOT_FOUND">> {
  return tenantScope(agencyId, async () => {
    if (!(await assertWedding(agencyId, weddingId))) return err("NOT_FOUND");
    const upd = await getDb().seatingTable.updateMany({
      where: { id: tableId, weddingId },
      data: { name: input.name, capacity: input.capacity },
    });
    if (upd.count === 0) return err("NOT_FOUND");
    return ok(true);
  });
}

export async function deleteTable(
  agencyId: string,
  weddingId: string,
  tableId: string,
): Promise<Result<true, "NOT_FOUND">> {
  return tenantScope(agencyId, async () => {
    if (!(await assertWedding(agencyId, weddingId))) return err("NOT_FOUND");
    // гости со стола вернутся в пул (tableId → null)
    await getDb().guest.updateMany({
      where: { tableId, weddingId },
      data: { tableId: null },
    });
    const del = await getDb().seatingTable.deleteMany({
      where: { id: tableId, weddingId },
    });
    if (del.count === 0) return err("NOT_FOUND");
    return ok(true);
  });
}

export async function assignGuestToTable(
  agencyId: string,
  weddingId: string,
  guestId: string,
  tableId: string,
): Promise<Result<true, "NOT_FOUND">> {
  return tenantScope(agencyId, async () => {
    if (!(await assertWedding(agencyId, weddingId))) return err("NOT_FOUND");
    const table = await getDb().seatingTable.findFirst({
      where: { id: tableId, weddingId },
      select: { id: true },
    });
    if (!table) return err("NOT_FOUND");
    const upd = await getDb().guest.updateMany({
      where: { id: guestId, weddingId },
      data: { tableId },
    });
    if (upd.count === 0) return err("NOT_FOUND");
    return ok(true);
  });
}

export async function unassignGuest(
  agencyId: string,
  weddingId: string,
  guestId: string,
): Promise<Result<true, "NOT_FOUND">> {
  return tenantScope(agencyId, async () => {
    if (!(await assertWedding(agencyId, weddingId))) return err("NOT_FOUND");
    const upd = await getDb().guest.updateMany({
      where: { id: guestId, weddingId },
      data: { tableId: null },
    });
    if (upd.count === 0) return err("NOT_FOUND");
    return ok(true);
  });
}
