"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { createWeddingAction, type WeddingFormState } from "../actions";
import { WeddingFields, type CoordinatorOption } from "../wedding-form";

const initialState: WeddingFormState = {};

export function CreateWeddingForm({
  coordinators,
}: {
  coordinators: CoordinatorOption[];
}) {
  const [state, formAction, isPending] = useActionState(
    createWeddingAction,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-6">
      <WeddingFields
        coordinators={coordinators}
        fieldErrors={state.fieldErrors}
        disabled={isPending}
      />
      {state.error ? (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" disabled={isPending}>
        {isPending ? "Создаём…" : "Создать свадьбу"}
      </Button>
    </form>
  );
}
