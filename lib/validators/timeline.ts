import { z } from "zod";

export const timelineEventSchema = z.object({
  startTime: z.string().regex(/^\d{1,2}:\d{2}$/, "Время в формате ЧЧ:ММ"),
  durationMin: z.coerce.number().int().min(0).max(1440).default(0),
  title: z.string().min(1, "Введите название события").max(200),
  description: z.string().max(1000).optional().or(z.literal("")),
  responsible: z.string().max(200).optional().or(z.literal("")),
});

export type TimelineEventInput = z.infer<typeof timelineEventSchema>;
