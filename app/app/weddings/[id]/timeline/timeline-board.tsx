"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  addEventAction,
  deleteEventAction,
  updateEventAction,
} from "./actions";

type Event = {
  id: string;
  startTime: string;
  durationMin: number;
  title: string;
  description: string | null;
  responsible: string | null;
};

export function TimelineBoard({
  weddingId,
  events,
}: {
  weddingId: string;
  events: Event[];
}) {
  const [adding, setAdding] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button type="button" onClick={() => setAdding((v) => !v)}>
          {adding ? "Отмена" : "Добавить событие"}
        </Button>
      </div>

      {adding ? (
        <EventForm
          weddingId={weddingId}
          mode="create"
          onDone={() => setAdding(false)}
        />
      ) : null}

      {events.length === 0 && !adding ? (
        <p className="text-muted-foreground">
          Тайминг пуст. Добавьте события свадебного дня по времени.
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

function EventRow({ weddingId, event }: { weddingId: string; event: Event }) {
  const [editing, setEditing] = useState(false);
  const [pending, start] = useTransition();

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
    <div className="border rounded-md p-3 flex gap-4">
      <div className="text-xl font-bold tabular-nums shrink-0 w-16">
        {event.startTime}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium">{event.title}</div>
        <div className="text-sm text-muted-foreground">
          {event.durationMin > 0 ? `${event.durationMin} мин` : ""}
          {event.responsible ? ` · ${event.responsible}` : ""}
        </div>
        {event.description ? (
          <div className="text-sm text-muted-foreground mt-1">
            {event.description}
          </div>
        ) : null}
      </div>
      <div className="flex flex-col gap-1 shrink-0">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setEditing(true)}
        >
          Изм.
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
          ✕
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
  event?: Event;
  mode: "create" | "edit";
  onDone: () => void;
}) {
  const [pending, start] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const input = {
      startTime: String(fd.get("startTime") ?? ""),
      durationMin: Number(fd.get("durationMin") ?? 0),
      title: String(fd.get("title") ?? ""),
      description: String(fd.get("description") ?? ""),
      responsible: String(fd.get("responsible") ?? ""),
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
    <form
      onSubmit={handleSubmit}
      className="border rounded-md p-4 space-y-3 bg-muted/20"
    >
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="startTime">Время</Label>
          <Input
            id="startTime"
            name="startTime"
            type="time"
            defaultValue={event?.startTime ?? "12:00"}
            required
            disabled={pending}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="durationMin">Длительность, мин</Label>
          <Input
            id="durationMin"
            name="durationMin"
            type="number"
            min={0}
            defaultValue={event?.durationMin ?? 0}
            disabled={pending}
          />
        </div>
      </div>
      <div className="space-y-1">
        <Label htmlFor="title">Событие</Label>
        <Input
          id="title"
          name="title"
          defaultValue={event?.title}
          required
          disabled={pending}
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="responsible">Ответственный</Label>
        <Input
          id="responsible"
          name="responsible"
          defaultValue={event?.responsible ?? ""}
          disabled={pending}
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="description">Описание</Label>
        <Input
          id="description"
          name="description"
          defaultValue={event?.description ?? ""}
          disabled={pending}
        />
      </div>
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
