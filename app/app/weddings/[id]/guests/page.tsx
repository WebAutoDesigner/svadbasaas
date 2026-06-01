import { notFound } from "next/navigation";
import { requireAgencyContext } from "@/lib/tenant";
import { getWedding } from "@/lib/wedding/wedding";
import { guestsSummary, listGuests } from "@/lib/wedding/guest";
import { getUnseenCoupleChanges } from "@/lib/wedding/couple-activity";
import { GuestsBoard } from "./guests-board";

export const dynamic = "force-dynamic";

export default async function GuestsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await requireAgencyContext();
  const { id } = await params;
  const wedding = await getWedding(ctx.agencyId, id);
  if (!wedding) notFound();

  const [guests, summary, unseen] = await Promise.all([
    listGuests(ctx.agencyId, id),
    guestsSummary(ctx.agencyId, id),
    getUnseenCoupleChanges(ctx.agencyId, id, "GUESTS"),
  ]);

  return (
    <GuestsBoard
      weddingId={id}
      summary={summary}
      unseen={{
        count: unseen.count,
        items: unseen.items.map((i) => ({
          summary: i.summary,
          createdAt: i.createdAt,
        })),
      }}
      guests={guests.map((g) => ({
        id: g.id,
        name: g.name,
        status: g.status,
        side: g.side,
        groupLabel: g.groupLabel,
      }))}
    />
  );
}
