import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { err, ok, type Result } from "@/lib/result";
import type { Role } from "@prisma/client";

const BCRYPT_COST = 12;

export type TeamMember = {
  memberId: string;
  userId: string;
  email: string;
  name: string;
  role: Role;
  createdAt: Date;
};

export async function listMembers(agencyId: string): Promise<TeamMember[]> {
  const members = await db.agencyMember.findMany({
    where: { agencyId },
    include: { user: true },
    orderBy: { createdAt: "asc" },
  });
  return members.map((m) => ({
    memberId: m.id,
    userId: m.userId,
    email: m.user.email,
    name: m.user.name,
    role: m.role,
    createdAt: m.createdAt,
  }));
}

export type AddMemberError = "EMAIL_TAKEN";

export async function addMember(
  agencyId: string,
  input: { email: string; name: string; password: string; role: Role },
): Promise<Result<{ memberId: string }, AddMemberError>> {
  const existing = await db.user.findUnique({ where: { email: input.email } });
  if (existing) return err("EMAIL_TAKEN");

  const passwordHash = await bcrypt.hash(input.password, BCRYPT_COST);
  const userId = randomUUID();
  const accountId = randomUUID();

  const member = await db.$transaction(async (tx) => {
    await tx.user.create({
      data: {
        id: userId,
        email: input.email,
        name: input.name,
        emailVerified: true,
      },
    });
    await tx.account.create({
      data: {
        id: accountId,
        accountId: input.email,
        providerId: "credential",
        userId,
        password: passwordHash,
      },
    });
    return tx.agencyMember.create({
      data: { agencyId, userId, role: input.role },
    });
  });

  return ok({ memberId: member.id });
}

export type ChangeRoleError = "NOT_FOUND" | "LAST_OWNER";

export async function changeMemberRole(
  agencyId: string,
  memberId: string,
  role: Role,
): Promise<Result<true, ChangeRoleError>> {
  const member = await db.agencyMember.findFirst({
    where: { id: memberId, agencyId },
  });
  if (!member) return err("NOT_FOUND");

  // Нельзя снять последнего OWNER
  if (member.role === "OWNER" && role !== "OWNER") {
    const ownerCount = await db.agencyMember.count({
      where: { agencyId, role: "OWNER" },
    });
    if (ownerCount <= 1) return err("LAST_OWNER");
  }

  await db.agencyMember.update({ where: { id: memberId }, data: { role } });
  return ok(true);
}

export type RemoveMemberError = "NOT_FOUND" | "LAST_OWNER";

export async function removeMember(
  agencyId: string,
  memberId: string,
): Promise<Result<{ userId: string }, RemoveMemberError>> {
  const member = await db.agencyMember.findFirst({
    where: { id: memberId, agencyId },
  });
  if (!member) return err("NOT_FOUND");

  if (member.role === "OWNER") {
    const ownerCount = await db.agencyMember.count({
      where: { agencyId, role: "OWNER" },
    });
    if (ownerCount <= 1) return err("LAST_OWNER");
  }

  // Удаляем membership. User+Account остаются (могут быть в других агентствах);
  // для MVP с глобально-уникальным email это просто «осиротевший» user, но он
  // не сможет войти без membership (tenant guard редиректит).
  await db.agencyMember.delete({ where: { id: memberId } });
  return ok({ userId: member.userId });
}
