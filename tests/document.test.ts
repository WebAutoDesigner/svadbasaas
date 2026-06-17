import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { createAgencyWithOwner } from "@/lib/agency/create";
import { createWedding } from "@/lib/wedding/wedding";
import {
  deleteDocument,
  getDocumentForAccess,
  listDocuments,
  uploadDocument,
} from "@/lib/wedding/document";

const PREFIX = "doc-test-";

// Минимальный валидный PNG (8-байтная сигнатура + IHDR) — распознаётся file-type
const PNG = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
  0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
  0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89,
]);
// Произвольные байты — не распознаются как разрешённый тип
const GARBAGE = Buffer.from("this is not a real file, just text bytes here ok");

async function cleanup() {
  await db.document.deleteMany({
    where: { wedding: { agency: { name: { startsWith: PREFIX } } } },
  });
  await db.wedding.deleteMany({ where: { agency: { name: { startsWith: PREFIX } } } });
  await db.agencyMember.deleteMany({
    where: { user: { email: { startsWith: PREFIX } } },
  });
  await db.account.deleteMany({
    where: { user: { email: { startsWith: PREFIX } } },
  });
  await db.user.deleteMany({ where: { email: { startsWith: PREFIX } } });
  await db.agency.deleteMany({ where: { name: { startsWith: PREFIX } } });
}

async function setup(suffix: string): Promise<{ agencyId: string; weddingId: string; userId: string }> {
  const a = await createAgencyWithOwner({
    agencyName: `${PREFIX}${suffix}`,
    ownerPhone: `7${Math.floor(1e9 + Math.random() * 8.9e9)}`,
    ownerName: "Owner",
    ownerPassword: "password-123-456",
  });
  if (!a.ok) throw new Error("agency setup failed");
  const w = await createWedding(a.data.agencyId, {
    brideName: "Анна",
    groomName: "Пётр",
    date: "2026-08-15",
    timezone: "Europe/Moscow",
    budget: 0,
  });
  if (!w.ok) throw new Error("wedding setup failed");
  return { agencyId: a.data.agencyId, weddingId: w.data.id, userId: a.data.userId };
}

describe("documents", () => {
  beforeEach(cleanup);
  afterAll(cleanup);

  it("uploads a valid image (magic-bytes pass) and lists it", async () => {
    const { agencyId, weddingId, userId } = await setup("ok");
    const res = await uploadDocument(
      agencyId,
      weddingId,
      { name: "photo.png", buffer: PNG },
      userId,
    );
    expect(res.ok).toBe(true);
    const list = await listDocuments(agencyId, weddingId);
    expect(list).toHaveLength(1);
    expect(list[0]?.mime).toBe("image/png");
  });

  it("rejects file with disallowed/unknown type", async () => {
    const { agencyId, weddingId, userId } = await setup("bad");
    const res = await uploadDocument(
      agencyId,
      weddingId,
      { name: "evil.png", buffer: GARBAGE }, // расширение png, но содержимое не png
      userId,
    );
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toBe("BAD_TYPE");
  });

  it("blocks cross-agency upload and access", async () => {
    const a = await setup("x1");
    const b = await setup("x2");
    const res = await uploadDocument(
      b.agencyId,
      a.weddingId,
      { name: "p.png", buffer: PNG },
      b.userId,
    );
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toBe("NOT_FOUND");

    // Загрузим в a, проверим что b не получит доступ
    const up = await uploadDocument(
      a.agencyId,
      a.weddingId,
      { name: "p.png", buffer: PNG },
      a.userId,
    );
    if (!up.ok) throw new Error("upload failed");
    const access = await getDocumentForAccess(b.agencyId, a.weddingId, up.data.id);
    expect(access).toBeNull();
  });

  it("deletes a document", async () => {
    const { agencyId, weddingId, userId } = await setup("del");
    const up = await uploadDocument(
      agencyId,
      weddingId,
      { name: "p.png", buffer: PNG },
      userId,
    );
    if (!up.ok) throw new Error("upload failed");
    const del = await deleteDocument(agencyId, weddingId, up.data.id);
    expect(del.ok).toBe(true);
    expect(await listDocuments(agencyId, weddingId)).toHaveLength(0);
  });
});
