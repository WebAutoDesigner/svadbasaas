import { requireAgencyContext } from "@/lib/tenant";
import { listTemplates } from "@/lib/agency/templates";
import { TemplatesBoard } from "./templates-board";

export const dynamic = "force-dynamic";

export default async function TemplatesPage() {
  const ctx = await requireAgencyContext();
  const templates = await listTemplates(ctx.agencyId, "QUESTIONNAIRE");

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-3xl space-y-6">
      <h1 className="text-xl font-bold">Шаблоны анкет</h1>
      <p className="text-sm text-muted-foreground">
        Соберите анкету один раз — потом отправляйте её паре в один клик со вкладки
        «Запросы» любой свадьбы.
      </p>
      <TemplatesBoard
        templates={templates.map((t) => ({
          id: t.id,
          name: t.name,
          questions: ((t.content as { questions?: string[] }).questions ?? []),
        }))}
      />
    </div>
  );
}
