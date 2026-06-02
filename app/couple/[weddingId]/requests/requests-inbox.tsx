"use client";

import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { RequestKind, RequestStatus } from "@prisma/client";
import {
  coupleAnswerAction,
  coupleCompleteTaskAction,
  coupleDeleteAttachmentAction,
  coupleUploadAttachmentAction,
} from "./actions";

type Q = { id: string; prompt: string; answerText: string | null };
type Att = { id: string; name: string };
type Req = {
  id: string;
  kind: RequestKind;
  title: string;
  message: string | null;
  status: RequestStatus;
  coupleReply: string | null;
  questions: Q[];
  attachments: Att[];
};

export function CoupleRequestsInbox({
  weddingId,
  requests,
}: {
  weddingId: string;
  requests: Req[];
}) {
  const open = requests.filter((r) => r.status === "OPEN");
  const done = requests.filter((r) => r.status === "DONE");

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <h2 className="font-semibold">🔔 Ждут вашего ответа ({open.length})</h2>
        {open.length === 0 ? (
          <p className="text-sm text-muted-foreground">Новых запросов нет 🎉</p>
        ) : (
          open.map((r) => <OpenCard key={r.id} weddingId={weddingId} req={r} />)
        )}
      </div>

      {done.length > 0 ? (
        <div className="space-y-3">
          <h2 className="font-semibold text-muted-foreground">История ({done.length})</h2>
          {done.map((r) => (
            <DoneCard key={r.id} weddingId={weddingId} req={r} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function Attachments({
  weddingId,
  attachments,
  editable,
}: {
  weddingId: string;
  attachments: Att[];
  editable: boolean;
}) {
  const [pending, start] = useTransition();
  if (attachments.length === 0) return null;
  return (
    <div className="text-sm flex flex-wrap gap-2 items-center">
      <span className="text-muted-foreground">Файлы:</span>
      {attachments.map((a) => (
        <span key={a.id} className="inline-flex items-center gap-1">
          <a href={`/api/couple/request-attachments/${a.id}`} className="underline">
            {a.name}
          </a>
          {editable ? (
            <button
              type="button"
              disabled={pending}
              className="text-xs text-muted-foreground hover:text-destructive"
              onClick={() =>
                start(async () => {
                  const res = await coupleDeleteAttachmentAction(weddingId, a.id);
                  if (res.error) toast.error(res.error);
                })
              }
            >
              ✕
            </button>
          ) : null}
        </span>
      ))}
    </div>
  );
}

function FileUpload({ weddingId, requestId }: { weddingId: string; requestId: string }) {
  const ref = useRef<HTMLInputElement>(null);
  const [pending, start] = useTransition();
  return (
    <div>
      <input
        ref={ref}
        type="file"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          const fd = new FormData();
          fd.set("file", file);
          start(async () => {
            const res = await coupleUploadAttachmentAction(weddingId, requestId, fd);
            if (res.error) toast.error(res.error);
            if (ref.current) ref.current.value = "";
          });
        }}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={pending}
        onClick={() => ref.current?.click()}
      >
        {pending ? "Загрузка…" : "Прикрепить файл"}
      </Button>
    </div>
  );
}

function OpenCard({ weddingId, req }: { weddingId: string; req: Req }) {
  const [answers, setAnswers] = useState<Record<string, string>>(
    Object.fromEntries(req.questions.map((q) => [q.id, q.answerText ?? ""])),
  );
  const [reply, setReply] = useState("");
  const [pending, start] = useTransition();

  function submitQuestionnaire() {
    const payload = {
      answers: req.questions.map((q) => ({ questionId: q.id, text: answers[q.id] ?? "" })),
    };
    start(async () => {
      const res = await coupleAnswerAction(weddingId, req.id, payload);
      if (res.error) toast.error(res.error);
      else toast.success("Ответы отправлены");
    });
  }

  function completeTask() {
    start(async () => {
      const res = await coupleCompleteTaskAction(weddingId, req.id, { reply });
      if (res.error) toast.error(res.error);
      else toast.success("Отмечено выполненным");
    });
  }

  return (
    <div className="border rounded-md p-4 space-y-3">
      <div className="font-medium">{req.title}</div>
      {req.message ? (
        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{req.message}</p>
      ) : null}

      {req.kind === "QUESTIONNAIRE" ? (
        <div className="space-y-3">
          {req.questions.map((q) => (
            <div key={q.id} className="space-y-1">
              <div className="text-sm">{q.prompt}</div>
              <textarea
                value={answers[q.id] ?? ""}
                onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))}
                disabled={pending}
                rows={2}
                className="w-full rounded-md border bg-background px-2 py-1.5 text-sm"
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-1">
          <div className="text-sm text-muted-foreground">Комментарий (необязательно)</div>
          <textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            disabled={pending}
            rows={2}
            className="w-full rounded-md border bg-background px-2 py-1.5 text-sm"
          />
        </div>
      )}

      <Attachments weddingId={weddingId} attachments={req.attachments} editable />
      <div className="flex flex-wrap gap-2 items-center">
        <FileUpload weddingId={weddingId} requestId={req.id} />
        <Button
          type="button"
          disabled={pending}
          onClick={req.kind === "QUESTIONNAIRE" ? submitQuestionnaire : completeTask}
        >
          {req.kind === "QUESTIONNAIRE" ? "Отправить ответы" : "Выполнено"}
        </Button>
      </div>
    </div>
  );
}

function DoneCard({ weddingId, req }: { weddingId: string; req: Req }) {
  return (
    <div className="border rounded-md p-4 opacity-70 space-y-1">
      <div className="font-medium">✓ {req.title}</div>
      {req.kind === "QUESTIONNAIRE" ? (
        <ol className="text-sm space-y-1">
          {req.questions.map((q) => (
            <li key={q.id}>
              <span className="text-muted-foreground">{q.prompt}: </span>
              {q.answerText || "—"}
            </li>
          ))}
        </ol>
      ) : req.coupleReply ? (
        <div className="text-sm text-muted-foreground">Ваш ответ: {req.coupleReply}</div>
      ) : null}
      <Attachments weddingId={weddingId} attachments={req.attachments} editable={false} />
    </div>
  );
}
