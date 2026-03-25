import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";

// ─── MOCK @upstash/redis ──────────────────────────────────────────────────────
const _kvStore = new Map<string, unknown>();
const _kvSortedSets = new Map<string, { score: number; member: string }[]>();

vi.mock("@upstash/redis", () => {
  // Must use a regular function (not arrow) so `new Redis()` works
  const Redis = vi.fn(function () {
    return {
      set: async (key: string, value: unknown) => {
        _kvStore.set(key, JSON.parse(JSON.stringify(value)));
        return "OK";
      },
      get: async (key: string) => _kvStore.get(key) ?? null,
      zadd: async (
        key: string,
        { score, member }: { score: number; member: string }
      ) => {
        const set = _kvSortedSets.get(key) ?? [];
        const filtered = set.filter((e) => e.member !== member);
        filtered.push({ score, member });
        _kvSortedSets.set(key, filtered);
        return 1;
      },
      zrange: async () => [],
      mget: async (...keys: string[]) =>
        keys.map((k) => _kvStore.get(k) ?? null),
    };
  });
  return { Redis };
});

// ─── MOCK next/server after() ─────────────────────────────────────────────────
// Capture after() callbacks so tests can flush them manually and assert on
// the resulting engagement state.

let _afterCallbacks: (() => Promise<void>)[] = [];

vi.mock("next/server", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/server")>();
  return {
    ...actual,
    after: vi.fn((fn: () => Promise<void>) => {
      _afterCallbacks.push(fn);
    }),
  };
});

async function flushAfter() {
  for (const cb of [..._afterCallbacks]) {
    await cb();
  }
  _afterCallbacks = [];
}

// ─── MOCK lib/anthropic ───────────────────────────────────────────────────────
vi.mock("@/lib/anthropic", () => ({
  extractDocumentData: vi.fn().mockResolvedValue({
    documentType: "policy",
    namedInsured: "Test Corp",
    policyNumber: null,
    carrier: null,
    effectiveDate: null,
    expirationDate: null,
    lineOfBusiness: "Commercial General Liability",
    premium: null,
    limits: { perOccurrence: null, aggregate: null, additionalLimits: [] },
    deductibleOrSIR: { type: null, amount: null },
    sublimits: [],
    keyExclusions: [],
    manuscriptEndorsements: [],
    notes: [],
  }),
}));

// ─── IMPORT AFTER MOCKS ───────────────────────────────────────────────────────
import { POST } from "@/app/api/upload/route";
import { getEngagement } from "@/lib/store";
import { extractDocumentData } from "@/lib/anthropic";

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function makeUploadRequest(overrides: {
  clientName?: string;
  clientEmail?: string;
  files?: File[];
} = {}): NextRequest {
  const formData = new FormData();
  if (overrides.clientName !== undefined) {
    formData.append("clientName", overrides.clientName);
  }
  if (overrides.clientEmail !== undefined) {
    formData.append("clientEmail", overrides.clientEmail);
  }
  const files = overrides.files ?? [
    new File(["PDF content"], "policy.pdf", { type: "application/pdf" }),
  ];
  for (const file of files) {
    formData.append("files", file);
  }
  return new NextRequest("http://localhost/api/upload", {
    method: "POST",
    body: formData,
  });
}

// ─── TESTS ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  _kvStore.clear();
  _kvSortedSets.clear();
  _afterCallbacks = [];
  vi.mocked(extractDocumentData).mockClear();
});

describe("POST /api/upload — validation", () => {
  it("returns 400 when clientName is missing", async () => {
    const req = makeUploadRequest({ clientEmail: "test@example.com" });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/client name/i);
  });

  it("returns 400 when clientEmail is missing", async () => {
    const req = makeUploadRequest({ clientName: "Acme Corp" });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/client email/i);
  });

  it("returns 400 when no files are provided", async () => {
    const req = makeUploadRequest({
      clientName: "Acme Corp",
      clientEmail: "test@example.com",
      files: [],
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});

describe("POST /api/upload — success", () => {
  it("returns 200 with engagementId", async () => {
    const req = makeUploadRequest({
      clientName: "Acme Corp",
      clientEmail: "acme@example.com",
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.engagementId).toBeTruthy();
  });

  it("creates engagement with extracting status before after() runs", async () => {
    const req = makeUploadRequest({
      clientName: "Acme Corp",
      clientEmail: "acme@example.com",
    });
    const res = await POST(req);
    const { engagementId } = await res.json();

    const eng = await getEngagement(engagementId);
    expect(eng!.status).toBe("extracting");
  });

  it("extraction runs and sets status to pending with extractedData", async () => {
    const req = makeUploadRequest({
      clientName: "Acme Corp",
      clientEmail: "acme@example.com",
    });
    const res = await POST(req);
    const { engagementId } = await res.json();

    await flushAfter();

    const eng = await getEngagement(engagementId);
    expect(eng!.status).toBe("pending");
    expect(eng!.extractedData).toBeDefined();
    expect(eng!.extractedData!.policies).toHaveLength(1);
  });

  it("stores file metadata on the engagement", async () => {
    const req = makeUploadRequest({
      clientName: "Acme Corp",
      clientEmail: "acme@example.com",
      files: [
        new File(["content"], "commercial_gl_policy.pdf", { type: "application/pdf" }),
      ],
    });
    const res = await POST(req);
    const { engagementId } = await res.json();

    const eng = await getEngagement(engagementId);
    expect(eng!.files).toHaveLength(1);
    expect(eng!.files[0].name).toBe("commercial_gl_policy.pdf");
  });
});

describe("POST /api/upload — extraction failure", () => {
  it("sets engagement status to error when extractDocumentData throws", async () => {
    vi.mocked(extractDocumentData).mockRejectedValueOnce(
      new Error("Anthropic API unavailable")
    );

    const req = makeUploadRequest({
      clientName: "Acme Corp",
      clientEmail: "acme@example.com",
    });
    const res = await POST(req);
    const { engagementId } = await res.json();

    await flushAfter();

    const eng = await getEngagement(engagementId);
    expect(eng!.status).toBe("error");
  });
});
