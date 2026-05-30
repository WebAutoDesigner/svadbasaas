"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PERIOD_LABELS, PERIOD_ORDER } from "@/lib/templates/checklist";
import {
  addItemAction,
  deleteItemAction,
  toggleItemAction,
  applyTemplateAction,
} from "./actions";
import type { ChecklistPeriod } from "@prisma/client";

type Item = {
  id: string;
  title: string;
  period: ChecklistPeriod;
  done: boolean;
  note: string | null;
};

export function ChecklistBoard({
  weddingId,
  items,
  templates,
}: {
  weddingId: string;
  items: Item[];
  templates: { id: string; name: string }[];
}) {
  const [pending, start] = useTransition();
  const total = items.length;
  const done = items.filter((i) => i.done).length;
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);

  function handleToggle(itemId: string, next: boolean) {
    start(async () => {
      const res = await toggleItemAction(weddingId, itemId, next);
      if (res.error) toast.error(res.error);
    });
  }

  function handleDelete(itemId: string) {
    start(async () => {
      const res = await deleteItemAction(weddingId, itemId);
      if (res.error) toast.error(res.error);
    });
  }

  function handleTemplate(templateId: string) {
    start(async () => {
      const res = await applyTemplateAction(weddingId, templateId);
      if (res.error) toast.error(res.error);
      else toast.success("Шаблон применён");
    });
  }

  if (total === 0) {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground">
          Чек-лист пуст. Примените готовый шаблон или добавляйте задачи вручную.
        </p>
        <div className="flex flex-wrap gap-2">
          {templates.map((t) => (
            <Button
              key={t.id}
              type="button"
              disabled={pending}
              onClick={() => handleTemplate(t.id)}
            >
              Применить «{t.name}»
            </Button>
          ))}
        </div>
        <AddItemRow weddingId={weddingId} defaultPeriod="SIX_MONTHS" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">
            Готово {done} из {total}
          </span>
          <span className="text-muted-foreground">{percent}%</span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      {PERIOD_ORDER.map((period) => {
        const group = items.filter((i) => i.period === period);
        if (group.length === 0) return null;
        return (
          <section key={period} className="space-y-2">
            <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              {PERIOD_LABELS[period]}
            </h2>
            <div className="border rounded-md divide-y">
              {group.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start gap-3 p-3 group"
                >
                  <input
                    type="checkbox"
                    checked={item.done}
                    disabled={pending}
                    onChange={(e) => handleToggle(item.id, e.target.checked)}
                    className="mt-1 size-4 shrink-0 cursor-pointer"
                  />
                  <div className="flex-1 min-w-0">
                    <div
                      className={
                        item.done
                          ? "line-through text-muted-foreground"
                          : ""
                      }
                    >
                      {item.title}
                    </div>
                    {item.note ? (
                      <div className="text-sm text-muted-foreground">
                        {item.note}
                      </div>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => handleDelete(item.id)}
                    className="text-muted-foreground hover:text-destructive text-sm opacity-0 group-hover:opacity-100 focus:opacity-100"
                    aria-label="Удалить"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            <AddItemRow weddingId={weddingId} defaultPeriod={period} />
          </section>
        );
      })}
    </div>
  );
}

function AddItemRow({
  weddingId,
  defaultPeriod,
}: {
  weddingId: string;
  defaultPeriod: ChecklistPeriod;
}) {
  const [title, setTitle] = useState("");
  const [pending, start] = useTransition();

  function submit() {
    const value = title.trim();
    if (!value) return;
    start(async () => {
      const res = await addItemAction(weddingId, {
        title: value,
        period: defaultPeriod,
      });
      if (res.error) toast.error(res.error);
      else setTitle("");
    });
  }

  return (
    <div className="flex gap-2">
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            submit();
          }
        }}
        placeholder="Добавить задачу…"
        disabled={pending}
      />
      <Button type="button" variant="outline" disabled={pending} onClick={submit}>
        +
      </Button>
    </div>
  );
}
