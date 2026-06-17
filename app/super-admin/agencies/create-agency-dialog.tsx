"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { formatPhone } from "@/lib/phone";
import { createAgencyAction, type CreateAgencyFormState } from "./actions";

const initialState: CreateAgencyFormState = {};
const LOGIN_URL = "http://85.239.59.252:3012/login";

export function CreateAgencyDialog() {
  const [open, setOpen] = useState(false);
  // Закрываем по клику на фон только если жест НАЧАЛСЯ на фоне
  // (иначе выделение текста мышью внутри окна закрывало бы его).
  const [downOnOverlay, setDownOnOverlay] = useState(false);
  const [state, formAction, isPending] = useActionState(
    createAgencyAction,
    initialState,
  );

  function close() {
    setOpen(false);
  }

  const created = state.ok ? state.created : undefined;

  return (
    <>
      <Button type="button" onClick={() => setOpen(true)}>
        Создать агентство
      </Button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onMouseDown={(e) => setDownOnOverlay(e.target === e.currentTarget)}
          onMouseUp={(e) => {
            if (e.target === e.currentTarget && downOnOverlay && !isPending) {
              close();
            }
            setDownOnOverlay(false);
          }}
        >
          <div className="w-full max-w-md rounded-xl border bg-card p-6 shadow-xl">
            {created ? (
              <SuccessPanel created={created} onClose={close} />
            ) : (
              <>
                <h2 className="mb-1 text-xl font-semibold">Новое агентство</h2>
                <p className="mb-4 text-sm text-muted-foreground">
                  Телефон и пароль — это доступ владельца для входа.
                </p>
                <form action={formAction} className="space-y-3">
                  <Field
                    name="agencyName"
                    label="Название агентства"
                    error={state.fieldErrors?.agencyName}
                    disabled={isPending}
                  />
                  <Field
                    name="ownerName"
                    label="Имя владельца"
                    error={state.fieldErrors?.ownerName}
                    disabled={isPending}
                  />
                  <Field
                    name="ownerPhone"
                    label="Телефон владельца"
                    type="tel"
                    placeholder="+7 999 123-45-67"
                    error={state.fieldErrors?.ownerPhone}
                    disabled={isPending}
                  />
                  <Field
                    name="ownerPassword"
                    label="Начальный пароль (≥8 симв)"
                    type="text"
                    error={state.fieldErrors?.ownerPassword}
                    disabled={isPending}
                  />
                  {state.error ? (
                    <p className="text-sm text-destructive" role="alert">
                      {state.error}
                    </p>
                  ) : null}
                  <div className="flex justify-end gap-2 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      disabled={isPending}
                      onClick={close}
                    >
                      Отмена
                    </Button>
                    <Button type="submit" disabled={isPending}>
                      {isPending ? "Создаём…" : "Создать"}
                    </Button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}

function SuccessPanel({
  created,
  onClose,
}: {
  created: NonNullable<CreateAgencyFormState["created"]>;
  onClose: () => void;
}) {
  const credentialsText = [
    `Агентство «${created.agencyName}»`,
    `Вход: ${LOGIN_URL}`,
    `Телефон: ${formatPhone(created.phone)}`,
    `Пароль: ${created.password}`,
  ].join("\n");

  async function copy() {
    // navigator.clipboard работает только в защищённом контексте (HTTPS/localhost).
    // На голом HTTP используем запасной способ через скрытую textarea.
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(credentialsText);
      } else {
        const ta = document.createElement("textarea");
        ta.value = credentialsText;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        const ok = document.execCommand("copy");
        document.body.removeChild(ta);
        if (!ok) throw new Error("execCommand failed");
      }
      toast.success("Скопировано — отправьте агентству");
    } catch {
      toast.error("Не удалось скопировать — выделите текст вручную");
    }
  }

  return (
    <div>
      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gold">
        Агентство создано
      </div>
      <h2 className="mt-1 text-xl font-semibold">«{created.agencyName}»</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Передайте владельцу эти данные для входа:
      </p>

      <div className="mt-4 space-y-3 rounded-lg border bg-background p-4">
        <Row label="Вход" value={LOGIN_URL} />
        <Row label="Телефон" value={formatPhone(created.phone)} mono />
        <Row label="Пароль" value={created.password} mono />
      </div>

      <div className="mt-5 flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Закрыть
        </Button>
        <Button type="button" onClick={copy}>
          Скопировать всё
        </Button>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </span>
      <span
        className={`select-all text-right text-sm ${mono ? "font-mono" : "break-all"}`}
      >
        {value}
      </span>
    </div>
  );
}

function Field({
  name,
  label,
  type = "text",
  placeholder,
  error,
  disabled,
}: {
  name: string;
  label: string;
  type?: string;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-1">
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        required
        disabled={disabled}
      />
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
