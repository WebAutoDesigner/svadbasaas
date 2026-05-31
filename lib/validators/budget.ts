import { z } from "zod";

export const addBudgetItemSchema = z.object({
  name: z.string().min(1, "Введите название статьи").max(200),
  planned: z.coerce.number().int().min(0).default(0),
  actual: z.coerce.number().int().min(0).default(0),
});

export type AddBudgetItemInput = z.infer<typeof addBudgetItemSchema>;

export const updateBudgetItemSchema = z.object({
  planned: z.coerce.number().int().min(0),
  actual: z.coerce.number().int().min(0),
});
