import { db } from "@/lib/db";

/**
 * Tenant guard для дочерних сущностей свадьбы (чек-лист, бюджет, подрядчики,
 * документы, тайминг). Проверяет что свадьба принадлежит агентству и не удалена.
 */
export async function assertWedding(
  agencyId: string,
  weddingId: string,
): Promise<boolean> {
  const w = await db.wedding.findFirst({
    where: { id: weddingId, agencyId, deletedAt: null },
    select: { id: true },
  });
  return Boolean(w);
}
