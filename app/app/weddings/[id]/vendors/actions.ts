"use server";

import { revalidatePath } from "next/cache";
import { requireAgencyContext } from "@/lib/tenant";
import {
  addVendor,
  deleteVendor,
  updateVendor,
  type VendorData,
} from "@/lib/wedding/vendor";
import { vendorSchema } from "@/lib/validators/vendor";

function revalidate(weddingId: string) {
  revalidatePath(`/app/weddings/${weddingId}/vendors`);
  revalidatePath(`/app/weddings/${weddingId}`);
}

function normalize(input: unknown): VendorData | null {
  const parsed = vendorSchema.safeParse(input);
  if (!parsed.success) return null;
  return {
    name: parsed.data.name,
    service: parsed.data.service,
    contact: parsed.data.contact || undefined,
    amount: parsed.data.amount,
    paymentStatus: parsed.data.paymentStatus,
    note: parsed.data.note || undefined,
  };
}

export async function addVendorAction(
  weddingId: string,
  input: unknown,
): Promise<{ error?: string }> {
  const ctx = await requireAgencyContext();
  const data = normalize(input);
  if (!data) return { error: "Проверьте поля формы" };
  const res = await addVendor(ctx.agencyId, weddingId, data);
  if (!res.ok) return { error: "Свадьба не найдена" };
  revalidate(weddingId);
  return {};
}

export async function updateVendorAction(
  weddingId: string,
  vendorId: string,
  input: unknown,
): Promise<{ error?: string }> {
  const ctx = await requireAgencyContext();
  const data = normalize(input);
  if (!data) return { error: "Проверьте поля формы" };
  const res = await updateVendor(ctx.agencyId, weddingId, vendorId, data);
  if (!res.ok) return { error: "Не найдено" };
  revalidate(weddingId);
  return {};
}

export async function deleteVendorAction(
  weddingId: string,
  vendorId: string,
): Promise<{ error?: string }> {
  const ctx = await requireAgencyContext();
  const res = await deleteVendor(ctx.agencyId, weddingId, vendorId);
  if (!res.ok) return { error: "Не найдено" };
  revalidate(weddingId);
  return {};
}
