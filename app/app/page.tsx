import Link from "next/link";
import { requireAgencyContext } from "@/lib/tenant";
import { listWeddings } from "@/lib/wedding/wedding";
import { buttonVariants } from "@/components/ui/button";
import { StatCard } from "@/components/domain/stat-card";
import { WeddingRow } from "@/components/domain/wedding-row";
import { formatWeddingDate, formatDayMonth, daysUntil } from "@/lib/dates";

export const dynamic = "force-dynamic";

export const metadata = { title: "Дашборд · Svadba Plus" };

const MONTH_AHEAD_DAYS = 30;

export default async function AppDashboardPage() {
  const ctx = await requireAgencyContext();
  const [weddings, user] = await Promise.all([
    listWeddings(ctx.agencyId),
    ctx.db.user.findUnique({
      where: { id: ctx.userId },
      select: { name: true },
    }),
  ]);
  const upcoming = weddings.slice(0, 5);

  const nearest = weddings.find((w) => daysUntil(w.date) >= 0);
  const nearestDays = nearest ? daysUntil(nearest.date) : null;
  const withinMonth = weddings.filter((w) => {
    const d = daysUntil(w.date);
    return d >= 0 && d <= MONTH_AHEAD_DAYS;
  }).length;

  const firstName = user?.name?.trim().split(/\s+/)[0] ?? null;

  return (
    <div className="container mx-auto max-w-5xl space-y-10 p-4 md:p-8">
      <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-5">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold">
            Панель агентства
          </div>
          <h1 className="mt-2 text-4xl font-semibold leading-[1.08] md:text-[2.75rem]">
            С возвращением,
            <br />
            <span className="font-normal italic text-gold">
              {firstName ?? ctx.agencyName}
            </span>
          </h1>
        </div>
        <Link
          href="/app/weddings/new"
          className={buttonVariants({ variant: "gold", size: "lg" })}
        >
          + Новая свадьба
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3 md:gap-5">
        <StatCard
          label="Свадеб в работе"
          value={String(weddings.length)}
          sub={
            withinMonth > 0
              ? `из них ${withinMonth} в ближайший месяц`
              : "в ближайший месяц свадеб нет"
          }
        />
        <StatCard
          label="Ближайшая"
          value={
            nearest && nearestDays !== null
              ? nearestDays === 0
                ? "сегодня"
                : `${nearestDays} дн.`
              : "—"
          }
          sub={
            nearest
              ? `${nearest.brideName} & ${nearest.groomName} · ${formatWeddingDate(nearest.date)}`
              : "добавьте первую свадьбу"
          }
        />
        <StatCard
          label="Агентство"
          value={ctx.agencyName.length > 18 ? "Команда" : ctx.agencyName}
          sub="настройки — в разделе «Команда»"
        />
      </div>

      <section className="space-y-5">
        <div className="flex items-baseline justify-between border-b pb-4">
          <h2 className="text-2xl font-semibold">Ближайшие свадьбы</h2>
          <Link
            href="/app/weddings"
            className="text-[11px] font-bold uppercase tracking-[0.12em] text-gold transition-opacity hover:opacity-75"
          >
            Все свадьбы →
          </Link>
        </div>

        {upcoming.length === 0 ? (
          <div className="rounded-xl border bg-card px-6 py-12 text-center shadow-sm">
            <div className="font-heading text-2xl">Свадеб пока нет</div>
            <p className="mt-2 text-sm text-muted-foreground">
              Создайте первую — и начните вести её вместе с парой.
            </p>
            <Link
              href="/app/weddings/new"
              className={`${buttonVariants({ variant: "gold" })} mt-6`}
            >
              + Новая свадьба
            </Link>
          </div>
        ) : (
          <div className="divide-y overflow-hidden rounded-xl border bg-card shadow-sm">
            {upcoming.map((w) => {
              const days = daysUntil(w.date);
              return (
                <WeddingRow
                  key={w.id}
                  href={`/app/weddings/${w.id}`}
                  brideName={w.brideName}
                  groomName={w.groomName}
                  dateLine={
                    w.location
                      ? `${formatWeddingDate(w.date)} · ${w.location}`
                      : formatWeddingDate(w.date)
                  }
                  trailingTitle={formatDayMonth(w.date)}
                  trailingSub={
                    days >= 0
                      ? days === 0
                        ? "сегодня"
                        : `через ${days} дн.`
                      : "прошла"
                  }
                />
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
