import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { AsyncLocalStorage } from "node:async_hooks";

// Рантайм приложения ходит под ОГРАНИЧЕННОЙ ролью (APP_DATABASE_URL): не
// superuser и без BYPASSRLS, иначе Postgres игнорирует RLS. Миграции/seed
// используют владельца (DATABASE_URL). Если APP_DATABASE_URL не задан —
// падаем обратно на DATABASE_URL (RLS тогда не enforced, но приложение работает).
const connectionString =
  process.env["APP_DATABASE_URL"] ?? process.env["DATABASE_URL"];
if (!connectionString) {
  throw new Error("APP_DATABASE_URL / DATABASE_URL is not set");
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });

if (process.env["NODE_ENV"] !== "production") {
  globalForPrisma.prisma = db;
}

/**
 * Транзакционный клиент Prisma (внутри $transaction). Совпадает по API с db
 * для целей tenant-запросов.
 */
export type DbClient = typeof db | Parameters<Parameters<typeof db.$transaction>[0]>[0];

/**
 * Request-scoped хранилище клиента БД. Внутри withAgency() здесь лежит
 * транзакционный клиент, у которого в сессии выставлен app.agency_id —
 * на нём срабатывает Postgres RLS. Вне withAgency() — глобальный db.
 */
const dbScope = new AsyncLocalStorage<DbClient>();

export function runWithDb<T>(client: DbClient, fn: () => Promise<T>): Promise<T> {
  return dbScope.run(client, fn);
}

/**
 * Возвращает клиент БД для tenant-запросов: транзакционный (с выставленным
 * app.agency_id → RLS активен), если мы внутри withAgency(); иначе глобальный db.
 * Слой данных должен ходить через getDb(), а не импортировать db напрямую.
 */
export function getDb(): DbClient {
  return dbScope.getStore() ?? db;
}

/**
 * Выполняет fn в транзакции с выставленным app.agency_id → внутри неё getDb()
 * отдаёт tx-клиент, на котором срабатывает RLS. Используется слоем данных,
 * чтобы каждый tenant-запрос шёл с контекстом агентства (страховка от забытого
 * WHERE). Re-entrant: если мы уже внутри такого скоупа (вложенный вызов или
 * withAgency) — переиспользуем текущую транзакцию, без вложенных tx.
 */
export async function tenantScope<T>(
  agencyId: string,
  fn: () => Promise<T>,
): Promise<T> {
  if (dbScope.getStore()) return fn();
  return db.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT set_config('app.agency_id', ${agencyId}, true)`;
    return dbScope.run(tx, fn);
  });
}
