/**
 * Создаёт супер-админа для локальной разработки.
 *   npm run seed:super-admin -- --email me@x.com --password supersecret123 --name Nikita
 * Если опции не переданы — берутся дефолты для dev.
 */
import "dotenv/config";
import { db } from "../lib/db";
import { hashPassword } from "../lib/super-admin/auth";

function parseArgs(argv: string[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg?.startsWith("--")) {
      const key = arg.slice(2);
      const value = argv[i + 1];
      if (value && !value.startsWith("--")) {
        out[key] = value;
        i++;
      }
    }
  }
  return out;
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv);
  const email = args["email"] ?? "admin@svadba.local";
  const password = args["password"] ?? "ChangeMe_DevOnly_123";
  const name = args["name"] ?? "Super Admin";

  const existing = await db.superAdmin.findUnique({ where: { email } });
  if (existing) {
    console.log(`Super-admin ${email} уже существует (id: ${existing.id})`);
    return;
  }

  const passwordHash = await hashPassword(password);
  const admin = await db.superAdmin.create({
    data: { email, passwordHash, name },
  });

  console.log("Создан супер-админ:");
  console.log(`  id:       ${admin.id}`);
  console.log(`  email:    ${admin.email}`);
  console.log(`  password: ${password}`);
  console.log("⚠️  Поменяй пароль в production через скрипт перед деплоем.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
