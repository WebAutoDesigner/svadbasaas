"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  addContactAction,
  deleteContactAction,
  updateContactAction,
} from "./contacts-actions";

type Contact = { id: string; label: string; value: string };

export function ContactsBlock({
  weddingId,
  contacts,
}: {
  weddingId: string;
  contacts: Contact[];
}) {
  const [adding, setAdding] = useState(false);

  return (
    <div className="pt-2 border-t">
      <div className="flex items-center justify-between mb-2">
        <h2 className="font-semibold">Контакты пары</h2>
        <Button type="button" variant="outline" size="sm" onClick={() => setAdding((v) => !v)}>
          {adding ? "Отмена" : "Добавить контакт"}
        </Button>
      </div>

      {adding ? (
        <ContactForm weddingId={weddingId} mode="create" onDone={() => setAdding(false)} />
      ) : null}

      {contacts.length === 0 && !adding ? (
        <p className="text-sm text-muted-foreground">
          Контактов пока нет. Добавьте телефоны/мессенджеры пары.
        </p>
      ) : (
        <div className="space-y-2">
          {contacts.map((c) => (
            <ContactRow key={c.id} weddingId={weddingId} contact={c} />
          ))}
        </div>
      )}
    </div>
  );
}

function ContactRow({ weddingId, contact }: { weddingId: string; contact: Contact }) {
  const [editing, setEditing] = useState(false);
  const [pending, start] = useTransition();

  if (editing) {
    return (
      <ContactForm
        weddingId={weddingId}
        contact={contact}
        mode="edit"
        onDone={() => setEditing(false)}
      />
    );
  }

  return (
    <div className="border rounded-md p-2 flex items-center justify-between gap-3">
      <div className="min-w-0">
        <span className="text-muted-foreground text-sm">{contact.label}: </span>
        <span className="font-medium break-all">{contact.value}</span>
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
              const res = await deleteContactAction(weddingId, contact.id);
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

function ContactForm({
  weddingId,
  contact,
  mode,
  onDone,
}: {
  weddingId: string;
  contact?: Contact;
  mode: "create" | "edit";
  onDone: () => void;
}) {
  const [pending, start] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const input = {
      label: String(fd.get("label") ?? ""),
      value: String(fd.get("value") ?? ""),
    };
    start(async () => {
      const res =
        mode === "create"
          ? await addContactAction(weddingId, input)
          : await updateContactAction(weddingId, contact!.id, input);
      if (res.error) toast.error(res.error);
      else {
        toast.success(mode === "create" ? "Добавлено" : "Сохранено");
        onDone();
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="border rounded-md p-3 mb-2 flex flex-col md:flex-row gap-2 bg-muted/20">
      <Input
        name="label"
        placeholder="Пометка (Мария, WhatsApp…)"
        defaultValue={contact?.label}
        required
        disabled={pending}
        className="md:max-w-48"
      />
      <Input
        name="value"
        placeholder="Телефон / ник / email"
        defaultValue={contact?.value}
        required
        disabled={pending}
      />
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={pending}>
          Сохранить
        </Button>
        <Button type="button" size="sm" variant="outline" disabled={pending} onClick={onDone}>
          Отмена
        </Button>
      </div>
    </form>
  );
}
