import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { createAgencyWithOwner } from "@/lib/agency/create";
import { createWedding } from "@/lib/wedding/wedding";
import {
  addTemplate,
  deleteTemplate,
  listTemplates,
  updateTemplate,
} from "@/lib/agency/templates";
import {
  addAttachment,
  answerQuestionnaire,
  completeTask,
  createQuestionnaire,
  createTask,
  deleteRequest,
  getRequest,
  listRequests,
  openRequestForSection,
  openRequestsCount,
} from "@/lib/wedding/request";

const PREFIX = "req-test-";

// 1x1 PNG (валидные magic bytes)
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  "base64",
);

async function cleanup() {
  const w = { wedding: { agency: { name: { startsWith: PREFIX } } } };
  await db.requestAttachment.deleteMany({ where: { request: w } });
  await db.requestQuestion.deleteMany({ where: { request: w } });
  await db.coupleRequest.deleteMany({ where: w });
  await db.template.deleteMany({ where: { agency: { name: { startsWith: PREFIX } } } });
  await db.wedding.deleteMany({ where: { agency: { name: { startsWith: PREFIX } } } });
  await db.agencyMember.deleteMany({ where: { user: { email: { startsWith: PREFIX } } } });
  await db.account.deleteMany({ where: { user: { email: { startsWith: PREFIX } } } });
  await db.user.deleteMany({ where: { email: { startsWith: PREFIX } } });
  await db.agency.deleteMany({ where: { name: { startsWith: PREFIX } } });
}

async function setup(suffix: string) {
  const a = await createAgencyWithOwner({
    agencyName: `${PREFIX}${suffix}`,
    ownerEmail: `${PREFIX}${suffix}@example.com`,
    ownerName: "Owner",
    ownerPassword: "password-123-456",
  });
  if (!a.ok) throw new Error("agency");
  const w = await createWedding(a.data.agencyId, {
    brideName: "Анна",
    groomName: "Пётр",
    date: "2026-08-15",
    timezone: "Europe/Moscow",
    budget: 0,
  });
  if (!w.ok) throw new Error("wedding");
  return { agencyId: a.data.agencyId, weddingId: w.data.id };
}

describe("templates", () => {
  beforeEach(cleanup);
  afterAll(cleanup);

  it("CRUD questionnaire template + cross-agency block", async () => {
    const { agencyId } = await setup("tpl");
    const t = await addTemplate(agencyId, {
      type: "QUESTIONNAIRE",
      name: "Брифинг",
      content: { questions: ["Сколько гостей?", "Стиль?"] },
    });
    if (!t.ok) throw new Error("add");
    expect(await listTemplates(agencyId, "QUESTIONNAIRE")).toHaveLength(1);
    expect((await updateTemplate(agencyId, t.data.id, { name: "Брифинг v2", content: { questions: ["Q"] } })).ok).toBe(true);

    const other = await setup("tpl2");
    expect(await listTemplates(other.agencyId)).toHaveLength(0);
    expect((await deleteTemplate(other.agencyId, t.data.id)).ok).toBe(false);
    expect((await deleteTemplate(agencyId, t.data.id)).ok).toBe(true);
  });
});

describe("couple requests", () => {
  beforeEach(cleanup);
  afterAll(cleanup);

  it("questionnaire: create, count open, answer → done, history", async () => {
    const { agencyId, weddingId } = await setup("q");
    const r = await createQuestionnaire(agencyId, weddingId, {
      title: "Брифинг",
      questions: ["Сколько гостей?", "Стиль?"],
    });
    if (!r.ok) throw new Error("create");
    expect(await openRequestsCount(agencyId, weddingId)).toBe(1);

    const detail = await getRequest(agencyId, weddingId, r.data.id);
    expect(detail!.questions).toHaveLength(2);

    const ans = detail!.questions.map((q) => ({ questionId: q.id, text: `ответ ${q.prompt}` }));
    expect((await answerQuestionnaire(agencyId, weddingId, r.data.id, ans)).ok).toBe(true);
    expect(await openRequestsCount(agencyId, weddingId)).toBe(0);

    const after = await getRequest(agencyId, weddingId, r.data.id);
    expect(after!.status).toBe("DONE");
    expect(after!.questions[0]!.answerText).toContain("ответ");
  });

  it("task: create with link, complete with reply, banner lookup", async () => {
    const { agencyId, weddingId } = await setup("t");
    const r = await createTask(agencyId, weddingId, {
      title: "Заполните рассадку",
      message: "Просьба распределить гостей",
      linkTo: "seating",
    });
    if (!r.ok) throw new Error("create");

    const banner = await openRequestForSection(agencyId, weddingId, "seating");
    expect(banner?.title).toBe("Заполните рассадку");
    expect(await openRequestForSection(agencyId, weddingId, "guests")).toBeNull();

    expect((await completeTask(agencyId, weddingId, r.data.id, "готово")).ok).toBe(true);
    expect(await openRequestForSection(agencyId, weddingId, "seating")).toBeNull();
    const after = await getRequest(agencyId, weddingId, r.data.id);
    expect(after!.status).toBe("DONE");
    expect(after!.coupleReply).toBe("готово");
  });

  it("attachments: add valid PNG, reject bad type, delete request removes them", async () => {
    const { agencyId, weddingId } = await setup("att");
    const r = await createQuestionnaire(agencyId, weddingId, { title: "T", questions: ["Q"] });
    if (!r.ok) throw new Error("create");

    const okAtt = await addAttachment(agencyId, weddingId, r.data.id, { name: "scan.png", buffer: PNG });
    expect(okAtt.ok).toBe(true);

    const bad = await addAttachment(agencyId, weddingId, r.data.id, { name: "x.txt", buffer: Buffer.from("just text") });
    expect(bad.ok).toBe(false);

    const detail = await getRequest(agencyId, weddingId, r.data.id);
    expect(detail!.attachments).toHaveLength(1);

    expect((await deleteRequest(agencyId, weddingId, r.data.id)).ok).toBe(true);
  });

  it("blocks cross-agency", async () => {
    const a = await setup("x1");
    const b = await setup("x2");
    const r = await createTask(a.agencyId, a.weddingId, { title: "X" });
    if (!r.ok) throw new Error("create");
    expect((await createTask(b.agencyId, a.weddingId, { title: "hack" })).ok).toBe(false);
    expect(await listRequests(b.agencyId, a.weddingId)).toHaveLength(0);
    expect((await completeTask(b.agencyId, b.weddingId, r.data.id, "x")).ok).toBe(false);
  });
});
