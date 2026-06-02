import { getDb, tenantScope } from "@/lib/db";
import { err, ok, type Result } from "@/lib/result";
import { assertWedding } from "@/lib/wedding/guard";
import { parseDateInput } from "@/lib/dates";

export type PaymentData = {
  amount: number;
  paidOn: string; // YYYY-MM-DD
  note?: string | undefined;
};

export async function updateAgencyFee(
  agencyId: string,
  weddingId: string,
  agencyFee: number,
): Promise<Result<true, "NOT_FOUND">> {
  return tenantScope(agencyId, async () => {
    if (!(await assertWedding(agencyId, weddingId))) return err("NOT_FOUND");
    await getDb().wedding.updateMany({
      where: { id: weddingId, agencyId },
      data: { agencyFee },
    });
    return ok(true);
  });
}

export async function listPayments(agencyId: string, weddingId: string) {
  return tenantScope(agencyId, async () => {
    if (!(await assertWedding(agencyId, weddingId))) return [];
    return getDb().agencyPayment.findMany({
      where: { weddingId },
      orderBy: [{ paidOn: "desc" }, { createdAt: "desc" }],
    });
  });
}

export type FinanceSummary = { fee: number; paid: number; remaining: number };

export async function financeSummary(
  agencyId: string,
  weddingId: string,
): Promise<FinanceSummary> {
  return tenantScope(agencyId, async () => {
    if (!(await assertWedding(agencyId, weddingId))) {
      return { fee: 0, paid: 0, remaining: 0 };
    }
    const [w, agg] = await Promise.all([
      getDb().wedding.findFirst({
        where: { id: weddingId },
        select: { agencyFee: true },
      }),
      getDb().agencyPayment.aggregate({
        where: { weddingId },
        _sum: { amount: true },
      }),
    ]);
    const fee = w?.agencyFee ?? 0;
    const paid = agg._sum.amount ?? 0;
    return { fee, paid, remaining: fee - paid };
  });
}

export async function addPayment(
  agencyId: string,
  weddingId: string,
  input: PaymentData,
): Promise<Result<{ id: string }, "NOT_FOUND">> {
  return tenantScope(agencyId, async () => {
    if (!(await assertWedding(agencyId, weddingId))) return err("NOT_FOUND");
    const p = await getDb().agencyPayment.create({
      data: {
        weddingId,
        amount: input.amount,
        paidOn: parseDateInput(input.paidOn),
        note: input.note || null,
      },
    });
    return ok({ id: p.id });
  });
}

export async function updatePayment(
  agencyId: string,
  weddingId: string,
  paymentId: string,
  input: PaymentData,
): Promise<Result<true, "NOT_FOUND">> {
  return tenantScope(agencyId, async () => {
    if (!(await assertWedding(agencyId, weddingId))) return err("NOT_FOUND");
    const upd = await getDb().agencyPayment.updateMany({
      where: { id: paymentId, weddingId },
      data: {
        amount: input.amount,
        paidOn: parseDateInput(input.paidOn),
        note: input.note || null,
      },
    });
    if (upd.count === 0) return err("NOT_FOUND");
    return ok(true);
  });
}

export async function deletePayment(
  agencyId: string,
  weddingId: string,
  paymentId: string,
): Promise<Result<true, "NOT_FOUND">> {
  return tenantScope(agencyId, async () => {
    if (!(await assertWedding(agencyId, weddingId))) return err("NOT_FOUND");
    const del = await getDb().agencyPayment.deleteMany({
      where: { id: paymentId, weddingId },
    });
    if (del.count === 0) return err("NOT_FOUND");
    return ok(true);
  });
}
