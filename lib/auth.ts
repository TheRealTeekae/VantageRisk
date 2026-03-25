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
//  RATE LIMITER:
//    Map<ip, { count: number, resetAt: number }>
//    5 attempts per 15-minute window per IP
//    Resets to zero on successful login
//    NOTE: in-memory — resets on cold start (acceptable for MVP)
//    TODO: migrate to Vercel KV in PR2 for persistence across cold starts
// ─────────────────────────────────────────────────────────────────────────────

import { SignJWT, jwtVerify } from "jose";
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

// ─── RATE LIMITER ────────────────────────────────────────────────────────────

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const loginAttempts = new Map<string, RateLimitEntry>();

export function rateLimitCheck(ip: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = loginAttempts.get(ip);

  if (!entry || now >= entry.resetAt) {
    loginAttempts.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1 };
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return { allowed: false, remaining: 0 };
  }

  entry.count += 1;
  return { allowed: true, remaining: RATE_LIMIT_MAX - entry.count };
}

export function rateLimitReset(ip: string): void {
  loginAttempts.delete(ip);
}
