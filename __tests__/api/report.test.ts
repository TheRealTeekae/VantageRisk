import { describe, it, expect, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Must set env before imports that read it at module load
process.env.JWT_SECRET = "test-secret-at-least-32-chars-long!!";
process.env.ADMIN_PASSWORD = "test-admin-password";

import { GET } from "@/app/api/report/[id]/route";
import { createEngagement, attachReport } from "@/lib/store";
import type { RenewalReport } from "@/types";

function makeReport(engagementId: string): RenewalReport {
  return {
    id: "report-123",
    engagementId,
    generatedAt: new Date().toISOString(),
    programSummary: {
      namedInsured: "Acme Corp",
      linesOfBusiness: [],
    },
    lossTrendAnalysis: {
      yearsAnalyzed: 3,
      frequencyTrend: "stable",
      severityTrend: "stable",
      totalIncurredAllYears: "$500,000",
    },
    coverageGaps: [],
    renewalNarrative: "Test narrative.",
    recommendations: [],
  };
}

describe("GET /api/report/[id]", () => {
  it("returns 404 for unknown engagement", async () => {
    const req = new NextRequest("http://localhost/api/report/nonexistent-id");
    const res = await GET(req, { params: Promise.resolve({ id: "nonexistent-id" }) });
    expect(res.status).toBe(404);
  });

  it("returns 404 when engagement exists but report not yet generated", async () => {
    const eng = createEngagement("Test Client");
    const req = new NextRequest(`http://localhost/api/report/${eng.id}`);
    const res = await GET(req, { params: Promise.resolve({ id: eng.id }) });
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toMatch(/not yet available/i);
  });

  it("returns engagement with report when complete", async () => {
    const eng = createEngagement("Acme Corp");
    attachReport(eng.id, makeReport(eng.id));

    const req = new NextRequest(`http://localhost/api/report/${eng.id}`);
    const res = await GET(req, { params: Promise.resolve({ id: eng.id }) });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.clientName).toBe("Acme Corp");
    expect(body.report).toBeDefined();
    expect(body.report.id).toBe("report-123");
  });

  it("does not require admin cookie", async () => {
    const eng = createEngagement("No Auth Client");
    attachReport(eng.id, makeReport(eng.id));

    // No cookie set on request
    const req = new NextRequest(`http://localhost/api/report/${eng.id}`);
    const res = await GET(req, { params: Promise.resolve({ id: eng.id }) });
    expect(res.status).toBe(200);
  });
});
