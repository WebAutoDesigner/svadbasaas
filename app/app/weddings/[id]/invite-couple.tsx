"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { inviteCoupleAction } from "./invite-action";

export function InviteCouple({
  weddingId,
  currentPhone,
}: {
  weddingId: string;
  currentPhone: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();

  if (!open) {
    return (
      <Button type="button" variant="outline" onClick={() => setOpen(true)}>
        {currentPhone ? `Доступ пары: ${currentPhone}` : "Пригласить пару"}
      </Button>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        start(async () => {
          const res = await inviteCoupleAction(weddingId, fd);
          if (res.error) toast.error(res.error);
          else {
            toast.success("Доступ выдан. Передайте паре телефон и пароль для входа.");
            setOpen(false);
          }
        });
      }}
      className="flex flex-col gap-2 border rounded-md p-3 sm:flex-row sm:flex-wrap"
    >
      <Input
        name="phone"
        type="tel"
        inputMode="tel"
        placeholder="телефон пары"
        defaultValue={currentPhone ?? ""}
        required
        disabled={pending}
        className="sm:max-w-44"
      />
      <Input
        name="password"
        type="text"
        placeholder="пароль (≥8 симв)"
        required
        disabled={pending}
        className="sm:max-w-44"
      />
      <Input name="name" placeholder="имена (необяз.)" disabled={pending} />
      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "…" : "Выдать доступ"}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={pending}
          onClick={() => setOpen(false)}
        >
          Отмена
        </Button>
      </div>
    </form>
  );
}
