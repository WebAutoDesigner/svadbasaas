import { notFound } from "next/navigation";
import { requireAgencyContext } from "@/lib/tenant";
import { getWedding } from "@/lib/wedding/wedding";
import { listMembers } from "@/lib/agency/team";
import { formatWeddingDate, daysUntil, toDateInputValue } from "@/lib/dates";
import { OverviewEditor } from "./overview-editor";

export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<string, string> = {
  PLANNING: "В подготовке",
  COMPLETED: "Завершена",
  CANCELLED: "Отменена",
};

export default async function WeddingOverviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await requireAgencyContext();
  const { id } = await params;
  const wedding = await getWedding(ctx.agencyId, id);
  if (!wedding) notFound();

  const members = await listMembers(ctx.agencyId);
  const days = daysUntil(wedding.date);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Дата" value={formatWeddingDate(wedding.date)} />
        <Stat
          label="До свадьбы"
          value={
            wedding.status === "PLANNING"
              ? days >= 0
                ? `${days} дн.`
                : "прошла"
              : STATUS_LABELS[wedding.status] ?? wedding.status
          }
        />
        <Stat
          label="Бюджет"
          value={`${wedding.budget.toLocaleString("ru-RU")} ₽`}
        />
        <Stat label="Гостей" value={wedding.guestCount?.toString() ?? "—"} />
      </div>

      <div className="text-sm text-muted-foreground space-y-1">
        {wedding.location ? <div>Локация: {wedding.location}</div> : null}
        <div>
          Координатор: {wedding.coordinator?.name ?? "не назначен"}
        </div>
        <div>Статус: {STATUS_LABELS[wedding.status] ?? wedding.status}</div>
      </div>

      <OverviewEditor
        weddingId={wedding.id}
        values={{
          brideName: wedding.brideName,
          groomName: wedding.groomName,
          date: toDateInputValue(wedding.date),
          budget: wedding.budget,
          location: wedding.location ?? "",
          guestCount: wedding.guestCount,
          coordinatorId: wedding.coordinatorId,
          timezone: wedding.timezone,
          status: wedding.status,
        }}
        coordinators={members.map((m) => ({ id: m.userId, name: m.name }))}
      />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border rounded-md p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-semibold mt-1">{value}</div>
    </div>
  );
}
