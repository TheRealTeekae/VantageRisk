import { NextRequest, NextResponse } from "next/server";
import { getEngagement, updateEngagement } from "@/lib/store";
import { requireAdmin } from "@/lib/auth";

// GET /api/report/[id] — unauthenticated report access
// The engagement ID functions as the access token: it is a UUID (not guessable)
// and is only shared with the client who submitted the engagement.
// Report is only accessible once the admin has sent it (status === "complete").
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const engagement = await getEngagement(id);

  if (!engagement) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!engagement.report || engagement.status !== "complete") {
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

// PATCH /api/report/[id] — admin saves edited report content
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const engagement = await getEngagement(id);

  if (!engagement) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { report } = await request.json();
  await updateEngagement(id, { report });

  return NextResponse.json({ success: true });
}
