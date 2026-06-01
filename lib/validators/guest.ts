import { z } from "zod";
import type { GuestStatus, GuestSide } from "@prisma/client";

export const guestStatusEnum = z.enum([
  "COMING",
  "NOT_COMING",
  "MAYBE",
  "NO_ANSWER",
]);
export const guestSideEnum = z.enum(["BRIDE", "GROOM", "COMMON"]);

export const GUEST_STATUS_LABELS: Record<GuestStatus, string> = {
  COMING: "Придёт",
  NOT_COMING: "Не придёт",
  MAYBE: "Под вопросом",
  NO_ANSWER: "Не ответил",
};

export const GUEST_SIDE_LABELS: Record<GuestSide, string> = {
  BRIDE: "Невеста",
  GROOM: "Жених",
  COMMON: "Общие",
};

// Полная схема — создание/редактирование одного гостя.
export const guestSchema = z.object({
  name: z.string().min(1, "Введите имя").max(200),
  status: guestStatusEnum.default("NO_ANSWER"),
  side: guestSideEnum.optional().or(z.literal("")),
  groupLabel: z.string().max(120).optional().or(z.literal("")),
});
export type GuestInput = z.infer<typeof guestSchema>;

// Быстрый ввод — только имя.
export const guestQuickSchema = z.object({
  name: z.string().min(1, "Введите имя").max(200),
});

// Inline-смена статуса.
export const guestStatusSchema = z.object({ status: guestStatusEnum });
