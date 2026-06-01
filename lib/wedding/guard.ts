import { getDb, tenantScope } from "@/lib/db";

/**
 * Tenant guard для дочерних сущностей свадьбы (чек-лист, бюджет, подрядчики,
 * документы, тайминг). Проверяет что свадьба принадлежит агентству и не удалена.
 * Запрос идёт в транзакции с app.agency_id → RLS как страховка.
 */
export async function assertWedding(
  agencyId: string,
  weddingId: string,
): Promise<boolean> {
  return tenantScope(agencyId, async () => {
    const w = await getDb().wedding.findFirst({
      where: { id: weddingId, agencyId, deletedAt: null },
      select: { id: true },
    });
    return Boolean(w);
  });
}
