import Link from "next/link";

/**
 * Строка свадьбы в списках (дашборд, список свадеб): золотой монограм-кружок
 * с инициалами пары, засечные имена, мета снизу; справа — засечная дата
 * и подпись капителью («через N дн.»).
 */
export function WeddingRow({
  href,
  brideName,
  groomName,
  dateLine,
  trailingTitle,
  trailingSub,
}: {
  href: string;
  brideName: string;
  groomName: string;
  dateLine: string;
  trailingTitle: string;
  trailingSub?: string;
}) {
  const initials = `${brideName.charAt(0)}&${groomName.charAt(0)}`;

  return (
    <Link
      href={href}
      className="flex items-center justify-between gap-4 px-5 py-5 transition-colors hover:bg-accent md:px-6"
    >
      <div className="flex min-w-0 items-center gap-4 md:gap-5">
        <span className="grid size-12 flex-none place-items-center rounded-full border border-gold-soft font-heading text-[15px] text-gold">
          {initials}
        </span>
        <div className="min-w-0">
          <div className="truncate font-heading text-xl leading-tight">
            {brideName} &amp; {groomName}
          </div>
          <div className="mt-1 truncate text-sm text-muted-foreground">
            {dateLine}
          </div>
        </div>
      </div>
      <div className="flex-none text-right">
        <div className="font-heading text-base leading-none">
          {trailingTitle}
        </div>
        {trailingSub ? (
          <div className="mt-1.5 whitespace-nowrap text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            {trailingSub}
          </div>
        ) : null}
      </div>
    </Link>
  );
}
