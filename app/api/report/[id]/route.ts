import { NextRequest, NextResponse } from "next/server";
import { getEngagement, updateEngagement, deleteEngagement } from "@/lib/store";
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

  // Report is accessible once sent (complete) or after archiving — archive is
  // an admin org tool and must not revoke a client's existing report link.
  const reportAccessible =
    engagement.report &&
    (engagement.status === "complete" || engagement.status === "archived");

  if (!reportAccessible) {
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

// DELETE /api/report/[id] — permanently delete an engagement and its report
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const deleted = await deleteEngagement(id);

  if (!deleted) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
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

  const body = await request.json();
  const { report } = body;
  if (!report || typeof report !== "object" || Array.isArray(report)) {
    return NextResponse.json({ error: "Invalid report body" }, { status: 400 });
  }
  await updateEngagement(id, { report });

  return NextResponse.json({ success: true });
}
