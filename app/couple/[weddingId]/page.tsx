import { requireCoupleForWedding } from "@/lib/couple/session";
import { coupleWedding, coupleChecklistProgress } from "@/lib/couple/data";
import { formatWeddingDate, daysUntil } from "@/lib/dates";

export const dynamic = "force-dynamic";

export default async function CoupleDashboard({
  params,
}: {
  params: Promise<{ weddingId: string }>;
}) {
  const { weddingId } = await params;
  await requireCoupleForWedding(weddingId);

  const wedding = await coupleWedding(weddingId);
  if (!wedding) return null;
  const progress = await coupleChecklistProgress(weddingId);
  const days = daysUntil(wedding.date);

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-2xl space-y-6">
      <div className="text-center py-6">
        <div className="text-5xl font-bold">
          {days >= 0 ? days : 0}
        </div>
        <div className="text-muted-foreground mt-1">
          {days >= 0 ? "дней до свадьбы" : "свадьба прошла"}
        </div>
        <div className="text-sm text-muted-foreground mt-2">
          {formatWeddingDate(wedding.date)}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">Готовность к свадьбе</span>
          <span className="text-muted-foreground">{progress.percent}%</span>
        </div>
        <div className="h-3 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${progress.percent}%` }}
          />
        </div>
        <p className="text-sm text-muted-foreground">
          Выполнено {progress.done} из {progress.total} задач
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Stat label="Бюджет" value={`${wedding.budget.toLocaleString("ru-RU")} ₽`} />
        <Stat label="Гостей" value={wedding.guestCount?.toString() ?? "—"} />
      </div>

      {wedding.location ? (
        <p className="text-sm text-muted-foreground">
          Локация: {wedding.location}
        </p>
      ) : null}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border rounded-md p-3 text-center">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-semibold mt-1">{value}</div>
    </div>
  );
}
