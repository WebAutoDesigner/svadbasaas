import { requireCoupleForWedding } from "@/lib/couple/session";
import { coupleVendors } from "@/lib/couple/data";
import { PAYMENT_LABELS } from "@/lib/validators/vendor";

export const dynamic = "force-dynamic";

export default async function CoupleVendors({
  params,
}: {
  params: Promise<{ weddingId: string }>;
}) {
  const { weddingId } = await params;
  await requireCoupleForWedding(weddingId);
  const vendors = await coupleVendors(weddingId);

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-2xl space-y-6">
      <h1 className="text-xl font-bold">Подрядчики</h1>
      {vendors.length === 0 ? (
        <p className="text-muted-foreground">Подрядчики пока не добавлены.</p>
      ) : (
        <div className="space-y-3">
          {vendors.map((v) => (
            <div key={v.id} className="border rounded-md p-4">
              <div className="font-medium">
                {v.name}{" "}
                <span className="text-muted-foreground font-normal">
                  · {v.service}
                </span>
              </div>
              <div className="text-sm text-muted-foreground">
                {v.contact ? `${v.contact} · ` : ""}
                {PAYMENT_LABELS[v.paymentStatus]}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
