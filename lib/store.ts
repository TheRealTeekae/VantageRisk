// ---------------------------------------------------------------------------
// In-memory engagement store — MVP only, no persistence layer yet
// ---------------------------------------------------------------------------
// Replace with a real database (e.g. Postgres via Prisma) before launch.
// All data here is lost on server restart. This is intentional for MVP.
// ---------------------------------------------------------------------------

import { Engagement, RenewalReport } from "@/types";

const engagements = new Map<string, Engagement>();

export function createEngagement(clientName: string): Engagement {
  const id = crypto.randomUUID();
  const engagement: Engagement = {
    id,
    clientName,
    submittedAt: new Date().toISOString(),
    status: "pending",
    files: [],
  };
  engagements.set(id, engagement);
  return engagement;
}

export function getEngagement(id: string): Engagement | undefined {
  return engagements.get(id);
}

export function listEngagements(): Engagement[] {
  return Array.from(engagements.values()).sort(
    (a, b) =>
      new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
  );
}

export function updateEngagement(
  id: string,
  updates: Partial<Engagement>
): Engagement | undefined {
  const existing = engagements.get(id);
  if (!existing) return undefined;
  const updated = { ...existing, ...updates };
  engagements.set(id, updated);
  return updated;
}

export function attachReport(
  engagementId: string,
  report: RenewalReport
): Engagement | undefined {
  return updateEngagement(engagementId, { report, status: "complete" });
}
