// ─── ASYNC EXTRACTION FLOW ───────────────────────────────────────────────────
//
//  REQUEST                    RESPONSE          AFTER() (background)
//  ───────                    ────────          ────────────────────
//  validate files             { engagementId }  Promise.all(
//  read buffers into memory ──►                   files.map(extractDocumentData)
//  createEngagement()                           ) → updateEngagement(pending)
//  return immediately ────────►                   on error → status: "error"
//
//  NOTE: buffers are read BEFORE the response is sent.
//  File objects passed into after() may have expired request lifecycle.
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import { createEngagement, updateEngagement } from "@/lib/store";
import { extractDocumentData } from "@/lib/anthropic";
import { guessDocumentType, validateUploadedFiles } from "@/lib/documents";
import type { PolicyExtraction, LossRunExtraction, MarketDataExtraction } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const clientName = formData.get("clientName") as string;
    const clientEmail = (formData.get("clientEmail") as string) || undefined;
    const files = formData.getAll("files") as File[];

    if (!clientName) {
      return NextResponse.json(
        { error: "Client name is required" },
        { status: 400 }
      );
    }

    if (!clientEmail) {
      return NextResponse.json(
        { error: "Client email is required" },
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

    // Read all file buffers into memory NOW — before the response is sent.
    // File objects from formData may not be accessible inside after().
    const fileBuffers = await Promise.all(
      files.map(async (file) => ({
        name: file.name,
        buffer: Buffer.from(await file.arrayBuffer()),
      }))
    );

    // Create engagement record
    const engagement = await createEngagement(clientName, clientEmail);

    const fileMetadata = fileBuffers.map(({ name }) => ({
      name,
      type: guessDocumentType(name),
      uploadedAt: new Date().toISOString(),
    }));

    await updateEngagement(engagement.id, {
      files: fileMetadata,
      status: "extracting",
    });

    // Kick off extraction after responding — client gets engagementId immediately
    after(async () => {
      try {
        const extractedData: {
          policies: PolicyExtraction[];
          lossRuns: LossRunExtraction[];
          marketData: MarketDataExtraction[];
        } = { policies: [], lossRuns: [], marketData: [] };

        await Promise.all(
          fileBuffers.map(async ({ name, buffer }) => {
            const docType = guessDocumentType(name);
            const content = name.toLowerCase().endsWith(".pdf")
              ? buffer
              : buffer.toString("utf-8");

            const extracted = await extractDocumentData(content, docType);

            if (docType === "policy") {
              extractedData.policies.push(extracted as PolicyExtraction);
            } else if (docType === "loss_run") {
              extractedData.lossRuns.push(extracted as LossRunExtraction);
            } else if (docType === "market_data") {
              extractedData.marketData.push(extracted as MarketDataExtraction);
            } else {
              extractedData.policies.push(extracted as PolicyExtraction);
            }
          })
        );

        await updateEngagement(engagement.id, {
          extractedData,
          status: "pending",
        });
      } catch (error) {
        console.error(`[upload] Extraction failed for engagement ${engagement.id}:`, error);
        await updateEngagement(engagement.id, { status: "error" });
      }
    });

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
