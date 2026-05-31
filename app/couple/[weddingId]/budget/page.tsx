import { requireCoupleForWedding } from "@/lib/couple/session";
import { coupleBudget, coupleWedding } from "@/lib/couple/data";

export const dynamic = "force-dynamic";

const fmt = (n: number) => n.toLocaleString("ru-RU");

export default async function CoupleBudget({
  params,
}: {
  params: Promise<{ weddingId: string }>;
}) {
  const { weddingId } = await params;
  await requireCoupleForWedding(weddingId);
  const [items, wedding] = await Promise.all([
    coupleBudget(weddingId),
    coupleWedding(weddingId),
  ]);
  const totalActual = items.reduce((s, i) => s + i.actual, 0);
  const budget = wedding?.budget ?? 0;

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-2xl space-y-6">
      <h1 className="text-xl font-bold">Бюджет</h1>
      <div className="grid grid-cols-3 gap-3">
        <Stat label="Бюджет" value={`${fmt(budget)} ₽`} />
        <Stat label="Потрачено" value={`${fmt(totalActual)} ₽`} />
        <Stat label="Остаток" value={`${fmt(budget - totalActual)} ₽`} />
      </div>
      {items.length === 0 ? (
        <p className="text-muted-foreground">Статьи бюджета пока не заполнены.</p>
      ) : (
        <div className="border rounded-md divide-y">
          {items.map((i) => (
            <div key={i.id} className="flex justify-between gap-3 p-3">
              <span>{i.name}</span>
              <span className="text-muted-foreground whitespace-nowrap">
                {fmt(i.actual)} / {fmt(i.planned)} ₽
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border rounded-md p-3 text-center">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-semibold mt-1 text-sm">{value}</div>
    </div>
  );
}
