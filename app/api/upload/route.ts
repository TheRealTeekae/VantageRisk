import { NextRequest, NextResponse } from "next/server";
import { createEngagement, updateEngagement } from "@/lib/store";
import { extractDocumentData } from "@/lib/anthropic";
import { guessDocumentType, validateUploadedFiles } from "@/lib/documents";

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

    const validationError = validateUploadedFiles(files);
    if (validationError) {
      return NextResponse.json(
        { error: validationError.error },
        { status: validationError.status }
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
