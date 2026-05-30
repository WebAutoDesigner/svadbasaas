import Link from "next/link";
import { requireAgencyContext } from "@/lib/tenant";
import { listWeddings } from "@/lib/wedding/wedding";
import { buttonVariants } from "@/components/ui/button";
import { formatWeddingDate, daysUntil } from "@/lib/dates";

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

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-4xl space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Свадьбы</h1>
        <Link href="/app/weddings/new" className={buttonVariants()}>
          Новая свадьба
        </Link>
      </div>

      <div className="flex gap-2 text-sm">
        <Link
          href="/app/weddings"
          className={!includeCompleted ? "font-semibold" : "text-muted-foreground"}
        >
          Активные
        </Link>
        <span className="text-muted-foreground">·</span>
        <Link
          href="/app/weddings?all=1"
          className={includeCompleted ? "font-semibold" : "text-muted-foreground"}
        >
          Все
        </Link>
      </div>

      {weddings.length === 0 ? (
        <p className="text-muted-foreground">
          Свадеб пока нет.{" "}
          <Link href="/app/weddings/new" className="underline">
            Создайте первую
          </Link>
          .
        </p>
      ) : (
        <div className="border rounded-md divide-y">
          {weddings.map((w) => {
            const days = daysUntil(w.date);
            return (
              <Link
                key={w.id}
                href={`/app/weddings/${w.id}`}
                className="flex flex-col md:flex-row md:items-center justify-between gap-2 p-4 hover:bg-accent/50"
              >
                <div className="min-w-0">
                  <div className="font-medium truncate">
                    {w.brideName} & {w.groomName}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {formatWeddingDate(w.date)}
                    {w.location ? ` · ${w.location}` : ""}
                  </div>
                </div>
                <div className="text-sm text-muted-foreground whitespace-nowrap">
                  {w.status === "PLANNING"
                    ? days >= 0
                      ? `через ${days} дн.`
                      : "прошла"
                    : w.status === "COMPLETED"
                      ? "завершена"
                      : "отменена"}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
