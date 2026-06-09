import Link from "next/link";
import { requireAgencyContext } from "@/lib/tenant";
import { listWeddings } from "@/lib/wedding/wedding";
import { buttonVariants } from "@/components/ui/button";
import { WeddingRow } from "@/components/domain/wedding-row";
import { formatWeddingDate, formatDayMonth, daysUntil } from "@/lib/dates";

export const dynamic = "force-dynamic";

export const metadata = { title: "Свадьбы · Svadba Plus" };

export default async function WeddingsPage({
  searchParams,
}: {
  searchParams: Promise<{ all?: string }>;
}) {
  const ctx = await requireAgencyContext();
  const params = await searchParams;
  const includeCompleted = params.all === "1";

  const weddings = await listWeddings(ctx.agencyId, { includeCompleted });

  const filterBase =
    "rounded-full px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.1em] transition-colors";

  return (
    <div className="container mx-auto max-w-5xl space-y-8 p-4 md:p-8">
      <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-5">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold">
            Агентство
          </div>
          <h1 className="mt-2 text-4xl font-semibold">Свадьбы</h1>
        </div>
        <Link
          href="/app/weddings/new"
          className={buttonVariants({ variant: "gold" })}
        >
          + Новая свадьба
        </Link>
      </div>

      <div className="flex gap-2">
        <Link
          href="/app/weddings"
          className={`${filterBase} ${
            !includeCompleted
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-accent hover:text-foreground"
          }`}
        >
          Активные
        </Link>
        <Link
          href="/app/weddings?all=1"
          className={`${filterBase} ${
            includeCompleted
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-accent hover:text-foreground"
          }`}
        >
          Все
        </Link>
      </div>

      {weddings.length === 0 ? (
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
          {weddings.map((w) => {
            const days = daysUntil(w.date);
            const trailingSub =
              w.status === "PLANNING"
                ? days >= 0
                  ? days === 0
                    ? "сегодня"
                    : `через ${days} дн.`
                  : "прошла"
                : w.status === "COMPLETED"
                  ? "завершена"
                  : "отменена";
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
                trailingSub={trailingSub}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
