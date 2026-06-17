"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireAgencyContext } from "@/lib/tenant";
import { assertWedding } from "@/lib/wedding/guard";
import { upsertCoupleAccess } from "@/lib/couple/auth";
import { phoneSchema, passwordSchema } from "@/lib/validators/auth";
import { logAction } from "@/lib/audit";

const schema = z.object({
  phone: phoneSchema,
  password: passwordSchema,
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
    phone: formData.get("phone"),
    password: formData.get("password"),
    name: formData.get("name"),
  });
  if (!parsed.success) {
    return {
      error:
        parsed.error.issues[0]?.message ?? "Проверьте телефон и пароль (≥8 симв)",
    };
  }

  try {
    await upsertCoupleAccess(
      weddingId,
      parsed.data.phone,
      parsed.data.password,
      parsed.data.name || null,
    );
  } catch {
    // Телефон уже занят другой свадьбой (phone @unique)
    return { error: "Этот телефон уже привязан к другой паре" };
  }

  await logAction({
    action: "wedding.couple_invite",
    agencyId: ctx.agencyId,
    userId: ctx.userId,
    targetType: "wedding",
    targetId: weddingId,
    payload: { phone: parsed.data.phone },
  });
  revalidatePath(`/app/weddings/${weddingId}`);
  return {};
}
