import { requireCoupleForWedding } from "@/lib/couple/session";
import { coupleDocuments } from "@/lib/couple/data";

export const dynamic = "force-dynamic";

function fmtSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} Б`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} КБ`;
  return `${(bytes / 1024 / 1024).toFixed(1)} МБ`;
}

export default async function CoupleDocuments({
  params,
}: {
  params: Promise<{ weddingId: string }>;
}) {
  const { weddingId } = await params;
  await requireCoupleForWedding(weddingId);
  const docs = await coupleDocuments(weddingId);

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-2xl space-y-6">
      <h1 className="text-xl font-bold">Документы</h1>
      {docs.length === 0 ? (
        <p className="text-muted-foreground">Документов пока нет.</p>
      ) : (
        <div className="border rounded-md divide-y">
          {docs.map((d) => (
            <div key={d.id} className="flex items-center justify-between gap-3 p-3">
              <a
                href={`/api/couple/documents/${d.id}?inline=1`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium truncate hover:underline"
              >
                {d.name}
              </a>
              <a
                href={`/api/couple/documents/${d.id}`}
                className="text-sm text-muted-foreground shrink-0"
              >
                Скачать ({fmtSize(d.size)})
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
