import { requireCoupleForWedding } from "@/lib/couple/session";
import { coupleGuests } from "@/lib/couple/data";
import { CoupleGuestsBoard } from "./couple-guests-board";
import { CoupleRequestBanner } from "../request-banner";

export const dynamic = "force-dynamic";

export default async function CoupleGuests({
  params,
}: {
  params: Promise<{ weddingId: string }>;
}) {
  const { weddingId } = await params;
  await requireCoupleForWedding(weddingId);
  const guests = await coupleGuests(weddingId);

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-2xl space-y-6">
      <h1 className="text-xl font-bold">Гости</h1>
      <p className="text-sm text-muted-foreground">
        Добавляйте гостей и отмечайте, кто придёт. Агентство видит изменения.
      </p>
      <CoupleRequestBanner weddingId={weddingId} slug="guests" />
      <CoupleGuestsBoard
        weddingId={weddingId}
        guests={guests.map((g) => ({
          id: g.id,
          name: g.name,
          status: g.status,
          side: g.side,
          groupLabel: g.groupLabel,
        }))}
      />
    </div>
  );
}
