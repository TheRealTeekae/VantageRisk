import { describe, it, expect, beforeEach, vi } from "vitest";

// ─── MOCK @upstash/redis ──────────────────────────────────────────────────────
// In-memory implementation of the Redis commands used by lib/store.ts.
// Scoped to this module; reset before each test via clearAllMocks + fresh maps.

const _store = new Map<string, unknown>();
const _sortedSets = new Map<string, { score: number; member: string }[]>();

vi.mock("@upstash/redis", () => {
  // Must use a regular function (not arrow) so `new Redis()` works
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
      zrange: async (
        key: string,
        _start: number,
        _end: number,
        opts?: { rev?: boolean }
      ) => {
        const set = _sortedSets.get(key) ?? [];
        const sorted = [...set].sort((a, b) =>
          opts?.rev ? b.score - a.score : a.score - b.score
        );
        return sorted.map((e) => e.member);
      },
      mget: async (...keys: string[]) =>
        keys.map((key) => _store.get(key) ?? null),
    };
  });
  return { Redis };
});

// ─── IMPORT AFTER MOCK ────────────────────────────────────────────────────────
import {
  createEngagement,
  getEngagement,
  listEngagements,
  updateEngagement,
  attachReport,
} from "@/lib/store";
import type { RenewalReport } from "@/types";

beforeEach(() => {
  _store.clear();
  _sortedSets.clear();
});

// ─── TESTS ────────────────────────────────────────────────────────────────────

describe("createEngagement", () => {
  it("creates an engagement with correct initial fields", async () => {
    const eng = await createEngagement("Acme Corp", "acme@example.com");
    expect(eng.id).toBeTruthy();
    expect(eng.clientName).toBe("Acme Corp");
    expect(eng.clientEmail).toBe("acme@example.com");
    expect(eng.status).toBe("pending");
    expect(eng.files).toEqual([]);
    expect(eng.submittedAt).toBeTruthy();
  });

  it("creates an engagement without email", async () => {
    const eng = await createEngagement("Acme Corp");
    expect(eng.clientEmail).toBeUndefined();
  });

  it("generates a unique id for each engagement", async () => {
    const a = await createEngagement("Client A");
    const b = await createEngagement("Client B");
    expect(a.id).not.toBe(b.id);
  });
});

describe("getEngagement", () => {
  it("returns the engagement by id", async () => {
    const created = await createEngagement("Test Client");
    const fetched = await getEngagement(created.id);
    expect(fetched).toBeDefined();
    expect(fetched!.id).toBe(created.id);
    expect(fetched!.clientName).toBe("Test Client");
  });

  it("returns undefined for unknown id", async () => {
    const result = await getEngagement("nonexistent-id");
    expect(result).toBeUndefined();
  });
});

describe("listEngagements", () => {
  it("returns empty array when no engagements exist", async () => {
    const results = await listEngagements();
    expect(results).toEqual([]);
  });

  it("returns engagements newest-first", async () => {
    const a = await createEngagement("A");
    await new Promise((r) => setTimeout(r, 5)); // ensure different timestamps
    const b = await createEngagement("B");
    await new Promise((r) => setTimeout(r, 5));
    const c = await createEngagement("C");

    const list = await listEngagements();
    expect(list.map((e) => e.clientName)).toEqual(["C", "B", "A"]);
    expect(list[0].id).toBe(c.id);
    expect(list[2].id).toBe(a.id);
  });
});

describe("updateEngagement", () => {
  it("merges updates into existing engagement", async () => {
    const eng = await createEngagement("Test");
    const updated = await updateEngagement(eng.id, { status: "extracting" });
    expect(updated!.status).toBe("extracting");
    expect(updated!.clientName).toBe("Test"); // unchanged fields preserved
  });

  it("returns undefined for unknown id", async () => {
    const result = await updateEngagement("bad-id", { status: "error" });
    expect(result).toBeUndefined();
  });

  it("can update files array", async () => {
    const eng = await createEngagement("Test");
    const files = [{ name: "policy.pdf", type: "policy" as const, uploadedAt: new Date().toISOString() }];
    const updated = await updateEngagement(eng.id, { files });
    expect(updated!.files).toHaveLength(1);
    expect(updated!.files[0].name).toBe("policy.pdf");
  });
});

describe("attachReport", () => {
  it("sets report and marks status complete", async () => {
    const eng = await createEngagement("Test");
    const report: RenewalReport = {
      id: "r1",
      engagementId: eng.id,
      generatedAt: new Date().toISOString(),
      programSummary: {
        namedInsured: "Test Corp",
        linesOfBusiness: [],
      },
      lossTrendAnalysis: {
        yearsAnalyzed: 3,
        frequencyTrend: "stable",
        severityTrend: "stable",
        totalIncurredAllYears: "$0",
      },
      coverageGaps: [],
      renewalNarrative: "Test narrative",
      recommendations: [],
    };

    const updated = await attachReport(eng.id, report);
    expect(updated!.status).toBe("complete");
    expect(updated!.report).toBeDefined();
    expect(updated!.report!.id).toBe("r1");
  });

  it("returns undefined for unknown engagement", async () => {
    const result = await attachReport("bad-id", {} as RenewalReport);
    expect(result).toBeUndefined();
  });
});
