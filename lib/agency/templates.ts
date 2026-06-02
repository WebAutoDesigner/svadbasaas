import { getDb, tenantScope } from "@/lib/db";
import { err, ok, type Result } from "@/lib/result";
import type { Prisma, TemplateType } from "@prisma/client";

export type TemplateData = {
  type: TemplateType;
  name: string;
  content: Prisma.InputJsonValue;
};

export async function listTemplates(agencyId: string, type?: TemplateType) {
  return tenantScope(agencyId, async () => {
    return getDb().template.findMany({
      where: { agencyId, ...(type ? { type } : {}) },
      orderBy: [{ type: "asc" }, { name: "asc" }],
    });
  });
}

export async function getTemplate(agencyId: string, templateId: string) {
  return tenantScope(agencyId, async () => {
    return getDb().template.findFirst({ where: { id: templateId, agencyId } });
  });
}

export async function addTemplate(
  agencyId: string,
  input: TemplateData,
): Promise<Result<{ id: string }, never>> {
  return tenantScope(agencyId, async () => {
    const t = await getDb().template.create({
      data: {
        agencyId,
        type: input.type,
        name: input.name,
        content: input.content,
      },
    });
    return ok({ id: t.id });
  });
}

export async function updateTemplate(
  agencyId: string,
  templateId: string,
  input: { name: string; content: Prisma.InputJsonValue },
): Promise<Result<true, "NOT_FOUND">> {
  return tenantScope(agencyId, async () => {
    const upd = await getDb().template.updateMany({
      where: { id: templateId, agencyId },
      data: { name: input.name, content: input.content },
    });
    if (upd.count === 0) return err("NOT_FOUND");
    return ok(true);
  });
}

export async function deleteTemplate(
  agencyId: string,
  templateId: string,
): Promise<Result<true, "NOT_FOUND">> {
  return tenantScope(agencyId, async () => {
    const del = await getDb().template.deleteMany({
      where: { id: templateId, agencyId },
    });
    if (del.count === 0) return err("NOT_FOUND");
    return ok(true);
  });
}
