"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { verifyCouplePassword } from "@/lib/couple/auth";
import { setCoupleCookie } from "@/lib/couple/session";
import { normalizePhone } from "@/lib/phone";
import { rateLimit, AUTH_RATE_LIMIT } from "@/lib/rate-limit";

export type LoginState = { error?: string };

export async function loginCoupleAction(
  _prev: LoginState | undefined,
  formData: FormData,
): Promise<LoginState> {
  const hdrs = await headers();
  const ip =
    hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    hdrs.get("x-real-ip") ??
    "unknown";
  const rl = rateLimit(`couple:login:${ip}`, AUTH_RATE_LIMIT);
  if (!rl.allowed) {
    return {
      error: `Слишком много попыток. Подождите ${Math.ceil(rl.resetIn / 60000)} мин.`,
    };
  }

  const phone = normalizePhone(String(formData.get("phone") ?? ""));
  const password = String(formData.get("password") ?? "");
  if (!phone || password.length < 1) {
    return { error: "Введите телефон и пароль" };
  }

  const res = await verifyCouplePassword(phone, password);
  if (!res.ok) {
    if (res.error === "LOCKED") {
      return { error: "Слишком много попыток. Попробуйте через 30 минут." };
    }
    return { error: "Неверный телефон или пароль" };
  }

  await setCoupleCookie(res.data.sessionId, res.data.expiresAt);
  redirect(`/couple/${res.data.weddingId}`);
}
