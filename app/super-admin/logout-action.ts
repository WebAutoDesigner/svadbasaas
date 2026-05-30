"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  clearSuperAdminCookie,
  getSuperAdminCookieName,
} from "@/lib/super-admin/session";
import { logoutSuperAdmin } from "@/lib/super-admin/auth";
import { logAction } from "@/lib/audit";

export async function logoutSuperAdminAction(): Promise<void> {
  const store = await cookies();
  const sessionId = store.get(getSuperAdminCookieName())?.value;
  if (sessionId) {
    await logoutSuperAdmin(sessionId);
    await logAction({ action: "super_admin.logout" });
  }
  await clearSuperAdminCookie();
  redirect("/super-admin/login");
}
