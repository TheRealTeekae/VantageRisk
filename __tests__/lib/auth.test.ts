import { describe, it, expect, beforeEach, vi } from "vitest";

// Set required env vars before importing the module
process.env.JWT_SECRET = "test-secret-at-least-32-chars-long!!";
process.env.ADMIN_PASSWORD = "test-admin-password";

// ─── MOCK @upstash/redis (rate limiter uses incr/expire/del) ─────────────────
const _rlStore = new Map<string, number>();

vi.mock("@upstash/redis", () => {
  // Must use a regular function (not arrow) so `new Redis()` works
  const Redis = vi.fn(function () {
    return {
      incr: async (key: string) => {
        const cur = (_rlStore.get(key) ?? 0) + 1;
        _rlStore.set(key, cur);
        return cur;
      },
      expire: async () => 1,
      del: async (key: string) => {
        _rlStore.delete(key);
        return 1;
      },
    };
  });
  return { Redis };
});

import {
  checkAdminPassword,
  signAdminJWT,
  verifyAdminJWT,
  rateLimitCheck,
  rateLimitReset,
} from "@/lib/auth";

describe("checkAdminPassword", () => {
  it("returns true for correct password", () => {
    expect(checkAdminPassword("test-admin-password")).toBe(true);
  });

  it("returns false for wrong password", () => {
    expect(checkAdminPassword("wrong")).toBe(false);
  });

  it("returns false for empty string", () => {
    expect(checkAdminPassword("")).toBe(false);
  });
});

describe("JWT round-trip", () => {
  it("signs a token that verifies successfully", async () => {
    const token = await signAdminJWT();
    expect(typeof token).toBe("string");
    expect(token.split(".").length).toBe(3); // valid JWT structure
    const valid = await verifyAdminJWT(token);
    expect(valid).toBe(true);
  });

  it("rejects a tampered token", async () => {
    const token = await signAdminJWT();
    const tampered = token.slice(0, -5) + "XXXXX";
    const valid = await verifyAdminJWT(tampered);
    expect(valid).toBe(false);
  });

  it("rejects a token signed with wrong secret", async () => {
    // Create a token with a different secret manually
    const { SignJWT } = await import("jose");
    const wrongSecret = new TextEncoder().encode("wrong-secret");
    const badToken = await new SignJWT({ role: "admin" })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("8h")
      .sign(wrongSecret);
    const valid = await verifyAdminJWT(badToken);
    expect(valid).toBe(false);
  });

  it("rejects an expired token", async () => {
    const { SignJWT } = await import("jose");
    const secret = new TextEncoder().encode("test-secret-at-least-32-chars-long!!");
    const expiredToken = await new SignJWT({ role: "admin" })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("-1s") // already expired
      .sign(secret);
    const valid = await verifyAdminJWT(expiredToken);
    expect(valid).toBe(false);
  });
});

describe("rateLimitCheck", () => {
  const testIp = "192.168.1.test-" + Math.random();

  beforeEach(async () => {
    _rlStore.clear();
    await rateLimitReset(testIp);
  });

  it("allows first attempt", async () => {
    const result = await rateLimitCheck(testIp);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4);
  });

  it("allows up to 5 attempts", async () => {
    for (let i = 0; i < 4; i++) {
      expect((await rateLimitCheck(testIp)).allowed).toBe(true);
    }
    // 5th attempt — still allowed
    const fifth = await rateLimitCheck(testIp);
    expect(fifth.allowed).toBe(true);
  });

  it("blocks the 6th attempt", async () => {
    for (let i = 0; i < 5; i++) {
      await rateLimitCheck(testIp);
    }
    const blocked = await rateLimitCheck(testIp);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
  });

  it("resets after rateLimitReset()", async () => {
    for (let i = 0; i < 5; i++) await rateLimitCheck(testIp);
    await rateLimitReset(testIp);
    const result = await rateLimitCheck(testIp);
    expect(result.allowed).toBe(true);
  });

  it("treats different IPs independently", async () => {
    const ip2 = "10.0.0.test-" + Math.random();
    for (let i = 0; i < 5; i++) await rateLimitCheck(testIp);
    const result = await rateLimitCheck(ip2);
    expect(result.allowed).toBe(true);
  });
});
