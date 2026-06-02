"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  updateWeddingAction,
  deleteWeddingAction,
  type WeddingFormState,
} from "../actions";
import { WeddingFields, type CoordinatorOption } from "../wedding-form";
import type { WeddingStatus } from "@prisma/client";

const initialState: WeddingFormState = {};

type Values = {
  brideName: string;
  groomName: string;
  date: string;
  budget: number;
  location: string;
  guestCount: number | null;
  coordinatorId: string | null;
  timezone: string;
  status: WeddingStatus;
  source: string;
};

export function OverviewEditor({
  weddingId,
  values,
  coordinators,
}: {
  weddingId: string;
  values: Values;
  coordinators: CoordinatorOption[];
}) {
  const [open, setOpen] = useState(false);
  const action = updateWeddingAction.bind(null, weddingId);
  const [state, formAction, isPending] = useActionState(action, initialState);
  const [deleting, startDelete] = useTransition();

  useEffect(() => {
    if (state.ok) {
      toast.success("Сохранено");
      setOpen(false);
    }
  }, [state.ok]);

  function handleDelete() {
    if (!confirm("Удалить свадьбу? Её можно будет восстановить только вручную.")) {
      return;
    }
    startDelete(async () => {
      const res = await deleteWeddingAction(weddingId);
      if (res?.error) toast.error(res.error);
    });
  }

  if (!open) {
    return (
      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={() => setOpen(true)}>
          Редактировать
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={deleting}
          onClick={handleDelete}
        >
          Удалить
        </Button>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4 border rounded-md p-4">
      <h2 className="font-semibold">Редактирование</h2>
      <WeddingFields
        values={values}
        coordinators={coordinators}
        fieldErrors={state.fieldErrors}
        disabled={isPending}
      />
      <div className="space-y-1">
        <Label htmlFor="status">Статус</Label>
        <select
          id="status"
          name="status"
          defaultValue={values.status}
          disabled={isPending}
          className="h-9 w-full rounded-md border bg-background px-2 text-sm"
        >
          <option value="PLANNING">В подготовке</option>
          <option value="COMPLETED">Завершена</option>
          <option value="CANCELLED">Отменена</option>
        </select>
      </div>
      {state.error ? (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}
      <div className="flex gap-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Сохраняем…" : "Сохранить"}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={isPending}
          onClick={() => setOpen(false)}
        >
          Отмена
        </Button>
      </div>
    </form>
  );
}
