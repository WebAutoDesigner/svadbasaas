"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { formatShortDate } from "@/lib/dates";
import { addNoteAction, deleteNoteAction } from "./actions";

type Note = {
  id: string;
  body: string;
  authorName: string | null;
  createdAt: string;
};

export function NotesBoard({
  weddingId,
  notes,
}: {
  weddingId: string;
  notes: Note[];
}) {
  const [body, setBody] = useState("");
  const [pending, start] = useTransition();

  function submit() {
    const text = body.trim();
    if (!text) return;
    start(async () => {
      const res = await addNoteAction(weddingId, { body: text });
      if (res.error) toast.error(res.error);
      else setBody("");
    });
  }

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          disabled={pending}
          rows={3}
          placeholder="Новая заметка: о чём договорились, что обсудили…"
          className="w-full rounded-md border bg-background px-2 py-1.5 text-sm"
        />
        <div className="flex justify-end">
          <Button type="button" onClick={submit} disabled={pending}>
            {pending ? "Сохраняем…" : "Добавить заметку"}
          </Button>
        </div>
      </div>

      {notes.length === 0 ? (
        <p className="text-muted-foreground">
          Заметок пока нет. Здесь удобно вести историю общения с парой.
        </p>
      ) : (
        <div className="space-y-3">
          {notes.map((n) => (
            <NoteCard key={n.id} weddingId={weddingId} note={n} />
          ))}
        </div>
      )}
    </div>
  );
}

function NoteCard({ weddingId, note }: { weddingId: string; note: Note }) {
  const [pending, start] = useTransition();
  return (
    <div className="border rounded-md p-4">
      <div className="text-xs text-muted-foreground mb-1 flex justify-between gap-2">
        <span>
          {formatShortDate(new Date(note.createdAt))}
          {note.authorName ? ` · ${note.authorName}` : ""}
        </span>
        <button
          type="button"
          disabled={pending}
          className="hover:text-destructive"
          onClick={() =>
            start(async () => {
              const res = await deleteNoteAction(weddingId, note.id);
              if (res.error) toast.error(res.error);
            })
          }
        >
          удалить
        </button>
      </div>
      <div className="text-sm whitespace-pre-wrap">{note.body}</div>
    </div>
  );
}
