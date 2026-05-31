"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  addBudgetItemAction,
  deleteBudgetItemAction,
  ensureCategoriesAction,
  updateBudgetItemAction,
} from "./actions";

type Item = { id: string; name: string; planned: number; actual: number };
type Summary = {
  totalPlanned: number;
  totalActual: number;
  weddingBudget: number;
  remaining: number;
};

const fmt = (n: number) => n.toLocaleString("ru-RU");

export function BudgetBoard({
  weddingId,
  items,
  summary,
}: {
  weddingId: string;
  items: Item[];
  summary: Summary;
}) {
  const [pending, start] = useTransition();

  if (items.length === 0) {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground">
          Бюджет пуст. Создайте стандартные статьи или добавляйте свои.
        </p>
        <Button
          type="button"
          disabled={pending}
          onClick={() =>
            start(async () => {
              const res = await ensureCategoriesAction(weddingId);
              if (res.error) toast.error(res.error);
              else toast.success("Статьи созданы");
            })
          }
        >
          Создать стандартные статьи
        </Button>
        <AddRow weddingId={weddingId} />
      </div>
    );
  }

  const overBudget = summary.remaining < 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Бюджет свадьбы" value={`${fmt(summary.weddingBudget)} ₽`} />
        <Stat label="План (сумма статей)" value={`${fmt(summary.totalPlanned)} ₽`} />
        <Stat label="Факт" value={`${fmt(summary.totalActual)} ₽`} />
        <Stat
          label="Остаток"
          value={`${fmt(summary.remaining)} ₽`}
          danger={overBudget}
        />
      </div>

      <div className="border rounded-md overflow-hidden">
        <div className="grid grid-cols-[1fr_auto_auto_auto] gap-2 px-3 py-2 text-xs text-muted-foreground border-b bg-muted/40">
          <div>Статья</div>
          <div className="text-right w-28">План</div>
          <div className="text-right w-28">Факт</div>
          <div className="w-8" />
        </div>
        {items.map((item) => (
          <BudgetRow key={item.id} weddingId={weddingId} item={item} />
        ))}
      </div>

      <AddRow weddingId={weddingId} />
    </div>
  );
}

function BudgetRow({ weddingId, item }: { weddingId: string; item: Item }) {
  const [planned, setPlanned] = useState(item.planned);
  const [actual, setActual] = useState(item.actual);
  const [pending, start] = useTransition();

  const dirty = planned !== item.planned || actual !== item.actual;

  function save() {
    if (!dirty) return;
    start(async () => {
      const res = await updateBudgetItemAction(weddingId, item.id, {
        planned,
        actual,
      });
      if (res.error) toast.error(res.error);
    });
  }

  return (
    <div className="grid grid-cols-[1fr_auto_auto_auto] gap-2 px-3 py-2 items-center border-b last:border-b-0">
      <div className="truncate">{item.name}</div>
      <Input
        type="number"
        min={0}
        value={planned}
        disabled={pending}
        onChange={(e) => setPlanned(Number(e.target.value) || 0)}
        onBlur={save}
        className="w-28 text-right h-8"
      />
      <Input
        type="number"
        min={0}
        value={actual}
        disabled={pending}
        onChange={(e) => setActual(Number(e.target.value) || 0)}
        onBlur={save}
        className="w-28 text-right h-8"
      />
      <button
        type="button"
        disabled={pending}
        aria-label="Удалить"
        className="text-muted-foreground hover:text-destructive w-8"
        onClick={() =>
          start(async () => {
            const res = await deleteBudgetItemAction(weddingId, item.id);
            if (res.error) toast.error(res.error);
          })
        }
      >
        ✕
      </button>
    </div>
  );
}

function AddRow({ weddingId }: { weddingId: string }) {
  const [name, setName] = useState("");
  const [pending, start] = useTransition();

  function submit() {
    const value = name.trim();
    if (!value) return;
    start(async () => {
      const res = await addBudgetItemAction(weddingId, {
        name: value,
        planned: 0,
        actual: 0,
      });
      if (res.error) toast.error(res.error);
      else setName("");
    });
  }

  return (
    <div className="flex gap-2">
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            submit();
          }
        }}
        placeholder="Новая статья…"
        disabled={pending}
      />
      <Button type="button" variant="outline" disabled={pending} onClick={submit}>
        +
      </Button>
    </div>
  );
}

function Stat({
  label,
  value,
  danger,
}: {
  label: string;
  value: string;
  danger?: boolean;
}) {
  return (
    <div className="border rounded-md p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`font-semibold mt-1 ${danger ? "text-destructive" : ""}`}>
        {value}
      </div>
    </div>
  );
}
