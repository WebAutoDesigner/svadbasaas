"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type CoordinatorOption = { id: string; name: string };

type Values = {
  brideName?: string;
  groomName?: string;
  date?: string;
  budget?: number;
  location?: string;
  guestCount?: number | null;
  coordinatorId?: string | null;
  timezone?: string;
  source?: string;
};

/**
 * Поля формы свадьбы — переиспользуются в create и edit.
 * Сабмит-кнопку и <form> оборачивает родитель.
 */
export function WeddingFields({
  values = {},
  coordinators,
  fieldErrors,
  disabled,
}: {
  values?: Values;
  coordinators: CoordinatorOption[];
  fieldErrors?: Record<string, string>;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="brideName">Невеста</Label>
          <Input
            id="brideName"
            name="brideName"
            defaultValue={values.brideName}
            required
            disabled={disabled}
          />
          {fieldErrors?.["brideName"] ? (
            <p className="text-sm text-destructive">{fieldErrors["brideName"]}</p>
          ) : null}
        </div>
        <div className="space-y-1">
          <Label htmlFor="groomName">Жених</Label>
          <Input
            id="groomName"
            name="groomName"
            defaultValue={values.groomName}
            required
            disabled={disabled}
          />
          {fieldErrors?.["groomName"] ? (
            <p className="text-sm text-destructive">{fieldErrors["groomName"]}</p>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="date">Дата свадьбы</Label>
          <Input
            id="date"
            name="date"
            type="date"
            defaultValue={values.date}
            required
            disabled={disabled}
          />
          {fieldErrors?.["date"] ? (
            <p className="text-sm text-destructive">{fieldErrors["date"]}</p>
          ) : null}
        </div>
        <div className="space-y-1">
          <Label htmlFor="budget">Бюджет, ₽</Label>
          <Input
            id="budget"
            name="budget"
            type="number"
            min={0}
            defaultValue={values.budget ?? 0}
            disabled={disabled}
          />
          {fieldErrors?.["budget"] ? (
            <p className="text-sm text-destructive">{fieldErrors["budget"]}</p>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="location">Локация</Label>
          <Input
            id="location"
            name="location"
            defaultValue={values.location ?? ""}
            disabled={disabled}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="guestCount">Гостей</Label>
          <Input
            id="guestCount"
            name="guestCount"
            type="number"
            min={0}
            defaultValue={values.guestCount ?? ""}
            disabled={disabled}
          />
        </div>
      </div>

      <div className="space-y-1">
        <Label htmlFor="coordinatorId">Координатор</Label>
        <select
          id="coordinatorId"
          name="coordinatorId"
          defaultValue={values.coordinatorId ?? ""}
          disabled={disabled}
          className="h-9 w-full rounded-md border bg-background px-2 text-sm"
        >
          <option value="">— не назначен —</option>
          {coordinators.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <Label htmlFor="source">Откуда пришли (источник)</Label>
        <Input
          id="source"
          name="source"
          defaultValue={values.source ?? ""}
          disabled={disabled}
          placeholder="Instagram, сарафан, реклама…"
        />
      </div>

      <input
        type="hidden"
        name="timezone"
        value={values.timezone ?? "Europe/Moscow"}
      />
    </div>
  );
}
