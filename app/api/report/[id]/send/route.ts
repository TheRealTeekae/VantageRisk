import { NextRequest, NextResponse } from "next/server";
import { getEngagement, updateEngagement } from "@/lib/store";
import { requireAdmin } from "@/lib/auth";
import { sendReportEmail } from "@/lib/email";

// POST /api/report/[id]/send — admin finalizes and delivers report to client
// Transitions status from "review" → "complete" and triggers the email.
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

  if (!engagement.report) {
    return NextResponse.json({ error: "No report to send" }, { status: 422 });
  }

  if (engagement.status !== "review") {
    return NextResponse.json(
      { error: "Engagement is not in review status" },
      { status: 409 }
    );
  }

  await updateEngagement(id, { status: "complete" });
  const emailSent = await sendReportEmail(engagement.clientEmail, id, engagement.clientName);

  return NextResponse.json({
    success: true,
    emailSent,
    ...(emailSent ? {} : { warning: "Report sent but email delivery failed. Follow up with the client directly." }),
  });
}
