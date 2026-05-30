import { LoginForm } from "./login-form";

export const metadata = {
  title: "Вход супер-админа · Svadba Plus",
};

export default function SuperAdminLoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold mb-6 text-center">
          Вход в супер-админку
        </h1>
        <LoginForm />
      </div>
    </main>
  );
}
