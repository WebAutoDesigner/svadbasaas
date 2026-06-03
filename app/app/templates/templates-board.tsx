"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PERIOD_LABELS, PERIOD_ORDER } from "@/lib/templates/checklist";
import type { ChecklistPeriod, TemplateType } from "@prisma/client";
import {
  addQuestionnaireTemplateAction,
  deleteTemplateAction,
  saveBudgetTemplateAction,
  saveChecklistTemplateAction,
  saveTimelineTemplateAction,
  updateQuestionnaireTemplateAction,
} from "./actions";

export type AnyTemplate = {
  id: string;
  type: TemplateType;
  name: string;
  content: unknown;
};

const TYPE_TITLES: Record<TemplateType, string> = {
  QUESTIONNAIRE: "Анкеты",
  CHECKLIST: "Чек-листы",
  TIMELINE: "Тайминги",
  BUDGET: "Бюджеты",
};

const mm = (m: number) =>
  `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;

export function TemplatesBoard({ templates }: { templates: AnyTemplate[] }) {
  const order: TemplateType[] = ["QUESTIONNAIRE", "CHECKLIST", "TIMELINE", "BUDGET"];
  return (
    <div className="space-y-8">
      {order.map((type) => (
        <TypeSection key={type} type={type} templates={templates.filter((t) => t.type === type)} />
      ))}
    </div>
  );
}

function TypeSection({ type, templates }: { type: TemplateType; templates: AnyTemplate[] }) {
  const [creating, setCreating] = useState(false);
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">{TYPE_TITLES[type]}</h2>
        <Button type="button" variant="outline" size="sm" onClick={() => setCreating((v) => !v)}>
          {creating ? "Отмена" : "Новый"}
        </Button>
      </div>
      {creating ? (
        <Editor type={type} onDone={() => setCreating(false)} />
      ) : null}
      {templates.length === 0 && !creating ? (
        <p className="text-sm text-muted-foreground">Пока пусто.</p>
      ) : (
        <div className="space-y-2">
          {templates.map((t) => (
            <TemplateCard key={t.id} template={t} />
          ))}
        </div>
      )}
    </section>
  );
}

function TemplateCard({ template }: { template: AnyTemplate }) {
  const [editing, setEditing] = useState(false);
  const [pending, start] = useTransition();
  if (editing) return <Editor type={template.type} template={template} onDone={() => setEditing(false)} />;

  return (
    <div className="border rounded-md p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium">{template.name}</span>
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
                const res = await deleteTemplateAction(template.id);
                if (res.error) toast.error(res.error);
              })
            }
          >
            Удалить
          </Button>
        </div>
      </div>
      <Preview template={template} />
    </div>
  );
}

function Preview({ template }: { template: AnyTemplate }) {
  const c = template.content as Record<string, unknown>;
  if (template.type === "QUESTIONNAIRE") {
    const qs = (c.questions as string[]) ?? [];
    return <div className="text-sm text-muted-foreground mt-1">{qs.length} вопрос(ов)</div>;
  }
  const items = (c.items as unknown[]) ?? [];
  return <div className="text-sm text-muted-foreground mt-1">{items.length} пункт(ов)</div>;
}

function Editor({
  type,
  template,
  onDone,
}: {
  type: TemplateType;
  template?: AnyTemplate;
  onDone: () => void;
}) {
  if (type === "QUESTIONNAIRE") return <QuestionnaireEditor template={template} onDone={onDone} />;
  if (type === "CHECKLIST") return <ChecklistEditor template={template} onDone={onDone} />;
  if (type === "TIMELINE") return <TimelineEditor template={template} onDone={onDone} />;
  return <BudgetEditor template={template} onDone={onDone} />;
}

function NameField({ value, onChange, disabled }: { value: string; onChange: (v: string) => void; disabled: boolean }) {
  return (
    <div className="space-y-1">
      <Label>Название шаблона</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled} />
    </div>
  );
}

function Actions({ pending, onDone }: { pending: boolean; onDone: () => void }) {
  return (
    <div className="flex gap-2">
      <Button type="submit" disabled={pending}>{pending ? "Сохраняем…" : "Сохранить"}</Button>
      <Button type="button" variant="outline" disabled={pending} onClick={onDone}>Отмена</Button>
    </div>
  );
}

const wrap = "border rounded-md p-4 space-y-3 bg-muted/20";

function QuestionnaireEditor({ template, onDone }: { template?: AnyTemplate; onDone: () => void }) {
  const init = ((template?.content as { questions?: string[] })?.questions ?? [""]) as string[];
  const [name, setName] = useState(template?.name ?? "");
  const [rows, setRows] = useState<string[]>(init.length ? init : [""]);
  const [pending, start] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const input = { name: name.trim(), questions: rows.map((r) => r.trim()).filter(Boolean) };
    start(async () => {
      const res = template
        ? await updateQuestionnaireTemplateAction(template.id, input)
        : await addQuestionnaireTemplateAction(input);
      if (res.error) toast.error(res.error);
      else { toast.success("Сохранено"); onDone(); }
    });
  }

  return (
    <form onSubmit={submit} className={wrap}>
      <NameField value={name} onChange={setName} disabled={pending} />
      <Label>Вопросы</Label>
      {rows.map((q, i) => (
        <div key={i} className="flex gap-2">
          <Input value={q} disabled={pending} placeholder={`Вопрос ${i + 1}`}
            onChange={(e) => setRows((r) => r.map((x, idx) => (idx === i ? e.target.value : x)))} />
          <Button type="button" variant="outline" size="sm" disabled={pending || rows.length === 1}
            onClick={() => setRows((r) => r.filter((_, idx) => idx !== i))}>✕</Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" disabled={pending} onClick={() => setRows((r) => [...r, ""])}>+ вопрос</Button>
      <Actions pending={pending} onDone={onDone} />
    </form>
  );
}

type CItem = { period: ChecklistPeriod; title: string };
function ChecklistEditor({ template, onDone }: { template?: AnyTemplate; onDone: () => void }) {
  const init = ((template?.content as { items?: CItem[] })?.items ?? []) as CItem[];
  const [name, setName] = useState(template?.name ?? "");
  const [rows, setRows] = useState<CItem[]>(init.length ? init : [{ period: "SIX_MONTHS", title: "" }]);
  const [pending, start] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const input = { name: name.trim(), items: rows.filter((r) => r.title.trim()) };
    start(async () => {
      const res = await saveChecklistTemplateAction(template?.id ?? null, input);
      if (res.error) toast.error(res.error);
      else { toast.success("Сохранено"); onDone(); }
    });
  }

  return (
    <form onSubmit={submit} className={wrap}>
      <NameField value={name} onChange={setName} disabled={pending} />
      <Label>Пункты</Label>
      {rows.map((it, i) => (
        <div key={i} className="flex gap-2">
          <select value={it.period} disabled={pending}
            className="h-9 rounded-md border bg-background px-2 text-sm"
            onChange={(e) => setRows((r) => r.map((x, idx) => (idx === i ? { ...x, period: e.target.value as ChecklistPeriod } : x)))}>
            {PERIOD_ORDER.map((p) => <option key={p} value={p}>{PERIOD_LABELS[p]}</option>)}
          </select>
          <Input value={it.title} disabled={pending} placeholder="Задача"
            onChange={(e) => setRows((r) => r.map((x, idx) => (idx === i ? { ...x, title: e.target.value } : x)))} />
          <Button type="button" variant="outline" size="sm" disabled={pending || rows.length === 1}
            onClick={() => setRows((r) => r.filter((_, idx) => idx !== i))}>✕</Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" disabled={pending}
        onClick={() => setRows((r) => [...r, { period: "SIX_MONTHS", title: "" }])}>+ пункт</Button>
      <Actions pending={pending} onDone={onDone} />
    </form>
  );
}

type TItem = { startMinutes: number; durationMin: number; title: string };
function TimelineEditor({ template, onDone }: { template?: AnyTemplate; onDone: () => void }) {
  const init = ((template?.content as { items?: TItem[] })?.items ?? []) as TItem[];
  const [name, setName] = useState(template?.name ?? "");
  const [rows, setRows] = useState(
    init.length ? init.map((i) => ({ time: mm(i.startMinutes), durationMin: i.durationMin, title: i.title })) : [{ time: "12:00", durationMin: 0, title: "" }],
  );
  const [pending, start] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const input = { name: name.trim(), items: rows.filter((r) => r.title.trim()) };
    start(async () => {
      const res = await saveTimelineTemplateAction(template?.id ?? null, input);
      if (res.error) toast.error(res.error);
      else { toast.success("Сохранено"); onDone(); }
    });
  }

  return (
    <form onSubmit={submit} className={wrap}>
      <NameField value={name} onChange={setName} disabled={pending} />
      <Label>События</Label>
      {rows.map((it, i) => (
        <div key={i} className="flex gap-2">
          <Input type="time" value={it.time} disabled={pending} className="w-28"
            onChange={(e) => setRows((r) => r.map((x, idx) => (idx === i ? { ...x, time: e.target.value } : x)))} />
          <Input type="number" min={0} value={it.durationMin} disabled={pending} className="w-20" title="мин"
            onChange={(e) => setRows((r) => r.map((x, idx) => (idx === i ? { ...x, durationMin: Number(e.target.value) || 0 } : x)))} />
          <Input value={it.title} disabled={pending} placeholder="Событие"
            onChange={(e) => setRows((r) => r.map((x, idx) => (idx === i ? { ...x, title: e.target.value } : x)))} />
          <Button type="button" variant="outline" size="sm" disabled={pending || rows.length === 1}
            onClick={() => setRows((r) => r.filter((_, idx) => idx !== i))}>✕</Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" disabled={pending}
        onClick={() => setRows((r) => [...r, { time: "12:00", durationMin: 0, title: "" }])}>+ событие</Button>
      <Actions pending={pending} onDone={onDone} />
    </form>
  );
}

type BItem = { name: string };
function BudgetEditor({ template, onDone }: { template?: AnyTemplate; onDone: () => void }) {
  const init = ((template?.content as { items?: BItem[] })?.items ?? []) as BItem[];
  const [name, setName] = useState(template?.name ?? "");
  const [rows, setRows] = useState<BItem[]>(init.length ? init : [{ name: "" }]);
  const [pending, start] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const input = { name: name.trim(), items: rows.filter((r) => r.name.trim()) };
    start(async () => {
      const res = await saveBudgetTemplateAction(template?.id ?? null, input);
      if (res.error) toast.error(res.error);
      else { toast.success("Сохранено"); onDone(); }
    });
  }

  return (
    <form onSubmit={submit} className={wrap}>
      <NameField value={name} onChange={setName} disabled={pending} />
      <Label>Статьи</Label>
      {rows.map((it, i) => (
        <div key={i} className="flex gap-2">
          <Input value={it.name} disabled={pending} placeholder="Статья расхода"
            onChange={(e) => setRows((r) => r.map((x, idx) => (idx === i ? { name: e.target.value } : x)))} />
          <Button type="button" variant="outline" size="sm" disabled={pending || rows.length === 1}
            onClick={() => setRows((r) => r.filter((_, idx) => idx !== i))}>✕</Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" disabled={pending}
        onClick={() => setRows((r) => [...r, { name: "" }])}>+ статья</Button>
      <Actions pending={pending} onDone={onDone} />
    </form>
  );
}
