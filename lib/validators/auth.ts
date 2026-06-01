import { z } from "zod";

// Нормализуем email: trim + lowercase. Так сторона агентства совпадает со
// стороной пары (та уже lowercase-ит) и Better-Auth-логин не ломается на
// заглавных буквах, а User.email @unique не плодит дубли в разном регистре.
export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email("Некорректный email")
  .max(255);

export const passwordSchema = z
  .string()
  .min(8, "Пароль должен быть от 8 символов")
  .max(128);

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export type LoginInput = z.infer<typeof loginSchema>;

export const createAgencySchema = z.object({
  agencyName: z.string().min(2, "Минимум 2 символа").max(100),
  ownerEmail: emailSchema,
  ownerName: z.string().min(2).max(100),
  ownerPassword: passwordSchema,
});

export type CreateAgencyInput = z.infer<typeof createAgencySchema>;
