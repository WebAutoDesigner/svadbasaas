import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
import { db } from "@/lib/db";
import { err, ok, type Result } from "@/lib/result";

const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 дней
const BCRYPT_COST = 12;

export type SuperAdminPublic = {
  id: string;
  email: string;
  name: string | null;
};

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_COST);
}

export async function verifyPassword(
  plain: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export async function loginSuperAdmin(
  email: string,
  password: string
): Promise<Result<{ sessionId: string; expiresAt: Date; admin: SuperAdminPublic }>> {
  const admin = await db.superAdmin.findUnique({ where: { email } });
  if (!admin) return err("INVALID_CREDENTIALS");

  const valid = await verifyPassword(password, admin.passwordHash);
  if (!valid) return err("INVALID_CREDENTIALS");

  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  const sessionId = randomBytes(32).toString("hex");

  await db.superAdminSession.create({
    data: { id: sessionId, superAdminId: admin.id, expiresAt },
  });

  return ok({
    sessionId,
    expiresAt,
    admin: { id: admin.id, email: admin.email, name: admin.name },
  });
}

export async function getSuperAdminBySession(
  sessionId: string | undefined
): Promise<SuperAdminPublic | null> {
  if (!sessionId) return null;

  const session = await db.superAdminSession.findUnique({
    where: { id: sessionId },
    include: { superAdmin: true },
  });

  if (!session) return null;
  if (session.expiresAt < new Date()) {
    await db.superAdminSession.delete({ where: { id: sessionId } });
    return null;
  }

  return {
    id: session.superAdmin.id,
    email: session.superAdmin.email,
    name: session.superAdmin.name,
  };
}

export async function logoutSuperAdmin(sessionId: string): Promise<void> {
  await db.superAdminSession.deleteMany({ where: { id: sessionId } });
}
