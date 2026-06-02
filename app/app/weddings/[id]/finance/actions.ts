"use server";

import { revalidatePath } from "next/cache";
import { requireAgencyContext } from "@/lib/tenant";
import {
  addPayment,
  deletePayment,
  updateAgencyFee,
  updatePayment,
  type PaymentData,
} from "@/lib/wedding/finance";
import { feeSchema, paymentSchema } from "@/lib/validators/finance";

function revalidate(weddingId: string) {
  revalidatePath(`/app/weddings/${weddingId}/finance`);
}

function normalize(input: unknown): PaymentData | null {
  const parsed = paymentSchema.safeParse(input);
  if (!parsed.success) return null;
  return {
    amount: parsed.data.amount,
    paidOn: parsed.data.paidOn,
    note: parsed.data.note || undefined,
  };
}

export async function updateFeeAction(
  weddingId: string,
  input: unknown,
): Promise<{ error?: string }> {
  const ctx = await requireAgencyContext();
  const parsed = feeSchema.safeParse(input);
  if (!parsed.success) return { error: "Некорректная сумма" };
  const res = await updateAgencyFee(ctx.agencyId, weddingId, parsed.data.agencyFee);
  if (!res.ok) return { error: "Свадьба не найдена" };
  revalidate(weddingId);
  return {};
}

export async function addPaymentAction(
  weddingId: string,
  input: unknown,
): Promise<{ error?: string }> {
  const ctx = await requireAgencyContext();
  const data = normalize(input);
  if (!data) return { error: "Проверьте поля платежа" };
  const res = await addPayment(ctx.agencyId, weddingId, data);
  if (!res.ok) return { error: "Свадьба не найдена" };
  revalidate(weddingId);
  return {};
}

export async function updatePaymentAction(
  weddingId: string,
  paymentId: string,
  input: unknown,
): Promise<{ error?: string }> {
  const ctx = await requireAgencyContext();
  const data = normalize(input);
  if (!data) return { error: "Проверьте поля платежа" };
  const res = await updatePayment(ctx.agencyId, weddingId, paymentId, data);
  if (!res.ok) return { error: "Не найдено" };
  revalidate(weddingId);
  return {};
}

export async function deletePaymentAction(
  weddingId: string,
  paymentId: string,
): Promise<{ error?: string }> {
  const ctx = await requireAgencyContext();
  const res = await deletePayment(ctx.agencyId, weddingId, paymentId);
  if (!res.ok) return { error: "Не найдено" };
  revalidate(weddingId);
  return {};
}
