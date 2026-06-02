import { notFound } from "next/navigation";
import { requireAgencyContext } from "@/lib/tenant";
import { getWedding } from "@/lib/wedding/wedding";
import { financeSummary, listPayments } from "@/lib/wedding/finance";
import { FinanceBoard } from "./finance-board";

export const dynamic = "force-dynamic";

export default async function FinancePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await requireAgencyContext();
  const { id } = await params;
  const wedding = await getWedding(ctx.agencyId, id);
  if (!wedding) notFound();

  const [summary, payments] = await Promise.all([
    financeSummary(ctx.agencyId, id),
    listPayments(ctx.agencyId, id),
  ]);

  return (
    <FinanceBoard
      weddingId={id}
      summary={summary}
      payments={payments.map((p) => ({
        id: p.id,
        amount: p.amount,
        paidOn: p.paidOn.toISOString(),
        note: p.note,
      }))}
    />
  );
}
