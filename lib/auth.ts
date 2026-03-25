// ---------------------------------------------------------------------------
// Admin auth — JWT-signed tokens + brute-force rate limiting
// ---------------------------------------------------------------------------
// ─── AUTH FLOW ───────────────────────────────────────────────────────────────
//
//  LOGIN:
//    POST /api/admin/login
//      rateLimitCheck(ip) ──► exceeded → 429
//      checkAdminPassword(pw) ──► fail → 401
//      signAdminJWT() ──► jwt string
//      set cookie(admin_token=jwt, httpOnly, secure, sameSite=strict, 8h)
//
//  VERIFICATION (every admin route):
//    requireAdmin(request)
//      getAdminTokenFromCookie(header) → token | null
//      verifyAdminJWT(token) → { role: "admin" } | null
//      null → return false
//
//  RATE LIMITER (KV-backed, fail-open):
//    Redis INCR + EXPIRE pattern — atomic, persists across cold starts.
//    Key: rate:login:{ip}, TTL: 15 minutes, max 5 attempts per window.
//    Resets to zero on successful login (DEL key).
//    Fail-open: if KV is unavailable, the request is allowed through.
// ─────────────────────────────────────────────────────────────────────────────

import { SignJWT, jwtVerify } from "jose";
import { Redis } from "@upstash/redis";
import type { NextRequest } from "next/server";

const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

// Fail fast at module load if required env vars are missing
function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET env var is required");
  return new TextEncoder().encode(secret);
}

function getAdminPassword(): string {
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw) throw new Error("ADMIN_PASSWORD env var is required");
  return pw;
}

// ─── PASSWORD CHECK ───────────────────────────────────────────────────────────

export function checkAdminPassword(password: string): boolean {
  try {
    return password === getAdminPassword();
  } catch {
    console.warn("ADMIN_PASSWORD env var not set");
    return false;
  }
}

// ─── JWT ─────────────────────────────────────────────────────────────────────

export async function signAdminJWT(): Promise<string> {
  return new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(getJwtSecret());
}

export async function verifyAdminJWT(token: string): Promise<boolean> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    return payload.role === "admin";
  } catch {
    return false;
  }
}

// ─── COOKIE HELPERS ──────────────────────────────────────────────────────────

export function getAdminTokenFromCookie(
  cookieHeader: string | null
): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(/admin_token=([^;]+)/);
  return match ? match[1] : null;
}

// ─── ROUTE GUARD ─────────────────────────────────────────────────────────────

export async function requireAdmin(request: NextRequest): Promise<boolean> {
  const token = getAdminTokenFromCookie(request.headers.get("cookie"));
  if (!token) return false;
  return verifyAdminJWT(token);
}

// ─── RATE LIMITER (KV-backed) ────────────────────────────────────────────────

let _redis: Redis | null = null;

function getRateLimitRedis(): Redis {
  if (!_redis) {
    _redis = new Redis({
      url: process.env.KV_REST_API_URL ?? "",
      token: process.env.KV_REST_API_TOKEN ?? "",
    });
  }
  return _redis;
}

const RATE_KEY = (ip: string) => `rate:login:${ip}`;

export async function rateLimitCheck(
  ip: string
): Promise<{ allowed: boolean; remaining: number }> {
  try {
    const redis = getRateLimitRedis();
    const key = RATE_KEY(ip);
    const count = await redis.incr(key);
    if (count === 1) {
      // First attempt in this window — start TTL so the key auto-expires
      await redis.expire(key, Math.floor(RATE_LIMIT_WINDOW_MS / 1000));
    }
    if (count > RATE_LIMIT_MAX) {
      return { allowed: false, remaining: 0 };
    }
    return { allowed: true, remaining: RATE_LIMIT_MAX - count };
  } catch {
    // Fail-open: if KV is unavailable, allow the request
    console.warn("[auth] Rate limit KV unavailable — failing open");
    return { allowed: true, remaining: RATE_LIMIT_MAX };
  }
}

export async function rateLimitReset(ip: string): Promise<void> {
  try {
    await getRateLimitRedis().del(RATE_KEY(ip));
  } catch {
    // Best effort — ignore failures
  }
}
