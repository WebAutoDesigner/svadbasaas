"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { slug: "", label: "Обзор" },
  { slug: "requests", label: "Запросы" },
  { slug: "checklist", label: "Чек-лист" },
  { slug: "budget", label: "Бюджет" },
  { slug: "vendors", label: "Подрядчики" },
  { slug: "guests", label: "Гости" },
  { slug: "seating", label: "Рассадка" },
  { slug: "schedule", label: "Расписание" },
  { slug: "timeline", label: "Тайминг" },
  { slug: "documents", label: "Документы" },
];

export function CoupleNav({
  weddingId,
  openRequests = 0,
}: {
  weddingId: string;
  openRequests?: number;
}) {
  const pathname = usePathname();
  const base = `/couple/${weddingId}`;

  return (
    <nav className="flex gap-1 overflow-x-auto border-b -mx-1 px-1">
      {TABS.map((tab) => {
        const href = tab.slug ? `${base}/${tab.slug}` : base;
        const active = tab.slug ? pathname.startsWith(href) : pathname === base;
        return (
          <Link
            key={tab.slug}
            href={href}
            className={`px-3 py-2 text-sm whitespace-nowrap border-b-2 -mb-px ${
              active
                ? "border-primary font-medium"
                : "border-transparent text-muted-foreground"
            }`}
          >
            {tab.label}
            {tab.slug === "requests" && openRequests > 0 ? (
              <span className="ml-1 inline-flex items-center justify-center rounded-full bg-amber-500 text-white text-[10px] leading-none px-1.5 py-0.5">
                {openRequests}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
