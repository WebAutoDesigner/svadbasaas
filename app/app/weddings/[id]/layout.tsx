import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAgencyContext } from "@/lib/tenant";
import { getWedding } from "@/lib/wedding/wedding";
import { formatWeddingDate } from "@/lib/dates";
import { WeddingTabs } from "./wedding-tabs";

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

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-4xl space-y-4">
      <div className="space-y-1 print:hidden">
        <Link
          href="/app/weddings"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← К списку
        </Link>
        <h1 className="text-2xl font-bold">
          {wedding.brideName} & {wedding.groomName}
        </h1>
        <p className="text-muted-foreground">{formatWeddingDate(wedding.date)}</p>
      </div>

      <div className="print:hidden">
        <WeddingTabs weddingId={id} />
      </div>

      <div className="pt-2">{children}</div>
    </div>
  );
}
