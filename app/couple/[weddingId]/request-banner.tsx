import Link from "next/link";
import { coupleAgencyId } from "@/lib/couple/data";
import { openRequestForSection } from "@/lib/wedding/request";

/**
 * Плашка на странице раздела у пары: если есть открытый запрос агентства,
 * привязанный к этому разделу (linkTo === slug) — показываем ссылку в «Запросы».
 * Server component.
 */
export async function CoupleRequestBanner({
  weddingId,
  slug,
}: {
  weddingId: string;
  slug: string;
}) {
  const agencyId = await coupleAgencyId(weddingId);
  if (!agencyId) return null;
  const req = await openRequestForSection(agencyId, weddingId, slug);
  if (!req) return null;
  return (
    <Link
      href={`/couple/${weddingId}/requests`}
      className="block border border-amber-300 bg-amber-50 rounded-md p-3 text-sm text-amber-900 hover:bg-amber-100"
    >
      🔔 Агентство просит: <b>{req.title}</b> — открыть в «Запросах»
    </Link>
  );
}
