import { db, getDb, tenantScope } from "@/lib/db";
import { assertWedding } from "@/lib/wedding/guard";
import type { CoupleArea } from "@prisma/client";

/**
 * Подсистема «пара внесла изменения». Couple-мутации пишут сюда строку-сводку.
 * Агентство на вкладке гостей/рассадки видит непросмотренные (createdAt позже
 * соответствующего seen-времени свадьбы) и при открытии помечает просмотренными.
 */

/**
 * Пишется из couple-мутаций. У пары нет агентского контекста — глобальный db.
 * Никогда не кидает (как audit) — сбой лога не должен ронять основную мутацию.
 */
export async function recordCoupleActivity(
  weddingId: string,
  area: CoupleArea,
  summary: string,
): Promise<void> {
  try {
    await db.coupleActivity.create({ data: { weddingId, area, summary } });
  } catch (error) {
    console.error("[couple-activity] failed to record", area, error);
  }
}

export type UnseenChanges = {
  count: number;
  items: { summary: string; createdAt: Date }[];
};

function seenAtFor(
  area: CoupleArea,
  w: { guestsSeenByAgencyAt: Date | null; seatingSeenByAgencyAt: Date | null },
): Date | null {
  return area === "GUESTS" ? w.guestsSeenByAgencyAt : w.seatingSeenByAgencyAt;
}

export async function getUnseenCoupleChanges(
  agencyId: string,
  weddingId: string,
  area: CoupleArea,
): Promise<UnseenChanges> {
  return tenantScope(agencyId, async () => {
    if (!(await assertWedding(agencyId, weddingId))) {
      return { count: 0, items: [] };
    }
    const w = await getDb().wedding.findFirst({
      where: { id: weddingId },
      select: { guestsSeenByAgencyAt: true, seatingSeenByAgencyAt: true },
    });
    if (!w) return { count: 0, items: [] };
    const seenAt = seenAtFor(area, w);
    const where = {
      weddingId,
      area,
      ...(seenAt ? { createdAt: { gt: seenAt } } : {}),
    };
    const [count, items] = await Promise.all([
      getDb().coupleActivity.count({ where }),
      getDb().coupleActivity.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: 10,
        select: { summary: true, createdAt: true },
      }),
    ]);
    return { count, items };
  });
}

export async function markCoupleChangesSeen(
  agencyId: string,
  weddingId: string,
  area: CoupleArea,
): Promise<void> {
  await tenantScope(agencyId, async () => {
    if (!(await assertWedding(agencyId, weddingId))) return;
    await getDb().wedding.updateMany({
      where: { id: weddingId },
      data:
        area === "GUESTS"
          ? { guestsSeenByAgencyAt: new Date() }
          : { seatingSeenByAgencyAt: new Date() },
    });
  });
}
