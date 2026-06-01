import { notFound } from "next/navigation";
import { requireAgencyContext } from "@/lib/tenant";
import { getWedding } from "@/lib/wedding/wedding";
import { listEvents } from "@/lib/wedding/event";
import { EventsBoard } from "./events-board";

export const dynamic = "force-dynamic";

export default async function EventsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await requireAgencyContext();
  const { id } = await params;
  const wedding = await getWedding(ctx.agencyId, id);
  if (!wedding) notFound();

  const events = await listEvents(ctx.agencyId, id);

  return (
    <EventsBoard
      weddingId={id}
      events={events.map((e) => ({
        id: e.id,
        title: e.title,
        date: e.date.toISOString(),
        startMinutes: e.startMinutes,
        description: e.description,
        visibleToCouple: e.visibleToCouple,
      }))}
    />
  );
}
