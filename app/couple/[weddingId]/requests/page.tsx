import { requireCoupleForWedding } from "@/lib/couple/session";
import { coupleAgencyId } from "@/lib/couple/data";
import { listRequests } from "@/lib/wedding/request";
import { CoupleRequestsInbox } from "./requests-inbox";

export const dynamic = "force-dynamic";

export default async function CoupleRequests({
  params,
}: {
  params: Promise<{ weddingId: string }>;
}) {
  const { weddingId } = await params;
  await requireCoupleForWedding(weddingId);
  const agencyId = await coupleAgencyId(weddingId);
  const requests = agencyId ? await listRequests(agencyId, weddingId) : [];

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-2xl space-y-6">
      <h1 className="text-xl font-bold">Запросы от агентства</h1>
      <p className="text-sm text-muted-foreground">
        Здесь всё, что агентство просит от вас. Ответьте — и запрос уйдёт из активных.
      </p>
      <CoupleRequestsInbox
        weddingId={weddingId}
        requests={requests.map((r) => ({
          id: r.id,
          kind: r.kind,
          title: r.title,
          message: r.message,
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
    </div>
  );
}
