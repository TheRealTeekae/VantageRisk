// Report page — renders a completed Renewal Intelligence Report for a given engagement.
"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { Engagement, RenewalReport, YearlyLossBreakdown } from "@/types";
import { formatDate } from "@/lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function ReportPage() {
  const { id } = useParams<{ id: string }>();
  const [engagement, setEngagement] = useState<Engagement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`/api/report/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      })
      .then((data: Engagement) => {
        setEngagement(data);
        setLoading(false);
      })
      .catch(() => {
        setError("Report not found or not yet generated.");
        setLoading(false);
      });
  }, [id]);

  function handleExportPDF() {
    window.print();
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-500 text-sm">Loading report...</p>
      </main>
    );
  }

  if (error || !engagement?.report) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="text-center">
          <p className="text-slate-600">{error || "Report is not yet available."}</p>
          <p className="text-slate-400 text-sm mt-1">Check back once report generation is complete.</p>
        </div>
      </main>
    );
  }

  const report = engagement.report;

  return (
    <main className="min-h-screen bg-slate-50">
      <style>{`
        @media print {
          body { background: white; }
          .max-w-4xl { max-width: 100%; padding: 0; }
          section { break-inside: avoid; margin-bottom: 1.5rem; box-shadow: none; border: 1px solid #e2e8f0; }
        }
      `}</style>
      <div className="max-w-4xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-8 print:hidden">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Renewal Intelligence Report</h1>
            <p className="text-slate-500 text-sm mt-1">
              {engagement.clientName} &middot; Generated {formatDate(report.generatedAt)}
            </p>
          </div>
          <button
            onClick={handleExportPDF}
            className="bg-slate-900 text-white text-sm px-5 py-2 rounded-lg hover:bg-slate-700 transition-colors"
          >
            Export PDF
          </button>
        </div>

        {/* Report Body */}
        <div ref={reportRef} className="space-y-6">
          <ReportHeader report={report} clientName={engagement.clientName} />
          <ProgramSummarySection report={report} />
          <LossTrendSection report={report} />
          <CoverageGapsSection report={report} />
          <RenewalNarrativeSection report={report} />
          <RecommendationsSection report={report} />
        </div>
      </div>
    </main>
  );
}

function ReportHeader({ report, clientName }: { report: RenewalReport; clientName: string }) {
  return (
    <div className="bg-slate-900 text-white rounded-xl p-8">
      <p className="text-slate-400 text-xs uppercase tracking-widest mb-1">Vantage Risk</p>
      <h2 className="text-2xl font-bold">{clientName}</h2>
      <p className="text-slate-400 text-sm mt-1">Renewal Intelligence Report &middot; {formatDate(report.generatedAt)}</p>
    </div>
  );
}

function ProgramSummarySection({ report }: { report: RenewalReport }) {
  const { programSummary } = report;
  if (!programSummary) return null;

  return (
    <section className="bg-white rounded-xl border border-slate-200 p-6">
      <SectionTitle number="01" title="Program Summary" />
      <div className="grid grid-cols-2 gap-4 mb-4">
        <Stat label="Insured" value={programSummary.namedInsured ?? "—"} />
        <Stat label="Report Date" value={programSummary.reportDate ?? "—"} />
        {programSummary.totalProgramPremium && (
          <Stat label="Total Program Premium" value={programSummary.totalProgramPremium} />
        )}
        {programSummary.overallAssessment && (
          <Stat label="Overall Assessment" value={programSummary.overallAssessment} />
        )}
      </div>
      {programSummary.linesOfBusiness && programSummary.linesOfBusiness.length > 0 && (
        <table className="w-full text-sm mt-4">
          <thead>
            <tr className="text-left text-slate-400 border-b border-slate-100">
              <th className="pb-2 font-medium">Line</th>
              <th className="pb-2 font-medium">Carrier</th>
              <th className="pb-2 font-medium">Limits</th>
              <th className="pb-2 font-medium">Deductible / SIR</th>
              <th className="pb-2 font-medium">Premium</th>
              <th className="pb-2 font-medium">Expiration</th>
            </tr>
          </thead>
          <tbody>
            {programSummary.linesOfBusiness.map((line, i) => (
              <tr key={i} className="border-b border-slate-50">
                <td className="py-2 font-medium text-slate-800">{line.line ?? "—"}</td>
                <td className="py-2 text-slate-600">{line.carrier ?? "—"}</td>
                <td className="py-2 text-slate-600">{line.limits ?? "—"}</td>
                <td className="py-2 text-slate-600">{line.deductibleOrSIR ?? "—"}</td>
                <td className="py-2 text-slate-600">{line.premium ?? "—"}</td>
                <td className="py-2 text-slate-600">{line.expirationDate ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

function LossTrendSection({ report }: { report: RenewalReport }) {
  const { lossTrendAnalysis } = report;
  if (!lossTrendAnalysis) return null;

  return (
    <section className="bg-white rounded-xl border border-slate-200 p-6">
      <SectionTitle number="02" title="Loss Trend Analysis" />
      <div className="grid grid-cols-3 gap-4 mb-4">
        <Stat label="Total Incurred" value={lossTrendAnalysis.totalIncurredAllYears ?? "—"} />
        <Stat label="Avg Annual Incurred" value={lossTrendAnalysis.averageAnnualIncurred ?? "—"} />
        <Stat label="Years Analyzed" value={lossTrendAnalysis.yearsAnalyzed != null ? String(lossTrendAnalysis.yearsAnalyzed) : "—"} />
        <Stat label="Open Claims" value={lossTrendAnalysis.openClaimCount != null ? String(lossTrendAnalysis.openClaimCount) : "—"} />
        <Stat label="Large Losses" value={lossTrendAnalysis.largeLossCount != null ? String(lossTrendAnalysis.largeLossCount) : "—"} />
      </div>
      {lossTrendAnalysis.yearlyBreakdown && lossTrendAnalysis.yearlyBreakdown.length > 0 && (
        <LossBarChart data={lossTrendAnalysis.yearlyBreakdown} />
      )}
      <div className="flex gap-4 mb-4">
        <TrendPill label="Frequency" trend={lossTrendAnalysis.frequencyTrend} />
        <TrendPill label="Severity" trend={lossTrendAnalysis.severityTrend} />
      </div>
      {lossTrendAnalysis.keyFindings && lossTrendAnalysis.keyFindings.length > 0 && (
        <ul className="text-slate-600 text-sm space-y-1 mb-3">
          {lossTrendAnalysis.keyFindings.map((f, i) => (
            <li key={i} className="flex gap-2"><span className="text-slate-400">–</span>{f}</li>
          ))}
        </ul>
      )}
      {lossTrendAnalysis.renewalNarrativeContext && (
        <p className="text-slate-600 text-sm leading-relaxed">{lossTrendAnalysis.renewalNarrativeContext}</p>
      )}
    </section>
  );
}

function CoverageGapsSection({ report }: { report: RenewalReport }) {
  if (!report.coverageGaps?.length) return null;

  return (
    <section className="bg-white rounded-xl border border-slate-200 p-6">
      <SectionTitle number="03" title="Coverage Gap Identification" />
      <div className="space-y-3">
        {report.coverageGaps.map((gap, i) => (
          <div
            key={i}
            className={`rounded-lg p-4 border ${
              gap.severity === "critical"
                ? "bg-red-50 border-red-200"
                : gap.severity === "moderate"
                ? "bg-yellow-50 border-yellow-200"
                : "bg-slate-50 border-slate-200"
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-xs font-semibold uppercase tracking-wide ${
                gap.severity === "critical" ? "text-red-600" : gap.severity === "moderate" ? "text-yellow-700" : "text-slate-500"
              }`}>
                {gap.severity}
              </span>
              <span className="text-xs text-slate-500">{gap.line}</span>
            </div>
            <p className="text-sm text-slate-800 font-medium">{gap.description}</p>
            <p className="text-sm text-slate-600 mt-1">{gap.recommendation}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function RenewalNarrativeSection({ report }: { report: RenewalReport }) {
  if (!report.renewalNarrative) return null;

  return (
    <section className="bg-white rounded-xl border border-slate-200 p-6">
      <SectionTitle number="04" title="Renewal Narrative" />
      <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">{report.renewalNarrative}</p>
    </section>
  );
}

function RecommendationsSection({ report }: { report: RenewalReport }) {
  if (!report.recommendations?.length) return null;

  return (
    <section className="bg-white rounded-xl border border-slate-200 p-6">
      <SectionTitle number="05" title="Strategic Recommendations" />
      <div className="space-y-4">
        {report.recommendations.map((rec, i) => (
          <div key={i} className="flex gap-4">
            <div className="w-7 h-7 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center shrink-0">
              {rec.priority}
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 text-sm">{rec.title}</h4>
              <p className="text-slate-600 text-sm mt-0.5">{rec.rationale}</p>
              <p className="text-slate-800 text-sm font-medium mt-1">Action: {rec.action}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function LossBarChart({ data }: { data: YearlyLossBreakdown[] }) {
  const formatDollar = (v: number) =>
    v >= 1_000_000
      ? `$${(v / 1_000_000).toFixed(1)}M`
      : v >= 1_000
      ? `$${(v / 1_000).toFixed(0)}K`
      : `$${v}`;

  return (
    <div className="mb-4">
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 8, right: 16, left: 8, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="year" tick={{ fontSize: 11, fill: "#94a3b8" }} />
          <YAxis tickFormatter={formatDollar} tick={{ fontSize: 11, fill: "#94a3b8" }} width={56} />
          <Tooltip
            formatter={(value, name) => [formatDollar(value as number), (name as string) === "paid" ? "Paid Losses" : "Reserves"]}
            contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0" }}
          />
          <Legend
            formatter={(value) => (value === "paid" ? "Paid Losses" : "Reserves")}
            wrapperStyle={{ fontSize: 12 }}
          />
          <Bar dataKey="paid" stackId="a" fill="#1a1a2e" name="paid" radius={[0, 0, 0, 0]} />
          <Bar dataKey="reserves" stackId="a" fill="#c8974a" name="reserves" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// --- Shared UI helpers ---

function SectionTitle({ number, title }: { number: string; title: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <span className="text-xs font-mono text-slate-400">{number}</span>
      <h3 className="font-semibold text-slate-900">{title}</h3>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <p className="text-xs text-slate-400 uppercase tracking-wide">{label}</p>
      <p className="text-sm font-medium text-slate-800 mt-0.5">{value ?? "—"}</p>
    </div>
  );
}

function TrendPill({
  label,
  trend,
}: {
  label: string;
  trend: "increasing" | "stable" | "decreasing";
}) {
  const color =
    trend === "increasing"
      ? "bg-red-100 text-red-700"
      : trend === "decreasing"
      ? "bg-green-100 text-green-700"
      : "bg-slate-100 text-slate-600";
  return (
    <span className={`text-xs px-3 py-1 rounded-full font-medium ${color}`}>
      {label}: {trend}
    </span>
  );
}

