import { getDb, tenantScope } from "@/lib/db";
import { err, ok, type Result } from "@/lib/result";

export type AgencyVendorData = {
  name: string;
  service: string;
  contact?: string | undefined;
  link?: string | undefined;
  priceNote?: string | undefined;
};

export async function listAgencyVendors(
  agencyId: string,
  filter?: { search?: string; service?: string },
) {
  return tenantScope(agencyId, async () => {
    return getDb().agencyVendor.findMany({
      where: {
        agencyId,
        ...(filter?.search
          ? { name: { contains: filter.search, mode: "insensitive" } }
          : {}),
        ...(filter?.service ? { service: filter.service } : {}),
      },
      orderBy: [{ service: "asc" }, { name: "asc" }],
    });
  });
}

export async function addAgencyVendor(
  agencyId: string,
  input: AgencyVendorData,
): Promise<Result<{ id: string }, never>> {
  return tenantScope(agencyId, async () => {
    const v = await getDb().agencyVendor.create({
      data: {
        agencyId,
        name: input.name,
        service: input.service,
        contact: input.contact || null,
        link: input.link || null,
        priceNote: input.priceNote || null,
      },
    });
    return ok({ id: v.id });
  });
}

export async function updateAgencyVendor(
  agencyId: string,
  vendorId: string,
  input: AgencyVendorData,
): Promise<Result<true, "NOT_FOUND">> {
  return tenantScope(agencyId, async () => {
    const upd = await getDb().agencyVendor.updateMany({
      where: { id: vendorId, agencyId },
      data: {
        name: input.name,
        service: input.service,
        contact: input.contact || null,
        link: input.link || null,
        priceNote: input.priceNote || null,
      },
    });
    if (upd.count === 0) return err("NOT_FOUND");
    return ok(true);
  });
}

export async function deleteAgencyVendor(
  agencyId: string,
  vendorId: string,
): Promise<Result<true, "NOT_FOUND">> {
  return tenantScope(agencyId, async () => {
    const del = await getDb().agencyVendor.deleteMany({
      where: { id: vendorId, agencyId },
    });
    if (del.count === 0) return err("NOT_FOUND");
    return ok(true);
  });
}
