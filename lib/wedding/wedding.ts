import { db } from "@/lib/db";
import { err, ok, type Result } from "@/lib/result";
import { parseDateInput } from "@/lib/dates";
import type { WeddingStatus } from "@prisma/client";

export type WeddingInput = {
  brideName: string;
  groomName: string;
  date: string; // YYYY-MM-DD
  timezone: string;
  budget: number;
  location?: string | undefined;
  guestCount?: number | undefined;
  coordinatorId?: string | undefined;
};

/**
 * Проверяет, что coordinatorId (если задан) принадлежит этому агентству.
 * Возвращает нормализованный coordinatorId | null.
 */
async function resolveCoordinator(
  agencyId: string,
  coordinatorId: string | undefined,
): Promise<Result<string | null, "BAD_COORDINATOR">> {
  if (!coordinatorId) return ok(null);
  const member = await db.agencyMember.findFirst({
    where: { agencyId, userId: coordinatorId },
  });
  if (!member) return err("BAD_COORDINATOR");
  return ok(coordinatorId);
}

export async function listWeddings(
  agencyId: string,
  opts: { includeCompleted?: boolean } = {},
) {
  return db.wedding.findMany({
    where: {
      agencyId,
      deletedAt: null,
      ...(opts.includeCompleted
        ? {}
        : { status: { in: ["PLANNING"] } }),
    },
    include: { coordinator: { select: { id: true, name: true } } },
    orderBy: { date: "asc" },
  });
}

export async function getWedding(agencyId: string, id: string) {
  return db.wedding.findFirst({
    where: { id, agencyId, deletedAt: null },
    include: { coordinator: { select: { id: true, name: true } } },
  });
}

export async function createWedding(
  agencyId: string,
  input: WeddingInput,
): Promise<Result<{ id: string }, "BAD_COORDINATOR">> {
  const coord = await resolveCoordinator(agencyId, input.coordinatorId);
  if (!coord.ok) return err(coord.error);

  const wedding = await db.wedding.create({
    data: {
      agencyId,
      brideName: input.brideName,
      groomName: input.groomName,
      date: parseDateInput(input.date),
      timezone: input.timezone,
      budget: input.budget,
      location: input.location || null,
      guestCount: input.guestCount ?? null,
      coordinatorId: coord.data,
    },
  });
  return ok({ id: wedding.id });
}

export async function updateWedding(
  agencyId: string,
  id: string,
  input: WeddingInput & { status: WeddingStatus },
): Promise<Result<true, "NOT_FOUND" | "BAD_COORDINATOR">> {
  const existing = await db.wedding.findFirst({
    where: { id, agencyId, deletedAt: null },
  });
  if (!existing) return err("NOT_FOUND");

  const coord = await resolveCoordinator(agencyId, input.coordinatorId);
  if (!coord.ok) return err(coord.error);

  await db.wedding.update({
    where: { id },
    data: {
      brideName: input.brideName,
      groomName: input.groomName,
      date: parseDateInput(input.date),
      timezone: input.timezone,
      budget: input.budget,
      location: input.location || null,
      guestCount: input.guestCount ?? null,
      coordinatorId: coord.data,
      status: input.status,
    },
  });
  return ok(true);
}

export async function softDeleteWedding(
  agencyId: string,
  id: string,
): Promise<Result<true, "NOT_FOUND">> {
  const existing = await db.wedding.findFirst({
    where: { id, agencyId, deletedAt: null },
  });
  if (!existing) return err("NOT_FOUND");

  await db.wedding.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
  return ok(true);
}
