import { NextRequest, NextResponse } from "next/server";
import { getEngagement } from "@/lib/store";

// GET /api/report/[id] — unauthenticated report access
// The engagement ID functions as the access token: it is a UUID (not guessable)
// and is only shared with the client who submitted the engagement.
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const engagement = await getEngagement(id);

  if (!engagement) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!engagement.report) {
    return NextResponse.json(
      {
        error: "Report not yet available",
        status: engagement.status,
        clientName: engagement.clientName,
      },
      { status: 404 }
    );
  }

  return NextResponse.json(engagement);
}
