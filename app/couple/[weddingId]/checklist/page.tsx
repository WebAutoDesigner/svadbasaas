import { requireCoupleForWedding } from "@/lib/couple/session";
import { coupleChecklist } from "@/lib/couple/data";
import { PERIOD_LABELS, PERIOD_ORDER } from "@/lib/templates/checklist";

export const dynamic = "force-dynamic";

export default async function CoupleChecklist({
  params,
}: {
  params: Promise<{ weddingId: string }>;
}) {
  const { weddingId } = await params;
  await requireCoupleForWedding(weddingId);
  const items = await coupleChecklist(weddingId);

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-2xl space-y-6">
      <h1 className="text-xl font-bold">Чек-лист подготовки</h1>
      {items.length === 0 ? (
        <p className="text-muted-foreground">Задачи пока не добавлены.</p>
      ) : (
        PERIOD_ORDER.map((period) => {
          const group = items.filter((i) => i.period === period);
          if (group.length === 0) return null;
          return (
            <section key={period} className="space-y-2">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase">
                {PERIOD_LABELS[period]}
              </h2>
              <div className="border rounded-md divide-y">
                {group.map((item) => (
                  <div key={item.id} className="flex items-start gap-3 p-3">
                    <span className="mt-0.5">{item.done ? "✅" : "⬜"}</span>
                    <span
                      className={
                        item.done ? "line-through text-muted-foreground" : ""
                      }
                    >
                      {item.title}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          );
        })
      )}
    </div>
  );
}
