"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  requestLoginCode,
  verifyLoginCode,
} from "@/lib/couple/auth";
import { setCoupleCookie } from "@/lib/couple/session";
import { sendMail, isEmailDevMode } from "@/lib/email";
import { rateLimit, AUTH_RATE_LIMIT } from "@/lib/rate-limit";

const emailSchema = z.string().email().max(255);

export type RequestState = {
  sent?: boolean;
  devCode?: string; // показывается только в dev (нет SMTP)
  error?: string;
};

export async function requestCodeAction(
  _prev: RequestState | undefined,
  formData: FormData,
): Promise<RequestState> {
  const hdrs = await headers();
  const ip =
    hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    hdrs.get("x-real-ip") ??
    "unknown";
  const rl = rateLimit(`couple:request:${ip}`, AUTH_RATE_LIMIT);
  if (!rl.allowed) {
    return { error: `Слишком много попыток. Подождите ${Math.ceil(rl.resetIn / 60000)} мин.` };
  }

  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success) return { error: "Некорректный email" };

  const res = await requestLoginCode(parsed.data);
  // Не раскрываем существует ли доступ (anti-enumeration): всегда "отправлено"
  if (res.ok) {
    try {
      await sendMail({
        to: parsed.data,
        subject: "Код входа в кабинет — Svadba Plus",
        text: `Ваш код для входа: ${res.data.code}\nКод действителен 15 минут.`,
      });
    } catch (e) {
      // SMTP-сбой не должен ни ронять запрос (500), ни выдавать через разницу
      // ответов, что доступ существует. Логируем и отвечаем как обычно.
      console.error("[couple-login] sendMail failed", e);
    }
    return {
      sent: true,
      ...(isEmailDevMode ? { devCode: res.data.code } : {}),
    };
  }
  return { sent: true };
}

export type VerifyState = { error?: string };

export async function verifyCodeAction(
  email: string,
  _prev: VerifyState | undefined,
  formData: FormData,
): Promise<VerifyState> {
  const emailParsed = emailSchema.safeParse(email);
  const code = String(formData.get("code") ?? "").trim();
  if (!emailParsed.success || !/^\d{6}$/.test(code)) {
    return { error: "Введите 6-значный код" };
  }

  const res = await verifyLoginCode(emailParsed.data, code);
  if (!res.ok) {
    const messages: Record<string, string> = {
      NO_ACCESS: "Код не запрашивался или истёк",
      LOCKED: "Слишком много попыток. Попробуйте через 30 минут.",
      EXPIRED: "Код истёк. Запросите новый.",
      WRONG_CODE: "Неверный код",
    };
    return { error: messages[res.error] ?? "Ошибка" };
  }

  await setCoupleCookie(res.data.sessionId, res.data.expiresAt);
  redirect(`/couple/${res.data.weddingId}`);
}
