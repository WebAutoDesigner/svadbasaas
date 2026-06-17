"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { slug: "", label: "Обзор" },
  { slug: "checklist", label: "Чек-лист" },
  { slug: "budget", label: "Бюджет" },
  { slug: "vendors", label: "Подрядчики" },
  { slug: "guests", label: "Гости" },
  { slug: "seating", label: "Рассадка" },
  { slug: "events", label: "События" },
  { slug: "requests", label: "Запросы" },
  { slug: "finance", label: "Финансы" },
  { slug: "notes", label: "Заметки" },
  { slug: "documents", label: "Документы" },
  { slug: "timeline", label: "Тайминг" },
];

export function WeddingTabs({ weddingId }: { weddingId: string }) {
  const pathname = usePathname();
  const base = `/app/weddings/${weddingId}`;

  return (
    <nav className="flex flex-row flex-wrap gap-2 lg:flex-col lg:gap-1.5">
      {TABS.map((tab) => {
        const href = tab.slug ? `${base}/${tab.slug}` : base;
        const active = tab.slug
          ? pathname.startsWith(href)
          : pathname === base;
        return (
          <Link
            key={tab.slug}
            href={href}
            className={`rounded-lg border px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.1em] transition-colors lg:text-xs ${
              active
                ? "border-gold-soft bg-gold-tint text-gold"
                : "border-transparent text-muted-foreground hover:border-border hover:bg-accent hover:text-foreground"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
