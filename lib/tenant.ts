import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db, runWithDb, type DbClient } from "@/lib/db";
import type { Role } from "@prisma/client";

export type AgencyContext = {
  userId: string;
  agencyId: string;
  agencyName: string;
  role: Role;
  db: DbClient;
};

/**
 * Получает текущее агентство пользователя из сессии Better-Auth + activeAgencyId.
 * Если у пользователя только одно membership — берёт его. Если несколько и нет
 * activeAgencyId в сессии — редиректит на /app/select-agency.
 * Без валидной сессии — редиректит на /login.
 */
export async function requireAgencyContext(): Promise<AgencyContext> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const { user } = session;
  const memberships = await db.agencyMember.findMany({
    where: { userId: user.id },
    include: { agency: true },
  });

  if (memberships.length === 0) {
    // user без агентств — выкидываем
    redirect("/login?error=no-membership");
  }

  // Берём первое membership (MVP — один user обычно в одном агентстве).
  // Когда добавим многократное membership — расширим логику через activeAgencyId.
  const first = memberships[0]!;
  if (!first.agency.isActive) {
    redirect("/login?error=agency-disabled");
  }

  return {
    userId: user.id,
    agencyId: first.agencyId,
    agencyName: first.agency.name,
    role: first.role,
    db,
  };
}

/**
 * Helper: выполняет fn в контексте агентства внутри транзакции, где в сессии
 * Postgres выставлен app.agency_id. На этой транзакции срабатывает RLS —
 * страховка: даже если запрос в слое данных забыл WHERE agencyId, БД вернёт
 * только строки этого агентства. Слой данных ходит через getDb(), который внутри
 * этой транзакции отдаёт tx-клиент (см. lib/db.ts).
 */
export async function withAgency<T>(
  fn: (ctx: AgencyContext) => Promise<T>
): Promise<T> {
  const ctx = await requireAgencyContext();
  return db.$transaction(async (tx) => {
    // set_config(..., true) = LOCAL: действует только до конца транзакции.
    await tx.$executeRaw`SELECT set_config('app.agency_id', ${ctx.agencyId}, true)`;
    return runWithDb(tx, () => fn({ ...ctx, db: tx }));
  });
}
