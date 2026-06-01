"use server";

import { requireAgencyContext } from "@/lib/tenant";
import { markCoupleChangesSeen } from "@/lib/wedding/couple-activity";
import type { CoupleArea } from "@prisma/client";

export async function markSeenAction(
  weddingId: string,
  area: CoupleArea,
): Promise<void> {
  const ctx = await requireAgencyContext();
  await markCoupleChangesSeen(ctx.agencyId, weddingId, area);
}
