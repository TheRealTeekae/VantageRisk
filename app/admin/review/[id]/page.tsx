"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Engagement, RenewalReport, CoverageGap, Recommendation } from "@/types";

export default function ReviewPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [engagement, setEngagement] = useState<Engagement | null>(null);
  const [report, setReport] = useState<RenewalReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/reports")
      .then((r) => {
        if (!r.ok) throw new Error("Unauthorized");
        return r.json();
      })
      .then((engagements: Engagement[]) => {
        const eng = engagements.find((e) => e.id === id);
        if (!eng || !eng.report) {
          setError("Engagement not found or report not ready.");
          setLoading(false);
          return;
        }
        setEngagement(eng);
        setReport(structuredClone(eng.report));
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load engagement. Are you logged in as admin?");
        setLoading(false);
      });
  }, [id]);

  async function handleSave() {
    if (!report) return;
    setSaving(true);
    const res = await fetch(`/api/report/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ report }),
    });
    if (!res.ok) {
      alert("Failed to save changes.");
    }
    setSaving(false);
  }

  async function handleSend() {
    if (!confirm("Send this report to the client? This cannot be undone.")) return;
    setSending(true);
    // Save latest edits first, then send
    await fetch(`/api/report/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ report }),
    });
    const res = await fetch(`/api/report/${id}/send`, { method: "POST" });
    if (res.ok) {
      router.push("/admin");
    } else {
      const data = await res.json().catch(() => ({}));
      alert(`Send failed: ${data.error ?? "Unknown error"}`);
      setSending(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-400 text-sm">Loading...</p>
      </main>
    );
  }

  if (error || !report || !engagement) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="text-center">
          <p className="text-slate-600">{error || "Report not available."}</p>
          <Link href="/admin" className="text-sm text-blue-600 hover:underline mt-2 block">
            Back to Admin
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link href="/admin" className="text-sm text-slate-400 hover:text-slate-600 mb-1 block">
              ← Back to Admin
            </Link>
            <h1 className="text-2xl font-bold text-slate-900">Review Report</h1>
            <p className="text-slate-500 text-sm mt-0.5">
              {engagement.clientName} &middot; {engagement.files.length} file(s) &middot; {engagement.clientEmail}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={saving || sending}
              className="border border-slate-300 text-slate-700 text-sm px-5 py-2 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-40"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
            <button
              onClick={handleSend}
              disabled={saving || sending}
              className="bg-violet-700 text-white text-sm px-5 py-2 rounded-lg hover:bg-violet-600 transition-colors disabled:opacity-40"
            >
              {sending ? "Sending..." : "Send to Client →"}
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <ProgramSummaryEditor report={report} setReport={setReport} />
          <LossTrendEditor report={report} setReport={setReport} />
          <CoverageGapsEditor report={report} setReport={setReport} />
          <NarrativeEditor report={report} setReport={setReport} />
          <RecommendationsEditor report={report} setReport={setReport} />
        </div>

        {/* Bottom action bar */}
        <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-slate-200">
          <button
            onClick={handleSave}
            disabled={saving || sending}
            className="border border-slate-300 text-slate-700 text-sm px-5 py-2 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-40"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
          <button
            onClick={handleSend}
            disabled={saving || sending}
            className="bg-violet-700 text-white text-sm px-5 py-2 rounded-lg hover:bg-violet-600 transition-colors disabled:opacity-40"
          >
            {sending ? "Sending..." : "Send to Client →"}
          </button>
        </div>
      </div>
    </main>
  );
}

// ─── SECTION EDITORS ──────────────────────────────────────────────────────────

function SectionTitle({ number, title }: { number: string; title: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <span className="text-xs font-mono text-slate-400">{number}</span>
      <h3 className="font-semibold text-slate-900">{title}</h3>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs text-slate-400 uppercase tracking-wide block mb-1">{label}</label>
      {children}
    </div>
  );
}

const inputCls =
  "w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-300";
const textareaCls =
  "w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-300 resize-y";

