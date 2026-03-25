import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";

process.env.JWT_SECRET = "test-secret-at-least-32-chars-long!!";
process.env.ADMIN_PASSWORD = "test-admin-password";

import { POST } from "@/app/api/extract/route";

describe("POST /api/extract — auth guard", () => {
  it("returns 401 without admin cookie", async () => {
    const req = new NextRequest("http://localhost/api/extract", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "some text", documentType: "policy" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });
});
