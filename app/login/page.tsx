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
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <h1 className="text-2xl font-bold text-center">Вход для агентств</h1>
        {errorMessage ? (
          <p className="text-sm text-destructive text-center" role="alert">
            {errorMessage}
          </p>
        ) : null}
        <LoginForm />
      </div>
    </main>
  );
}
