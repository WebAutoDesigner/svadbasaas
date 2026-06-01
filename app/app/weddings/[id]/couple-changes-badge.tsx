"use client";

import { useEffect, useRef, useState } from "react";
import type { CoupleArea } from "@prisma/client";
import { markSeenAction } from "./mark-seen-action";

type UnseenItem = { summary: string; createdAt: string | Date };

/**
 * Бейдж «пара внесла изменения». Список приходит с сервера (непросмотренное).
 * На монтировании помечаем просмотренным (seen=now) — список держим в локальном
 * состоянии, чтобы он не исчез прямо во время просмотра.
 */
export function CoupleChangesBadge({
  weddingId,
  area,
  count,
  items,
}: {
  weddingId: string;
  area: CoupleArea;
  count: number;
  items: UnseenItem[];
}) {
  const [snapshot] = useState({ count, items });
  const marked = useRef(false);

  useEffect(() => {
    if (snapshot.count > 0 && !marked.current) {
      marked.current = true;
      void markSeenAction(weddingId, area);
    }
  }, [snapshot.count, weddingId, area]);

  if (snapshot.count === 0) return null;

  return (
    <div className="border border-amber-300 bg-amber-50 rounded-md p-3 text-sm">
      <div className="font-medium text-amber-800">
        ⚠ Пара внесла изменения: {snapshot.count}
      </div>
      <ul className="mt-1 space-y-0.5 text-amber-900/80">
        {snapshot.items.map((it, i) => (
          <li key={i}>• {it.summary}</li>
        ))}
      </ul>
    </div>
  );
}
