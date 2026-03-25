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
  submittedAt: string;
  status: EngagementStatus;
  files: UploadedFile[];
  extractedData?: {
    policies: unknown[];
    lossRuns: unknown[];
    marketData: unknown[];
  };
  report?: RenewalReport;
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
