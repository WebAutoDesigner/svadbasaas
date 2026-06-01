import { requireAgencyContext } from "@/lib/tenant";
import { listAgencyVendors } from "@/lib/agency/vendor-directory";
import { VendorDirectoryBoard } from "./vendor-directory-board";

export const dynamic = "force-dynamic";

export default async function VendorDirectoryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const ctx = await requireAgencyContext();
  const { q } = await searchParams;
  const vendors = await listAgencyVendors(ctx.agencyId, q ? { search: q } : undefined);

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-3xl space-y-6">
      <h1 className="text-xl font-bold">База подрядчиков</h1>
      <p className="text-sm text-muted-foreground">
        Справочник проверенных подрядчиков. При добавлении подрядчика на свадьбу
        можно выбрать отсюда — данные подставятся сами.
      </p>
      <VendorDirectoryBoard
        vendors={vendors.map((v) => ({
          id: v.id,
          name: v.name,
          service: v.service,
          contact: v.contact,
          link: v.link,
          priceNote: v.priceNote,
        }))}
      />
    </div>
  );
}
