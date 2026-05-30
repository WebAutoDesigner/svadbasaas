import { requireAgencyContext } from "@/lib/tenant";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Дашборд · Svadba Plus",
};

export default async function AppDashboardPage() {
  const ctx = await requireAgencyContext();

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-4xl space-y-4">
      <h1 className="text-2xl font-bold">Добро пожаловать, {ctx.agencyName}</h1>
      <p className="text-muted-foreground">
        Это пустой дашборд. Свадьбы, чек-листы, подрядчики и документы появятся
        в следующих фазах.
      </p>
      <div className="text-sm text-muted-foreground">
        Ваша роль:{" "}
        <span className="font-medium text-foreground">{ctx.role}</span>
      </div>
    </div>
  );
}
