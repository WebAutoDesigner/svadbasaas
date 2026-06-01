import { getDb, tenantScope } from "@/lib/db";
import { err, ok, type Result } from "@/lib/result";
import { assertWedding } from "@/lib/wedding/guard";
import { parseDateInput } from "@/lib/dates";

export type EventData = {
  title: string;
  date: string; // YYYY-MM-DD
  startMinutes: number | null;
  description?: string | undefined;
  visibleToCouple: boolean;
};

export async function listEvents(agencyId: string, weddingId: string) {
  return tenantScope(agencyId, async () => {
    if (!(await assertWedding(agencyId, weddingId))) return [];
    return getDb().weddingEvent.findMany({
      where: { weddingId },
      orderBy: [{ date: "asc" }, { startMinutes: "asc" }],
    });
  });
}

export async function addEvent(
  agencyId: string,
  weddingId: string,
  input: EventData,
): Promise<Result<{ id: string }, "NOT_FOUND">> {
  return tenantScope(agencyId, async () => {
    if (!(await assertWedding(agencyId, weddingId))) return err("NOT_FOUND");
    const e = await getDb().weddingEvent.create({
      data: {
        weddingId,
        title: input.title,
        date: parseDateInput(input.date),
        startMinutes: input.startMinutes,
        description: input.description || null,
        visibleToCouple: input.visibleToCouple,
      },
    });
    return ok({ id: e.id });
  });
}

export async function updateEvent(
  agencyId: string,
  weddingId: string,
  eventId: string,
  input: EventData,
): Promise<Result<true, "NOT_FOUND">> {
  return tenantScope(agencyId, async () => {
    if (!(await assertWedding(agencyId, weddingId))) return err("NOT_FOUND");
    const upd = await getDb().weddingEvent.updateMany({
      where: { id: eventId, weddingId },
      data: {
        title: input.title,
        date: parseDateInput(input.date),
        startMinutes: input.startMinutes,
        description: input.description || null,
        visibleToCouple: input.visibleToCouple,
      },
    });
    if (upd.count === 0) return err("NOT_FOUND");
    return ok(true);
  });
}

export async function deleteEvent(
  agencyId: string,
  weddingId: string,
  eventId: string,
): Promise<Result<true, "NOT_FOUND">> {
  return tenantScope(agencyId, async () => {
    if (!(await assertWedding(agencyId, weddingId))) return err("NOT_FOUND");
    const del = await getDb().weddingEvent.deleteMany({
      where: { id: eventId, weddingId },
    });
    if (del.count === 0) return err("NOT_FOUND");
    return ok(true);
  });
}
