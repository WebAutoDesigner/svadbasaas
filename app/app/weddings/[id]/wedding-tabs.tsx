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
    <nav className="-mx-1 flex flex-wrap gap-x-5 border-b px-1">
      {TABS.map((tab) => {
        const href = tab.slug ? `${base}/${tab.slug}` : base;
        const active = tab.slug
          ? pathname.startsWith(href)
          : pathname === base;
        return (
          <Link
            key={tab.slug}
            href={href}
            className={`-mb-px whitespace-nowrap border-b-2 py-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] transition-colors ${
              active
                ? "border-gold text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
