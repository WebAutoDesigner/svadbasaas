import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { db } from "@/lib/db";
import { logAction } from "@/lib/audit";
import { createAgencySchema } from "@/lib/validators/auth";
import { addMemberSchema } from "@/lib/validators/team";
import { createAgencyWithOwner } from "@/lib/agency/create";
import { addMember, listMembers, removeMember } from "@/lib/agency/team";

const PREFIX = "regfix-test-";

async function cleanup() {
  await db.auditLog.deleteMany({
    where: { targetType: { startsWith: PREFIX } },
  });
  await db.agencyMember.deleteMany({
    where: { user: { email: { startsWith: PREFIX } } },
  });
  await db.account.deleteMany({
    where: { user: { email: { startsWith: PREFIX } } },
  });
  await db.user.deleteMany({ where: { email: { startsWith: PREFIX } } });
  await db.agency.deleteMany({ where: { name: { startsWith: PREFIX } } });
}

describe("regression: AuditLog.userId is not an enforced FK to User", () => {
  beforeEach(cleanup);
  afterAll(cleanup);

  // Баг: super-admin (сущность SuperAdmin) писал userId, которого нет в User →
  // FK violation → logAction молча терял запись. После снятия FK должно писаться.
  it("logs an action whose actor id does not exist in the User table", async () => {
    const fakeSuperAdminId = randomUUID();
    const targetId = randomUUID();

    await logAction({
      action: "super_admin.login",
      userId: fakeSuperAdminId,
      targetType: `${PREFIX}actor`,
      targetId,
    });

    const row = await db.auditLog.findFirst({
      where: { targetType: `${PREFIX}actor`, targetId },
    });
    expect(row).not.toBeNull();
    expect(row?.userId).toBe(fakeSuperAdminId);
    expect(row?.action).toBe("super_admin.login");
  });
});

describe("regression: email is normalized to lowercase in validators", () => {
  // Баг: сторона агентства хранила email как есть, Better-Auth-логин (lowercase)
  // не находил юзера при заглавных буквах. emailSchema теперь trim+lowercase.
  it("createAgencySchema lowercases ownerEmail", () => {
    const parsed = createAgencySchema.parse({
      agencyName: "Тест",
      ownerEmail: "  Owner@TestAgency.RU ",
      ownerName: "Анна",
      ownerPassword: "password-123-456",
    });
    expect(parsed.ownerEmail).toBe("owner@testagency.ru");
  });

  it("addMemberSchema lowercases email", () => {
    const parsed = addMemberSchema.parse({
      email: "Coord@Example.COM",
      name: "Координатор",
      password: "password-123-456",
      role: "COORDINATOR",
    });
    expect(parsed.email).toBe("coord@example.com");
  });
});

describe("regression: removing the only membership frees the email for re-add", () => {
  beforeEach(cleanup);
  afterAll(cleanup);

  // Баг: removeMember удалял только membership, осиротевший User.email @unique
  // навсегда давал EMAIL_TAKEN при повторном добавлении того же человека.
  it("re-adding a removed member with the same email succeeds", async () => {
    const agency = await createAgencyWithOwner({
      agencyName: `${PREFIX}readd`,
      ownerEmail: `${PREFIX}owner@example.com`,
      ownerName: "Owner",
      ownerPassword: "password-123-456",
    });
    if (!agency.ok) throw new Error("agency setup failed");
    const agencyId = agency.data.agencyId;
    const coordEmail = `${PREFIX}coord@example.com`;

    const first = await addMember(agencyId, {
      email: coordEmail,
      name: "Координатор",
      password: "password-123-456",
      role: "COORDINATOR",
    });
    expect(first.ok).toBe(true);
    if (!first.ok) return;

    const remove = await removeMember(agencyId, first.data.memberId);
    expect(remove.ok).toBe(true);

    // Осиротевший user должен быть удалён (нет других membership)
    const orphan = await db.user.findUnique({ where: { email: coordEmail } });
    expect(orphan).toBeNull();

    // Повторное добавление того же email теперь проходит
    const second = await addMember(agencyId, {
      email: coordEmail,
      name: "Координатор снова",
      password: "password-123-456",
      role: "COORDINATOR",
    });
    expect(second.ok).toBe(true);
    expect(await listMembers(agencyId)).toHaveLength(2); // owner + новый coord
  });
});
