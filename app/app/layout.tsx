import Link from "next/link";
import { requireAgencyContext } from "@/lib/tenant";
import { LogoutButton } from "./logout-button";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await requireAgencyContext();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <Link href="/app" className="font-semibold truncate">
            {ctx.agencyName}
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-muted-foreground hidden md:inline">
              {ctx.role}
            </span>
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
