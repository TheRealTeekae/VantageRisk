import { NextRequest, NextResponse } from "next/server";
import { listEngagements, getEngagement } from "@/lib/store";
import { isValidAdminToken, getAdminTokenFromCookie } from "@/lib/auth";

function requireAdmin(request: NextRequest): boolean {
  const token = getAdminTokenFromCookie(
    request.headers.get("cookie")
  );
  return token ? isValidAdminToken(token) : false;
}

// GET /api/reports — list all engagements (admin only)
export async function GET(request: NextRequest) {
  if (!requireAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (id) {
    const engagement = getEngagement(id);
    if (!engagement) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(engagement);
  }

  return NextResponse.json(listEngagements());
}
