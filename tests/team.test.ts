import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { createAgencyWithOwner } from "@/lib/agency/create";
import {
  addMember,
  changeMemberRole,
  listMembers,
  removeMember,
} from "@/lib/agency/team";
import { atLeast, canManageTeam } from "@/lib/auth/can";

const PREFIX = "team-test-";

async function cleanup() {
  await db.agencyMember.deleteMany({
    where: { user: { email: { startsWith: PREFIX } } },
  });
  await db.account.deleteMany({
    where: { user: { email: { startsWith: PREFIX } } },
  });
  await db.user.deleteMany({ where: { email: { startsWith: PREFIX } } });
  await db.agency.deleteMany({ where: { name: { startsWith: PREFIX } } });
}

async function makeAgency(suffix: string): Promise<string> {
  const res = await createAgencyWithOwner({
    agencyName: `${PREFIX}${suffix}`,
    ownerPhone: `7${Math.floor(1e9 + Math.random() * 8.9e9)}`,
    ownerName: "Owner",
    ownerPassword: "password-123-456",
  });
  if (!res.ok) throw new Error("setup failed");
  return res.data.agencyId;
}

describe("role hierarchy", () => {
  it("atLeast respects ranking", () => {
    expect(atLeast("OWNER", "COORDINATOR")).toBe(true);
    expect(atLeast("ADMIN", "ADMIN")).toBe(true);
    expect(atLeast("COORDINATOR", "ADMIN")).toBe(false);
  });

  it("only OWNER can manage team", () => {
    expect(canManageTeam("OWNER")).toBe(true);
    expect(canManageTeam("ADMIN")).toBe(false);
    expect(canManageTeam("COORDINATOR")).toBe(false);
  });
});

describe("team management", () => {
  beforeEach(cleanup);
  afterAll(cleanup);

  it("adds a member scoped to the agency", async () => {
    const agencyId = await makeAgency("add");
    const res = await addMember(agencyId, {
      email: `${PREFIX}add-coord@example.com`,
      name: "Coord",
      password: "password-123-456",
      role: "COORDINATOR",
    });
    expect(res.ok).toBe(true);

    const members = await listMembers(agencyId);
    expect(members).toHaveLength(2); // owner + coordinator
    expect(members.some((m) => m.role === "COORDINATOR")).toBe(true);
  });

  it("rejects duplicate email across agencies", async () => {
    const a1 = await makeAgency("dup1");
    const a2 = await makeAgency("dup2");
    const email = `${PREFIX}shared@example.com`;

    const first = await addMember(a1, {
      email,
      name: "X",
      password: "password-123-456",
      role: "ADMIN",
    });
    expect(first.ok).toBe(true);

    const second = await addMember(a2, {
      email,
      name: "Y",
      password: "password-123-456",
      role: "ADMIN",
    });
    expect(second.ok).toBe(false);
  });

  it("cannot demote the last owner", async () => {
    const agencyId = await makeAgency("lastowner");
    const members = await listMembers(agencyId);
    const owner = members.find((m) => m.role === "OWNER")!;

    const res = await changeMemberRole(agencyId, owner.memberId, "ADMIN");
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toBe("LAST_OWNER");
  });

  it("cannot remove the last owner", async () => {
    const agencyId = await makeAgency("rmowner");
    const members = await listMembers(agencyId);
    const owner = members.find((m) => m.role === "OWNER")!;

    const res = await removeMember(agencyId, owner.memberId);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toBe("LAST_OWNER");
  });

  it("can remove a non-owner member", async () => {
    const agencyId = await makeAgency("rmcoord");
    await addMember(agencyId, {
      email: `${PREFIX}rmcoord-c@example.com`,
      name: "C",
      password: "password-123-456",
      role: "COORDINATOR",
    });
    const members = await listMembers(agencyId);
    const coord = members.find((m) => m.role === "COORDINATOR")!;

    const res = await removeMember(agencyId, coord.memberId);
    expect(res.ok).toBe(true);
    expect(await listMembers(agencyId)).toHaveLength(1);
  });

  it("does not allow cross-agency member removal", async () => {
    const a1 = await makeAgency("x1");
    const a2 = await makeAgency("x2");
    const a1Members = await listMembers(a1);
    const a1Owner = a1Members[0]!;

    // Пытаемся удалить участника a1, передав agencyId a2 — должно быть NOT_FOUND
    const res = await removeMember(a2, a1Owner.memberId);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toBe("NOT_FOUND");
  });
});
