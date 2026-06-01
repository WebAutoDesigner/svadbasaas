"use server";

import { revalidatePath } from "next/cache";
import { requireAgencyContext } from "@/lib/tenant";
import {
  addAgencyVendor,
  deleteAgencyVendor,
  updateAgencyVendor,
  type AgencyVendorData,
} from "@/lib/agency/vendor-directory";
import { agencyVendorSchema } from "@/lib/validators/agency-vendor";

function normalize(input: unknown): AgencyVendorData | null {
  const parsed = agencyVendorSchema.safeParse(input);
  if (!parsed.success) return null;
  return {
    name: parsed.data.name,
    service: parsed.data.service,
    contact: parsed.data.contact || undefined,
    link: parsed.data.link || undefined,
    priceNote: parsed.data.priceNote || undefined,
  };
}

export async function addAgencyVendorAction(
  input: unknown,
): Promise<{ error?: string }> {
  const ctx = await requireAgencyContext();
  const data = normalize(input);
  if (!data) return { error: "Проверьте поля формы" };
  await addAgencyVendor(ctx.agencyId, data);
  revalidatePath("/app/vendors");
  return {};
}

export async function updateAgencyVendorAction(
  vendorId: string,
  input: unknown,
): Promise<{ error?: string }> {
  const ctx = await requireAgencyContext();
  const data = normalize(input);
  if (!data) return { error: "Проверьте поля формы" };
  const res = await updateAgencyVendor(ctx.agencyId, vendorId, data);
  if (!res.ok) return { error: "Не найдено" };
  revalidatePath("/app/vendors");
  return {};
}

export async function deleteAgencyVendorAction(
  vendorId: string,
): Promise<{ error?: string }> {
  const ctx = await requireAgencyContext();
  const res = await deleteAgencyVendor(ctx.agencyId, vendorId);
  if (!res.ok) return { error: "Не найдено" };
  revalidatePath("/app/vendors");
  return {};
}
