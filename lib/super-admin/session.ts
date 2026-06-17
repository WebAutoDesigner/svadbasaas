import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getSuperAdminBySession, type SuperAdminPublic } from "./auth";

const COOKIE_NAME = "svadba_super";

export async function setSuperAdminCookie(
  sessionId: string,
  expiresAt: Date
): Promise<void> {
  const store = await cookies();
  store.set(COOKIE_NAME, sessionId, {
    httpOnly: true,
    // Secure только при реальном HTTPS (по протоколу BETTER_AUTH_URL).
    // На голом HTTP-IP Secure-куку браузер шлёт нестабильно → ломался вход.
    secure: (process.env["BETTER_AUTH_URL"] ?? "").startsWith("https"),
    sameSite: "lax",
    expires: expiresAt,
    path: "/",
  });
}

export async function clearSuperAdminCookie(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export async function getSuperAdminFromCookie(): Promise<SuperAdminPublic | null> {
  const store = await cookies();
  const sessionId = store.get(COOKIE_NAME)?.value;
  return getSuperAdminBySession(sessionId);
}

export async function requireSuperAdmin(): Promise<SuperAdminPublic> {
  const admin = await getSuperAdminFromCookie();
  if (!admin) {
    redirect("/super-admin/login");
  }
  return admin;
}

export function getSuperAdminCookieName(): string {
  return COOKIE_NAME;
}
