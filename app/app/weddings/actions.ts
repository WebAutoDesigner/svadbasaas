"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAgencyContext } from "@/lib/tenant";
import {
  createWedding,
  updateWedding,
  softDeleteWedding,
} from "@/lib/wedding/wedding";
import {
  createWeddingSchema,
  updateWeddingSchema,
} from "@/lib/validators/wedding";
import { logAction } from "@/lib/audit";

export type WeddingFormState = {
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
};

function collectFieldErrors(
  issues: { path: PropertyKey[]; message: string }[],
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !(key in out)) out[key] = issue.message;
  }
  return out;
}

function formToInput(formData: FormData) {
  return {
    brideName: formData.get("brideName"),
    groomName: formData.get("groomName"),
    date: formData.get("date"),
    timezone: formData.get("timezone") || "Europe/Moscow",
    budget: formData.get("budget") || 0,
    location: formData.get("location") || "",
    guestCount: formData.get("guestCount") || "",
    coordinatorId: formData.get("coordinatorId") || "",
  };
}

function normalize(data: {
  brideName: string;
  groomName: string;
  date: string;
  timezone: string;
  budget: number;
  location?: string;
  guestCount?: number | "";
  coordinatorId?: string;
}) {
  return {
    brideName: data.brideName,
    groomName: data.groomName,
    date: data.date,
    timezone: data.timezone,
    budget: data.budget,
    location: data.location || undefined,
    guestCount: data.guestCount === "" ? undefined : data.guestCount,
    coordinatorId: data.coordinatorId || undefined,
  };
}

export async function createWeddingAction(
  _prev: WeddingFormState | undefined,
  formData: FormData,
): Promise<WeddingFormState> {
  const ctx = await requireAgencyContext();

  const parsed = createWeddingSchema.safeParse(formToInput(formData));
  if (!parsed.success) {
    return { fieldErrors: collectFieldErrors(parsed.error.issues) };
  }

  const result = await createWedding(ctx.agencyId, normalize(parsed.data));
  if (!result.ok) {
    return { error: "Выбранный координатор не из вашего агентства" };
  }

  await logAction({
    action: "wedding.create",
    agencyId: ctx.agencyId,
    userId: ctx.userId,
    targetType: "wedding",
    targetId: result.data.id,
    payload: { brideName: parsed.data.brideName, groomName: parsed.data.groomName },
  });

  redirect(`/app/weddings/${result.data.id}`);
}

export async function updateWeddingAction(
  weddingId: string,
  _prev: WeddingFormState | undefined,
  formData: FormData,
): Promise<WeddingFormState> {
  const ctx = await requireAgencyContext();

  const parsed = updateWeddingSchema.safeParse({
    ...formToInput(formData),
    status: formData.get("status") || "PLANNING",
  });
  if (!parsed.success) {
    return { fieldErrors: collectFieldErrors(parsed.error.issues) };
  }

  const result = await updateWedding(ctx.agencyId, weddingId, {
    ...normalize(parsed.data),
    status: parsed.data.status,
  });
  if (!result.ok) {
    if (result.error === "NOT_FOUND") return { error: "Свадьба не найдена" };
    return { error: "Выбранный координатор не из вашего агентства" };
  }

  await logAction({
    action: "wedding.update",
    agencyId: ctx.agencyId,
    userId: ctx.userId,
    targetType: "wedding",
    targetId: weddingId,
  });

  revalidatePath(`/app/weddings/${weddingId}`);
  revalidatePath("/app/weddings");
  return { ok: true };
}

export async function deleteWeddingAction(
  weddingId: string,
): Promise<{ error?: string }> {
  const ctx = await requireAgencyContext();
  const result = await softDeleteWedding(ctx.agencyId, weddingId);
  if (!result.ok) return { error: "Свадьба не найдена" };

  await logAction({
    action: "wedding.delete",
    agencyId: ctx.agencyId,
    userId: ctx.userId,
    targetType: "wedding",
    targetId: weddingId,
  });

  revalidatePath("/app/weddings");
  redirect("/app/weddings");
}
