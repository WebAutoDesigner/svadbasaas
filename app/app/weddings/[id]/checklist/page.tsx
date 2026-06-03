import { notFound } from "next/navigation";
import { requireAgencyContext } from "@/lib/tenant";
import { getWedding } from "@/lib/wedding/wedding";
import { listChecklist } from "@/lib/wedding/checklist";
import { listTemplates } from "@/lib/agency/templates";
import { ChecklistBoard } from "./checklist-board";

export const dynamic = "force-dynamic";

export default async function ChecklistPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await requireAgencyContext();
  const { id } = await params;
  const wedding = await getWedding(ctx.agencyId, id);
  if (!wedding) notFound();

  const [items, templates] = await Promise.all([
    listChecklist(ctx.agencyId, id),
    listTemplates(ctx.agencyId, "CHECKLIST"),
  ]);

  return (
    <ChecklistBoard
      weddingId={id}
      items={items.map((i) => ({
        id: i.id,
        title: i.title,
        period: i.period,
        done: i.done,
        note: i.note,
      }))}
      templates={templates.map((t) => ({ id: t.id, name: t.name }))}
    />
  );
}
