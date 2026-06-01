import { notFound } from "next/navigation";
import { requireAgencyContext } from "@/lib/tenant";
import { getWedding } from "@/lib/wedding/wedding";
import { listSeatableGuests, listTables } from "@/lib/wedding/seating";
import { getUnseenCoupleChanges } from "@/lib/wedding/couple-activity";
import { SeatingBoard } from "@/components/domain/seating-board";
import { CoupleChangesBadge } from "../couple-changes-badge";
import {
  addTableAction,
  assignGuestAction,
  deleteTableAction,
  unassignGuestAction,
  updateTableAction,
} from "./actions";

export const dynamic = "force-dynamic";

export default async function SeatingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await requireAgencyContext();
  const { id } = await params;
  const wedding = await getWedding(ctx.agencyId, id);
  if (!wedding) notFound();

  const [tables, pool, unseen] = await Promise.all([
    listTables(ctx.agencyId, id),
    listSeatableGuests(ctx.agencyId, id),
    getUnseenCoupleChanges(ctx.agencyId, id, "SEATING"),
  ]);

  return (
    <SeatingBoard
      weddingId={id}
      tables={tables.map((t) => ({
        id: t.id,
        name: t.name,
        capacity: t.capacity,
        guests: t.guests,
      }))}
      pool={pool}
      actions={{
        assign: assignGuestAction,
        unassign: unassignGuestAction,
        addTable: addTableAction,
        updateTable: updateTableAction,
        deleteTable: deleteTableAction,
      }}
      badge={
        <CoupleChangesBadge
          weddingId={id}
          area="SEATING"
          count={unseen.count}
          items={unseen.items.map((i) => ({
            summary: i.summary,
            createdAt: i.createdAt,
          }))}
        />
      }
    />
  );
}
