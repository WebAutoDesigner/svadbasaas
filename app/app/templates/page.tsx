import { requireAgencyContext } from "@/lib/tenant";
import { listTemplates } from "@/lib/agency/templates";
import { TemplatesBoard, type AnyTemplate } from "./templates-board";

export const dynamic = "force-dynamic";

export default async function TemplatesPage() {
  const ctx = await requireAgencyContext();
  const templates = await listTemplates(ctx.agencyId);

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-3xl space-y-6">
      <h1 className="text-xl font-bold">Шаблоны</h1>
      <p className="text-sm text-muted-foreground">
        Анкеты, чек-листы, тайминги и бюджеты — соберите один раз и применяйте к
        свадьбам. Всё редактируется.
      </p>
      <TemplatesBoard
        templates={templates.map(
          (t) =>
            ({
              id: t.id,
              type: t.type,
              name: t.name,
              content: t.content,
            }) as AnyTemplate,
        )}
      />
    </div>
  );
}
