import { redirect } from "next/navigation";
import { getCoupleFromCookie } from "@/lib/couple/session";
import { LoginFlow } from "./login-flow";

export const dynamic = "force-dynamic";

export const metadata = { title: "Вход для молодожёнов · Svadba Plus" };

export default async function CoupleLoginPage() {
  const existing = await getCoupleFromCookie();
  if (existing) redirect(`/couple/${existing.weddingId}`);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto grid size-14 place-items-center rounded-full border border-gold font-heading text-2xl text-gold">
            ♥
          </div>
          <div className="mt-5 text-[11px] font-semibold uppercase tracking-[0.26em] text-gold">
            Svadba Plus
          </div>
          <h1 className="mt-2 text-3xl font-semibold">Кабинет молодожёнов</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Вход по телефону и паролю от вашего агентства
          </p>
        </div>
        <div className="rounded-xl border bg-card p-6 shadow-sm md:p-7">
          <LoginFlow />
        </div>
        <p className="mt-6 text-center text-xs text-muted-foreground">
          Вы — агентство?{" "}
          <a href="/login" className="underline underline-offset-4 hover:text-foreground">
            Вход для агентств
          </a>
        </p>
      </div>
    </main>
  );
}
