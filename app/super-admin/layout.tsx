import Link from "next/link";
import { headers } from "next/headers";
import { getSuperAdminFromCookie } from "@/lib/super-admin/session";
import { LogoutButton } from "./logout-button";

export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const hdrs = await headers();
  const pathname = hdrs.get("x-pathname") ?? "";
  const isLoginRoute = pathname.endsWith("/super-admin/login");

  if (isLoginRoute) {
    return <>{children}</>;
  }

  const admin = await getSuperAdminFromCookie();
  // Layout не может редиректить надёжно без middleware, поэтому страницы
  // ниже сами вызывают requireSuperAdmin() в server component.
  // Этот layout рендерит шапку только если есть admin.

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/super-admin/agencies" className="font-semibold">
              Svadba Plus · Супер-админ
            </Link>
            {admin ? (
              <nav className="flex items-center gap-3 text-sm">
                <Link
                  href="/super-admin/agencies"
                  className="text-muted-foreground hover:text-foreground"
                >
                  Агентства
                </Link>
                <Link
                  href="/super-admin/audit"
                  className="text-muted-foreground hover:text-foreground"
                >
                  Аудит
                </Link>
              </nav>
            ) : null}
          </div>
          {admin ? (
            <div className="flex items-center gap-3 text-sm">
              <span className="text-muted-foreground">{admin.email}</span>
              <LogoutButton />
            </div>
          ) : null}
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
