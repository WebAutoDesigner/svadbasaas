import { z } from "zod";

export const feeSchema = z.object({
  agencyFee: z.coerce.number().int().min(0).default(0),
});

export const paymentSchema = z.object({
  amount: z.coerce.number().int().min(0).default(0),
  paidOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Некорректная дата"),
  note: z.string().max(300).optional().or(z.literal("")),
});
export type PaymentInput = z.infer<typeof paymentSchema>;
