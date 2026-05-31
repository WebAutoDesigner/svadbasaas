import { notFound } from "next/navigation";
import { requireAgencyContext } from "@/lib/tenant";
import { getWedding } from "@/lib/wedding/wedding";
import { listVendors, vendorsSummary } from "@/lib/wedding/vendor";
import { VendorsBoard } from "./vendors-board";

export const dynamic = "force-dynamic";

export default async function VendorsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await requireAgencyContext();
  const { id } = await params;
  const wedding = await getWedding(ctx.agencyId, id);
  if (!wedding) notFound();

  const [vendors, summary] = await Promise.all([
    listVendors(ctx.agencyId, id),
    vendorsSummary(ctx.agencyId, id),
  ]);

  return (
    <VendorsBoard
      weddingId={id}
      vendors={vendors.map((v) => ({
        id: v.id,
        name: v.name,
        service: v.service,
        contact: v.contact,
        amount: v.amount,
        paymentStatus: v.paymentStatus,
        note: v.note,
      }))}
      summary={summary}
    />
  );
}
