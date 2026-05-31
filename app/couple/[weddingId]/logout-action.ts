"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  clearCoupleCookie,
  getCoupleCookieName,
} from "@/lib/couple/session";
import { destroyCoupleSession } from "@/lib/couple/auth";

export async function coupleLogoutAction(): Promise<void> {
  const store = await cookies();
  const sid = store.get(getCoupleCookieName())?.value;
  if (sid) await destroyCoupleSession(sid);
  await clearCoupleCookie();
  redirect("/couple/login");
}
