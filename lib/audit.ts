import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";

export type AuditAction =
  // super-admin
  | "agency.create"
  | "agency.activate"
  | "agency.deactivate"
  | "super_admin.login"
  | "super_admin.logout"
  // agency
  | "user.invite"
  | "user.remove"
  | "user.role_change"
  | "wedding.create"
  | "wedding.update"
  | "wedding.delete"
  | "wedding.couple_invite";

export type LogActionInput = {
  action: AuditAction;
  agencyId?: string | null;
  userId?: string | null;
  targetType?: string | null;
  targetId?: string | null;
  payload?: Prisma.InputJsonValue | null;
};

/**
 * Записывает действие в audit_log. Никогда не кидает — даже если в БД проблема,
 * мы не хотим валить основной поток из-за логирования.
 */
export async function logAction(input: LogActionInput): Promise<void> {
  try {
    await db.auditLog.create({
      data: {
        action: input.action,
        agencyId: input.agencyId ?? null,
        userId: input.userId ?? null,
        targetType: input.targetType ?? null,
        targetId: input.targetId ?? null,
        payload: input.payload ?? undefined,
      },
    });
  } catch (error) {
    console.error("[audit] failed to log action", input.action, error);
  }
}
