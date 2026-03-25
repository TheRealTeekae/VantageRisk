import { describe, it, expect } from "vitest";
import { guessDocumentType, validateUploadedFiles } from "@/lib/documents";

describe("guessDocumentType", () => {
  it.each([
    ["loss_run_2024.pdf", "loss_run"],
    ["claims_history.xlsx", "loss_run"],
    ["run_report.pdf", "loss_run"],
    ["policy_dec_page.pdf", "policy"],
    ["commercial_policy.pdf", "policy"],
    ["binder_acme.pdf", "policy"],
    ["market_update_q1.pdf", "market_data"],
    ["benchmark_report.xlsx", "market_data"],
    ["capacity_overview.pdf", "market_data"],
    ["renewal_outlook_2025.pdf", "market_data"],
    ["contract.pdf", "other"],
    ["financials.xlsx", "other"],
    ["unknown_document.docx", "other"],
  ])('"%s" → %s', (filename, expected) => {
    expect(guessDocumentType(filename)).toBe(expected);
  });

  it("is case-insensitive", () => {
    expect(guessDocumentType("LOSS_RUN.PDF")).toBe("loss_run");
    expect(guessDocumentType("POLICY_DEC.PDF")).toBe("policy");
  });
});

function makeFile(name: string, size: number, type = "application/pdf"): File {
  const blob = new Blob([new Uint8Array(size)], { type });
  return new File([blob], name, { type });
}

describe("validateUploadedFiles", () => {
  it("returns null for valid files", () => {
    const files = [makeFile("policy.pdf", 1024)];
    expect(validateUploadedFiles(files)).toBeNull();
  });

  it("rejects empty file list", () => {
    const result = validateUploadedFiles([]);
    expect(result).not.toBeNull();
    expect(result!.status).toBe(400);
  });

  it("rejects more than 10 files", () => {
    const files = Array.from({ length: 11 }, (_, i) =>
      makeFile(`file${i}.pdf`, 1024)
    );
    const result = validateUploadedFiles(files);
    expect(result).not.toBeNull();
    expect(result!.error).toMatch(/too many/i);
  });

  it("rejects a 0-byte file", () => {
    const result = validateUploadedFiles([makeFile("empty.pdf", 0)]);
    expect(result).not.toBeNull();
    expect(result!.error).toMatch(/empty/i);
  });

  it("rejects a file over 25MB", () => {
    const over25mb = 26 * 1024 * 1024;
    const result = validateUploadedFiles([makeFile("huge.pdf", over25mb)]);
    expect(result).not.toBeNull();
    expect(result!.error).toMatch(/25MB/i);
  });

  it("rejects unsupported MIME types", () => {
    const result = validateUploadedFiles([
      makeFile("script.exe", 1024, "application/x-msdownload"),
    ]);
    expect(result).not.toBeNull();
    expect(result!.error).toMatch(/unsupported type/i);
  });

  it("accepts exactly 10 files", () => {
    const files = Array.from({ length: 10 }, (_, i) =>
      makeFile(`file${i}.pdf`, 1024)
    );
    expect(validateUploadedFiles(files)).toBeNull();
  });
});
