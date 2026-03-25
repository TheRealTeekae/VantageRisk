import { NextRequest, NextResponse } from "next/server";
import { extractDocumentData } from "@/lib/anthropic";
import { requireAdmin } from "@/lib/auth";

// POST /api/extract — internal document extraction endpoint (admin only)
// In production this is called internally by the upload pipeline,
// NOT directly by any client. Raw document text is processed and discarded.
export async function POST(request: NextRequest) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { text, documentType } = await request.json();

    if (!text || !documentType) {
      return NextResponse.json(
        { error: "text and documentType are required" },
        { status: 400 }
      );
    }

    const extracted = await extractDocumentData(text, documentType);

    return NextResponse.json({ extracted });
  } catch (error) {
    console.error("Extraction error:", error);
    return NextResponse.json({ error: "Extraction failed" }, { status: 500 });
  }
}
