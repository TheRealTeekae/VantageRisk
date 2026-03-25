import { NextRequest, NextResponse } from "next/server";
import { getEngagement, updateEngagement, attachReport } from "@/lib/store";
import { generateRenewalReport } from "@/lib/anthropic";
import { isValidAdminToken, getAdminTokenFromCookie } from "@/lib/auth";
import { RenewalReport } from "@/types";

function requireAdmin(request: NextRequest): boolean {
  const token = getAdminTokenFromCookie(request.headers.get("cookie"));
  return token ? isValidAdminToken(token) : false;
}

// POST /api/generate — trigger report generation for an engagement (admin only)
export async function POST(request: NextRequest) {
  if (!requireAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let engagementId: string | undefined;

  try {
    const body = await request.json();
    engagementId = body.engagementId;

    if (!engagementId) {
      return NextResponse.json(
        { error: "engagementId is required" },
        { status: 400 }
      );
    }

    const engagement = getEngagement(engagementId);
    if (!engagement) {
      return NextResponse.json({ error: "Engagement not found" }, { status: 404 });
    }

    if (engagement.status === "analyzing" || engagement.status === "extracting") {
      return NextResponse.json(
        { error: "Report generation already in progress" },
        { status: 409 }
      );
    }

    updateEngagement(engagementId, { status: "analyzing" });

    if (!engagement.extractedData) {
      return NextResponse.json(
        { error: "No extracted document data found. Please re-upload files before generating a report." },
        { status: 422 }
      );
    }

    const rawReport = await generateRenewalReport(engagement.extractedData);

    const report: RenewalReport = {
      id: crypto.randomUUID(),
      engagementId,
      generatedAt: new Date().toISOString(),
      ...(rawReport as Omit<RenewalReport, "id" | "engagementId" | "generatedAt">),
    };

    attachReport(engagementId, report);

    return NextResponse.json({ reportId: report.id, engagementId });
  } catch (error) {
    console.error("Report generation error:", error);
    if (engagementId) updateEngagement(engagementId, { status: "error" });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Report generation failed" },
      { status: 500 }
    );
  }
}
