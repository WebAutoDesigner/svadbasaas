/**
 * Удаляет файлы документов свадеб, помеченных как удалённые (soft-delete)
 * более 30 дней назад. Запускать по cron раз в неделю.
 *   tsx scripts/cleanup-orphan-files.ts
 */
import "dotenv/config";
import { db } from "../lib/db";
import { deleteObject } from "../lib/storage";

const RETENTION_DAYS = 30;

async function main(): Promise<void> {
  const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000);

  const docs = await db.document.findMany({
    where: {
      wedding: { deletedAt: { lt: cutoff } },
    },
    select: { id: true, storageKey: true },
  });

  console.log(`[cleanup] найдено ${docs.length} файлов для удаления`);

  let removed = 0;
  for (const doc of docs) {
    try {
      await deleteObject(doc.storageKey);
      await db.document.delete({ where: { id: doc.id } });
      removed++;
    } catch (e) {
      console.error(`[cleanup] ошибка по ${doc.id}:`, e);
    }
  }

  console.log(`[cleanup] удалено ${removed} файлов`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
