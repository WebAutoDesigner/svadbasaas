import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ErrorBoundary } from "@/components/error-boundary";

export const metadata: Metadata = {
  title: "Svadba Plus — платформа для свадебных агентств",
  description: "Управление свадьбами, чек-листы, бюджет и личный кабинет пары",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans">
        <div
          aria-hidden
          className="h-[3px] w-full bg-gradient-to-r from-gold via-gold-soft to-gold print:hidden"
        />
        <ErrorBoundary>{children}</ErrorBoundary>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
