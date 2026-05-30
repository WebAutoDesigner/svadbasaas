import { z } from "zod";

export const checklistPeriodEnum = z.enum([
  "SIX_MONTHS",
  "THREE_MONTHS",
  "ONE_MONTH",
  "ONE_WEEK",
  "ONE_DAY",
  "AFTER",
]);

export const addItemSchema = z.object({
  title: z.string().min(1, "Введите задачу").max(300),
  period: checklistPeriodEnum,
  note: z.string().max(1000).optional().or(z.literal("")),
});

export type AddItemInput = z.infer<typeof addItemSchema>;
