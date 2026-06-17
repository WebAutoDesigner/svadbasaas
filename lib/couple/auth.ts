import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
import { db } from "@/lib/db";
import { err, ok, type Result } from "@/lib/result";

const BCRYPT_COST = 12; // политика AGENTS.md (≥12)
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 дней
const MAX_TRIES = 5;
const LOCK_MS = 30 * 60 * 1000; // 30 минут

/**
 * Агентство приглашает пару: задаёт телефон + пароль доступа к свадьбе.
 * Повторный вызов перезаписывает (сброс пароля парой через агентство).
 */
export async function upsertCoupleAccess(
  weddingId: string,
  phone: string,
  password: string,
  name: string | null,
): Promise<void> {
  const passwordHash = await bcrypt.hash(password, BCRYPT_COST);
  await db.coupleAccess.upsert({
    where: { weddingId },
    create: { weddingId, phone, passwordHash, name },
    update: {
      phone,
      passwordHash,
      name,
      failedTries: 0,
      lockedUntil: null,
    },
  });
}

export async function getCoupleAccessForWedding(weddingId: string) {
  return db.coupleAccess.findUnique({ where: { weddingId } });
}

export type VerifyError = "INVALID" | "LOCKED";

/** Вход пары по телефону+паролю. При успехе создаёт сессию. */
export async function verifyCouplePassword(
  phone: string,
  password: string,
): Promise<
  Result<{ sessionId: string; expiresAt: Date; weddingId: string }, VerifyError>
> {
  const access = await db.coupleAccess.findUnique({ where: { phone } });
  // Не раскрываем, существует ли доступ: общий ответ INVALID.
  if (!access || !access.passwordHash) return err("INVALID");
  if (access.lockedUntil && access.lockedUntil > new Date()) {
    return err("LOCKED");
  }

  const valid = await bcrypt.compare(password, access.passwordHash);
  if (!valid) {
    const tries = access.failedTries + 1;
    await db.coupleAccess.update({
      where: { id: access.id },
      data: {
        failedTries: tries,
        lockedUntil:
          tries >= MAX_TRIES ? new Date(Date.now() + LOCK_MS) : null,
      },
    });
    return err("INVALID");
  }

  const sessionId = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await db.$transaction([
    db.coupleAccess.update({
      where: { id: access.id },
      data: { failedTries: 0, lockedUntil: null, lastLoginAt: new Date() },
    }),
    db.coupleSession.create({
      data: { id: sessionId, coupleAccessId: access.id, expiresAt },
    }),
  ]);

  return ok({ sessionId, expiresAt, weddingId: access.weddingId });
}

export type CoupleSessionInfo = { weddingId: string; phone: string };

export async function getCoupleSession(
  sessionId: string | undefined,
): Promise<CoupleSessionInfo | null> {
  if (!sessionId) return null;
  const session = await db.coupleSession.findUnique({
    where: { id: sessionId },
    include: { coupleAccess: true },
  });
  if (!session) return null;
  if (session.expiresAt < new Date()) {
    await db.coupleSession.delete({ where: { id: sessionId } });
    return null;
  }
  return {
    weddingId: session.coupleAccess.weddingId,
    phone: session.coupleAccess.phone ?? "",
  };
}

export async function destroyCoupleSession(sessionId: string): Promise<void> {
  await db.coupleSession.deleteMany({ where: { id: sessionId } });
}
