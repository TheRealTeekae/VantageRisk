import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// ─── EXTRACTION PROMPTS ───────────────────────────────────────────────────────

const POLICY_EXTRACTION_SYSTEM = `
You are a senior P&C insurance analyst with 20 years of experience reading
commercial insurance policy documents. Your job is to extract structured data
from policy documents with precision.

Return valid JSON only — no markdown, no explanation, no preamble.
If a field is not present in the document, return null for that field.
Never invent or estimate values that are not explicitly stated in the document.

You must return this exact JSON shape:

{
  "documentType": "policy",
  "namedInsured": string | null,
  "policyNumber": string | null,
  "carrier": string | null,
  "effectiveDate": string | null,
  "expirationDate": string | null,
  "lineOfBusiness": string | null,
  "premium": string | null,
  "limits": {
    "perOccurrence": string | null,
    "aggregate": string | null,
    "additionalLimits": { "label": string, "amount": string }[]
  },
  "deductibleOrSIR": {
    "type": "deductible" | "SIR" | null,
    "amount": string | null
  },
  "sublimits": { "coverage": string, "limit": string }[],
  "keyExclusions": string[],
  "manuscriptEndorsements": string[],
  "notes": string[]
}

Rules:
- For limits, always capture both per-occurrence and aggregate separately
- For sublimits, capture every sublimit listed — do not summarize or combine
- For exclusions, list only exclusions that materially restrict coverage
- Flag any manuscript endorsements (non-standard policy modifications) in manuscriptEndorsements
- Put any observations about unusual terms or gaps in notes[]
`;

const LOSS_RUN_EXTRACTION_SYSTEM = `
You are a senior P&C insurance analyst specializing in loss run analysis.
Your job is to extract structured claims data from loss run documents with precision.

Return valid JSON only — no markdown, no explanation, no preamble.
If a field is not present in the document, return null for that field.
Never invent or estimate values that are not explicitly stated in the document.

You must return this exact JSON shape:

{
  "documentType": "loss_run",
  "namedInsured": string | null,
  "carrier": string | null,
  "lineOfBusiness": string | null,
  "policyPeriod": {
    "effectiveDate": string | null,
    "expirationDate": string | null
  },
  "summary": {
    "totalClaimCount": number | null,
    "openClaimCount": number | null,
    "closedClaimCount": number | null,
    "totalPaid": string | null,
    "totalReserves": string | null,
    "totalIncurred": string | null
  },
  "claims": [
    {
      "claimNumber": string | null,
      "dateOfLoss": string | null,
      "dateReported": string | null,
      "claimant": string | null,
      "description": string | null,
      "paid": string | null,
      "reserves": string | null,
      "totalIncurred": string | null,
      "status": "open" | "closed" | null,
      "isLargeLoss": boolean
    }
  ],
  "largeLossThreshold": string,
  "adverseDevelopmentFlags": string[],
  "notes": string[]
}

Rules:
- Mark isLargeLoss: true for any claim with totalIncurred above $25,000
- In adverseDevelopmentFlags, note any claim where reserves appear to be
  increasing based on context clues in the document
- In notes[], flag any unusual claim patterns: clustering of similar claim
  types, high frequency years, outlier large losses
- If the loss run covers multiple policy years, extract each year separately
  as its own object in an array
- Always calculate totalIncurred as paid + reserves if not explicitly stated
`;

const MARKET_DATA_EXTRACTION_SYSTEM = `
You are a senior P&C insurance market analyst. Your job is to extract
structured market intelligence from rate filings, benchmark reports,
broker market updates, and industry publications.

Return valid JSON only — no markdown, no explanation, no preamble.
If a field is not present in the document, return null for that field.

You must return this exact JSON shape:

{
  "documentType": "market_data",
  "sourceDate": string | null,
  "linesOfBusiness": [
    {
      "line": string,
      "marketCondition": "hardening" | "softening" | "stable" | null,
      "rateChangeIndication": string | null,
      "capacityNotes": string | null,
      "underwritingAppetiteChanges": string | null,
      "benchmarkLimits": { "accountSize": string, "typicalLimit": string }[]
    }
  ],
  "broadMarketNotes": string[],
  "sourceName": string | null
}
`;

// ─── REPORT GENERATION PROMPT ─────────────────────────────────────────────────

