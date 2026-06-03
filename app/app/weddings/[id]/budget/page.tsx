import { notFound } from "next/navigation";
import { requireAgencyContext } from "@/lib/tenant";
import { getWedding } from "@/lib/wedding/wedding";
import { listBudget, budgetSummary } from "@/lib/wedding/budget";
import { listTemplates } from "@/lib/agency/templates";
import { BudgetBoard } from "./budget-board";

export const dynamic = "force-dynamic";

export default async function BudgetPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await requireAgencyContext();
  const { id } = await params;
  const wedding = await getWedding(ctx.agencyId, id);
  if (!wedding) notFound();

  const [items, summary, templates] = await Promise.all([
    listBudget(ctx.agencyId, id),
    budgetSummary(ctx.agencyId, id),
    listTemplates(ctx.agencyId, "BUDGET"),
  ]);

  return (
    <BudgetBoard
      weddingId={id}
      items={items.map((i) => ({
        id: i.id,
        name: i.name,
        planned: i.planned,
        actual: i.actual,
      }))}
      summary={summary}
      templates={templates.map((t) => ({ id: t.id, name: t.name }))}
    />
  );
}
