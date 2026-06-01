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

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b print:hidden">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <Link href="/app" className="font-semibold truncate">
              {ctx.agencyName}
            </Link>
            <nav className="flex items-center gap-3 text-sm">
              <Link
                href="/app/weddings"
                className="text-muted-foreground hover:text-foreground"
              >
                Свадьбы
              </Link>
              <Link
                href="/app/vendors"
                className="text-muted-foreground hover:text-foreground"
              >
                Подрядчики
              </Link>
              <Link
                href="/app/team"
                className="text-muted-foreground hover:text-foreground"
              >
                Команда
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-muted-foreground hidden md:inline">
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
