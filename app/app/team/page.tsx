import { requireAgencyContext } from "@/lib/tenant";
import { listMembers } from "@/lib/agency/team";
import { canManageTeam } from "@/lib/auth/can";
import { TeamList } from "./team-list";
import { AddMemberDialog } from "./add-member-dialog";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Команда · Svadba Plus",
};

export default async function TeamPage() {
  const ctx = await requireAgencyContext();
  const members = await listMembers(ctx.agencyId);
  const manage = canManageTeam(ctx.role);

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-3xl space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Команда</h1>
        {manage ? <AddMemberDialog /> : null}
      </div>

      <TeamList
        members={members.map((m) => ({
          memberId: m.memberId,
          email: m.email,
          name: m.name,
          role: m.role,
          isSelf: m.userId === ctx.userId,
        }))}
        canManage={manage}
      />

      {!manage ? (
        <p className="text-sm text-muted-foreground">
          Только владелец может управлять составом команды.
        </p>
      ) : null}
    </div>
  );
}
