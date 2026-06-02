import { requireCoupleForWedding } from "@/lib/couple/session";
import { coupleVisibleEvents } from "@/lib/couple/data";
import { formatShortDate } from "@/lib/dates";
import { minutesToTime } from "@/lib/validators/wedding-event";
import { CoupleRequestBanner } from "../request-banner";

export const dynamic = "force-dynamic";

export default async function CoupleSchedule({
  params,
}: {
  params: Promise<{ weddingId: string }>;
}) {
  const { weddingId } = await params;
  await requireCoupleForWedding(weddingId);
  const events = await coupleVisibleEvents(weddingId);

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-2xl space-y-6">
      <h1 className="text-xl font-bold">Расписание свадьбы</h1>
      <CoupleRequestBanner weddingId={weddingId} slug="schedule" />
      {events.length === 0 ? (
        <p className="text-muted-foreground">Расписание появится позже.</p>
      ) : (
        <div className="space-y-3">
          {events.map((e) => {
            const time = minutesToTime(e.startMinutes);
            return (
              <div key={e.id} className="border rounded-md p-4">
                <div className="font-medium">
                  {e.title}{" "}
                  <span className="text-muted-foreground font-normal">
                    · {formatShortDate(e.date)}
                    {time ? ` ${time}` : ""}
                  </span>
                </div>
                {e.description ? (
                  <div className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
                    {e.description}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
