import { z } from "zod";
import { normalizePhone } from "@/lib/phone";

// Нормализуем email: trim + lowercase. Используется супер-админом и legacy-кодом.
export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email("Некорректный email")
  .max(255);

// Телефон как логин. На выходе — канонический "7XXXXXXXXXX".
export const phoneSchema = z
  .string()
  .trim()
  .refine((v) => normalizePhone(v) !== null, "Некорректный номер телефона")
  .transform((v) => normalizePhone(v)!);

export const passwordSchema = z
  .string()
  .min(8, "Пароль должен быть от 8 символов")
  .max(128);

export const loginSchema = z.object({
  phone: phoneSchema,
  password: passwordSchema,
});

export type LoginInput = z.infer<typeof loginSchema>;

// Супер-админ входит по email+паролю (его вход не меняли).
export const superAdminLoginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const createAgencySchema = z.object({
  agencyName: z.string().min(2, "Минимум 2 символа").max(100),
  ownerPhone: phoneSchema,
  ownerName: z.string().min(2).max(100),
  ownerPassword: passwordSchema,
});

export type CreateAgencyInput = z.infer<typeof createAgencySchema>;
