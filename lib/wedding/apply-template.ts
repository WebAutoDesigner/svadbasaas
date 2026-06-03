import { getDb, tenantScope } from "@/lib/db";
import { err, ok, type Result } from "@/lib/result";
import { assertWedding } from "@/lib/wedding/guard";
import type { ChecklistPeriod } from "@prisma/client";

type ChecklistItems = { items: { period: ChecklistPeriod; title: string }[] };
type TimelineItems = {
  items: { startMinutes: number; durationMin: number; title: string }[];
};
type BudgetItems = { items: { name: string }[] };

/**
 * Применяет шаблон агентства к свадьбе — ДОБАВЛЯЕТ пункты (append) в
 * соответствующий раздел. Тип берётся из шаблона. Только вручную.
 */
export async function applyTemplate(
  agencyId: string,
  weddingId: string,
  templateId: string,
): Promise<Result<{ added: number }, "NOT_FOUND" | "BAD_TEMPLATE">> {
  return tenantScope(agencyId, async () => {
    if (!(await assertWedding(agencyId, weddingId))) return err("NOT_FOUND");
    const tpl = await getDb().template.findFirst({
      where: { id: templateId, agencyId },
    });
    if (!tpl) return err("BAD_TEMPLATE");

    if (tpl.type === "CHECKLIST") {
      const { items } = tpl.content as ChecklistItems;
      if (!items?.length) return ok({ added: 0 });
      const max = await getDb().checklistItem.aggregate({
        where: { weddingId },
        _max: { sortOrder: true },
      });
      const base = (max._max.sortOrder ?? 0) + 1;
      await getDb().checklistItem.createMany({
        data: items.map((it, i) => ({
          weddingId,
          title: it.title,
          period: it.period,
          sortOrder: base + i,
        })),
      });
      return ok({ added: items.length });
    }

    if (tpl.type === "TIMELINE") {
      const { items } = tpl.content as TimelineItems;
      if (!items?.length) return ok({ added: 0 });
      await getDb().timelineEvent.createMany({
        data: items.map((it) => ({
          weddingId,
          startMinutes: it.startMinutes,
          durationMin: it.durationMin,
          title: it.title,
        })),
      });
      return ok({ added: items.length });
    }

    if (tpl.type === "BUDGET") {
      const { items } = tpl.content as BudgetItems;
      if (!items?.length) return ok({ added: 0 });
      const max = await getDb().budgetItem.aggregate({
        where: { weddingId },
        _max: { sortOrder: true },
      });
      const base = (max._max.sortOrder ?? 0) + 1;
      await getDb().budgetItem.createMany({
        data: items.map((it, i) => ({
          weddingId,
          name: it.name,
          sortOrder: base + i,
        })),
      });
      return ok({ added: items.length });
    }

    return err("BAD_TEMPLATE"); // QUESTIONNAIRE не применяется к разделам
  });
}
