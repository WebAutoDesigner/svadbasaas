import { z } from "zod";

export const tableSchema = z.object({
  name: z.string().min(1, "Введите название").max(120),
  capacity: z.coerce.number().int().min(0).max(100).default(0),
});
export type TableInput = z.infer<typeof tableSchema>;
