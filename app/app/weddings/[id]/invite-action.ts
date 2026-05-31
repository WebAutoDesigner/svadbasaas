"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireAgencyContext } from "@/lib/tenant";
import { assertWedding } from "@/lib/wedding/guard";
import { upsertCoupleAccess } from "@/lib/couple/auth";
import { logAction } from "@/lib/audit";

const schema = z.object({
  email: z.string().email().max(255),
  name: z.string().max(200).optional().or(z.literal("")),
});

export async function inviteCoupleAction(
  weddingId: string,
  formData: FormData,
): Promise<{ error?: string }> {
  const ctx = await requireAgencyContext();
  if (!(await assertWedding(ctx.agencyId, weddingId))) {
    return { error: "Свадьба не найдена" };
  }
  const parsed = schema.safeParse({
    email: formData.get("email"),
    name: formData.get("name"),
  });
  if (!parsed.success) return { error: "Некорректный email" };

  await upsertCoupleAccess(weddingId, parsed.data.email, parsed.data.name || null);
  await logAction({
    action: "wedding.couple_invite",
    agencyId: ctx.agencyId,
    userId: ctx.userId,
    targetType: "wedding",
    targetId: weddingId,
    payload: { email: parsed.data.email },
  });
  revalidatePath(`/app/weddings/${weddingId}`);
  return {};
}
