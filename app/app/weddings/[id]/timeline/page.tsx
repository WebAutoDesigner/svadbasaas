import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAgencyContext } from "@/lib/tenant";
import { getWedding } from "@/lib/wedding/wedding";
import { listTimeline, minutesToHHMM } from "@/lib/wedding/timeline";
import { listTemplates } from "@/lib/agency/templates";
import { buttonVariants } from "@/components/ui/button";
import { TimelineBoard } from "./timeline-board";
import { ApplyTemplatePicker } from "../apply-template-picker";
import { applyTimelineTemplateAction } from "./actions";

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

  const [events, templates] = await Promise.all([
    listTimeline(ctx.agencyId, id),
    listTemplates(ctx.agencyId, "TIMELINE"),
  ]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center gap-2">
        <ApplyTemplatePicker
          weddingId={id}
          templates={templates.map((t) => ({ id: t.id, name: t.name }))}
          action={applyTimelineTemplateAction}
        />
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
