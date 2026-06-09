import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { LoginForm } from "./login-form";

export const metadata = {
  title: "Вход · Svadba Plus",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session) redirect("/app");

  const params = await searchParams;
  let errorMessage: string | null = null;
  if (params.error === "agency-disabled") {
    errorMessage = "Доступ к вашему агентству приостановлен. Свяжитесь с поддержкой.";
  } else if (params.error === "no-membership") {
    errorMessage = "У этого аккаунта нет связанного агентства.";
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto grid size-14 place-items-center rounded-full border border-gold font-heading text-2xl text-gold">
            S
          </div>
          <div className="mt-5 text-[11px] font-semibold uppercase tracking-[0.26em] text-gold">
            Svadba Plus
          </div>
          <h1 className="mt-2 text-3xl font-semibold">Вход для агентств</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Платформа управления свадьбами
          </p>
        </div>
        {errorMessage ? (
          <p className="mb-4 text-center text-sm text-destructive" role="alert">
            {errorMessage}
          </p>
        ) : null}
        <div className="rounded-xl border bg-card p-6 shadow-sm md:p-7">
          <LoginForm />
        </div>
        <p className="mt-6 text-center text-xs text-muted-foreground">
          Кабинет пары —{" "}
          <a href="/couple/login" className="underline underline-offset-4 hover:text-foreground">
            отдельный вход
          </a>
        </p>
      </div>
    </main>
  );
}
