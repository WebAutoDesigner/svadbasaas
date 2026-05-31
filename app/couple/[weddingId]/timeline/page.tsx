import { requireCoupleForWedding } from "@/lib/couple/session";
import { coupleTimeline } from "@/lib/couple/data";
import { minutesToHHMM } from "@/lib/wedding/timeline";

export const dynamic = "force-dynamic";

export default async function CoupleTimeline({
  params,
}: {
  params: Promise<{ weddingId: string }>;
}) {
  const { weddingId } = await params;
  await requireCoupleForWedding(weddingId);
  const events = await coupleTimeline(weddingId);

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-2xl space-y-6">
      <h1 className="text-xl font-bold">Тайминг дня</h1>
      {events.length === 0 ? (
        <p className="text-muted-foreground">Тайминг пока не составлен.</p>
      ) : (
        <div className="space-y-2">
          {events.map((e) => (
            <div key={e.id} className="border rounded-md p-3 flex gap-4">
              <div className="text-lg font-bold tabular-nums w-14 shrink-0">
                {minutesToHHMM(e.startMinutes)}
              </div>
              <div>
                <div className="font-medium">{e.title}</div>
                {e.description ? (
                  <div className="text-sm text-muted-foreground">
                    {e.description}
                  </div>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
