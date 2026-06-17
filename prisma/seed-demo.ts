/**
 * Dev-сид: демо-агентство с владельцем и несколькими свадьбами + доступ пары.
 * Вход теперь по телефону+паролю (без email/смс).
 *   npx tsx prisma/seed-demo.ts
 * Агентство:  +7 999 000-00-01 / demo12345
 * Пара:       +7 999 000-00-02 / para12345  (свадьба Анна & Дмитрий)
 */
import "dotenv/config";
import { db } from "../lib/db";
import { createAgencyWithOwner } from "../lib/agency/create";
import { upsertCoupleAccess } from "../lib/couple/auth";

const OWNER_PHONE = "79990000001";
const OWNER_PASSWORD = "demo12345";
const COUPLE_PHONE = "79990000002";
const COUPLE_PASSWORD = "para12345";

async function main(): Promise<void> {
  let agencyId: string;

  const res = await createAgencyWithOwner({
    agencyName: "Свадебное агентство «Вечность»",
    ownerPhone: OWNER_PHONE,
    ownerName: "Никита",
    ownerPassword: OWNER_PASSWORD,
  });

  if (res.ok) {
    agencyId = res.data.agencyId;
  } else {
    const user = await db.user.findUnique({ where: { phone: OWNER_PHONE } });
    if (!user) throw new Error("Owner exists but user not found");
    const member = await db.agencyMember.findFirst({
      where: { userId: user.id },
    });
    if (!member) throw new Error("Owner has no agency membership");
    agencyId = member.agencyId;
  }

  const existing = await db.wedding.count({
    where: { agencyId, deletedAt: null },
  });
  if (existing === 0) {
    const now = Date.now();
    const day = 86_400_000;
    const seed: [string, string, number, string][] = [
      ["Анна", "Дмитрий", 5, "Усадьба «Кусково»"],
      ["Мария", "Иван", 18, "Лофт «Депо»"],
      ["Екатерина", "Павел", 32, "Загородный клуб «Сосны»"],
      ["Ольга", "Сергей", 54, "Ресторан «Прага»"],
    ];
    let firstWeddingId: string | null = null;
    for (const [brideName, groomName, days, location] of seed) {
      const w = await db.wedding.create({
        data: {
          agencyId,
          brideName,
          groomName,
          date: new Date(now + days * day),
          location,
          status: "PLANNING",
        },
      });
      if (!firstWeddingId) firstWeddingId = w.id;
    }
    if (firstWeddingId) {
      await upsertCoupleAccess(
        firstWeddingId,
        COUPLE_PHONE,
        COUPLE_PASSWORD,
        "Анна и Дмитрий",
      );
    }
  }

  console.log("DEMO READY");
  console.log(`  agencyId:    ${agencyId}`);
  console.log(`  агентство:   ${OWNER_PHONE} / ${OWNER_PASSWORD}`);
  console.log(`  пара:        ${COUPLE_PHONE} / ${COUPLE_PASSWORD}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
