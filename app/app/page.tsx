import Link from "next/link";
import { requireAgencyContext } from "@/lib/tenant";
import { listWeddings } from "@/lib/wedding/wedding";
import { buttonVariants } from "@/components/ui/button";
import { formatWeddingDate, daysUntil } from "@/lib/dates";

export const dynamic = "force-dynamic";

export const metadata = { title: "Дашборд · Svadba Plus" };

export default async function AppDashboardPage() {
  const ctx = await requireAgencyContext();
  const upcoming = (await listWeddings(ctx.agencyId)).slice(0, 5);

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-4xl space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">{ctx.agencyName}</h1>
        <Link href="/app/weddings/new" className={buttonVariants()}>
          Новая свадьба
        </Link>
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Ближайшие свадьбы</h2>
          <Link
            href="/app/weddings"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Все →
          </Link>
        </div>

        {upcoming.length === 0 ? (
          <p className="text-muted-foreground">
            Свадеб пока нет.{" "}
            <Link href="/app/weddings/new" className="underline">
              Создайте первую
            </Link>
            .
          </p>
        ) : (
          <div className="border rounded-md divide-y">
            {upcoming.map((w) => {
              const days = daysUntil(w.date);
              return (
                <Link
                  key={w.id}
                  href={`/app/weddings/${w.id}`}
                  className="flex items-center justify-between gap-2 p-4 hover:bg-accent/50"
                >
                  <div className="min-w-0">
                    <div className="font-medium truncate">
                      {w.brideName} & {w.groomName}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatWeddingDate(w.date)}
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground whitespace-nowrap">
                    {days >= 0 ? `через ${days} дн.` : "прошла"}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
