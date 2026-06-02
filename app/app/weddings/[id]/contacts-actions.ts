"use server";

import { revalidatePath } from "next/cache";
import { requireAgencyContext } from "@/lib/tenant";
import {
  addContact,
  deleteContact,
  updateContact,
} from "@/lib/wedding/contact";
import { contactSchema } from "@/lib/validators/contact";

function revalidate(weddingId: string) {
  revalidatePath(`/app/weddings/${weddingId}`);
}

export async function addContactAction(
  weddingId: string,
  input: unknown,
): Promise<{ error?: string }> {
  const ctx = await requireAgencyContext();
  const parsed = contactSchema.safeParse(input);
  if (!parsed.success) return { error: "Заполните пометку и контакт" };
  const res = await addContact(ctx.agencyId, weddingId, parsed.data);
  if (!res.ok) return { error: "Свадьба не найдена" };
  revalidate(weddingId);
  return {};
}

export async function updateContactAction(
  weddingId: string,
  contactId: string,
  input: unknown,
): Promise<{ error?: string }> {
  const ctx = await requireAgencyContext();
  const parsed = contactSchema.safeParse(input);
  if (!parsed.success) return { error: "Заполните пометку и контакт" };
  const res = await updateContact(ctx.agencyId, weddingId, contactId, parsed.data);
  if (!res.ok) return { error: "Не найдено" };
  revalidate(weddingId);
  return {};
}

export async function deleteContactAction(
  weddingId: string,
  contactId: string,
): Promise<{ error?: string }> {
  const ctx = await requireAgencyContext();
  const res = await deleteContact(ctx.agencyId, weddingId, contactId);
  if (!res.ok) return { error: "Не найдено" };
  revalidate(weddingId);
  return {};
}
