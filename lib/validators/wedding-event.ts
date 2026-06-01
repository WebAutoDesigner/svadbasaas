import { z } from "zod";

export const weddingEventSchema = z.object({
  title: z.string().min(1, "Введите название").max(200),
  date: z.string().min(1, "Укажите дату"), // YYYY-MM-DD
  time: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Время в формате ЧЧ:ММ")
    .optional()
    .or(z.literal("")), // HH:MM
  description: z.string().max(2000).optional().or(z.literal("")),
  visibleToCouple: z.coerce.boolean().default(false),
});
export type WeddingEventInput = z.infer<typeof weddingEventSchema>;

/** "HH:MM" → минуты от полуночи, или null. */
export function timeToMinutes(time: string | undefined | null): number | null {
  if (!time) return null;
  const m = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(time);
  if (!m) return null;
  return Number(m[1]) * 60 + Number(m[2]);
}

/** минуты → "HH:MM", или "". */
export function minutesToTime(minutes: number | null | undefined): string {
  if (minutes === null || minutes === undefined) return "";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}
