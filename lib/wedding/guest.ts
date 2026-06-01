import { getDb, tenantScope } from "@/lib/db";
import { err, ok, type Result } from "@/lib/result";
import { assertWedding } from "@/lib/wedding/guard";
import type { GuestStatus, GuestSide } from "@prisma/client";

export type GuestData = {
  name: string;
  status: GuestStatus;
  side?: GuestSide | undefined;
  groupLabel?: string | undefined;
};

export async function listGuests(agencyId: string, weddingId: string) {
  return tenantScope(agencyId, async () => {
    if (!(await assertWedding(agencyId, weddingId))) return [];
    return getDb().guest.findMany({
      where: { weddingId },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });
  });
}

export type GuestsSummary = {
  total: number;
  coming: number;
  notComing: number;
  maybe: number;
  noAnswer: number;
};

export async function guestsSummary(
  agencyId: string,
  weddingId: string,
): Promise<GuestsSummary> {
  return tenantScope(agencyId, async () => {
    const empty: GuestsSummary = {
      total: 0,
      coming: 0,
      notComing: 0,
      maybe: 0,
      noAnswer: 0,
    };
    if (!(await assertWedding(agencyId, weddingId))) return empty;
    const rows = await getDb().guest.groupBy({
      by: ["status"],
      where: { weddingId },
      _count: { _all: true },
    });
    const out = { ...empty };
    for (const r of rows) {
      const n = r._count._all;
      out.total += n;
      if (r.status === "COMING") out.coming = n;
      else if (r.status === "NOT_COMING") out.notComing = n;
      else if (r.status === "MAYBE") out.maybe = n;
      else if (r.status === "NO_ANSWER") out.noAnswer = n;
    }
    return out;
  });
}

export async function addGuest(
  agencyId: string,
  weddingId: string,
  input: GuestData,
): Promise<Result<{ id: string }, "NOT_FOUND">> {
  return tenantScope(agencyId, async () => {
    if (!(await assertWedding(agencyId, weddingId))) return err("NOT_FOUND");
    const max = await getDb().guest.aggregate({
      where: { weddingId },
      _max: { sortOrder: true },
    });
    const g = await getDb().guest.create({
      data: {
        weddingId,
        name: input.name,
        status: input.status,
        side: input.side ?? null,
        groupLabel: input.groupLabel || null,
        sortOrder: (max._max.sortOrder ?? 0) + 1,
      },
    });
    return ok({ id: g.id });
  });
}

export async function updateGuest(
  agencyId: string,
  weddingId: string,
  guestId: string,
  input: GuestData,
): Promise<Result<true, "NOT_FOUND">> {
  return tenantScope(agencyId, async () => {
    if (!(await assertWedding(agencyId, weddingId))) return err("NOT_FOUND");
    const upd = await getDb().guest.updateMany({
      where: { id: guestId, weddingId },
      data: {
        name: input.name,
        status: input.status,
        side: input.side ?? null,
        groupLabel: input.groupLabel || null,
      },
    });
    if (upd.count === 0) return err("NOT_FOUND");
    return ok(true);
  });
}

export async function setGuestStatus(
  agencyId: string,
  weddingId: string,
  guestId: string,
  status: GuestStatus,
): Promise<Result<true, "NOT_FOUND">> {
  return tenantScope(agencyId, async () => {
    if (!(await assertWedding(agencyId, weddingId))) return err("NOT_FOUND");
    const upd = await getDb().guest.updateMany({
      where: { id: guestId, weddingId },
      data: { status },
    });
    if (upd.count === 0) return err("NOT_FOUND");
    return ok(true);
  });
}

export async function deleteGuest(
  agencyId: string,
  weddingId: string,
  guestId: string,
): Promise<Result<true, "NOT_FOUND">> {
  return tenantScope(agencyId, async () => {
    if (!(await assertWedding(agencyId, weddingId))) return err("NOT_FOUND");
    const del = await getDb().guest.deleteMany({
      where: { id: guestId, weddingId },
    });
    if (del.count === 0) return err("NOT_FOUND");
    return ok(true);
  });
}
