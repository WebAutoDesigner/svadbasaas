"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { REQUEST_LINK_LABELS } from "@/lib/validators/request";
import type { RequestKind, RequestStatus } from "@prisma/client";
import {
  createFromTemplateAction,
  createQuestionnaireRequestAction,
  createTaskRequestAction,
  deleteRequestAction,
} from "./actions";

type Q = { id: string; prompt: string; answerText: string | null };
type Att = { id: string; name: string };
type Req = {
  id: string;
  kind: RequestKind;
  title: string;
  message: string | null;
  linkTo: string | null;
  status: RequestStatus;
  coupleReply: string | null;
  questions: Q[];
  attachments: Att[];
};
type TemplateOpt = { id: string; name: string };

const LINKS = ["guests", "seating", "documents", "schedule"];

export function RequestsBoard({
  weddingId,
  requests,
  templates,
}: {
  weddingId: string;
  requests: Req[];
  templates: TemplateOpt[];
}) {
  const [mode, setMode] = useState<"none" | "questionnaire" | "task">("none");
  const open = requests.filter((r) => r.status === "OPEN");
  const done = requests.filter((r) => r.status === "DONE");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2 justify-end">
        <Button
          type="button"
          variant={mode === "questionnaire" ? "default" : "outline"}
          onClick={() => setMode(mode === "questionnaire" ? "none" : "questionnaire")}
        >
          Отправить анкету
        </Button>
        <Button
          type="button"
          variant={mode === "task" ? "default" : "outline"}
          onClick={() => setMode(mode === "task" ? "none" : "task")}
        >
          Отправить просьбу
        </Button>
      </div>

      {mode === "questionnaire" ? (
        <QuestionnaireCreator
          weddingId={weddingId}
          templates={templates}
          onDone={() => setMode("none")}
        />
      ) : null}
      {mode === "task" ? (
        <TaskCreator weddingId={weddingId} onDone={() => setMode("none")} />
      ) : null}

      <Section title={`Ждут ответа (${open.length})`}>
        {open.length === 0 ? (
          <p className="text-sm text-muted-foreground">Открытых запросов нет.</p>
        ) : (
          open.map((r) => <RequestCard key={r.id} weddingId={weddingId} req={r} />)
        )}
      </Section>

      {done.length > 0 ? (
        <Section title={`Отвечено (${done.length})`}>
          {done.map((r) => (
            <RequestCard key={r.id} weddingId={weddingId} req={r} />
          ))}
        </Section>
      ) : null}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h2 className="font-semibold">{title}</h2>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function RequestCard({ weddingId, req }: { weddingId: string; req: Req }) {
  const [pending, start] = useTransition();
  const done = req.status === "DONE";

  return (
    <div className={`border rounded-md p-4 ${done ? "opacity-70" : ""}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="font-medium">
          {req.kind === "QUESTIONNAIRE" ? "📋 " : "✅ "}
          {req.title}{" "}
          <span className="text-xs text-muted-foreground font-normal">
            {done ? "отвечено" : "ждёт ответа"}
            {req.linkTo ? ` · раздел: ${REQUEST_LINK_LABELS[req.linkTo] ?? req.linkTo}` : ""}
          </span>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={pending}
          onClick={() =>
            start(async () => {
              const res = await deleteRequestAction(weddingId, req.id);
              if (res.error) toast.error(res.error);
            })
          }
        >
          Удалить
        </Button>
      </div>

      {req.message ? (
        <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{req.message}</p>
      ) : null}

      {req.kind === "QUESTIONNAIRE" ? (
        <ol className="mt-2 space-y-1 text-sm">
          {req.questions.map((q) => (
            <li key={q.id}>
              <span className="text-muted-foreground">{q.prompt}</span>
              <div className="font-medium">{q.answerText ? q.answerText : "— нет ответа —"}</div>
            </li>
          ))}
        </ol>
      ) : null}

      {req.coupleReply ? (
        <div className="text-sm mt-2">
          <span className="text-muted-foreground">Ответ пары: </span>
          <span className="font-medium">{req.coupleReply}</span>
        </div>
      ) : null}

      {req.attachments.length > 0 ? (
        <div className="mt-2 text-sm">
          <span className="text-muted-foreground">Файлы: </span>
          {req.attachments.map((a) => (
            <a
              key={a.id}
              href={`/api/weddings/${weddingId}/request-attachments/${a.id}`}
              className="underline mr-2"
            >
              {a.name}
            </a>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function QuestionnaireCreator({
  weddingId,
  templates,
  onDone,
}: {
  weddingId: string;
  templates: TemplateOpt[];
  onDone: () => void;
}) {
  const [title, setTitle] = useState("");
  const [questions, setQuestions] = useState<string[]>([""]);
  const [pending, start] = useTransition();

  function fromTemplate(templateId: string) {
    if (!templateId) return;
    start(async () => {
      const res = await createFromTemplateAction(weddingId, templateId);
      if (res.error) toast.error(res.error);
      else {
        toast.success("Анкета отправлена паре");
        onDone();
      }
    });
  }

  function submitCustom() {
    const input = {
      title: title.trim(),
      questions: questions.map((q) => q.trim()).filter(Boolean),
    };
    start(async () => {
      const res = await createQuestionnaireRequestAction(weddingId, input);
      if (res.error) toast.error(res.error);
      else {
        toast.success("Анкета отправлена паре");
        onDone();
      }
    });
  }

  return (
    <div className="border rounded-md p-4 space-y-4 bg-muted/20">
      {templates.length > 0 ? (
        <div className="space-y-1">
          <Label htmlFor="tplPick">Из шаблона</Label>
          <select
            id="tplPick"
            defaultValue=""
            disabled={pending}
            onChange={(e) => fromTemplate(e.target.value)}
            className="h-9 w-full rounded-md border bg-background px-2 text-sm"
          >
            <option value="">— выбрать шаблон —</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground">или соберите свою ниже</p>
        </div>
      ) : null}

      <div className="space-y-1">
        <Label htmlFor="qTitle">Название анкеты</Label>
        <Input id="qTitle" value={title} onChange={(e) => setTitle(e.target.value)} disabled={pending} />
      </div>
      <div className="space-y-2">
        <Label>Вопросы</Label>
        {questions.map((q, i) => (
          <div key={i} className="flex gap-2">
            <Input
              value={q}
              onChange={(e) => setQuestions((qs) => qs.map((x, idx) => (idx === i ? e.target.value : x)))}
              disabled={pending}
              placeholder={`Вопрос ${i + 1}`}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={pending || questions.length === 1}
              onClick={() => setQuestions((qs) => qs.filter((_, idx) => idx !== i))}
            >
              ✕
            </Button>
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" disabled={pending} onClick={() => setQuestions((qs) => [...qs, ""])}>
          + вопрос
        </Button>
      </div>
      <div className="flex gap-2">
        <Button type="button" onClick={submitCustom} disabled={pending}>
          Отправить паре
        </Button>
        <Button type="button" variant="outline" onClick={onDone} disabled={pending}>
          Отмена
        </Button>
      </div>
    </div>
  );
}

function TaskCreator({ weddingId, onDone }: { weddingId: string; onDone: () => void }) {
  const [pending, start] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const input = {
      title: String(fd.get("title") ?? ""),
      message: String(fd.get("message") ?? ""),
      linkTo: String(fd.get("linkTo") ?? ""),
    };
    start(async () => {
      const res = await createTaskRequestAction(weddingId, input);
      if (res.error) toast.error(res.error);
      else {
        toast.success("Просьба отправлена паре");
        onDone();
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="border rounded-md p-4 space-y-3 bg-muted/20">
      <div className="space-y-1">
        <Label htmlFor="title">Что нужно от пары</Label>
        <Input id="title" name="title" required disabled={pending} placeholder="Заполните рассадку" />
      </div>
      <div className="space-y-1">
        <Label htmlFor="message">Описание (необязательно)</Label>
        <textarea
          id="message"
          name="message"
          rows={2}
          disabled={pending}
          className="w-full rounded-md border bg-background px-2 py-1.5 text-sm"
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="linkTo">Привязать к разделу (необязательно)</Label>
        <select
          id="linkTo"
          name="linkTo"
          defaultValue=""
          disabled={pending}
          className="h-9 w-full rounded-md border bg-background px-2 text-sm"
        >
          <option value="">— без привязки —</option>
          {LINKS.map((s) => (
            <option key={s} value={s}>
              {REQUEST_LINK_LABELS[s]}
            </option>
          ))}
        </select>
      </div>
      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          Отправить паре
        </Button>
        <Button type="button" variant="outline" onClick={onDone} disabled={pending}>
          Отмена
        </Button>
      </div>
    </form>
  );
}
