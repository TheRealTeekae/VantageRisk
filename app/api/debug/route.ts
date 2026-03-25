import { NextResponse } from "next/server";
import { listEngagements } from "@/lib/store";

// GET /api/debug — returns extractedData from the most recent engagement
// Development only — remove before production deployment
export async function GET() {
  const engagements = listEngagements();

  if (engagements.length === 0) {
    return NextResponse.json({ error: "No engagements found" }, { status: 404 });
  }

  const latest = engagements[0];

  return NextResponse.json({
    engagementId: latest.id,
    clientName: latest.clientName,
    status: latest.status,
    files: latest.files,
    extractedData: latest.extractedData ?? null,
  });
}
