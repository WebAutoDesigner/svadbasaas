"use client";

import { useActionState, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { createAgencyAction, type CreateAgencyFormState } from "./actions";

const initialState: CreateAgencyFormState = {};

export function CreateAgencyDialog() {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(
    createAgencyAction,
    initialState,
  );

  useEffect(() => {
    if (state.ok) {
      toast.success("Агентство создано. Передай учётку владельцу.");
      setOpen(false);
    }
  }, [state.ok]);

  return (
    <>
      <Button type="button" onClick={() => setOpen(true)}>
        Создать агентство
      </Button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isPending) setOpen(false);
          }}
        >
          <div className="bg-background rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-lg font-semibold mb-4">Новое агентство</h2>
            <form action={formAction} className="space-y-3">
              <Field
                name="agencyName"
                label="Название агентства"
                error={state.fieldErrors?.agencyName}
                disabled={isPending}
              />
              <Field
                name="ownerName"
                label="Имя владельца"
                error={state.fieldErrors?.ownerName}
                disabled={isPending}
              />
              <Field
                name="ownerEmail"
                label="Email владельца"
                type="email"
                error={state.fieldErrors?.ownerEmail}
                disabled={isPending}
              />
              <Field
                name="ownerPassword"
                label="Начальный пароль (≥10 симв)"
                type="text"
                error={state.fieldErrors?.ownerPassword}
                disabled={isPending}
              />
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
                  {isPending ? "Создаём…" : "Создать"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}

function Field({
  name,
  label,
  type = "text",
  error,
  disabled,
}: {
  name: string;
  label: string;
  type?: string;
  error?: string;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-1">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} type={type} required disabled={disabled} />
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
