import { requireCoupleForWedding } from "@/lib/couple/session";
import { coupleAgencyId } from "@/lib/couple/data";
import { listSeatableGuests, listTables } from "@/lib/wedding/seating";
import { SeatingBoard } from "@/components/domain/seating-board";
import { CoupleRequestBanner } from "../request-banner";
import {
  coupleAddTableAction,
  coupleAssignGuestAction,
  coupleDeleteTableAction,
  coupleUnassignGuestAction,
  coupleUpdateTableAction,
} from "./actions";

export const dynamic = "force-dynamic";

export default async function CoupleSeating({
  params,
}: {
  params: Promise<{ weddingId: string }>;
}) {
  const { weddingId } = await params;
  await requireCoupleForWedding(weddingId);
  const agencyId = await coupleAgencyId(weddingId);

  const [tables, pool] = agencyId
    ? await Promise.all([
        listTables(agencyId, weddingId),
        listSeatableGuests(agencyId, weddingId),
      ])
    : [[], []];

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-4xl space-y-6">
      <h1 className="text-xl font-bold">Рассадка</h1>
      <p className="text-sm text-muted-foreground">
        Создавайте столы и сажайте гостей. Агентство видит изменения.
      </p>
      <CoupleRequestBanner weddingId={weddingId} slug="seating" />
      <SeatingBoard
        weddingId={weddingId}
        tables={tables.map((t) => ({
          id: t.id,
          name: t.name,
          capacity: t.capacity,
          guests: t.guests,
        }))}
        pool={pool}
        actions={{
          assign: coupleAssignGuestAction,
          unassign: coupleUnassignGuestAction,
          addTable: coupleAddTableAction,
          updateTable: coupleUpdateTableAction,
          deleteTable: coupleDeleteTableAction,
        }}
      />
    </div>
  );
}
