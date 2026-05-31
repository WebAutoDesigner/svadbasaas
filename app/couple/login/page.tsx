import { redirect } from "next/navigation";
import { getCoupleFromCookie } from "@/lib/couple/session";
import { LoginFlow } from "./login-flow";

export const dynamic = "force-dynamic";

export const metadata = { title: "Вход для молодожёнов · Svadba Plus" };

export default async function CoupleLoginPage() {
  const existing = await getCoupleFromCookie();
  if (existing) redirect(`/couple/${existing.weddingId}`);

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Кабинет молодожёнов</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Вход по коду из письма
          </p>
        </div>
        <LoginFlow />
      </div>
    </main>
  );
}
