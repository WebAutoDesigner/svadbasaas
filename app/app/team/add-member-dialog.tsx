"use client";

import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ROLE_LABELS } from "@/lib/auth/can";
import { addMemberAction, type AddMemberFormState } from "./actions";
import type { Role } from "@prisma/client";

const initialState: AddMemberFormState = {};
const ROLES: Role[] = ["ADMIN", "COORDINATOR", "OWNER"];

export function AddMemberDialog() {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(
    addMemberAction,
    initialState,
  );

  useEffect(() => {
    if (state.ok) {
      toast.success("Участник добавлен. Передайте ему логин и пароль.");
      setOpen(false);
    }
  }, [state.ok]);

  return (
    <>
      <Button type="button" onClick={() => setOpen(true)}>
        Добавить участника
      </Button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isPending) setOpen(false);
          }}
        >
          <div className="bg-background rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-lg font-semibold mb-4">Новый участник</h2>
            <form action={formAction} className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="name">Имя</Label>
                <Input id="name" name="name" required disabled={isPending} />
                {state.fieldErrors?.name ? (
                  <p className="text-sm text-destructive">
                    {state.fieldErrors.name}
                  </p>
                ) : null}
              </div>
              <div className="space-y-1">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  disabled={isPending}
                />
                {state.fieldErrors?.email ? (
                  <p className="text-sm text-destructive">
                    {state.fieldErrors.email}
                  </p>
                ) : null}
              </div>
              <div className="space-y-1">
                <Label htmlFor="password">Начальный пароль (≥10 симв)</Label>
                <Input
                  id="password"
                  name="password"
                  type="text"
                  required
                  disabled={isPending}
                />
                {state.fieldErrors?.password ? (
                  <p className="text-sm text-destructive">
                    {state.fieldErrors.password}
                  </p>
                ) : null}
              </div>
              <div className="space-y-1">
                <Label htmlFor="role">Роль</Label>
                <select
                  id="role"
                  name="role"
                  defaultValue="COORDINATOR"
                  disabled={isPending}
                  className="h-9 w-full rounded-md border bg-background px-2 text-sm"
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {ROLE_LABELS[r]}
                    </option>
                  ))}
                </select>
              </div>
              {state.error ? (
                <p className="text-sm text-destructive" role="alert">
                  {state.error}
                </p>
              ) : null}
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={isPending}
                  onClick={() => setOpen(false)}
                >
                  Отмена
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? "Добавляем…" : "Добавить"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
