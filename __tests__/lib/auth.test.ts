import { describe, it, expect, beforeEach, vi } from "vitest";

// Set required env vars before importing the module
process.env.JWT_SECRET = "test-secret-at-least-32-chars-long!!";
process.env.ADMIN_PASSWORD = "test-admin-password";

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

  beforeEach(() => {
    rateLimitReset(testIp);
  });

  it("allows first attempt", () => {
    const result = rateLimitCheck(testIp);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4);
  });

  it("allows up to 5 attempts", () => {
    for (let i = 0; i < 4; i++) {
      expect(rateLimitCheck(testIp).allowed).toBe(true);
    }
    // 5th attempt — still allowed (count goes from 4 to 5, but limit is >5)
    const fifth = rateLimitCheck(testIp);
    expect(fifth.allowed).toBe(true);
  });

  it("blocks the 6th attempt", () => {
    for (let i = 0; i < 5; i++) {
      rateLimitCheck(testIp);
    }
    const blocked = rateLimitCheck(testIp);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
  });

  it("resets after rateLimitReset()", () => {
    for (let i = 0; i < 5; i++) rateLimitCheck(testIp);
    rateLimitReset(testIp);
    const result = rateLimitCheck(testIp);
    expect(result.allowed).toBe(true);
  });

  it("treats different IPs independently", () => {
    const ip2 = "10.0.0.test-" + Math.random();
    for (let i = 0; i < 5; i++) rateLimitCheck(testIp);
    const result = rateLimitCheck(ip2);
    expect(result.allowed).toBe(true);
  });
});
