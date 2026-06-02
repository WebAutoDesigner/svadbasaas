import { z } from "zod";

export const noteSchema = z.object({
  body: z.string().min(1, "Введите заметку").max(4000),
});
export type NoteInput = z.infer<typeof noteSchema>;
