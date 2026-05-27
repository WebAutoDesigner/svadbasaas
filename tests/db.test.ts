import { describe, it, expect } from "vitest";
import { db } from "@/lib/db";

describe("db connectivity", () => {
  it("can read HealthCheck table", async () => {
    const count = await db.healthCheck.count();
    expect(typeof count).toBe("number");
  });
});
