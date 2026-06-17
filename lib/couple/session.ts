import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getCoupleSession, type CoupleSessionInfo } from "./auth";

const COOKIE_NAME = "svadba_couple";

export async function setCoupleCookie(
  sessionId: string,
  expiresAt: Date,
): Promise<void> {
  const store = await cookies();
  store.set(COOKIE_NAME, sessionId, {
    httpOnly: true,
    // Secure только при реальном HTTPS (см. super-admin/session.ts).
    secure: (process.env["BETTER_AUTH_URL"] ?? "").startsWith("https"),
    sameSite: "lax",
    expires: expiresAt,
    path: "/",
  });
}

export async function clearCoupleCookie(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export function getCoupleCookieName(): string {
  return COOKIE_NAME;
}

export async function getCoupleFromCookie(): Promise<CoupleSessionInfo | null> {
  const store = await cookies();
  return getCoupleSession(store.get(COOKIE_NAME)?.value);
}

export async function requireCouple(): Promise<CoupleSessionInfo> {
  const info = await getCoupleFromCookie();
  if (!info) redirect("/couple/login");
  return info;
}

/** Гарантирует, что пара авторизована именно для этой свадьбы */
export async function requireCoupleForWedding(
  weddingId: string,
): Promise<CoupleSessionInfo> {
  const info = await requireCouple();
  if (info.weddingId !== weddingId) redirect(`/couple/${info.weddingId}`);
  return info;
}
