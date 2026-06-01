"use server";

import { revalidatePath } from "next/cache";
import { requireAgencyContext } from "@/lib/tenant";
import {
  addGuest,
  deleteGuest,
  setGuestStatus,
  updateGuest,
  type GuestData,
} from "@/lib/wedding/guest";
import {
  guestQuickSchema,
  guestSchema,
  guestStatusSchema,
} from "@/lib/validators/guest";

function revalidate(weddingId: string) {
  revalidatePath(`/app/weddings/${weddingId}/guests`);
  revalidatePath(`/app/weddings/${weddingId}`);
}

function normalize(input: unknown): GuestData | null {
  const parsed = guestSchema.safeParse(input);
  if (!parsed.success) return null;
  return {
    name: parsed.data.name,
    status: parsed.data.status,
    side: parsed.data.side ? parsed.data.side : undefined,
    groupLabel: parsed.data.groupLabel || undefined,
  };
}

export async function addGuestAction(
  weddingId: string,
  input: unknown,
): Promise<{ error?: string }> {
  const ctx = await requireAgencyContext();
  const data = normalize(input);
  if (!data) return { error: "Проверьте поля формы" };
  const res = await addGuest(ctx.agencyId, weddingId, data);
  if (!res.ok) return { error: "Свадьба не найдена" };
  revalidate(weddingId);
  return {};
}

export async function quickAddGuestAction(
  weddingId: string,
  input: unknown,
): Promise<{ error?: string }> {
  const ctx = await requireAgencyContext();
  const parsed = guestQuickSchema.safeParse(input);
  if (!parsed.success) return { error: "Введите имя" };
  const res = await addGuest(ctx.agencyId, weddingId, {
    name: parsed.data.name,
    status: "NO_ANSWER",
  });
  if (!res.ok) return { error: "Свадьба не найдена" };
  revalidate(weddingId);
  return {};
}

export async function updateGuestAction(
  weddingId: string,
  guestId: string,
  input: unknown,
): Promise<{ error?: string }> {
  const ctx = await requireAgencyContext();
  const data = normalize(input);
  if (!data) return { error: "Проверьте поля формы" };
  const res = await updateGuest(ctx.agencyId, weddingId, guestId, data);
  if (!res.ok) return { error: "Не найдено" };
  revalidate(weddingId);
  return {};
}

export async function setGuestStatusAction(
  weddingId: string,
  guestId: string,
  input: unknown,
): Promise<{ error?: string }> {
  const ctx = await requireAgencyContext();
  const parsed = guestStatusSchema.safeParse(input);
  if (!parsed.success) return { error: "Неверный статус" };
  const res = await setGuestStatus(
    ctx.agencyId,
    weddingId,
    guestId,
    parsed.data.status,
  );
  if (!res.ok) return { error: "Не найдено" };
  revalidate(weddingId);
  return {};
}

export async function deleteGuestAction(
  weddingId: string,
  guestId: string,
): Promise<{ error?: string }> {
  const ctx = await requireAgencyContext();
  const res = await deleteGuest(ctx.agencyId, weddingId, guestId);
  if (!res.ok) return { error: "Не найдено" };
  revalidate(weddingId);
  return {};
}
