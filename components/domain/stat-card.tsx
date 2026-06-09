/**
 * Премиум стат-карточка: тёплый белый фон, золотой акцент слева,
 * эйкброу-подпись капителью и крупное засечное значение.
 */
export function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-lg border bg-card px-5 py-5 shadow-sm">
      <span aria-hidden className="absolute inset-y-0 left-0 w-[3px] bg-gold" />
      <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </div>
      <div className="mt-3 font-heading text-2xl leading-none md:text-[2rem]">
        {value}
      </div>
      {sub ? (
        <div className="mt-2 text-[13px] text-muted-foreground">{sub}</div>
      ) : null}
    </div>
  );
}
