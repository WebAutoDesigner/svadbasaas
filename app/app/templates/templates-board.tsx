"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  addQuestionnaireTemplateAction,
  deleteTemplateAction,
  updateQuestionnaireTemplateAction,
} from "./actions";

type Template = { id: string; name: string; questions: string[] };

export function TemplatesBoard({ templates }: { templates: Template[] }) {
  const [creating, setCreating] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button type="button" onClick={() => setCreating((v) => !v)}>
          {creating ? "Отмена" : "Новая анкета-шаблон"}
        </Button>
      </div>

      {creating ? (
        <TemplateForm mode="create" onDone={() => setCreating(false)} />
      ) : null}

      {templates.length === 0 && !creating ? (
        <p className="text-muted-foreground">
          Шаблонов пока нет. Соберите первую анкету.
        </p>
      ) : (
        <div className="space-y-3">
          {templates.map((t) => (
            <TemplateCard key={t.id} template={t} />
          ))}
        </div>
      )}
    </div>
  );
}

function TemplateCard({ template }: { template: Template }) {
  const [editing, setEditing] = useState(false);
  const [pending, start] = useTransition();

  if (editing) {
    return (
      <TemplateForm
        mode="edit"
        template={template}
        onDone={() => setEditing(false)}
      />
    );
  }

  return (
    <div className="border rounded-md p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="font-medium">{template.name}</div>
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
      <ol className="mt-2 list-decimal list-inside text-sm text-muted-foreground space-y-0.5">
        {template.questions.map((q, i) => (
          <li key={i}>{q}</li>
        ))}
      </ol>
    </div>
  );
}

function TemplateForm({
  mode,
  template,
  onDone,
}: {
  mode: "create" | "edit";
  template?: Template;
  onDone: () => void;
}) {
  const [name, setName] = useState(template?.name ?? "");
  const [questions, setQuestions] = useState<string[]>(
    template?.questions.length ? template.questions : [""],
  );
  const [pending, start] = useTransition();

  function setQ(i: number, v: string) {
    setQuestions((qs) => qs.map((q, idx) => (idx === i ? v : q)));
  }
  function addQ() {
    setQuestions((qs) => [...qs, ""]);
  }
  function removeQ(i: number) {
    setQuestions((qs) => qs.filter((_, idx) => idx !== i));
  }

  function submit() {
    const cleanQuestions = questions.map((q) => q.trim()).filter(Boolean);
    const input = { name: name.trim(), questions: cleanQuestions };
    start(async () => {
      const res =
        mode === "create"
          ? await addQuestionnaireTemplateAction(input)
          : await updateQuestionnaireTemplateAction(template!.id, input);
      if (res.error) toast.error(res.error);
      else {
        toast.success(mode === "create" ? "Шаблон создан" : "Сохранено");
        onDone();
      }
    });
  }

  return (
    <div className="border rounded-md p-4 space-y-3 bg-muted/20">
      <div className="space-y-1">
        <Label htmlFor="tpl-name">Название анкеты</Label>
        <Input
          id="tpl-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={pending}
          placeholder="Брифинг пары"
        />
      </div>
      <div className="space-y-2">
        <Label>Вопросы</Label>
        {questions.map((q, i) => (
          <div key={i} className="flex gap-2">
            <Input
              value={q}
              onChange={(e) => setQ(i, e.target.value)}
              disabled={pending}
              placeholder={`Вопрос ${i + 1}`}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={pending || questions.length === 1}
              onClick={() => removeQ(i)}
            >
              ✕
            </Button>
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={addQ} disabled={pending}>
          + вопрос
        </Button>
      </div>
      <div className="flex gap-2">
        <Button type="button" onClick={submit} disabled={pending}>
          {pending ? "Сохраняем…" : "Сохранить"}
        </Button>
        <Button type="button" variant="outline" onClick={onDone} disabled={pending}>
          Отмена
        </Button>
      </div>
    </div>
  );
}
