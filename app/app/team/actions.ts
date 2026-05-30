"use server";

import { revalidatePath } from "next/cache";
import { requireAgencyContext } from "@/lib/tenant";
import { canManageTeam } from "@/lib/auth/can";
import {
  addMember,
  changeMemberRole,
  removeMember,
} from "@/lib/agency/team";
import { addMemberSchema, roleEnum } from "@/lib/validators/team";
import { logAction } from "@/lib/audit";
import type { Role } from "@prisma/client";

export type AddMemberFormState = {
  ok?: boolean;
  error?: string;
  fieldErrors?: Partial<Record<"email" | "name" | "password" | "role", string>>;
};

export async function addMemberAction(
  _prev: AddMemberFormState | undefined,
  formData: FormData,
): Promise<AddMemberFormState> {
  const ctx = await requireAgencyContext();
  if (!canManageTeam(ctx.role)) {
    return { error: "Недостаточно прав" };
  }

  const parsed = addMemberSchema.safeParse({
    email: formData.get("email"),
    name: formData.get("name"),
    password: formData.get("password"),
    role: formData.get("role"),
  });

  if (!parsed.success) {
    const fieldErrors: AddMemberFormState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (key === "email" || key === "name" || key === "password" || key === "role") {
        fieldErrors[key] = issue.message;
      }
    }
    return { fieldErrors };
  }

  const result = await addMember(ctx.agencyId, parsed.data);
  if (!result.ok) {
    return { error: "Пользователь с таким email уже существует" };
  }

  await logAction({
    action: "user.invite",
    agencyId: ctx.agencyId,
    userId: ctx.userId,
    targetType: "agency_member",
    targetId: result.data.memberId,
    payload: { email: parsed.data.email, role: parsed.data.role },
  });

  revalidatePath("/app/team");
  return { ok: true };
}

export async function changeRoleAction(
  memberId: string,
  role: Role,
): Promise<{ error?: string }> {
  const ctx = await requireAgencyContext();
  if (!canManageTeam(ctx.role)) return { error: "Недостаточно прав" };

  const roleParsed = roleEnum.safeParse(role);
  if (!roleParsed.success) return { error: "Некорректная роль" };

  const result = await changeMemberRole(ctx.agencyId, memberId, roleParsed.data);
  if (!result.ok) {
    if (result.error === "LAST_OWNER") {
      return { error: "Нельзя снять роль у последнего владельца" };
    }
    return { error: "Участник не найден" };
  }

  await logAction({
    action: "user.role_change",
    agencyId: ctx.agencyId,
    userId: ctx.userId,
    targetType: "agency_member",
    targetId: memberId,
    payload: { role },
  });

  revalidatePath("/app/team");
  return {};
}

export async function removeMemberAction(
  memberId: string,
): Promise<{ error?: string }> {
  const ctx = await requireAgencyContext();
  if (!canManageTeam(ctx.role)) return { error: "Недостаточно прав" };

  const result = await removeMember(ctx.agencyId, memberId);
  if (!result.ok) {
    if (result.error === "LAST_OWNER") {
      return { error: "Нельзя удалить последнего владельца" };
    }
    return { error: "Участник не найден" };
  }

  await logAction({
    action: "user.remove",
    agencyId: ctx.agencyId,
    userId: ctx.userId,
    targetType: "agency_member",
    targetId: memberId,
  });

  revalidatePath("/app/team");
  return {};
}
