import { db } from "@/lib/db";
import { requireSuperAdmin } from "@/lib/super-admin/session";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Аудит · Супер-админ · Svadba Plus",
};

export default async function AuditLogPage() {
  await requireSuperAdmin();

  const logs = await db.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { agency: true },
  });

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-5xl space-y-4">
      <h1 className="text-2xl font-bold">Аудит (последние 100)</h1>
      <div className="border rounded-md divide-y text-sm">
        {logs.length === 0 ? (
          <p className="p-4 text-muted-foreground">Записей нет.</p>
        ) : (
          logs.map((log) => (
            <div
              key={log.id}
              className="p-3 flex flex-col md:flex-row md:items-baseline md:gap-4"
            >
              <div className="text-muted-foreground tabular-nums text-xs md:w-44">
                {log.createdAt.toLocaleString("ru-RU")}
              </div>
              <div className="font-medium md:w-48">{log.action}</div>
              <div className="text-muted-foreground flex-1 truncate">
                {log.agency?.name ?? "—"}
                {log.targetId ? ` · ${log.targetType}:${log.targetId}` : ""}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
