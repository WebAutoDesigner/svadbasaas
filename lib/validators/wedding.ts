import { z } from "zod";

export const weddingStatusEnum = z.enum([
  "PLANNING",
  "COMPLETED",
  "CANCELLED",
]);

const baseWedding = {
  brideName: z.string().min(1, "Укажите имя невесты").max(100),
  groomName: z.string().min(1, "Укажите имя жениха").max(100),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Некорректная дата"),
  timezone: z.string().min(1).max(64).default("Europe/Moscow"),
  budget: z.coerce.number().int().min(0, "Бюджет не может быть отрицательным"),
  location: z.string().max(255).optional().or(z.literal("")),
  guestCount: z.coerce
    .number()
    .int()
    .min(0)
    .max(5000)
    .optional()
    .or(z.literal("")),
  coordinatorId: z.string().optional().or(z.literal("")),
  source: z.string().max(255).optional().or(z.literal("")),
};

export const createWeddingSchema = z.object(baseWedding);
export type CreateWeddingInput = z.infer<typeof createWeddingSchema>;

export const updateWeddingSchema = z.object({
  ...baseWedding,
  status: weddingStatusEnum,
});
export type UpdateWeddingInput = z.infer<typeof updateWeddingSchema>;
