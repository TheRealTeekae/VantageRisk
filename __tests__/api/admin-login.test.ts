import { describe, it, expect, beforeEach } from "vitest";
import { NextRequest } from "next/server";

process.env.JWT_SECRET = "test-secret-at-least-32-chars-long!!";
process.env.ADMIN_PASSWORD = "test-admin-password";

import { POST, DELETE } from "@/app/api/admin/login/route";
import { rateLimitReset } from "@/lib/auth";
import { verifyAdminJWT } from "@/lib/auth";

function makeLoginRequest(password: string, ip = "127.0.0.1"): NextRequest {
  return new NextRequest("http://localhost/api/admin/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-forwarded-for": ip,
    },
    body: JSON.stringify({ password }),
  });
}

describe("POST /api/admin/login", () => {
  const testIp = "10.0.0." + Math.floor(Math.random() * 255);

  beforeEach(() => {
    rateLimitReset(testIp);
  });

  it("returns 200 and sets JWT cookie on valid password", async () => {
    const req = makeLoginRequest("test-admin-password", testIp);
    const res = await POST(req);
    expect(res.status).toBe(200);

    const setCookie = res.headers.get("set-cookie");
    expect(setCookie).toMatch(/admin_token=/);
    expect(setCookie).toMatch(/HttpOnly/i);
    expect(setCookie).toMatch(/Secure/i);
    expect(setCookie).toMatch(/SameSite=Strict/i);

    // Extract token and verify it's a valid JWT
    const tokenMatch = setCookie?.match(/admin_token=([^;]+)/);
    expect(tokenMatch).not.toBeNull();
    const valid = await verifyAdminJWT(tokenMatch![1]);
    expect(valid).toBe(true);
  });

  it("returns 401 on wrong password", async () => {
    const req = makeLoginRequest("wrong-password", testIp);
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("returns 400 on malformed JSON body", async () => {
    const req = new NextRequest("http://localhost/api/admin/login", {
      method: "POST",
      headers: { "x-forwarded-for": testIp },
      body: "not-json",
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("blocks after 5 failed attempts from same IP", async () => {
    for (let i = 0; i < 5; i++) {
      await POST(makeLoginRequest("wrong", testIp));
    }
    const blocked = await POST(makeLoginRequest("wrong", testIp));
    expect(blocked.status).toBe(429);
    const body = await blocked.json();
    expect(body.error).toMatch(/too many/i);
  });

  it("does not block different IPs independently", async () => {
    const otherIp = "192.168.99." + Math.floor(Math.random() * 255);
    for (let i = 0; i < 5; i++) {
      await POST(makeLoginRequest("wrong", testIp));
    }
    // Different IP should still work
    const res = await POST(makeLoginRequest("test-admin-password", otherIp));
    expect(res.status).toBe(200);
  });
});

describe("DELETE /api/admin/login", () => {
  it("clears the admin_token cookie", async () => {
    const res = await DELETE();
    expect(res.status).toBe(200);
    const setCookie = res.headers.get("set-cookie");
    // Cookie deletion sets Max-Age=0 or expires in the past
    expect(setCookie).toMatch(/admin_token/);
  });
});
