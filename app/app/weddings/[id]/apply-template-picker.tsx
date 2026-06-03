"use client";

import { useTransition } from "react";
import { toast } from "sonner";

type TemplateOpt = { id: string; name: string };

/**
 * Пикер «Применить шаблон» для вкладок свадьбы (бюджет, тайминг).
 * action — серверный экшен соответствующей вкладки (применяет из БД, append).
 */
export function ApplyTemplatePicker({
  weddingId,
  templates,
  action,
}: {
  weddingId: string;
  templates: TemplateOpt[];
  action: (weddingId: string, templateId: string) => Promise<{ error?: string }>;
}) {
  const [pending, start] = useTransition();
  if (templates.length === 0) return null;

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">Применить шаблон:</span>
      <select
        defaultValue=""
        disabled={pending}
        className="h-9 rounded-md border bg-background px-2 text-sm"
        onChange={(e) => {
          const id = e.target.value;
          if (!id) return;
          const sel = e.target;
          start(async () => {
            const res = await action(weddingId, id);
            if (res.error) toast.error(res.error);
            else toast.success("Шаблон применён");
            sel.value = "";
          });
        }}
      >
        <option value="">— выбрать —</option>
        {templates.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </select>
    </div>
  );
}
