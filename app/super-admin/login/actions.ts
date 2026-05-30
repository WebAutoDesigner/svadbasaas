"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { loginSchema } from "@/lib/validators/auth";
import { loginSuperAdmin } from "@/lib/super-admin/auth";
import { setSuperAdminCookie } from "@/lib/super-admin/session";
import { logAction } from "@/lib/audit";
import { AUTH_RATE_LIMIT, rateLimit } from "@/lib/rate-limit";

export type LoginFormState = {
  error?: string;
  fieldErrors?: Partial<Record<"email" | "password", string>>;
};

export async function loginSuperAdminAction(
  _prev: LoginFormState | undefined,
  formData: FormData,
): Promise<LoginFormState> {
  const hdrs = await headers();
  const ip =
    hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    hdrs.get("x-real-ip") ??
    "unknown";

  const rl = rateLimit(`super-admin:login:${ip}`, AUTH_RATE_LIMIT);
  if (!rl.allowed) {
    const minutes = Math.ceil(rl.resetIn / 60000);
    return {
      error: `Слишком много попыток. Подождите ${minutes} мин.`,
    };
  }

  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    const fieldErrors: LoginFormState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (key === "email" || key === "password") {
        fieldErrors[key] = issue.message;
      }
    }
    return { fieldErrors };
  }

  const result = await loginSuperAdmin(parsed.data.email, parsed.data.password);
  if (!result.ok) {
    return { error: "Неверный email или пароль" };
  }

  await setSuperAdminCookie(result.data.sessionId, result.data.expiresAt);
  await logAction({
    action: "super_admin.login",
    userId: result.data.admin.id,
  });

  redirect("/super-admin/agencies");
}
