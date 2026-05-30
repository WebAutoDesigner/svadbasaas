import { describe, it, expect } from "vitest";
import { db } from "@/lib/db";

describe("db connectivity", () => {
  it("can count Agency rows", async () => {
    const count = await db.agency.count();
    expect(typeof count).toBe("number");
    expect(count).toBeGreaterThanOrEqual(0);
  });
});
