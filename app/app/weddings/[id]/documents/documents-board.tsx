"use client";

import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { deleteDocumentAction, uploadDocumentAction } from "./actions";

type Doc = {
  id: string;
  name: string;
  mime: string;
  size: number;
  createdAt: string;
};

function fmtSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} Б`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} КБ`;
  return `${(bytes / 1024 / 1024).toFixed(1)} МБ`;
}

export function DocumentsBoard({
  weddingId,
  documents,
}: {
  weddingId: string;
  documents: Doc[];
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, start] = useTransition();
  const [dragOver, setDragOver] = useState(false);

  function upload(file: File) {
    const fd = new FormData();
    fd.set("file", file);
    start(async () => {
      const res = await uploadDocumentAction(weddingId, fd);
      if (res.error) toast.error(res.error);
      else toast.success("Файл загружен");
    });
  }

  function handleDelete(id: string, name: string) {
    if (!confirm(`Удалить «${name}»?`)) return;
    start(async () => {
      const res = await deleteDocumentAction(weddingId, id);
      if (res.error) toast.error(res.error);
    });
  }

  return (
    <div className="space-y-6">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const file = e.dataTransfer.files[0];
          if (file) upload(file);
        }}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragOver ? "border-primary bg-accent/40" : "border-border"
        }`}
      >
        <p className="text-muted-foreground mb-3">
          Перетащите файл сюда или
        </p>
        <Button
          type="button"
          variant="outline"
          disabled={pending}
          onClick={() => inputRef.current?.click()}
        >
          {pending ? "Загрузка…" : "Выбрать файл"}
        </Button>
        <input
          ref={inputRef}
          type="file"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) upload(file);
            e.target.value = "";
          }}
        />
        <p className="text-xs text-muted-foreground mt-3">
          PDF, фото, Word/Excel, zip — до 50 МБ
        </p>
      </div>

      {documents.length === 0 ? (
        <p className="text-muted-foreground">Документов пока нет.</p>
      ) : (
        <div className="border rounded-md divide-y">
          {documents.map((d) => (
            <div
              key={d.id}
              className="flex items-center justify-between gap-3 p-3"
            >
              <div className="min-w-0">
                <a
                  href={`/api/weddings/${weddingId}/documents/${d.id}?inline=1`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium truncate hover:underline block"
                >
                  {d.name}
                </a>
                <div className="text-sm text-muted-foreground">
                  {fmtSize(d.size)} ·{" "}
                  {new Date(d.createdAt).toLocaleDateString("ru-RU")}
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <a
                  href={`/api/weddings/${weddingId}/documents/${d.id}`}
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  Скачать
                </a>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => handleDelete(d.id, d.name)}
                  className="text-sm text-muted-foreground hover:text-destructive"
                >
                  Удалить
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
