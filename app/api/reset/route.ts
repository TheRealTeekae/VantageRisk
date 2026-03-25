import { NextRequest, NextResponse } from "next/server";
import { getEngagement, updateEngagement } from "@/lib/store";
import { requireAdmin } from "@/lib/auth";

// POST /api/reset — reset a stuck engagement back to "pending" (admin only)
// Used when extraction was aborted mid-flight (function timeout/crash).
export async function POST(request: NextRequest) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { engagementId } = await request.json();

    if (!engagementId) {
      return NextResponse.json({ error: "engagementId is required" }, { status: 400 });
    }

    const engagement = await getEngagement(engagementId);
    if (!engagement) {
      return NextResponse.json({ error: "Engagement not found" }, { status: 404 });
    }

    if (engagement.status !== "extracting" && engagement.status !== "error") {
      return NextResponse.json(
        { error: "Only extracting or error engagements can be reset" },
        { status: 409 }
      );
    }

    await updateEngagement(engagementId, { status: "pending" });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Reset error:", error);
    return NextResponse.json({ error: "Reset failed" }, { status: 500 });
  }
}
