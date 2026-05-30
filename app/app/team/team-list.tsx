"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ROLE_LABELS } from "@/lib/auth/can";
import { changeRoleAction, removeMemberAction } from "./actions";
import type { Role } from "@prisma/client";

type Member = {
  memberId: string;
  email: string;
  name: string;
  role: Role;
  isSelf: boolean;
};

const ROLES: Role[] = ["OWNER", "ADMIN", "COORDINATOR"];

export function TeamList({
  members,
  canManage,
}: {
  members: Member[];
  canManage: boolean;
}) {
  const [pending, start] = useTransition();

  function handleRole(memberId: string, role: Role) {
    start(async () => {
      const res = await changeRoleAction(memberId, role);
      if (res.error) toast.error(res.error);
      else toast.success("Роль обновлена");
    });
  }

  function handleRemove(memberId: string, name: string) {
    if (!confirm(`Удалить ${name} из команды?`)) return;
    start(async () => {
      const res = await removeMemberAction(memberId);
      if (res.error) toast.error(res.error);
      else toast.success("Участник удалён");
    });
  }

  return (
    <div className="border rounded-md divide-y">
      {members.map((m) => (
        <div
          key={m.memberId}
          className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4"
        >
          <div className="min-w-0">
            <div className="font-medium truncate">
              {m.name}
              {m.isSelf ? (
                <span className="text-muted-foreground"> (вы)</span>
              ) : null}
            </div>
            <div className="text-sm text-muted-foreground truncate">
              {m.email}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {canManage ? (
              <select
                className="h-9 rounded-md border bg-background px-2 text-sm"
                value={m.role}
                disabled={pending}
                onChange={(e) => handleRole(m.memberId, e.target.value as Role)}
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABELS[r]}
                  </option>
                ))}
              </select>
            ) : (
              <span className="text-sm text-muted-foreground">
                {ROLE_LABELS[m.role]}
              </span>
            )}

            {canManage && !m.isSelf ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={pending}
                onClick={() => handleRemove(m.memberId, m.name)}
              >
                Удалить
              </Button>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}
