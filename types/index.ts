// Core domain types for Vantage Risk

export type EngagementStatus =
  | "pending"
  | "extracting"
  | "analyzing"
  | "complete"
  | "error";

export interface Engagement {
  id: string;
  clientName: string;
  clientEmail?: string;
  submittedAt: string;
  status: EngagementStatus;
  files: UploadedFile[];
  extractedData?: {
    policies: PolicyExtraction[];
    lossRuns: LossRunExtraction[];
    marketData: MarketDataExtraction[];
  };
  report?: RenewalReport;
}

// ─── EXTRACTION TYPES ────────────────────────────────────────────────────────
// These mirror the JSON shapes returned by the extraction prompts in
// lib/anthropic.ts. Keep in sync if prompts change.

export interface PolicyExtraction {
  documentType: "policy";
  namedInsured: string | null;
  policyNumber: string | null;
  carrier: string | null;
  effectiveDate: string | null;
  expirationDate: string | null;
  lineOfBusiness: string | null;
  premium: string | null;
  limits: {
    perOccurrence: string | null;
    aggregate: string | null;
    additionalLimits: { label: string; amount: string }[];
  };
  deductibleOrSIR: {
    type: "deductible" | "SIR" | null;
    amount: string | null;
  };
  sublimits: { coverage: string; limit: string }[];
  keyExclusions: string[];
  manuscriptEndorsements: string[];
  notes: string[];
}

export interface LossRunExtraction {
  documentType: "loss_run";
  namedInsured: string | null;
  carrier: string | null;
  lineOfBusiness: string | null;
  policyPeriod: {
    effectiveDate: string | null;
    expirationDate: string | null;
  };
  summary: {
    totalClaimCount: number | null;
    openClaimCount: number | null;
    closedClaimCount: number | null;
    totalPaid: string | null;
    totalReserves: string | null;
    totalIncurred: string | null;
  };
  claims: {
    claimNumber: string | null;
    dateOfLoss: string | null;
    dateReported: string | null;
    claimant: string | null;
    description: string | null;
    paid: string | null;
    reserves: string | null;
    totalIncurred: string | null;
    status: "open" | "closed" | null;
    isLargeLoss: boolean;
  }[];
  largeLossThreshold: string;
  adverseDevelopmentFlags: string[];
  notes: string[];
}

export interface MarketDataExtraction {
  documentType: "market_data";
  sourceDate: string | null;
  linesOfBusiness: {
    line: string;
    marketCondition: "hardening" | "softening" | "stable" | null;
    rateChangeIndication: string | null;
    capacityNotes: string | null;
    underwritingAppetiteChanges: string | null;
    benchmarkLimits: { accountSize: string; typicalLimit: string }[];
  }[];
  broadMarketNotes: string[];
  sourceName: string | null;
}

export interface UploadedFile {
  name: string;
  type: "policy" | "loss_run" | "market_data" | "other";
  uploadedAt: string;
}

export interface RenewalReport {
  id: string;
  engagementId: string;
  generatedAt: string;
  programSummary: ProgramSummary;
  lossTrendAnalysis: LossTrendAnalysis;
  coverageGaps: CoverageGap[];
  renewalNarrative: string;
  recommendations: Recommendation[];
}

export interface ProgramSummary {
  namedInsured: string;
  reportDate?: string | null;
  linesOfBusiness: LineOfBusiness[];
  totalProgramPremium?: string | null;
  overallAssessment?: string | null;
}

export interface LineOfBusiness {
  line: string;
  carrier?: string | null;
  limits?: string | null;
  deductibleOrSIR?: string | null;
  premium?: string | null;
  expirationDate?: string | null;
}

export interface LossTrendAnalysis {
  yearsAnalyzed: number;
  frequencyTrend: "increasing" | "stable" | "decreasing";
  severityTrend: "increasing" | "stable" | "decreasing";
  totalIncurredAllYears: string;
  averageAnnualIncurred?: string | null;
  largeLossCount?: number | null;
  openClaimCount?: number | null;
  keyFindings?: string[] | null;
  renewalNarrativeContext?: string | null;
  yearlyBreakdown?: YearlyLossBreakdown[] | null;
}

export interface YearlyLossBreakdown {
  year: string;
  paid: number;
  reserves: number;
  totalIncurred: number;
  claimCount: number;
}

export interface CoverageGap {
  severity: "critical" | "moderate" | "informational";
  line: string;
  description: string;
  recommendation: string;
}

export interface Recommendation {
  priority: number;
  title: string;
  rationale: string;
  action: string;
}
