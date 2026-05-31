import { redirect } from "next/navigation";
import { requireCouple } from "@/lib/couple/session";
import { coupleWedding } from "@/lib/couple/data";
import { CoupleNav } from "./couple-nav";
import { CoupleLogout } from "./couple-logout";

export default async function CoupleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ weddingId: string }>;
}) {
  const session = await requireCouple();
  const { weddingId } = await params;
  // Пара видит только свою свадьбу
  if (session.weddingId !== weddingId) {
    redirect(`/couple/${session.weddingId}`);
  }

  const wedding = await coupleWedding(weddingId);
  if (!wedding) redirect("/couple/login");

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <span className="font-semibold truncate">
            {wedding.brideName} & {wedding.groomName}
          </span>
          <CoupleLogout />
        </div>
      </header>
      <div className="container mx-auto px-4 py-2">
        <CoupleNav weddingId={weddingId} />
      </div>
      <main className="flex-1">{children}</main>
    </div>
  );
}
