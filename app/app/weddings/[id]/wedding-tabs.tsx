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
  { slug: "documents", label: "Документы" },
  { slug: "timeline", label: "Тайминг" },
];

export function WeddingTabs({ weddingId }: { weddingId: string }) {
  const pathname = usePathname();
  const base = `/app/weddings/${weddingId}`;

  return (
    <nav className="flex gap-1 overflow-x-auto border-b -mx-1 px-1">
      {TABS.map((tab) => {
        const href = tab.slug ? `${base}/${tab.slug}` : base;
        const active = tab.slug
          ? pathname.startsWith(href)
          : pathname === base;
        return (
          <Link
            key={tab.slug}
            href={href}
            className={`px-3 py-2 text-sm whitespace-nowrap border-b-2 -mb-px transition-colors ${
              active
                ? "border-primary font-medium"
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