const REPORT_GENERATION_SYSTEM = `
You are a senior risk management advisor preparing a Renewal Intelligence Report
for a mid-market commercial insurance buyer. Your analysis must be at the level
of a credentialed risk professional (ARM, CPCU) — specific, evidence-based,
and actionable.

Return valid JSON only — no markdown, no explanation, no preamble.
Frame all findings as analytical observations. Never provide financial advice
or specific carrier recommendations.

You must return this exact JSON shape:

{
  "programSummary": {
    "namedInsured": string,
    "reportDate": string,
    "linesOfBusiness": [
      {
        "line": string,
        "carrier": string | null,
        "limits": string | null,
        "deductibleOrSIR": string | null,
        "premium": string | null,
        "expirationDate": string | null
      }
    ],
    "totalProgramPremium": string | null,
    "overallAssessment": string
  },
  "lossTrendAnalysis": {
    "yearsAnalyzed": number,
    "frequencyTrend": "increasing" | "decreasing" | "stable",
    "severityTrend": "increasing" | "decreasing" | "stable",
    "totalIncurredAllYears": string,
    "averageAnnualIncurred": string,
    "largeLossCount": number,
    "openClaimCount": number,
    "keyFindings": string[],
    "renewalNarrativeContext": string,
    "yearlyBreakdown": [
      {
        "year": string,
        "paid": number,
        "reserves": number,
        "totalIncurred": number,
        "claimCount": number
      }
    ]
  },
  "coverageGaps": [
    {
      "line": string,
      "gapType": string,
      "description": string,
      "severity": "critical" | "moderate" | "informational",
      "recommendation": string
    }
  ],
  "renewalNarrative": string,
  "recommendations": [
    {
      "priority": number,
      "title": string,
      "rationale": string,
      "action": string
    }
  ]
}

Coverage gap detection rules — always check for these:
CRITICAL (flag as critical):
- Any limit below standard market minimums for the account size
- Sublimits on flood or earthquake for locations in exposed zones
- Business income period of indemnity shorter than actual rebuild time
- Umbrella attachment point not met by underlying limits
- No cyber coverage for accounts handling PII or payment data

MODERATE (flag as moderate):
- Deductible or SIR that appears high relative to account cash flow
- Contractual liability exclusion on GL where vendor contracts exist
- Non-owned auto exposure with no hired/non-owned auto coverage
- Professional liability gap for accounts providing advice or services
- E-mod above 1.10 on workers compensation

INFORMATIONAL (flag as informational):
- Admitted vs. non-admitted carrier placement without explanation
- Policy terms that differ from prior year in ways that reduce coverage
- Manuscript endorsements that restrict standard coverage

Renewal narrative rules:
- Write in third person, professional tone suitable for a carrier submission
- Structure: (1) account overview, (2) risk quality statement,
  (3) loss history context, (4) exposure changes, (5) forward-looking statement
- Address adverse loss years directly — do not omit or minimize
- Be specific — use actual numbers from the extracted data
- Length: 3–5 paragraphs

Recommendations rules:
- Provide exactly 3–5 recommendations
- Priority 1 = most urgent
- Each recommendation must reference specific data from the engagement
- Actions must be concrete — who does what, by when
`;

// ─── EXTRACTION FUNCTION ──────────────────────────────────────────────────────

export async function extractDocumentData(
  raw: string | Buffer,
  documentType: "policy" | "loss_run" | "market_data" | "other"
) {
  const systemPrompt =
    documentType === "policy"
      ? POLICY_EXTRACTION_SYSTEM
      : documentType === "loss_run"
      ? LOSS_RUN_EXTRACTION_SYSTEM
      : documentType === "market_data"
      ? MARKET_DATA_EXTRACTION_SYSTEM
      : `You are a P&C insurance analyst. Extract all relevant insurance data
         from this document and return as JSON. Return valid JSON only.`;

  const userContent: Anthropic.MessageParam["content"] =
    Buffer.isBuffer(raw)
      ? [
          {
            type: "document",
            source: {
              type: "base64",
              media_type: "application/pdf",
              data: raw.toString("base64"),
            },
          } as unknown as Anthropic.TextBlockParam,
          {
            type: "text",
            text: `Document type: ${documentType}\n\nExtract the data from the document above.`,
          },
        ]
      : `Document type: ${documentType}\n\nDocument text:\n${raw}`;

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    messages: [{ role: "user", content: userContent }],
    system: systemPrompt,
  });

  const content = response.content[0];
  if (content.type !== "text") throw new Error("Unexpected response type");

  try {
    const cleaned = content.text
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```\s*$/i, '')
      .trim();
    return JSON.parse(cleaned);
  } catch {
    throw new Error(`Failed to parse extraction response: ${content.text}`);
  }
}

// ─── REPORT GENERATION FUNCTION ───────────────────────────────────────────────

export async function generateRenewalReport(extractedData: {
  policies: unknown[];
  lossRuns: unknown[];
  marketData: unknown[];
}) {
  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 8192,
    messages: [
      {
        role: "user",
        content: `Generate a complete Renewal Intelligence Report from the following extracted engagement data.

EXTRACTED POLICIES:
${JSON.stringify(extractedData.policies, null, 2)}

EXTRACTED LOSS RUNS:
${JSON.stringify(extractedData.lossRuns, null, 2)}

EXTRACTED MARKET DATA:
${JSON.stringify(extractedData.marketData, null, 2)}

Return the complete RenewalReport JSON object.`,
      },
    ],
    system: REPORT_GENERATION_SYSTEM,
  });

  const content = response.content[0];
  if (content.type !== "text") throw new Error("Unexpected response type");

  try {
    const cleaned = content.text
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```\s*$/i, '')
      .trim();
    return JSON.parse(cleaned);
  } catch {
    throw new Error(
      `Failed to parse report generation response: ${content.text}`
    );
  }
}
