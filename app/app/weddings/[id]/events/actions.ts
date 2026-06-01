"use server";

import { revalidatePath } from "next/cache";
import { requireAgencyContext } from "@/lib/tenant";
import {
  addEvent,
  deleteEvent,
  updateEvent,
  type EventData,
} from "@/lib/wedding/event";
import {
  timeToMinutes,
  weddingEventSchema,
} from "@/lib/validators/wedding-event";

function revalidate(weddingId: string) {
  revalidatePath(`/app/weddings/${weddingId}/events`);
  revalidatePath(`/couple/${weddingId}/schedule`);
}

function normalize(input: unknown): EventData | null {
  const parsed = weddingEventSchema.safeParse(input);
  if (!parsed.success) return null;
  return {
    title: parsed.data.title,
    date: parsed.data.date,
    startMinutes: timeToMinutes(parsed.data.time),
    description: parsed.data.description || undefined,
    visibleToCouple: parsed.data.visibleToCouple,
  };
}

export async function addEventAction(
  weddingId: string,
  input: unknown,
): Promise<{ error?: string }> {
  const ctx = await requireAgencyContext();
  const data = normalize(input);
  if (!data) return { error: "Проверьте поля формы" };
  const res = await addEvent(ctx.agencyId, weddingId, data);
  if (!res.ok) return { error: "Свадьба не найдена" };
  revalidate(weddingId);
  return {};
}

export async function updateEventAction(
  weddingId: string,
  eventId: string,
  input: unknown,
): Promise<{ error?: string }> {
  const ctx = await requireAgencyContext();
  const data = normalize(input);
  if (!data) return { error: "Проверьте поля формы" };
  const res = await updateEvent(ctx.agencyId, weddingId, eventId, data);
  if (!res.ok) return { error: "Не найдено" };
  revalidate(weddingId);
  return {};
}

export async function deleteEventAction(
  weddingId: string,
  eventId: string,
): Promise<{ error?: string }> {
  const ctx = await requireAgencyContext();
  const res = await deleteEvent(ctx.agencyId, weddingId, eventId);
  if (!res.ok) return { error: "Не найдено" };
  revalidate(weddingId);
  return {};
}
