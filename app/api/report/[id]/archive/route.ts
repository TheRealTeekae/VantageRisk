import { NextRequest, NextResponse } from "next/server";
import { getEngagement, updateEngagement } from "@/lib/store";
import { requireAdmin } from "@/lib/auth";

// POST /api/report/[id]/archive — move an engagement to archived state
export async function POST(
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

  if (engagement.status === "archived") {
    return NextResponse.json({ error: "Already archived" }, { status: 409 });
  }

  await updateEngagement(id, { status: "archived" });
  return NextResponse.json({ success: true });
}

// DELETE /api/report/[id]/archive — restore an archived engagement
// If it has a report, restores to "complete". Otherwise restores to "pending".
export async function DELETE(
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

  if (engagement.status !== "archived") {
    return NextResponse.json({ error: "Not archived" }, { status: 409 });
  }

  const restoredStatus = engagement.report ? "complete" : "pending";
  await updateEngagement(id, { status: restoredStatus });
  return NextResponse.json({ success: true });
}
