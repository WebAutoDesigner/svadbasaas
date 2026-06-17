"use server";

import { revalidatePath } from "next/cache";
import { requireSuperAdmin } from "@/lib/super-admin/session";
import { createAgencyWithOwner, setAgencyActive } from "@/lib/agency/create";
import { createAgencySchema } from "@/lib/validators/auth";
import { logAction } from "@/lib/audit";

export type CreateAgencyFormState = {
  ok?: boolean;
  error?: string;
  fieldErrors?: Partial<
    Record<"agencyName" | "ownerPhone" | "ownerName" | "ownerPassword", string>
  >;
};

export async function createAgencyAction(
  _prev: CreateAgencyFormState | undefined,
  formData: FormData,
): Promise<CreateAgencyFormState> {
  const admin = await requireSuperAdmin();

  const parsed = createAgencySchema.safeParse({
    agencyName: formData.get("agencyName"),
    ownerPhone: formData.get("ownerPhone"),
    ownerName: formData.get("ownerName"),
    ownerPassword: formData.get("ownerPassword"),
  });

  if (!parsed.success) {
    const fieldErrors: CreateAgencyFormState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (
        key === "agencyName" ||
        key === "ownerPhone" ||
        key === "ownerName" ||
        key === "ownerPassword"
      ) {
        fieldErrors[key] = issue.message;
      }
    }
    return { fieldErrors };
  }

  const result = await createAgencyWithOwner(parsed.data);
  if (!result.ok) {
    if (result.error === "PHONE_TAKEN") {
      return { error: "Пользователь с таким телефоном уже существует" };
    }
    return { error: "Не удалось создать агентство" };
  }

  await logAction({
    action: "agency.create",
    userId: admin.id,
    agencyId: result.data.agencyId,
    targetType: "agency",
    targetId: result.data.agencyId,
    payload: {
      agencyName: parsed.data.agencyName,
      ownerPhone: parsed.data.ownerPhone,
    },
  });

  revalidatePath("/super-admin/agencies");
  return { ok: true };
}

export async function toggleAgencyActiveAction(
  agencyId: string,
  nextActive: boolean,
): Promise<void> {
  const admin = await requireSuperAdmin();
  await setAgencyActive(agencyId, nextActive);
  await logAction({
    action: nextActive ? "agency.activate" : "agency.deactivate",
    userId: admin.id,
    agencyId,
    targetType: "agency",
    targetId: agencyId,
  });
  revalidatePath("/super-admin/agencies");
}
