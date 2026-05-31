import { z } from "zod";
import type { PaymentStatus } from "@prisma/client";

export const paymentStatusEnum = z.enum(["NOT_PAID", "PARTIAL", "PAID"]);

export const PAYMENT_LABELS: Record<PaymentStatus, string> = {
  NOT_PAID: "Не оплачен",
  PARTIAL: "Частично",
  PAID: "Оплачен",
};

export const vendorSchema = z.object({
  name: z.string().min(1, "Введите название").max(200),
  service: z.string().min(1, "Укажите услугу").max(120),
  contact: z.string().max(300).optional().or(z.literal("")),
  amount: z.coerce.number().int().min(0).default(0),
  paymentStatus: paymentStatusEnum.default("NOT_PAID"),
  note: z.string().max(1000).optional().or(z.literal("")),
});

export type VendorInput = z.infer<typeof vendorSchema>;
