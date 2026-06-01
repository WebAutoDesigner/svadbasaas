import { getDb, tenantScope } from "@/lib/db";
import { err, ok, type Result } from "@/lib/result";
import { assertWedding } from "@/lib/wedding/guard";
import type { PaymentStatus } from "@prisma/client";

export type VendorData = {
  name: string;
  service: string;
  contact?: string | undefined;
  amount: number;
  paymentStatus: PaymentStatus;
  note?: string | undefined;
};

export async function listVendors(agencyId: string, weddingId: string) {
  return tenantScope(agencyId, async () => {
    if (!(await assertWedding(agencyId, weddingId))) return [];
    return getDb().vendor.findMany({
      where: { weddingId },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });
  });
}

export type VendorsSummary = {
  total: number;
  paid: number;
  count: number;
};

export async function vendorsSummary(
  agencyId: string,
  weddingId: string,
): Promise<VendorsSummary> {
  return tenantScope(agencyId, async () => {
    if (!(await assertWedding(agencyId, weddingId))) {
      return { total: 0, paid: 0, count: 0 };
    }
    const vendors = await getDb().vendor.findMany({
      where: { weddingId },
      select: { amount: true, paymentStatus: true },
    });
    const total = vendors.reduce((s, v) => s + v.amount, 0);
    const paid = vendors
      .filter((v) => v.paymentStatus === "PAID")
      .reduce((s, v) => s + v.amount, 0);
    return { total, paid, count: vendors.length };
  });
}

export async function addVendor(
  agencyId: string,
  weddingId: string,
  input: VendorData,
): Promise<Result<{ id: string }, "NOT_FOUND">> {
  return tenantScope(agencyId, async () => {
    if (!(await assertWedding(agencyId, weddingId))) return err("NOT_FOUND");
    const max = await getDb().vendor.aggregate({
      where: { weddingId },
      _max: { sortOrder: true },
    });
    const vendor = await getDb().vendor.create({
      data: {
        weddingId,
        name: input.name,
        service: input.service,
        contact: input.contact || null,
        amount: input.amount,
        paymentStatus: input.paymentStatus,
        note: input.note || null,
        sortOrder: (max._max.sortOrder ?? 0) + 1,
      },
    });
    return ok({ id: vendor.id });
  });
}

export async function updateVendor(
  agencyId: string,
  weddingId: string,
  vendorId: string,
  input: VendorData,
): Promise<Result<true, "NOT_FOUND">> {
  return tenantScope(agencyId, async () => {
    if (!(await assertWedding(agencyId, weddingId))) return err("NOT_FOUND");
    const updated = await getDb().vendor.updateMany({
      where: { id: vendorId, weddingId },
      data: {
        name: input.name,
        service: input.service,
        contact: input.contact || null,
        amount: input.amount,
        paymentStatus: input.paymentStatus,
        note: input.note || null,
      },
    });
    if (updated.count === 0) return err("NOT_FOUND");
    return ok(true);
  });
}

export async function deleteVendor(
  agencyId: string,
  weddingId: string,
  vendorId: string,
): Promise<Result<true, "NOT_FOUND">> {
  return tenantScope(agencyId, async () => {
    if (!(await assertWedding(agencyId, weddingId))) return err("NOT_FOUND");
    const deleted = await getDb().vendor.deleteMany({
      where: { id: vendorId, weddingId },
    });
    if (deleted.count === 0) return err("NOT_FOUND");
    return ok(true);
  });
}
