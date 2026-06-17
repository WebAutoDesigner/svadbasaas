import { notFound } from "next/navigation";
import { requireAgencyContext } from "@/lib/tenant";
import { getWedding } from "@/lib/wedding/wedding";
import { listMembers } from "@/lib/agency/team";
import { checklistProgress } from "@/lib/wedding/checklist";
import { getCoupleAccessForWedding } from "@/lib/couple/auth";
import { formatWeddingDate, daysUntil, toDateInputValue } from "@/lib/dates";
import { listContacts } from "@/lib/wedding/contact";
import { StatCard } from "@/components/domain/stat-card";
import { OverviewEditor } from "./overview-editor";
import { InviteCouple } from "./invite-couple";
import { ContactsBlock } from "./contacts-block";

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

  // Три независимых запроса — параллельно, а не друг за другом (быстрее на латентность).
  const [members, progress, coupleAccess, contacts] = await Promise.all([
    listMembers(ctx.agencyId),
    checklistProgress(ctx.agencyId, id),
    getCoupleAccessForWedding(id),
    listContacts(ctx.agencyId, id),
  ]);
  const days = daysUntil(wedding.date);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Дата" value={formatWeddingDate(wedding.date)} />
        <StatCard
          label="До свадьбы"
          value={
            wedding.status === "PLANNING"
              ? days >= 0
                ? `${days} дн.`
                : "прошла"
              : STATUS_LABELS[wedding.status] ?? wedding.status
          }
        />
        <StatCard
          label="Бюджет"
          value={`${wedding.budget.toLocaleString("ru-RU")} ₽`}
        />
        <StatCard
          label="Готовность"
          value={
            progress.total === 0
              ? "—"
              : `${progress.percent}% (${progress.done}/${progress.total})`
          }
        />
      </div>

      <div className="flex flex-wrap gap-x-10 gap-y-4 rounded-lg border bg-card px-5 py-4 shadow-sm">
        <InfoItem label="Локация" value={wedding.location ?? "не указана"} />
        <InfoItem
          label="Координатор"
          value={wedding.coordinator?.name ?? "не назначен"}
        />
        <InfoItem label="Источник" value={wedding.source ?? "—"} />
        <InfoItem
          label="Гостей"
          value={wedding.guestCount != null ? String(wedding.guestCount) : "—"}
        />
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
          source: wedding.source ?? "",
        }}
        coordinators={members.map((m) => ({ id: m.userId, name: m.name }))}
      />

      <ContactsBlock
        weddingId={wedding.id}
        contacts={contacts.map((c) => ({ id: c.id, label: c.label, value: c.value }))}
      />

      <div className="border-t pt-6">
        <h2 className="text-xl font-semibold">Кабинет молодожёнов</h2>
        <p className="mt-1 mb-4 text-sm text-muted-foreground">
          Личный кабинет пары: гости, чек-лист, тайминг и запросы — в одном месте.
        </p>
        <InviteCouple weddingId={wedding.id} currentPhone={coupleAccess?.phone ?? null} />
      </div>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 text-sm font-medium">{value}</div>
    </div>
  );
}
