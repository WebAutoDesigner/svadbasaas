"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { inviteCoupleAction } from "./invite-action";

export function InviteCouple({
  weddingId,
  currentEmail,
}: {
  weddingId: string;
  currentEmail: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();

  if (!open) {
    return (
      <Button type="button" variant="outline" onClick={() => setOpen(true)}>
        {currentEmail ? `Доступ пары: ${currentEmail}` : "Пригласить пару"}
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
            toast.success("Доступ выдан. Пара входит на /couple/login по этому email.");
            setOpen(false);
          }
        });
      }}
      className="flex flex-col sm:flex-row gap-2 border rounded-md p-3"
    >
      <Input
        name="email"
        type="email"
        placeholder="email пары"
        defaultValue={currentEmail ?? ""}
        required
        disabled={pending}
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
