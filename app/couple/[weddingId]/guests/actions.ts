"use server";

import { revalidatePath } from "next/cache";
import { requireCoupleForWedding } from "@/lib/couple/session";
import { coupleAgencyId } from "@/lib/couple/data";
import {
  addGuest,
  deleteGuest,
  setGuestStatus,
  updateGuest,
  type GuestData,
} from "@/lib/wedding/guest";
import { recordCoupleActivity } from "@/lib/wedding/couple-activity";
import {
  guestQuickSchema,
  guestSchema,
  guestStatusSchema,
  GUEST_STATUS_LABELS,
} from "@/lib/validators/guest";

function revalidate(weddingId: string) {
  revalidatePath(`/couple/${weddingId}/guests`);
  revalidatePath(`/app/weddings/${weddingId}/guests`);
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

export async function coupleAddGuestAction(
  weddingId: string,
  input: unknown,
): Promise<{ error?: string }> {
  await requireCoupleForWedding(weddingId);
  const agencyId = await coupleAgencyId(weddingId);
  if (!agencyId) return { error: "Свадьба не найдена" };
  const data = normalize(input);
  if (!data) return { error: "Проверьте поля формы" };
  const res = await addGuest(agencyId, weddingId, data);
  if (!res.ok) return { error: "Не удалось добавить" };
  await recordCoupleActivity(weddingId, "GUESTS", `Добавлен гость: ${data.name}`);
  revalidate(weddingId);
  return {};
}

export async function coupleQuickAddGuestAction(
  weddingId: string,
  input: unknown,
): Promise<{ error?: string }> {
  await requireCoupleForWedding(weddingId);
  const agencyId = await coupleAgencyId(weddingId);
  if (!agencyId) return { error: "Свадьба не найдена" };
  const parsed = guestQuickSchema.safeParse(input);
  if (!parsed.success) return { error: "Введите имя" };
  const res = await addGuest(agencyId, weddingId, {
    name: parsed.data.name,
    status: "NO_ANSWER",
  });
  if (!res.ok) return { error: "Не удалось добавить" };
  await recordCoupleActivity(
    weddingId,
    "GUESTS",
    `Добавлен гость: ${parsed.data.name}`,
  );
  revalidate(weddingId);
  return {};
}

export async function coupleUpdateGuestAction(
  weddingId: string,
  guestId: string,
  input: unknown,
): Promise<{ error?: string }> {
  await requireCoupleForWedding(weddingId);
  const agencyId = await coupleAgencyId(weddingId);
  if (!agencyId) return { error: "Свадьба не найдена" };
  const data = normalize(input);
  if (!data) return { error: "Проверьте поля формы" };
  const res = await updateGuest(agencyId, weddingId, guestId, data);
  if (!res.ok) return { error: "Не найдено" };
  await recordCoupleActivity(weddingId, "GUESTS", `Изменён гость: ${data.name}`);
  revalidate(weddingId);
  return {};
}

export async function coupleSetGuestStatusAction(
  weddingId: string,
  guestId: string,
  input: unknown,
): Promise<{ error?: string }> {
  await requireCoupleForWedding(weddingId);
  const agencyId = await coupleAgencyId(weddingId);
  if (!agencyId) return { error: "Свадьба не найдена" };
  const parsed = guestStatusSchema.safeParse(input);
  if (!parsed.success) return { error: "Неверный статус" };
  const res = await setGuestStatus(
    agencyId,
    weddingId,
    guestId,
    parsed.data.status,
  );
  if (!res.ok) return { error: "Не найдено" };
  await recordCoupleActivity(
    weddingId,
    "GUESTS",
    `Статус гостя → ${GUEST_STATUS_LABELS[parsed.data.status]}`,
  );
  revalidate(weddingId);
  return {};
}

export async function coupleDeleteGuestAction(
  weddingId: string,
  guestId: string,
): Promise<{ error?: string }> {
  await requireCoupleForWedding(weddingId);
  const agencyId = await coupleAgencyId(weddingId);
  if (!agencyId) return { error: "Свадьба не найдена" };
  const res = await deleteGuest(agencyId, weddingId, guestId);
  if (!res.ok) return { error: "Не найдено" };
  await recordCoupleActivity(weddingId, "GUESTS", "Удалён гость");
  revalidate(weddingId);
  return {};
}
