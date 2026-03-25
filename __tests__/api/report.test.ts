import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";

// Must set env before imports that read it at module load
process.env.JWT_SECRET = "test-secret-at-least-32-chars-long!!";
process.env.ADMIN_PASSWORD = "test-admin-password";

// ─── MOCK @upstash/redis ──────────────────────────────────────────────────────
const _store = new Map<string, unknown>();
const _sortedSets = new Map<string, { score: number; member: string }[]>();

vi.mock("@upstash/redis", () => {
  const Redis = vi.fn(function () {
    return {
      set: async (key: string, value: unknown) => {
        _store.set(key, JSON.parse(JSON.stringify(value)));
        return "OK";
      },
      get: async (key: string) => _store.get(key) ?? null,
      zadd: async (
        key: string,
        { score, member }: { score: number; member: string }
      ) => {
        const set = _sortedSets.get(key) ?? [];
        const filtered = set.filter((e) => e.member !== member);
        filtered.push({ score, member });
        _sortedSets.set(key, filtered);
        return 1;
      },
      zrange: async () => [],
      mget: async (...keys: string[]) =>
        keys.map((k) => _store.get(k) ?? null),
    };
  });
  return { Redis };
});

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

beforeEach(() => {
  _store.clear();
  _sortedSets.clear();
});

describe("GET /api/report/[id]", () => {
  it("returns 404 for unknown engagement", async () => {
    const req = new NextRequest("http://localhost/api/report/nonexistent-id");
    const res = await GET(req, { params: Promise.resolve({ id: "nonexistent-id" }) });
    expect(res.status).toBe(404);
  });

  it("returns 404 when engagement exists but report not yet generated", async () => {
    const eng = await createEngagement("Test Client");
    const req = new NextRequest(`http://localhost/api/report/${eng.id}`);
    const res = await GET(req, { params: Promise.resolve({ id: eng.id }) });
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toMatch(/not yet available/i);
  });

  it("returns engagement with report when complete", async () => {
    const eng = await createEngagement("Acme Corp");
    await attachReport(eng.id, makeReport(eng.id));

    const req = new NextRequest(`http://localhost/api/report/${eng.id}`);
    const res = await GET(req, { params: Promise.resolve({ id: eng.id }) });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.clientName).toBe("Acme Corp");
    expect(body.report).toBeDefined();
    expect(body.report.id).toBe("report-123");
  });

  it("does not require admin cookie", async () => {
    const eng = await createEngagement("No Auth Client");
    await attachReport(eng.id, makeReport(eng.id));

    // No cookie set on request
    const req = new NextRequest(`http://localhost/api/report/${eng.id}`);
    const res = await GET(req, { params: Promise.resolve({ id: eng.id }) });
    expect(res.status).toBe(200);
  });
});
