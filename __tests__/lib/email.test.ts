import { describe, it, expect, beforeEach, vi } from "vitest";

// ─── MOCK resend ──────────────────────────────────────────────────────────────
// vi.hoisted() ensures mockSend is initialised before the vi.mock() factory
// runs (vi.mock is hoisted to the top of the file by Vitest's transform).
const mockSend = vi.hoisted(() =>
  vi.fn().mockResolvedValue({ data: { id: "email-123" }, error: null })
);

vi.mock("resend", () => {
  // Must use a regular function (not arrow) so `new Resend()` works
  const Resend = vi.fn(function () {
    return { emails: { send: mockSend } };
  });
  return { Resend };
});

// ─── IMPORT AFTER MOCK ────────────────────────────────────────────────────────
import { sendReportEmail } from "@/lib/email";

beforeEach(() => {
  mockSend.mockClear();
  delete process.env.RESEND_API_KEY;
  delete process.env.RESEND_FROM_ADDRESS;
  delete process.env.NEXT_PUBLIC_APP_URL;
});

// ─── TESTS ────────────────────────────────────────────────────────────────────

describe("sendReportEmail", () => {
  it("skips sending when RESEND_API_KEY is not set", async () => {
    await sendReportEmail("client@example.com", "eng-123", "Acme Corp");
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("skips sending when clientEmail is null", async () => {
    process.env.RESEND_API_KEY = "test-key";
    await sendReportEmail(null, "eng-123", "Acme Corp");
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("skips sending when clientEmail is undefined", async () => {
    process.env.RESEND_API_KEY = "test-key";
    await sendReportEmail(undefined, "eng-123", "Acme Corp");
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("sends email with correct recipient and subject", async () => {
    process.env.RESEND_API_KEY = "test-key";
    process.env.NEXT_PUBLIC_APP_URL = "https://app.example.com";

    await sendReportEmail("client@example.com", "eng-456", "Acme Corp");

    expect(mockSend).toHaveBeenCalledOnce();
    const call = mockSend.mock.calls[0][0];
    expect(call.to).toBe("client@example.com");
    expect(call.subject).toMatch(/ready/i);
  });

  it("includes the report URL in email body", async () => {
    process.env.RESEND_API_KEY = "test-key";
    process.env.NEXT_PUBLIC_APP_URL = "https://app.example.com";

    await sendReportEmail("client@example.com", "eng-789", "Acme Corp");

    const call = mockSend.mock.calls[0][0];
    expect(call.text).toContain("https://app.example.com/report/eng-789");
  });

  it("uses RESEND_FROM_ADDRESS env var when set", async () => {
    process.env.RESEND_API_KEY = "test-key";
    process.env.RESEND_FROM_ADDRESS = "custom@vantage.com";

    await sendReportEmail("client@example.com", "eng-999", "Acme Corp");

    const call = mockSend.mock.calls[0][0];
    expect(call.from).toBe("custom@vantage.com");
  });

  it("returns false and does not throw when Resend.send() rejects", async () => {
    process.env.RESEND_API_KEY = "test-key";
    mockSend.mockRejectedValueOnce(new Error("Resend API down"));

    await expect(
      sendReportEmail("client@example.com", "eng-fail", "Acme Corp")
    ).resolves.toBe(false);
  });

  it("returns true when email sends successfully", async () => {
    process.env.RESEND_API_KEY = "test-key";
    const result = await sendReportEmail("client@example.com", "eng-ok", "Acme Corp");
    expect(result).toBe(true);
  });
});
