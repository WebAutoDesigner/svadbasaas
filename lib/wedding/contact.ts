import { getDb, tenantScope } from "@/lib/db";
import { err, ok, type Result } from "@/lib/result";
import { assertWedding } from "@/lib/wedding/guard";

export type ContactData = { label: string; value: string };

export async function listContacts(agencyId: string, weddingId: string) {
  return tenantScope(agencyId, async () => {
    if (!(await assertWedding(agencyId, weddingId))) return [];
    return getDb().weddingContact.findMany({
      where: { weddingId },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });
  });
}

export async function addContact(
  agencyId: string,
  weddingId: string,
  input: ContactData,
): Promise<Result<{ id: string }, "NOT_FOUND">> {
  return tenantScope(agencyId, async () => {
    if (!(await assertWedding(agencyId, weddingId))) return err("NOT_FOUND");
    const max = await getDb().weddingContact.aggregate({
      where: { weddingId },
      _max: { sortOrder: true },
    });
    const c = await getDb().weddingContact.create({
      data: {
        weddingId,
        label: input.label,
        value: input.value,
        sortOrder: (max._max.sortOrder ?? 0) + 1,
      },
    });
    return ok({ id: c.id });
  });
}

export async function updateContact(
  agencyId: string,
  weddingId: string,
  contactId: string,
  input: ContactData,
): Promise<Result<true, "NOT_FOUND">> {
  return tenantScope(agencyId, async () => {
    if (!(await assertWedding(agencyId, weddingId))) return err("NOT_FOUND");
    const upd = await getDb().weddingContact.updateMany({
      where: { id: contactId, weddingId },
      data: { label: input.label, value: input.value },
    });
    if (upd.count === 0) return err("NOT_FOUND");
    return ok(true);
  });
}

export async function deleteContact(
  agencyId: string,
  weddingId: string,
  contactId: string,
): Promise<Result<true, "NOT_FOUND">> {
  return tenantScope(agencyId, async () => {
    if (!(await assertWedding(agencyId, weddingId))) return err("NOT_FOUND");
    const del = await getDb().weddingContact.deleteMany({
      where: { id: contactId, weddingId },
    });
    if (del.count === 0) return err("NOT_FOUND");
    return ok(true);
  });
}
