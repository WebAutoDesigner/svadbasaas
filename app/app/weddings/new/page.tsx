import Link from "next/link";
import { requireAgencyContext } from "@/lib/tenant";
import { listMembers } from "@/lib/agency/team";
import { CreateWeddingForm } from "./create-form";

export const dynamic = "force-dynamic";

export const metadata = { title: "Новая свадьба · Svadba Plus" };

export default async function NewWeddingPage() {
  const ctx = await requireAgencyContext();
  const members = await listMembers(ctx.agencyId);

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-2xl space-y-6">
      <div className="space-y-1">
        <Link
          href="/app/weddings"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← К списку
        </Link>
        <h1 className="text-2xl font-bold">Новая свадьба</h1>
      </div>
      <CreateWeddingForm
        coordinators={members.map((m) => ({ id: m.userId, name: m.name }))}
      />
    </div>
  );
}
