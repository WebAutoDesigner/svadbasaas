"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PAYMENT_LABELS } from "@/lib/validators/vendor";
import {
  addVendorAction,
  deleteVendorAction,
  updateVendorAction,
} from "./actions";
import type { PaymentStatus } from "@prisma/client";

type Vendor = {
  id: string;
  name: string;
  service: string;
  contact: string | null;
  amount: number;
  paymentStatus: PaymentStatus;
  note: string | null;
};
type Summary = { total: number; paid: number; count: number };

const fmt = (n: number) => n.toLocaleString("ru-RU");
const STATUSES: PaymentStatus[] = ["NOT_PAID", "PARTIAL", "PAID"];
const STATUS_COLOR: Record<PaymentStatus, string> = {
  NOT_PAID: "text-destructive",
  PARTIAL: "text-amber-600",
  PAID: "text-green-600",
};

export function VendorsBoard({
  weddingId,
  vendors,
  summary,
}: {
  weddingId: string;
  vendors: Vendor[];
  summary: Summary;
}) {
  const [adding, setAdding] = useState(false);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-3">
        <Stat label="Подрядчиков" value={String(summary.count)} />
        <Stat label="Сумма" value={`${fmt(summary.total)} ₽`} />
        <Stat label="Оплачено" value={`${fmt(summary.paid)} ₽`} />
      </div>

      <div className="flex justify-end">
        <Button type="button" onClick={() => setAdding((v) => !v)}>
          {adding ? "Отмена" : "Добавить подрядчика"}
        </Button>
      </div>

      {adding ? (
        <VendorForm
          weddingId={weddingId}
          onDone={() => setAdding(false)}
          mode="create"
        />
      ) : null}

      {vendors.length === 0 && !adding ? (
        <p className="text-muted-foreground">
          Подрядчиков пока нет. Добавьте ведущего, фотографа, декор и т.д.
        </p>
      ) : (
        <div className="space-y-3">
          {vendors.map((v) => (
            <VendorCard key={v.id} weddingId={weddingId} vendor={v} />
          ))}
        </div>
      )}
    </div>
  );
}

function VendorCard({
  weddingId,
  vendor,
}: {
  weddingId: string;
  vendor: Vendor;
}) {
  const [editing, setEditing] = useState(false);
  const [pending, start] = useTransition();

  if (editing) {
    return (
      <VendorForm
        weddingId={weddingId}
        vendor={vendor}
        mode="edit"
        onDone={() => setEditing(false)}
      />
    );
  }

  return (
    <div className="border rounded-md p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
      <div className="min-w-0">
        <div className="font-medium">
          {vendor.name}{" "}
          <span className="text-muted-foreground font-normal">
            · {vendor.service}
          </span>
        </div>
        <div className="text-sm text-muted-foreground">
          {vendor.contact ? `${vendor.contact} · ` : ""}
          {fmt(vendor.amount)} ₽ ·{" "}
          <span className={STATUS_COLOR[vendor.paymentStatus]}>
            {PAYMENT_LABELS[vendor.paymentStatus]}
          </span>
        </div>
        {vendor.note ? (
          <div className="text-sm text-muted-foreground mt-1">{vendor.note}</div>
        ) : null}
      </div>
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
              const res = await deleteVendorAction(weddingId, vendor.id);
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

function VendorForm({
  weddingId,
  vendor,
  mode,
  onDone,
}: {
  weddingId: string;
  vendor?: Vendor;
  mode: "create" | "edit";
  onDone: () => void;
}) {
  const [pending, start] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const input = {
      name: String(fd.get("name") ?? ""),
      service: String(fd.get("service") ?? ""),
      contact: String(fd.get("contact") ?? ""),
      amount: Number(fd.get("amount") ?? 0),
      paymentStatus: String(fd.get("paymentStatus") ?? "NOT_PAID"),
      note: String(fd.get("note") ?? ""),
    };
    start(async () => {
      const res =
        mode === "create"
          ? await addVendorAction(weddingId, input)
          : await updateVendorAction(weddingId, vendor!.id, input);
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
        <Field name="name" label="Название" def={vendor?.name} disabled={pending} />
        <Field
          name="service"
          label="Услуга"
          def={vendor?.service}
          disabled={pending}
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Field
          name="contact"
          label="Контакт"
          def={vendor?.contact ?? ""}
          required={false}
          disabled={pending}
        />
        <Field
          name="amount"
          label="Сумма, ₽"
          type="number"
          def={vendor ? String(vendor.amount) : "0"}
          required={false}
          disabled={pending}
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="paymentStatus">Оплата</Label>
        <select
          id="paymentStatus"
          name="paymentStatus"
          defaultValue={vendor?.paymentStatus ?? "NOT_PAID"}
          disabled={pending}
          className="h-9 w-full rounded-md border bg-background px-2 text-sm"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {PAYMENT_LABELS[s]}
            </option>
          ))}
        </select>
      </div>
      <Field
        name="note"
        label="Заметка"
        def={vendor?.note ?? ""}
        required={false}
        disabled={pending}
      />
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

function Field({
  name,
  label,
  def,
  type = "text",
  required = true,
  disabled,
}: {
  name: string;
  label: string;
  def?: string;
  type?: string;
  required?: boolean;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-1">
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        name={name}
        type={type}
        defaultValue={def}
        required={required}
        disabled={disabled}
        min={type === "number" ? 0 : undefined}
      />
    </div>
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
