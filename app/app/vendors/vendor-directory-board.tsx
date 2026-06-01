"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  addAgencyVendorAction,
  deleteAgencyVendorAction,
  updateAgencyVendorAction,
} from "./actions";

type Vendor = {
  id: string;
  name: string;
  service: string;
  contact: string | null;
  link: string | null;
  priceNote: string | null;
};

export function VendorDirectoryBoard({ vendors }: { vendors: Vendor[] }) {
  const [adding, setAdding] = useState(false);
  const [search, setSearch] = useState("");
  const [serviceFilter, setServiceFilter] = useState("");

  const services = useMemo(
    () => Array.from(new Set(vendors.map((v) => v.service))).sort(),
    [vendors],
  );

  const filtered = vendors.filter(
    (v) =>
      (serviceFilter === "" || v.service === serviceFilter) &&
      (search === "" || v.name.toLowerCase().includes(search.toLowerCase())),
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Input
          value={search}
          placeholder="Поиск по имени…"
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        {services.length > 0 ? (
          <select
            value={serviceFilter}
            onChange={(e) => setServiceFilter(e.target.value)}
            className="h-9 rounded-md border bg-background px-2 text-sm"
          >
            <option value="">Все типы</option>
            {services.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        ) : null}
        <div className="ml-auto">
          <Button type="button" onClick={() => setAdding((v) => !v)}>
            {adding ? "Отмена" : "Добавить подрядчика"}
          </Button>
        </div>
      </div>

      {adding ? (
        <VendorForm mode="create" onDone={() => setAdding(false)} />
      ) : null}

      {filtered.length === 0 ? (
        <p className="text-muted-foreground">
          {vendors.length === 0
            ? "База пуста. Добавьте проверенных фотографов, ведущих, площадки."
            : "Нет подрядчиков под фильтр."}
        </p>
      ) : (
        <div className="space-y-2">
          {filtered.map((v) => (
            <VendorCard key={v.id} vendor={v} />
          ))}
        </div>
      )}
    </div>
  );
}

function VendorCard({ vendor }: { vendor: Vendor }) {
  const [editing, setEditing] = useState(false);
  const [pending, start] = useTransition();

  if (editing) {
    return <VendorForm vendor={vendor} mode="edit" onDone={() => setEditing(false)} />;
  }

  return (
    <div className="border rounded-md p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
      <div className="min-w-0">
        <div className="font-medium">
          {vendor.name}{" "}
          <span className="text-muted-foreground font-normal">· {vendor.service}</span>
        </div>
        <div className="text-sm text-muted-foreground">
          {vendor.contact ? `${vendor.contact} · ` : ""}
          {vendor.priceNote ? `${vendor.priceNote} · ` : ""}
          {vendor.link ? (
            <a href={vendor.link} target="_blank" rel="noreferrer" className="underline">
              ссылка
            </a>
          ) : null}
        </div>
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
              const res = await deleteAgencyVendorAction(vendor.id);
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
  vendor,
  mode,
  onDone,
}: {
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
      link: String(fd.get("link") ?? ""),
      priceNote: String(fd.get("priceNote") ?? ""),
    };
    start(async () => {
      const res =
        mode === "create"
          ? await addAgencyVendorAction(input)
          : await updateAgencyVendorAction(vendor!.id, input);
      if (res.error) toast.error(res.error);
      else {
        toast.success(mode === "create" ? "Добавлено" : "Сохранено");
        onDone();
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="border rounded-md p-4 space-y-3 bg-muted/20">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Field name="name" label="Имя" def={vendor?.name} disabled={pending} />
        <Field name="service" label="Тип услуги" def={vendor?.service} disabled={pending} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Field name="contact" label="Контакт" def={vendor?.contact ?? ""} required={false} disabled={pending} />
        <Field name="priceNote" label="Примерный прайс" def={vendor?.priceNote ?? ""} required={false} disabled={pending} />
      </div>
      <Field name="link" label="Ссылка (сайт/соцсети)" def={vendor?.link ?? ""} required={false} disabled={pending} />
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

function Field({
  name,
  label,
  def,
  required = true,
  disabled,
}: {
  name: string;
  label: string;
  def?: string;
  required?: boolean;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-1">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} defaultValue={def} required={required} disabled={disabled} />
    </div>
  );
}
