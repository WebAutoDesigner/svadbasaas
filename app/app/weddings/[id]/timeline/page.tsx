import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAgencyContext } from "@/lib/tenant";
import { getWedding } from "@/lib/wedding/wedding";
import { listTimeline, minutesToHHMM } from "@/lib/wedding/timeline";
import { buttonVariants } from "@/components/ui/button";
import { TimelineBoard } from "./timeline-board";

export const dynamic = "force-dynamic";

export default async function TimelinePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await requireAgencyContext();
  const { id } = await params;
  const wedding = await getWedding(ctx.agencyId, id);
  if (!wedding) notFound();

  const events = await listTimeline(ctx.agencyId, id);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Link
          href={`/app/weddings/${id}/timeline/print`}
          target="_blank"
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          Печать / PDF
        </Link>
      </div>
      <TimelineBoard
        weddingId={id}
        events={events.map((e) => ({
          id: e.id,
          startTime: minutesToHHMM(e.startMinutes),
          durationMin: e.durationMin,
          title: e.title,
          description: e.description,
          responsible: e.responsible,
        }))}
      />
    </div>
  );
}
