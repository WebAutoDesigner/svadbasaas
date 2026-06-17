"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatShortDate, toDateInputValue } from "@/lib/dates";
import {
  addPaymentAction,
  deletePaymentAction,
  updateFeeAction,
  updatePaymentAction,
} from "./actions";

type Payment = { id: string; amount: number; paidOn: string; note: string | null };
type Summary = { fee: number; paid: number; remaining: number };

const fmt = (n: number) => n.toLocaleString("ru-RU");

export function FinanceBoard({
  weddingId,
  summary,
  payments,
}: {
  weddingId: string;
  summary: Summary;
  payments: Payment[];
}) {
  const [adding, setAdding] = useState(false);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <FeeStat weddingId={weddingId} fee={summary.fee} />
        <Stat label="Заплачено" value={`${fmt(summary.paid)} ₽`} />
        <Stat
          label="Осталось"
          value={`${fmt(summary.remaining)} ₽`}
          accent={summary.remaining > 0 ? "text-amber-600" : "text-green-600"}
        />
      </div>

      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Платежи от пары</h2>
        <Button type="button" onClick={() => setAdding((v) => !v)}>
          {adding ? "Отмена" : "Добавить платёж"}
        </Button>
      </div>

      {adding ? (
        <PaymentForm weddingId={weddingId} mode="create" onDone={() => setAdding(false)} />
      ) : null}

      {payments.length === 0 && !adding ? (
        <p className="text-muted-foreground">
          Платежей пока нет. Добавьте предоплату и доплаты.
        </p>
      ) : (
        <div className="space-y-2">
          {payments.map((p) => (
            <PaymentRow key={p.id} weddingId={weddingId} payment={p} />
          ))}
        </div>
      )}
    </div>
  );
}

function FeeStat({ weddingId, fee }: { weddingId: string; fee: number }) {
  const [editing, setEditing] = useState(false);
  const [pending, start] = useTransition();

  if (editing) {
    return (
      <form
        className="border rounded-md p-3 space-y-1"
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          start(async () => {
            const res = await updateFeeAction(weddingId, {
              agencyFee: Number(fd.get("agencyFee") ?? 0),
            });
            if (res.error) toast.error(res.error);
            else {
              toast.success("Гонорар сохранён");
              setEditing(false);
            }
          });
        }}
      >
        <Label htmlFor="agencyFee" className="text-xs text-muted-foreground">
          Гонорар, ₽
        </Label>
        <div className="flex gap-2">
          <Input
            id="agencyFee"
            name="agencyFee"
            type="number"
            min={0}
            defaultValue={fee || ""}
            placeholder="0"
            onFocus={(e) => e.target.select()}
            disabled={pending}
          />
          <Button type="submit" size="sm" disabled={pending}>
            ОК
          </Button>
        </div>
      </form>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className="border rounded-md p-3 text-left hover:border-foreground/40"
    >
      <div className="text-xs text-muted-foreground">Гонорар (нажми, чтобы изменить)</div>
      <div className="font-semibold mt-1">{fmt(fee)} ₽</div>
    </button>
  );
}

function PaymentRow({ weddingId, payment }: { weddingId: string; payment: Payment }) {
  const [editing, setEditing] = useState(false);
  const [pending, start] = useTransition();

  if (editing) {
    return (
      <PaymentForm
        weddingId={weddingId}
        payment={payment}
        mode="edit"
        onDone={() => setEditing(false)}
      />
    );
  }

  return (
    <div className="border rounded-md p-3 flex items-center justify-between gap-3">
      <div className="min-w-0">
        <span className="font-medium">{fmt(payment.amount)} ₽</span>{" "}
        <span className="text-muted-foreground text-sm">
          · {formatShortDate(new Date(payment.paidOn))}
          {payment.note ? ` · ${payment.note}` : ""}
        </span>
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
              const res = await deletePaymentAction(weddingId, payment.id);
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

function PaymentForm({
  weddingId,
  payment,
  mode,
  onDone,
}: {
  weddingId: string;
  payment?: Payment;
  mode: "create" | "edit";
  onDone: () => void;
}) {
  const [pending, start] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const input = {
      amount: Number(fd.get("amount") ?? 0),
      paidOn: String(fd.get("paidOn") ?? ""),
      note: String(fd.get("note") ?? ""),
    };
    start(async () => {
      const res =
        mode === "create"
          ? await addPaymentAction(weddingId, input)
          : await updatePaymentAction(weddingId, payment!.id, input);
      if (res.error) toast.error(res.error);
      else {
        toast.success(mode === "create" ? "Платёж добавлен" : "Сохранено");
        onDone();
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="border rounded-md p-4 space-y-3 bg-muted/20">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="amount">Сумма, ₽</Label>
          <Input
            id="amount"
            name="amount"
            type="number"
            min={0}
            defaultValue={payment ? String(payment.amount) : ""}
            placeholder="0"
            onFocus={(e) => e.target.select()}
            disabled={pending}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="paidOn">Дата</Label>
          <Input
            id="paidOn"
            name="paidOn"
            type="date"
            defaultValue={payment ? toDateInputValue(new Date(payment.paidOn)) : ""}
            required
            disabled={pending}
          />
        </div>
      </div>
      <div className="space-y-1">
        <Label htmlFor="note">Заметка</Label>
        <Input
          id="note"
          name="note"
          defaultValue={payment?.note ?? ""}
          placeholder="предоплата, доплата…"
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

function Stat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="border rounded-md p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`font-semibold mt-1 ${accent ?? ""}`}>{value}</div>
    </div>
  );
}
