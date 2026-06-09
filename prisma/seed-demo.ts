/**
 * Dev-сид: демо-агентство с владельцем и несколькими свадьбами —
 * чтобы прокликивать/снимать интерфейс агентства локально.
 *   npx tsx prisma/seed-demo.ts
 * Вход: demo@svadba.local / demo12345
 */
import "dotenv/config";
import { db } from "../lib/db";
import { createAgencyWithOwner } from "../lib/agency/create";

const OWNER_EMAIL = "demo@svadba.local";
const OWNER_PASSWORD = "demo12345";

async function main(): Promise<void> {
  let agencyId: string;

  const res = await createAgencyWithOwner({
    agencyName: "Свадебное агентство «Вечность»",
    ownerEmail: OWNER_EMAIL,
    ownerName: "Никита",
    ownerPassword: OWNER_PASSWORD,
  });

  if (res.ok) {
    agencyId = res.data.agencyId;
  } else {
    const user = await db.user.findUnique({ where: { email: OWNER_EMAIL } });
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
    for (const [brideName, groomName, days, location] of seed) {
      await db.wedding.create({
        data: {
          agencyId,
          brideName,
          groomName,
          date: new Date(now + days * day),
          location,
          status: "PLANNING",
        },
      });
    }
  }

  console.log("DEMO READY");
  console.log(`  agencyId: ${agencyId}`);
  console.log(`  email:    ${OWNER_EMAIL}`);
  console.log(`  password: ${OWNER_PASSWORD}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
