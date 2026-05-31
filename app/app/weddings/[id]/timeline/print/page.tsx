import { notFound } from "next/navigation";
import { requireAgencyContext } from "@/lib/tenant";
import { getWedding } from "@/lib/wedding/wedding";
import { listTimeline, minutesToHHMM } from "@/lib/wedding/timeline";
import { formatWeddingDate } from "@/lib/dates";
import { PrintTrigger } from "./print-trigger";

export const dynamic = "force-dynamic";

export default async function TimelinePrintPage({
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
    <div className="mx-auto max-w-2xl p-6 print:p-0">
      <PrintTrigger />
      <div className="mb-6">
        <h1 className="text-2xl font-bold">
          Тайминг дня — {wedding.brideName} & {wedding.groomName}
        </h1>
        <p className="text-muted-foreground">{formatWeddingDate(wedding.date)}</p>
      </div>

      {events.length === 0 ? (
        <p>Событий нет.</p>
      ) : (
        <table className="w-full border-collapse">
          <tbody>
            {events.map((e) => (
              <tr key={e.id} className="border-b align-top">
                <td className="py-2 pr-4 font-bold tabular-nums whitespace-nowrap">
                  {minutesToHHMM(e.startMinutes)}
                </td>
                <td className="py-2">
                  <div className="font-medium">{e.title}</div>
                  {(e.durationMin > 0 || e.responsible) && (
                    <div className="text-sm text-gray-600">
                      {e.durationMin > 0 ? `${e.durationMin} мин` : ""}
                      {e.responsible ? ` · ${e.responsible}` : ""}
                    </div>
                  )}
                  {e.description ? (
                    <div className="text-sm text-gray-600">{e.description}</div>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
