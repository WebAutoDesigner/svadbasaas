import Link from "next/link";
import { requireAgencyContext } from "@/lib/tenant";
import { ROLE_LABELS } from "@/lib/auth/can";
import { LogoutButton } from "./logout-button";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await requireAgencyContext();

  const initial = ctx.agencyName.trim().charAt(0).toUpperCase() || "С";

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-30 print:hidden">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-6 min-w-0">
            <Link href="/app" className="flex items-center gap-3 min-w-0">
              <span className="flex-none grid place-items-center size-9 rounded-full border border-gold text-gold font-heading text-lg">
                {initial}
              </span>
              <span className="font-heading text-lg font-semibold truncate">
                {ctx.agencyName}
              </span>
            </Link>
            <nav className="hidden md:flex items-center gap-7 text-xs font-semibold tracking-[0.12em] uppercase">
              <Link
                href="/app/weddings"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Свадьбы
              </Link>
              <Link
                href="/app/vendors"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Подрядчики
              </Link>
              <Link
                href="/app/templates"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Шаблоны
              </Link>
              <Link
                href="/app/team"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Команда
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-muted-foreground hidden md:inline text-xs tracking-wide uppercase">
              {ROLE_LABELS[ctx.role]}
            </span>
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
