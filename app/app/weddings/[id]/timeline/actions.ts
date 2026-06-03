"use server";

import { revalidatePath } from "next/cache";
import { requireAgencyContext } from "@/lib/tenant";
import {
  addEvent,
  deleteEvent,
  hhmmToMinutes,
  updateEvent,
  type TimelineInput,
} from "@/lib/wedding/timeline";
import { applyTemplate } from "@/lib/wedding/apply-template";
import { timelineEventSchema } from "@/lib/validators/timeline";

function revalidate(weddingId: string) {
  revalidatePath(`/app/weddings/${weddingId}/timeline`);
}

export async function applyTimelineTemplateAction(
  weddingId: string,
  templateId: string,
): Promise<{ error?: string }> {
  const ctx = await requireAgencyContext();
  const res = await applyTemplate(ctx.agencyId, weddingId, templateId);
  if (!res.ok) return { error: "Не удалось применить шаблон" };
  revalidate(weddingId);
  return {};
}

function normalize(input: unknown): TimelineInput | null {
  const parsed = timelineEventSchema.safeParse(input);
  if (!parsed.success) return null;
  const startMinutes = hhmmToMinutes(parsed.data.startTime);
  if (startMinutes === null) return null;
  return {
    startMinutes,
    durationMin: parsed.data.durationMin,
    title: parsed.data.title,
    description: parsed.data.description || undefined,
    responsible: parsed.data.responsible || undefined,
  };
}

export async function addEventAction(
  weddingId: string,
  input: unknown,
): Promise<{ error?: string }> {
  const ctx = await requireAgencyContext();
  const data = normalize(input);
  if (!data) return { error: "Проверьте поля" };
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
  if (!data) return { error: "Проверьте поля" };
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
