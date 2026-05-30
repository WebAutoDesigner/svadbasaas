import { db } from "@/lib/db";
import { requireSuperAdmin } from "@/lib/super-admin/session";
import { AgencyRow } from "./agency-row";
import { CreateAgencyDialog } from "./create-agency-dialog";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Агентства · Супер-админ · Svadba Plus",
};

export default async function AgenciesPage() {
  await requireSuperAdmin();

  const agencies = await db.agency.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { members: true } },
    },
  });

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-4xl space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Агентства</h1>
        <CreateAgencyDialog />
      </div>

      {agencies.length === 0 ? (
        <p className="text-muted-foreground">
          Пока нет агентств. Создай первое.
        </p>
      ) : (
        <div className="border rounded-md divide-y">
          {agencies.map((agency) => (
            <AgencyRow
              key={agency.id}
              id={agency.id}
              name={agency.name}
              isActive={agency.isActive}
              membersCount={agency._count.members}
              createdAt={agency.createdAt.toISOString()}
            />
          ))}
        </div>
      )}
    </div>
  );
}
