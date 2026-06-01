"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatShortDate, daysUntil, toDateInputValue } from "@/lib/dates";
import { minutesToTime } from "@/lib/validators/wedding-event";
import {
  addEventAction,
  deleteEventAction,
  updateEventAction,
} from "./actions";

type WEvent = {
  id: string;
  title: string;
  date: string; // ISO
  startMinutes: number | null;
  description: string | null;
  visibleToCouple: boolean;
};

export function EventsBoard({
  weddingId,
  events,
}: {
  weddingId: string;
  events: WEvent[];
}) {
  const [adding, setAdding] = useState(false);

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <Button type="button" onClick={() => setAdding((v) => !v)}>
          {adding ? "Отмена" : "Добавить событие"}
        </Button>
      </div>

      {adding ? (
        <EventForm weddingId={weddingId} mode="create" onDone={() => setAdding(false)} />
      ) : null}

      {events.length === 0 ? (
        <p className="text-muted-foreground">
          Событий пока нет. Добавьте вехи: сборы, роспись, банкет…
        </p>
      ) : (
        <div className="space-y-2">
          {events.map((e) => (
            <EventRow key={e.id} weddingId={weddingId} event={e} />
          ))}
        </div>
      )}
    </div>
  );
}

function EventRow({ weddingId, event }: { weddingId: string; event: WEvent }) {
  const [editing, setEditing] = useState(false);
  const [pending, start] = useTransition();
  const past = daysUntil(new Date(event.date)) < 0;
  const time = minutesToTime(event.startMinutes);

  if (editing) {
    return (
      <EventForm
        weddingId={weddingId}
        event={event}
        mode="edit"
        onDone={() => setEditing(false)}
      />
    );
  }

  return (
    <div
      className={`border rounded-md p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 ${past ? "opacity-60" : ""}`}
    >
      <div className="min-w-0">
        <div className="font-medium">
          {event.title}{" "}
          <span className="text-muted-foreground font-normal">
            · {formatShortDate(new Date(event.date))}
            {time ? ` ${time}` : ""}
          </span>{" "}
          <span className="text-xs">
            {event.visibleToCouple ? "👁 видна паре" : "🔒 скрыто"}
          </span>
        </div>
        {event.description ? (
          <div className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
            {event.description}
          </div>
        ) : null}
      </div>
      <div className="flex gap-2 shrink-0">
        <Button type="button" variant="outline" size="sm" onClick={() => setEditing(true)}>
          Изменить
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={pending}
          onClick={() =>
            start(async () => {
              const res = await deleteEventAction(weddingId, event.id);
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

function EventForm({
  weddingId,
  event,
  mode,
  onDone,
}: {
  weddingId: string;
  event?: WEvent;
  mode: "create" | "edit";
  onDone: () => void;
}) {
  const [pending, start] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const input = {
      title: String(fd.get("title") ?? ""),
      date: String(fd.get("date") ?? ""),
      time: String(fd.get("time") ?? ""),
      description: String(fd.get("description") ?? ""),
      visibleToCouple: fd.get("visibleToCouple") === "on",
    };
    start(async () => {
      const res =
        mode === "create"
          ? await addEventAction(weddingId, input)
          : await updateEventAction(weddingId, event!.id, input);
      if (res.error) toast.error(res.error);
      else {
        toast.success(mode === "create" ? "Добавлено" : "Сохранено");
        onDone();
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="border rounded-md p-4 space-y-3 bg-muted/20">
      <div className="space-y-1">
        <Label htmlFor="title">Название</Label>
        <Input id="title" name="title" defaultValue={event?.title} required disabled={pending} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="date">Дата</Label>
          <Input
            id="date"
            name="date"
            type="date"
            defaultValue={event ? toDateInputValue(new Date(event.date)) : ""}
            required
            disabled={pending}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="time">Время (необязательно)</Label>
          <Input
            id="time"
            name="time"
            type="time"
            defaultValue={minutesToTime(event?.startMinutes)}
            disabled={pending}
          />
        </div>
      </div>
      <div className="space-y-1">
        <Label htmlFor="description">Описание (место, детали)</Label>
        <textarea
          id="description"
          name="description"
          defaultValue={event?.description ?? ""}
          disabled={pending}
          rows={3}
          className="w-full rounded-md border bg-background px-2 py-1.5 text-sm"
        />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="visibleToCouple"
          defaultChecked={event?.visibleToCouple ?? false}
          disabled={pending}
        />
        Показать паре
      </label>
      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Сохраняем…" : "Сохранить"}
        </Button>
        <Button type="button" variant="outline" disabled={pending} onClick={onDone}>
          Отмена
        </Button>
      </div>
    </form>
  );
}
