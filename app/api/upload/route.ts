import { NextRequest, NextResponse } from "next/server";
import { createEngagement, updateEngagement } from "@/lib/store";
import { extractDocumentData } from "@/lib/anthropic";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const clientName = formData.get("clientName") as string;
    const files = formData.getAll("files") as File[];

    if (!clientName) {
      return NextResponse.json(
        { error: "Client name is required" },
        { status: 400 }
      );
    }

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: "At least one file is required" },
        { status: 400 }
      );
    }

    // Create engagement record
    const engagement = createEngagement(clientName);

    // Store file metadata
    const fileMetadata = files.map((file) => ({
      name: file.name,
      type: guessDocumentType(file.name),
      uploadedAt: new Date().toISOString(),
    }));

    updateEngagement(engagement.id, { files: fileMetadata, status: "extracting" });

    // Extract text from each file and run AI extraction
    const extractedData: { policies: unknown[]; lossRuns: unknown[]; marketData: unknown[] } = {
      policies: [],
      lossRuns: [],
      marketData: [],
    };

    for (const file of files) {
      const docType = guessDocumentType(file.name);
      const buffer = Buffer.from(await file.arrayBuffer());

      const content = file.name.toLowerCase().endsWith(".pdf")
        ? buffer
        : buffer.toString("utf-8");

      const extracted = await extractDocumentData(content, docType);

      if (docType === "policy") extractedData.policies.push(extracted);
      else if (docType === "loss_run") extractedData.lossRuns.push(extracted);
      else if (docType === "market_data") extractedData.marketData.push(extracted);
      else extractedData.policies.push(extracted); // store unknowns with policies
    }

    updateEngagement(engagement.id, { extractedData, status: "pending" });

    return NextResponse.json({
      engagementId: engagement.id,
      message: "Upload received. Your documents are being processed.",
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

function guessDocumentType(
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
    lower.includes("benchmark") ||
    lower.includes("capacity") ||
    lower.includes("renewal outlook") ||
    lower.includes("market update")
  ) {
    return "market_data";
  }
  return "other";
}
