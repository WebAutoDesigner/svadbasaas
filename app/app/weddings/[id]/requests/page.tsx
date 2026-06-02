import { notFound } from "next/navigation";
import { requireAgencyContext } from "@/lib/tenant";
import { getWedding } from "@/lib/wedding/wedding";
import { listRequests } from "@/lib/wedding/request";
import { listTemplates } from "@/lib/agency/templates";
import { RequestsBoard } from "./requests-board";

export const dynamic = "force-dynamic";

export default async function RequestsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await requireAgencyContext();
  const { id } = await params;
  const wedding = await getWedding(ctx.agencyId, id);
  if (!wedding) notFound();

  const [requests, templates] = await Promise.all([
    listRequests(ctx.agencyId, id),
    listTemplates(ctx.agencyId, "QUESTIONNAIRE"),
  ]);

  return (
    <RequestsBoard
      weddingId={id}
      templates={templates.map((t) => ({ id: t.id, name: t.name }))}
      requests={requests.map((r) => ({
        id: r.id,
        kind: r.kind,
        title: r.title,
        message: r.message,
        linkTo: r.linkTo,
        status: r.status,
        coupleReply: r.coupleReply,
        questions: r.questions.map((q) => ({
          id: q.id,
          prompt: q.prompt,
          answerText: q.answerText,
        })),
        attachments: r.attachments.map((a) => ({ id: a.id, name: a.name })),
      }))}
    />
  );
}
