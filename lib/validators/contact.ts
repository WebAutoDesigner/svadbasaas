import { z } from "zod";

export const contactSchema = z.object({
  label: z.string().min(1, "Укажите пометку").max(120),
  value: z.string().min(1, "Укажите контакт").max(300),
});
export type ContactInput = z.infer<typeof contactSchema>;
