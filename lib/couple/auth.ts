import bcrypt from "bcryptjs";
import { randomInt, randomBytes } from "node:crypto";
import { db } from "@/lib/db";
import { err, ok, type Result } from "@/lib/result";

const BCRYPT_COST = 10;
const CODE_TTL_MS = 15 * 60 * 1000; // 15 минут
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 дней
const MAX_TRIES = 5;
const LOCK_MS = 30 * 60 * 1000; // 30 минут

/** Агентство приглашает пару: создаёт/обновляет доступ к свадьбе */
export async function upsertCoupleAccess(
  weddingId: string,
  email: string,
  name: string | null,
): Promise<void> {
  await db.coupleAccess.upsert({
    where: { weddingId },
    create: { weddingId, email: email.toLowerCase(), name },
    update: { email: email.toLowerCase(), name },
  });
}

export async function getCoupleAccessForWedding(weddingId: string) {
  return db.coupleAccess.findUnique({ where: { weddingId } });
}

/**
 * Запрос кода входа. Находит доступ по email, генерит 6-значный код,
 * хэширует, ставит TTL. Возвращает code только в dev (для показа), иначе null.
 */
export async function requestLoginCode(
  email: string,
): Promise<Result<{ code: string }, "NO_ACCESS">> {
  const access = await db.coupleAccess.findFirst({
    where: { email: email.toLowerCase() },
    orderBy: { createdAt: "desc" },
  });
  if (!access) return err("NO_ACCESS");

  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  const codeHash = await bcrypt.hash(code, BCRYPT_COST);

  await db.coupleAccess.update({
    where: { id: access.id },
    data: {
      codeHash,
      codeExpiresAt: new Date(Date.now() + CODE_TTL_MS),
      failedTries: 0,
      lockedUntil: null,
    },
  });

  return ok({ code });
}

export type VerifyError = "NO_ACCESS" | "LOCKED" | "EXPIRED" | "WRONG_CODE";

/** Проверяет код, при успехе создаёт сессию и возвращает её id + weddingId */
export async function verifyLoginCode(
  email: string,
  code: string,
): Promise<
  Result<{ sessionId: string; expiresAt: Date; weddingId: string }, VerifyError>
> {
  const access = await db.coupleAccess.findFirst({
    where: { email: email.toLowerCase() },
    orderBy: { createdAt: "desc" },
  });
  if (!access || !access.codeHash || !access.codeExpiresAt) {
    return err("NO_ACCESS");
  }
  if (access.lockedUntil && access.lockedUntil > new Date()) {
    return err("LOCKED");
  }
  if (access.codeExpiresAt < new Date()) {
    return err("EXPIRED");
  }

  const valid = await bcrypt.compare(code, access.codeHash);
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
    return err("WRONG_CODE");
  }

  // Успех: гасим код, создаём сессию
  const sessionId = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await db.$transaction([
    db.coupleAccess.update({
      where: { id: access.id },
      data: {
        codeHash: null,
        codeExpiresAt: null,
        failedTries: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
      },
    }),
    db.coupleSession.create({
      data: { id: sessionId, coupleAccessId: access.id, expiresAt },
    }),
  ]);

  return ok({ sessionId, expiresAt, weddingId: access.weddingId });
}

export type CoupleSessionInfo = { weddingId: string; email: string };

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
    email: session.coupleAccess.email,
  };
}

export async function destroyCoupleSession(sessionId: string): Promise<void> {
  await db.coupleSession.deleteMany({ where: { id: sessionId } });
}
