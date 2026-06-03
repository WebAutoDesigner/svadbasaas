import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { err, ok, type Result } from "@/lib/result";
import { getTemplate as getChecklistSeed } from "@/lib/templates/checklist";
import { DEFAULT_BUDGET_CATEGORIES } from "@/lib/templates/budget";

const BCRYPT_COST = 12;

export type CreateAgencyInput = {
  agencyName: string;
  ownerEmail: string;
  ownerName: string;
  ownerPassword: string;
};

export type CreateAgencyOutput = {
  agencyId: string;
  userId: string;
};

export async function createAgencyWithOwner(
  input: CreateAgencyInput,
): Promise<Result<CreateAgencyOutput, "EMAIL_TAKEN">> {
  const existing = await db.user.findUnique({
    where: { email: input.ownerEmail },
  });
  if (existing) return err("EMAIL_TAKEN");

  const passwordHash = await bcrypt.hash(input.ownerPassword, BCRYPT_COST);
  const userId = randomUUID();
  const accountId = randomUUID();

  const agency = await db.$transaction(async (tx) => {
    const agency = await tx.agency.create({
      data: { name: input.agencyName, isActive: true },
    });
    await tx.user.create({
      data: {
        id: userId,
        email: input.ownerEmail,
        name: input.ownerName,
        emailVerified: true, // верифицирован вручную при создании супер-админом
      },
    });
    await tx.account.create({
      data: {
        id: accountId,
        accountId: input.ownerEmail,
        providerId: "credential",
        userId,
        password: passwordHash,
      },
    });
    await tx.agencyMember.create({
      data: { agencyId: agency.id, userId, role: "OWNER" },
    });

    // Стартовые редактируемые шаблоны (наши зашитые дефолты как Template-записи).
    const classic = getChecklistSeed("classic");
    await tx.template.create({
      data: {
        agencyId: agency.id,
        type: "CHECKLIST",
        name: "Классическая свадьба",
        content: {
          items: (classic?.items ?? []).map((i) => ({
            period: i.period,
            title: i.title,
          })),
        },
      },
    });
    await tx.template.create({
      data: {
        agencyId: agency.id,
        type: "BUDGET",
        name: "Стандартный бюджет",
        content: { items: DEFAULT_BUDGET_CATEGORIES.map((name) => ({ name })) },
      },
    });
    return agency;
  });

  return ok({ agencyId: agency.id, userId });
}

export async function setAgencyActive(
  agencyId: string,
  isActive: boolean,
): Promise<void> {
  await db.agency.update({
    where: { id: agencyId },
    data: { isActive },
  });
}
