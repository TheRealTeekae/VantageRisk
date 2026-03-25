// ---------------------------------------------------------------------------
// Simple admin auth — password check via environment variable
// ---------------------------------------------------------------------------
// Not production-grade. Replace with NextAuth or similar before any
// multi-user or public-facing admin access.
// ---------------------------------------------------------------------------

export function checkAdminPassword(password: string): boolean {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    console.warn("ADMIN_PASSWORD env var not set");
    return false;
  }
  return password === adminPassword;
}

export function getAdminTokenFromCookie(
  cookieHeader: string | null
): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(/admin_token=([^;]+)/);
  return match ? match[1] : null;
}

export function isValidAdminToken(token: string): boolean {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) return false;
  // Token is just the password for MVP — upgrade to JWT for production
  return token === adminPassword;
}
