// ---------------------------------------------------------------------------
// Email delivery via Resend
// ---------------------------------------------------------------------------
// RESEND_API_KEY must be set in production. If missing, emails are skipped
// with a warning — this allows local development without email credentials.
// ---------------------------------------------------------------------------

import { Resend } from "resend";

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.warn("[email] RESEND_API_KEY not set — email delivery skipped");
    return null;
  }
  return new Resend(key);
}

export async function sendReportEmail(
  clientEmail: string | null | undefined,
  engagementId: string,
  clientName: string
): Promise<void> {
  if (!clientEmail) {
    console.warn(`[email] No client email for engagement ${engagementId} — skipping`);
    return;
  }

  const resend = getResend();
  if (!resend) return;

  const fromAddress = process.env.RESEND_FROM_ADDRESS ?? "reports@vantagerisk.com";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://vantagerisk.com";
  const reportUrl = `${appUrl}/report/${engagementId}`;

  try {
    await resend.emails.send({
      from: fromAddress,
      to: clientEmail,
      subject: "Your Renewal Intelligence Report is Ready",
      text: [
        `Hello,`,
        ``,
        `Your Renewal Intelligence Report for ${clientName} is ready.`,
        ``,
        `View your report here:`,
        reportUrl,
        ``,
        `This link is unique to your engagement. Please keep it secure.`,
        ``,
        `— Vantage Risk`,
      ].join("\n"),
    });
  } catch (error) {
    // Email failure should never block report generation — log and continue
    console.error(`[email] Failed to send report email to ${clientEmail}:`, error);
  }
}
