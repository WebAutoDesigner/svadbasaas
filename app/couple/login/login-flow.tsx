"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginCoupleAction, type LoginState } from "./actions";

export function LoginFlow() {
  const [state, formAction, pending] = useActionState(
    loginCoupleAction,
    {} as LoginState,
  );

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="phone">Телефон</Label>
        <Input
          id="phone"
          name="phone"
          type="tel"
          inputMode="tel"
          placeholder="+7 999 123-45-67"
          autoComplete="tel"
          required
          disabled={pending}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Пароль</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          disabled={pending}
        />
      </div>
      {state.error ? (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" variant="gold" className="w-full" disabled={pending}>
        {pending ? "Входим…" : "Войти"}
      </Button>
    </form>
  );
}
