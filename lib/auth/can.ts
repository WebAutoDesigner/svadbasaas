import type { Role } from "@prisma/client";

const RANK: Record<Role, number> = {
  OWNER: 3,
  ADMIN: 2,
  COORDINATOR: 1,
};

export function roleRank(role: Role): number {
  return RANK[role];
}

/** Текущая роль не ниже требуемой */
export function atLeast(role: Role, min: Role): boolean {
  return RANK[role] >= RANK[min];
}

/** Управление командой (добавить/удалить/сменить роль) — только OWNER */
export function canManageTeam(role: Role): boolean {
  return role === "OWNER";
}

export const ROLE_LABELS: Record<Role, string> = {
  OWNER: "Владелец",
  ADMIN: "Администратор",
  COORDINATOR: "Координатор",
};
