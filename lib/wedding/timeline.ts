import { db } from "@/lib/db";
import { err, ok, type Result } from "@/lib/result";
import { assertWedding } from "@/lib/wedding/guard";

export function minutesToHHMM(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function hhmmToMinutes(value: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const h = Number(match[1]);
  const m = Number(match[2]);
  if (h > 23 || m > 59) return null;
  return h * 60 + m;
}

export type TimelineInput = {
  startMinutes: number;
  durationMin: number;
  title: string;
  description?: string | undefined;
  responsible?: string | undefined;
};

export async function listTimeline(agencyId: string, weddingId: string) {
  if (!(await assertWedding(agencyId, weddingId))) return [];
  return db.timelineEvent.findMany({
    where: { weddingId },
    orderBy: { startMinutes: "asc" },
  });
}

export async function addEvent(
  agencyId: string,
  weddingId: string,
  input: TimelineInput,
): Promise<Result<{ id: string }, "NOT_FOUND">> {
  if (!(await assertWedding(agencyId, weddingId))) return err("NOT_FOUND");
  const ev = await db.timelineEvent.create({
    data: {
      weddingId,
      startMinutes: input.startMinutes,
      durationMin: input.durationMin,
      title: input.title,
      description: input.description || null,
      responsible: input.responsible || null,
    },
  });
  return ok({ id: ev.id });
}

export async function updateEvent(
  agencyId: string,
  weddingId: string,
  eventId: string,
  input: TimelineInput,
): Promise<Result<true, "NOT_FOUND">> {
  if (!(await assertWedding(agencyId, weddingId))) return err("NOT_FOUND");
  const updated = await db.timelineEvent.updateMany({
    where: { id: eventId, weddingId },
    data: {
      startMinutes: input.startMinutes,
      durationMin: input.durationMin,
      title: input.title,
      description: input.description || null,
      responsible: input.responsible || null,
    },
  });
  if (updated.count === 0) return err("NOT_FOUND");
  return ok(true);
}

export async function deleteEvent(
  agencyId: string,
  weddingId: string,
  eventId: string,
): Promise<Result<true, "NOT_FOUND">> {
  if (!(await assertWedding(agencyId, weddingId))) return err("NOT_FOUND");
  const deleted = await db.timelineEvent.deleteMany({
    where: { id: eventId, weddingId },
  });
  if (deleted.count === 0) return err("NOT_FOUND");
  return ok(true);
}
