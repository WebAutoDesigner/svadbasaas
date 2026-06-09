import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAgencyContext } from "@/lib/tenant";
import { getWedding } from "@/lib/wedding/wedding";
import { formatWeddingDate, daysUntil } from "@/lib/dates";
import { WeddingTabs } from "./wedding-tabs";

const STATUS_LABELS: Record<string, string> = {
  PLANNING: "В подготовке",
  COMPLETED: "Завершена",
  CANCELLED: "Отменена",
};

function pluralDays(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "день";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "дня";
  return "дней";
}

export default async function WeddingLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const ctx = await requireAgencyContext();
  const { id } = await params;
  const wedding = await getWedding(ctx.agencyId, id);
  if (!wedding) notFound();

  const days = daysUntil(wedding.date);
  const showCountdown = wedding.status === "PLANNING" && days >= 0;

  return (
    <div className="container mx-auto max-w-5xl space-y-6 p-4 md:p-8">
      <div className="print:hidden">
        <Link
          href="/app/weddings"
          className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:text-gold"
        >
          ← Все свадьбы
        </Link>

        <div className="mt-4 flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">
                Свадьба
              </span>
              <span className="rounded-full bg-gold-tint px-3 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-gold">
                {STATUS_LABELS[wedding.status] ?? wedding.status}
              </span>
            </div>
            <h1 className="mt-2 text-4xl font-semibold leading-[1.05] md:text-5xl">
              {wedding.brideName}{" "}
              <span className="font-normal italic text-gold">&</span>{" "}
              {wedding.groomName}
            </h1>
            <p className="mt-3 text-sm text-muted-foreground">
              {formatWeddingDate(wedding.date)}
              {wedding.location ? ` · ${wedding.location}` : ""}
            </p>
          </div>

          {showCountdown ? (
            <div className="pb-1 text-right">
              <div className="font-heading text-4xl leading-none text-gold md:text-5xl">
                {days}
              </div>
              <div className="mt-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                {pluralDays(days)} до свадьбы
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div className="print:hidden">
        <WeddingTabs weddingId={id} />
      </div>

      <div className="pt-1">{children}</div>
    </div>
  );
}
