"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  GUEST_SIDE_LABELS,
  GUEST_STATUS_LABELS,
} from "@/lib/validators/guest";
import type { GuestSide, GuestStatus } from "@prisma/client";
import {
  coupleAddGuestAction,
  coupleDeleteGuestAction,
  coupleQuickAddGuestAction,
  coupleSetGuestStatusAction,
  coupleUpdateGuestAction,
} from "./actions";

type Guest = {
  id: string;
  name: string;
  status: GuestStatus;
  side: GuestSide | null;
  groupLabel: string | null;
};

const STATUSES: GuestStatus[] = ["COMING", "NOT_COMING", "MAYBE", "NO_ANSWER"];
const SIDES: GuestSide[] = ["BRIDE", "GROOM", "COMMON"];
const STATUS_COLOR: Record<GuestStatus, string> = {
  COMING: "text-green-600",
  NOT_COMING: "text-destructive",
  MAYBE: "text-amber-600",
  NO_ANSWER: "text-muted-foreground",
};

export function CoupleGuestsBoard({
  weddingId,
  guests,
}: {
  weddingId: string;
  guests: Guest[];
}) {
  const [adding, setAdding] = useState(false);

  return (
    <div className="space-y-4">
      <QuickAdd weddingId={weddingId} />

      <div className="flex justify-end">
        <Button type="button" onClick={() => setAdding((v) => !v)}>
          {adding ? "Отмена" : "Добавить гостя"}
        </Button>
      </div>

      {adding ? (
        <GuestForm
          weddingId={weddingId}
          mode="create"
          onDone={() => setAdding(false)}
        />
      ) : null}

      {guests.length === 0 ? (
        <p className="text-muted-foreground">
          Гостей пока нет. Добавьте имена близких.
        </p>
      ) : (
        <div className="space-y-2">
          {guests.map((g) => (
            <GuestRow key={g.id} weddingId={weddingId} guest={g} />
          ))}
        </div>
      )}
    </div>
  );
}

function QuickAdd({ weddingId }: { weddingId: string }) {
  const [name, setName] = useState("");
  const [pending, start] = useTransition();

  function submit() {
    const value = name.trim();
    if (!value) return;
    start(async () => {
      const res = await coupleQuickAddGuestAction(weddingId, { name: value });
      if (res.error) toast.error(res.error);
      else setName("");
    });
  }

  return (
    <div className="flex gap-2">
      <Input
        value={name}
        placeholder="Имя гостя и Enter…"
        disabled={pending}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            submit();
          }
        }}
      />
      <Button type="button" onClick={submit} disabled={pending}>
        Добавить
      </Button>
    </div>
  );
}

function GuestRow({ weddingId, guest }: { weddingId: string; guest: Guest }) {
  const [editing, setEditing] = useState(false);
  const [pending, start] = useTransition();

  if (editing) {
    return (
      <GuestForm
        weddingId={weddingId}
        guest={guest}
        mode="edit"
        onDone={() => setEditing(false)}
      />
    );
  }

  return (
    <div className="border rounded-md p-3 flex flex-col md:flex-row md:items-center gap-3">
      <div className="min-w-0 flex-1">
        <div className="font-medium truncate">{guest.name}</div>
        <div className="text-sm text-muted-foreground">
          {guest.side ? GUEST_SIDE_LABELS[guest.side] : "—"}
          {guest.groupLabel ? ` · ${guest.groupLabel}` : ""}
        </div>
      </div>
      <select
        value={guest.status}
        disabled={pending}
        className={`h-9 rounded-md border bg-background px-2 text-sm ${STATUS_COLOR[guest.status]}`}
        onChange={(e) =>
          start(async () => {
            const res = await coupleSetGuestStatusAction(weddingId, guest.id, {
              status: e.target.value,
            });
            if (res.error) toast.error(res.error);
          })
        }
      >
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {GUEST_STATUS_LABELS[s]}
          </option>
        ))}
      </select>
      <div className="flex gap-2 shrink-0">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setEditing(true)}
        >
          Изменить
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={pending}
          onClick={() =>
            start(async () => {
              const res = await coupleDeleteGuestAction(weddingId, guest.id);
              if (res.error) toast.error(res.error);
            })
          }
        >
          Удалить
        </Button>
      </div>
    </div>
  );
}

function GuestForm({
  weddingId,
  guest,
  mode,
  onDone,
}: {
  weddingId: string;
  guest?: Guest;
  mode: "create" | "edit";
  onDone: () => void;
}) {
  const [pending, start] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const input = {
      name: String(fd.get("name") ?? ""),
      status: String(fd.get("status") ?? "NO_ANSWER"),
      side: String(fd.get("side") ?? ""),
      groupLabel: String(fd.get("groupLabel") ?? ""),
    };
    start(async () => {
      const res =
        mode === "create"
          ? await coupleAddGuestAction(weddingId, input)
          : await coupleUpdateGuestAction(weddingId, guest!.id, input);
      if (res.error) toast.error(res.error);
      else {
        toast.success(mode === "create" ? "Добавлено" : "Сохранено");
        onDone();
      }
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="border rounded-md p-4 space-y-3 bg-muted/20"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="name">Имя</Label>
          <Input
            id="name"
            name="name"
            defaultValue={guest?.name}
            required
            disabled={pending}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="status">Статус</Label>
          <select
            id="status"
            name="status"
            defaultValue={guest?.status ?? "NO_ANSWER"}
            disabled={pending}
            className="h-9 w-full rounded-md border bg-background px-2 text-sm"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {GUEST_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="side">Сторона</Label>
          <select
            id="side"
            name="side"
            defaultValue={guest?.side ?? ""}
            disabled={pending}
            className="h-9 w-full rounded-md border bg-background px-2 text-sm"
          >
            <option value="">—</option>
            {SIDES.map((s) => (
              <option key={s} value={s}>
                {GUEST_SIDE_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="groupLabel">Группа</Label>
          <Input
            id="groupLabel"
            name="groupLabel"
            defaultValue={guest?.groupLabel ?? ""}
            disabled={pending}
            placeholder="родственники, друзья…"
          />
        </div>
      </div>
      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Сохраняем…" : "Сохранить"}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={pending}
          onClick={onDone}
        >
          Отмена
        </Button>
      </div>
    </form>
  );
}
