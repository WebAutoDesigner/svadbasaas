"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  requestCodeAction,
  verifyCodeAction,
  type RequestState,
  type VerifyState,
} from "./actions";

export function LoginFlow() {
  const [email, setEmail] = useState("");
  const [reqState, reqAction, reqPending] = useActionState(
    requestCodeAction,
    {} as RequestState,
  );

  if (!reqState.sent) {
    return (
      <form action={reqAction} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Ваш email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={reqPending}
          />
        </div>
        {reqState.error ? (
          <p className="text-sm text-destructive">{reqState.error}</p>
        ) : null}
        <Button type="submit" className="w-full" disabled={reqPending}>
          {reqPending ? "Отправляем…" : "Получить код"}
        </Button>
      </form>
    );
  }

  return <CodeStep email={email} devCode={reqState.devCode} />;
}

function CodeStep({ email, devCode }: { email: string; devCode?: string }) {
  const action = verifyCodeAction.bind(null, email);
  const [state, formAction, pending] = useActionState(
    action,
    {} as VerifyState,
  );

  return (
    <form action={formAction} className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Мы отправили код на <b>{email}</b>. Введите его ниже.
      </p>
      {devCode ? (
        <p className="text-sm bg-muted rounded p-2">
          DEV: код входа <b>{devCode}</b>
        </p>
      ) : null}
      <div className="space-y-2">
        <Label htmlFor="code">Код из письма</Label>
        <Input
          id="code"
          name="code"
          inputMode="numeric"
          pattern="\d{6}"
          maxLength={6}
          required
          disabled={pending}
        />
      </div>
      {state.error ? (
        <p className="text-sm text-destructive">{state.error}</p>
      ) : null}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Проверяем…" : "Войти"}
      </Button>
    </form>
  );
}
