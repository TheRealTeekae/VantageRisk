import { NextRequest, NextResponse } from "next/server";
import { listEngagements, getEngagement } from "@/lib/store";
import { requireAdmin } from "@/lib/auth";

// GET /api/reports — list all engagements (admin only)
export async function GET(request: NextRequest) {
  if (!(await requireAdmin(request))) {
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
