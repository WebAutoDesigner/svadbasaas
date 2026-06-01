"use client";

import { useState, useTransition, type ReactNode } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GUEST_SIDE_LABELS, GUEST_STATUS_LABELS } from "@/lib/validators/guest";
import type { GuestSide, GuestStatus } from "@prisma/client";

export type SeatingGuest = {
  id: string;
  name: string;
  status: GuestStatus;
  side: GuestSide | null;
  groupLabel: string | null;
};
export type PoolGuest = SeatingGuest & { tableId: string | null };
export type SeatingTableView = {
  id: string;
  name: string;
  capacity: number;
  guests: SeatingGuest[];
};

export type SeatingActions = {
  assign: (weddingId: string, guestId: string, tableId: string) => Promise<{ error?: string }>;
  unassign: (weddingId: string, guestId: string) => Promise<{ error?: string }>;
  addTable: (weddingId: string, input: { name: string; capacity: number }) => Promise<{ error?: string }>;
  updateTable: (weddingId: string, tableId: string, input: { name: string; capacity: number }) => Promise<{ error?: string }>;
  deleteTable: (weddingId: string, tableId: string) => Promise<{ error?: string }>;
};

export function SeatingBoard({
  weddingId,
  pool,
  tables,
  actions,
  badge,
}: {
  weddingId: string;
  pool: PoolGuest[];
  tables: SeatingTableView[];
  actions: SeatingActions;
  badge?: ReactNode;
}) {
  const [comingOnly, setComingOnly] = useState(false);
  const [addingTable, setAddingTable] = useState(false);

  const unassigned = pool.filter((g) => !g.tableId);
  const visiblePool = comingOnly
    ? unassigned.filter((g) => g.status === "COMING")
    : unassigned;
  const seated = tables.reduce((s, t) => s + t.guests.length, 0);
  const total = pool.length;

  return (
    <div className="space-y-6">
      {badge}

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <Stat label="Столов" value={String(tables.length)} />
        <Stat label="Рассажено" value={`${seated} / ${total}`} />
        <Stat label="Не рассажены" value={String(unassigned.length)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
        {/* Пул «не рассажены» */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Не рассажены ({unassigned.length})</h2>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={comingOnly}
              onChange={(e) => setComingOnly(e.target.checked)}
            />
            только «придут»
          </label>
          {visiblePool.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {unassigned.length === 0
                ? "Все рассажены 🎉"
                : "Нет подходящих под фильтр."}
            </p>
          ) : (
            <div className="space-y-2">
              {visiblePool.map((g) => (
                <PoolRow
                  key={g.id}
                  weddingId={weddingId}
                  guest={g}
                  tables={tables}
                  assign={actions.assign}
                />
              ))}
            </div>
          )}
        </div>

        {/* Столы */}
        <div className="space-y-3">
          <div className="flex flex-wrap gap-3">
            {tables.map((t) => (
              <TableCard
                key={t.id}
                weddingId={weddingId}
                table={t}
                unassign={actions.unassign}
                updateTable={actions.updateTable}
                deleteTable={actions.deleteTable}
              />
            ))}
            {addingTable ? (
              <TableForm
                weddingId={weddingId}
                mode="create"
                save={actions.addTable}
                onDone={() => setAddingTable(false)}
              />
            ) : (
              <button
                type="button"
                onClick={() => setAddingTable(true)}
                className="border border-dashed rounded-md p-4 w-56 text-muted-foreground hover:text-foreground hover:border-foreground/40"
              >
                + добавить стол
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function PoolRow({
  weddingId,
  guest,
  tables,
  assign,
}: {
  weddingId: string;
  guest: PoolGuest;
  tables: SeatingTableView[];
  assign: SeatingActions["assign"];
}) {
  const [pending, start] = useTransition();
  return (
    <div className="border rounded-md p-2 flex items-center gap-2">
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium truncate">
          {guest.name}{" "}
          <span className="text-muted-foreground font-normal">
            {GUEST_STATUS_LABELS[guest.status]}
          </span>
        </div>
        {guest.side || guest.groupLabel ? (
          <div className="text-xs text-muted-foreground truncate">
            {guest.side ? GUEST_SIDE_LABELS[guest.side] : ""}
            {guest.side && guest.groupLabel ? " · " : ""}
            {guest.groupLabel ?? ""}
          </div>
        ) : null}
      </div>
      <select
        defaultValue=""
        disabled={pending || tables.length === 0}
        className="h-8 rounded-md border bg-background px-1 text-xs max-w-28"
        onChange={(e) => {
          const tableId = e.target.value;
          if (!tableId) return;
          start(async () => {
            const res = await assign(weddingId, guest.id, tableId);
            if (res.error) toast.error(res.error);
          });
        }}
      >
        <option value="">За стол…</option>
        {tables.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </select>
    </div>
  );
}

function TableCard({
  weddingId,
  table,
  unassign,
  updateTable,
  deleteTable,
}: {
  weddingId: string;
  table: SeatingTableView;
  unassign: SeatingActions["unassign"];
  updateTable: SeatingActions["updateTable"];
  deleteTable: SeatingActions["deleteTable"];
}) {
  const [editing, setEditing] = useState(false);
  const [pending, start] = useTransition();
  const over = table.capacity > 0 && table.guests.length > table.capacity;

  if (editing) {
    return (
      <TableForm
        weddingId={weddingId}
        table={table}
        mode="edit"
        save={(wId, input) => updateTable(wId, table.id, input)}
        onDone={() => setEditing(false)}
        onDelete={() =>
          start(async () => {
            const res = await deleteTable(weddingId, table.id);
            if (res.error) toast.error(res.error);
            else setEditing(false);
          })
        }
      />
    );
  }

  return (
    <div className="border rounded-md p-3 w-56 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="font-medium truncate">{table.name}</div>
        <span className={`text-xs ${over ? "text-destructive font-semibold" : "text-muted-foreground"}`}>
          {table.guests.length}/{table.capacity || "∞"}
          {over ? " ⚠" : ""}
        </span>
      </div>
      <div className="space-y-1 min-h-8">
        {table.guests.length === 0 ? (
          <p className="text-xs text-muted-foreground">пусто</p>
        ) : (
          table.guests.map((g) => (
            <div key={g.id} className="flex items-center justify-between gap-1 text-sm">
              <span className="truncate">{g.name}</span>
              <button
                type="button"
                disabled={pending}
                className="text-xs text-muted-foreground hover:text-destructive shrink-0"
                onClick={() =>
                  start(async () => {
                    const res = await unassign(weddingId, g.id);
                    if (res.error) toast.error(res.error);
                  })
                }
              >
                убрать
              </button>
            </div>
          ))
        )}
      </div>
      <Button type="button" variant="outline" size="sm" onClick={() => setEditing(true)}>
        Изменить стол
      </Button>
    </div>
  );
}

function TableForm({
  weddingId,
  table,
  mode,
  save,
  onDone,
  onDelete,
}: {
  weddingId: string;
  table?: SeatingTableView;
  mode: "create" | "edit";
  save: (weddingId: string, input: { name: string; capacity: number }) => Promise<{ error?: string }>;
  onDone: () => void;
  onDelete?: () => void;
}) {
  const [pending, start] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const input = {
      name: String(fd.get("name") ?? ""),
      capacity: Number(fd.get("capacity") ?? 0),
    };
    start(async () => {
      const res = await save(weddingId, input);
      if (res.error) toast.error(res.error);
      else {
        toast.success(mode === "create" ? "Стол добавлен" : "Сохранено");
        onDone();
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="border rounded-md p-3 w-56 space-y-2 bg-muted/20">
      <div className="space-y-1">
        <Label htmlFor="name">Название</Label>
        <Input id="name" name="name" defaultValue={table?.name ?? ""} required disabled={pending} />
      </div>
      <div className="space-y-1">
        <Label htmlFor="capacity">Мест</Label>
        <Input
          id="capacity"
          name="capacity"
          type="number"
          min={0}
          defaultValue={table ? String(table.capacity) : "8"}
          disabled={pending}
        />
      </div>
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={pending}>
          Сохранить
        </Button>
        <Button type="button" size="sm" variant="outline" disabled={pending} onClick={onDone}>
          Отмена
        </Button>
      </div>
      {mode === "edit" && onDelete ? (
        <Button type="button" size="sm" variant="outline" disabled={pending} onClick={onDelete}>
          Удалить стол
        </Button>
      ) : null}
    </form>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border rounded-md p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-semibold mt-1">{value}</div>
    </div>
  );
}
