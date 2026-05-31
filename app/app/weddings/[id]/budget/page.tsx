import { notFound } from "next/navigation";
import { requireAgencyContext } from "@/lib/tenant";
import { getWedding } from "@/lib/wedding/wedding";
import { listBudget, budgetSummary } from "@/lib/wedding/budget";
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

  const [items, summary] = await Promise.all([
    listBudget(ctx.agencyId, id),
    budgetSummary(ctx.agencyId, id),
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
    />
  );
}
