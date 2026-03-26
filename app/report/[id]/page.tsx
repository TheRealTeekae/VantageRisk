// Report page — renders a completed Renewal Intelligence Report for a given engagement.
"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { Engagement } from "@/types";
import { formatDate } from "@/lib/utils";
import { ReportView } from "@/components/ReportView";

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

        <div ref={reportRef}>
          <ReportView report={report} clientName={engagement.clientName} />
        </div>
      </div>
    </main>
  );
}
