// ─── DOCUMENT PIPELINE ───────────────────────────────────────────────────────
//
//  validateUploadedFiles(files):
//    count > 10 → error
//    any file == 0 bytes → error
//    any file > 25MB → error
//    any MIME not in allowlist → error
//    allowlist: pdf, xlsx, xls, csv, docx
//
//  guessDocumentType(filename):
//    loss|run|claims → loss_run
//    policy|dec|binder → policy
//    market|benchmark|capacity → market_data
//    else → other
// ─────────────────────────────────────────────────────────────────────────────

const MAX_FILES = 10;
const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25MB

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/csv",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  // Some browsers send these variants
  "application/msword",
  "application/octet-stream", // fallback for some PDF uploads
]);

export interface FileValidationError {
  error: string;
  status: 400;
}

export function validateUploadedFiles(
  files: File[]
): FileValidationError | null {
  if (files.length === 0) {
    return { error: "At least one file is required", status: 400 };
  }

  if (files.length > MAX_FILES) {
    return {
      error: `Too many files. Maximum ${MAX_FILES} files per submission.`,
      status: 400,
    };
  }

  for (const file of files) {
    if (file.size === 0) {
      return { error: `File "${file.name}" is empty.`, status: 400 };
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return {
        error: `File "${file.name}" exceeds the 25MB size limit.`,
        status: 400,
      };
    }

    if (!ALLOWED_MIME_TYPES.has(file.type) && !file.name.toLowerCase().endsWith(".pdf")) {
      return {
        error: `File "${file.name}" has an unsupported type. Please upload PDF, Excel, CSV, or Word documents.`,
        status: 400,
      };
    }
  }

  return null;
}

export function guessDocumentType(
  filename: string
): "policy" | "loss_run" | "market_data" | "other" {
  const lower = filename.toLowerCase();
  if (lower.includes("loss") || lower.includes("run") || lower.includes("claims")) {
    return "loss_run";
  }
  if (lower.includes("policy") || lower.includes("dec") || lower.includes("binder")) {
    return "policy";
  }
  if (
    lower.includes("market") ||
    lower.includes("rate change") ||
    lower.includes("rate_change") ||
    lower.includes("benchmark") ||
    lower.includes("capacity") ||
    lower.includes("renewal outlook") ||
    lower.includes("renewal_outlook") ||
    lower.includes("market update") ||
    lower.includes("market_update")
  ) {
    return "market_data";
  }
  return "other";
}