function ProgramSummaryEditor({
  report,
  setReport,
}: {
  report: RenewalReport;
  setReport: React.Dispatch<React.SetStateAction<RenewalReport | null>>;
}) {
  const ps = report.programSummary;

  function updateField(field: string, value: string) {
    setReport((r) => r && { ...r, programSummary: { ...r.programSummary, [field]: value } });
  }

  function updateLine(i: number, field: string, value: string) {
    setReport((r) => {
      if (!r) return r;
      const lines = [...r.programSummary.linesOfBusiness];
      lines[i] = { ...lines[i], [field]: value };
      return { ...r, programSummary: { ...r.programSummary, linesOfBusiness: lines } };
    });
  }

  return (
    <section className="bg-white rounded-xl border border-slate-200 p-6">
      <SectionTitle number="01" title="Program Summary" />
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Field label="Named Insured">
          <input className={inputCls} value={ps.namedInsured ?? ""} onChange={(e) => updateField("namedInsured", e.target.value)} />
        </Field>
        <Field label="Report Date">
          <input className={inputCls} value={ps.reportDate ?? ""} onChange={(e) => updateField("reportDate", e.target.value)} />
        </Field>
        <Field label="Total Program Premium">
          <input className={inputCls} value={ps.totalProgramPremium ?? ""} onChange={(e) => updateField("totalProgramPremium", e.target.value)} />
        </Field>
        <Field label="Overall Assessment">
          <input className={inputCls} value={ps.overallAssessment ?? ""} onChange={(e) => updateField("overallAssessment", e.target.value)} />
        </Field>
      </div>

      {ps.linesOfBusiness && ps.linesOfBusiness.length > 0 && (
        <div>
          <p className="text-xs text-slate-400 uppercase tracking-wide mb-2">Lines of Business</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-400 border-b border-slate-100">
                  <th className="pb-2 font-medium pr-2">Line</th>
                  <th className="pb-2 font-medium pr-2">Carrier</th>
                  <th className="pb-2 font-medium pr-2">Limits</th>
                  <th className="pb-2 font-medium pr-2">Ded / SIR</th>
                  <th className="pb-2 font-medium pr-2">Premium</th>
                  <th className="pb-2 font-medium">Expiration</th>
                </tr>
              </thead>
              <tbody>
                {ps.linesOfBusiness.map((line, i) => (
                  <tr key={i} className="border-b border-slate-50">
                    {(["line", "carrier", "limits", "deductibleOrSIR", "premium", "expirationDate"] as const).map((field) => (
                      <td key={field} className="py-1 pr-2">
                        <input
                          className="w-full border border-slate-100 rounded px-2 py-1 text-xs text-slate-700 focus:outline-none focus:border-slate-300"
                          value={(line[field] as string) ?? ""}
                          onChange={(e) => updateLine(i, field, e.target.value)}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}

function LossTrendEditor({
  report,
  setReport,
}: {
  report: RenewalReport;
  setReport: React.Dispatch<React.SetStateAction<RenewalReport | null>>;
}) {
  const lt = report.lossTrendAnalysis;

  function updateField(field: string, value: string) {
    setReport((r) => r && { ...r, lossTrendAnalysis: { ...r.lossTrendAnalysis, [field]: value } });
  }

  return (
    <section className="bg-white rounded-xl border border-slate-200 p-6">
      <SectionTitle number="02" title="Loss Trend Analysis" />
      <div className="grid grid-cols-2 gap-4 mb-4">
        <Field label="Total Incurred (All Years)">
          <input className={inputCls} value={lt.totalIncurredAllYears ?? ""} onChange={(e) => updateField("totalIncurredAllYears", e.target.value)} />
        </Field>
        <Field label="Avg Annual Incurred">
          <input className={inputCls} value={lt.averageAnnualIncurred ?? ""} onChange={(e) => updateField("averageAnnualIncurred", e.target.value)} />
        </Field>
        <Field label="Frequency Trend">
          <select
            className={inputCls}
            value={lt.frequencyTrend}
            onChange={(e) => updateField("frequencyTrend", e.target.value)}
          >
            <option value="increasing">Increasing</option>
            <option value="stable">Stable</option>
            <option value="decreasing">Decreasing</option>
          </select>
        </Field>
        <Field label="Severity Trend">
          <select
            className={inputCls}
            value={lt.severityTrend}
            onChange={(e) => updateField("severityTrend", e.target.value)}
          >
            <option value="increasing">Increasing</option>
            <option value="stable">Stable</option>
            <option value="decreasing">Decreasing</option>
          </select>
        </Field>
      </div>
      <Field label="Key Findings (one per line)">
        <textarea
          className={textareaCls}
          rows={4}
          value={(lt.keyFindings ?? []).join("\n")}
          onChange={(e) =>
            setReport((r) =>
              r && {
                ...r,
                lossTrendAnalysis: {
                  ...r.lossTrendAnalysis,
                  keyFindings: e.target.value.split("\n"),
                },
              }
            )
          }
        />
      </Field>
      <div className="mt-4">
        <Field label="Narrative Context">
          <textarea
            className={textareaCls}
            rows={3}
            value={lt.renewalNarrativeContext ?? ""}
            onChange={(e) => updateField("renewalNarrativeContext", e.target.value)}
          />
        </Field>
      </div>
    </section>
  );
}

function CoverageGapsEditor({
  report,
  setReport,
}: {
  report: RenewalReport;
  setReport: React.Dispatch<React.SetStateAction<RenewalReport | null>>;
}) {
  function updateGap(i: number, field: keyof CoverageGap, value: string) {
    setReport((r) => {
      if (!r) return r;
      const gaps = [...(r.coverageGaps ?? [])];
      gaps[i] = { ...gaps[i], [field]: value } as CoverageGap;
      return { ...r, coverageGaps: gaps };
    });
  }

  function addGap() {
    setReport((r) =>
      r && {
        ...r,
        coverageGaps: [
          ...(r.coverageGaps ?? []),
          { severity: "informational", line: "", description: "", recommendation: "" },
        ],
      }
    );
  }

  function removeGap(i: number) {
    setReport((r) => r && { ...r, coverageGaps: (r.coverageGaps ?? []).filter((_, idx) => idx !== i) });
  }

  return (
    <section className="bg-white rounded-xl border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <SectionTitle number="03" title="Coverage Gaps" />
        <button
          onClick={addGap}
          className="text-xs text-violet-700 border border-violet-200 px-2 py-1 rounded hover:bg-violet-50 transition-colors"
        >
          + Add Gap
        </button>
      </div>
      <div className="space-y-4">
        {(report.coverageGaps ?? []).map((gap, i) => (
          <div key={i} className="border border-slate-100 rounded-lg p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Severity">
                <select
                  className={inputCls}
                  value={gap.severity}
                  onChange={(e) => updateGap(i, "severity", e.target.value)}
                >
                  <option value="critical">Critical</option>
                  <option value="moderate">Moderate</option>
                  <option value="informational">Informational</option>
                </select>
              </Field>
              <Field label="Line">
                <input className={inputCls} value={gap.line} onChange={(e) => updateGap(i, "line", e.target.value)} />
              </Field>
            </div>
            <Field label="Description">
              <textarea className={textareaCls} rows={2} value={gap.description} onChange={(e) => updateGap(i, "description", e.target.value)} />
            </Field>
            <Field label="Recommendation">
              <textarea className={textareaCls} rows={2} value={gap.recommendation} onChange={(e) => updateGap(i, "recommendation", e.target.value)} />
            </Field>
            <div className="flex justify-end">
              <button
                onClick={() => removeGap(i)}
                className="text-xs text-red-500 hover:text-red-700"
              >
                ✕ Remove
              </button>
            </div>
          </div>
        ))}
        {(report.coverageGaps ?? []).length === 0 && (
          <p className="text-sm text-slate-400">No coverage gaps. Click "+ Add Gap" to add one.</p>
        )}
      </div>
    </section>
  );
}

function NarrativeEditor({
  report,
  setReport,
}: {
  report: RenewalReport;
  setReport: React.Dispatch<React.SetStateAction<RenewalReport | null>>;
}) {
  return (
    <section className="bg-white rounded-xl border border-slate-200 p-6">
      <SectionTitle number="04" title="Renewal Narrative" />
      <textarea
        className={textareaCls}
        rows={12}
        value={report.renewalNarrative ?? ""}
        onChange={(e) => setReport((r) => r && { ...r, renewalNarrative: e.target.value })}
      />
    </section>
  );
}

function RecommendationsEditor({
  report,
  setReport,
}: {
  report: RenewalReport;
  setReport: React.Dispatch<React.SetStateAction<RenewalReport | null>>;
}) {
  function updateRec(i: number, field: keyof Recommendation, value: string) {
    setReport((r) => {
      if (!r) return r;
      const recs = [...(r.recommendations ?? [])];
      recs[i] = { ...recs[i], [field]: value } as Recommendation;
      // Re-assign priorities by order
      recs.forEach((rec, idx) => { rec.priority = idx + 1; });
      return { ...r, recommendations: recs };
    });
  }

  function addRec() {
    setReport((r) => {
      if (!r) return r;
      const recs = [...(r.recommendations ?? [])];
      recs.push({ priority: recs.length + 1, title: "", rationale: "", action: "" });
      return { ...r, recommendations: recs };
    });
  }

  function removeRec(i: number) {
    setReport((r) => {
      if (!r) return r;
      const recs = (r.recommendations ?? []).filter((_, idx) => idx !== i);
      recs.forEach((rec, idx) => { rec.priority = idx + 1; });
      return { ...r, recommendations: recs };
    });
  }

  return (
    <section className="bg-white rounded-xl border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <SectionTitle number="05" title="Strategic Recommendations" />
        <button
          onClick={addRec}
          className="text-xs text-violet-700 border border-violet-200 px-2 py-1 rounded hover:bg-violet-50 transition-colors"
        >
          + Add
        </button>
      </div>
      <div className="space-y-4">
        {(report.recommendations ?? []).map((rec, i) => (
          <div key={i} className="border border-slate-100 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center shrink-0">
                {rec.priority}
              </div>
              <Field label="Title">
                <input className={inputCls} value={rec.title} onChange={(e) => updateRec(i, "title", e.target.value)} />
              </Field>
            </div>
            <Field label="Rationale">
              <textarea className={textareaCls} rows={2} value={rec.rationale} onChange={(e) => updateRec(i, "rationale", e.target.value)} />
            </Field>
            <Field label="Action">
              <textarea className={textareaCls} rows={2} value={rec.action} onChange={(e) => updateRec(i, "action", e.target.value)} />
            </Field>
            <div className="flex justify-end">
              <button
                onClick={() => removeRec(i)}
                className="text-xs text-red-500 hover:text-red-700"
              >
                ✕ Remove
              </button>
            </div>
          </div>
        ))}
        {(report.recommendations ?? []).length === 0 && (
          <p className="text-sm text-slate-400">No recommendations. Click "+ Add" to add one.</p>
        )}
      </div>
    </section>
  );
}
