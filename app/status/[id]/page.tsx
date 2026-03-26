"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";

// ─── STATUS STATES ────────────────────────────────────────────────────────────
//
//  loading      → initial fetch in flight
//  processing   → engagement exists, report not ready (extracting/analyzing/pending)
//  error        → engagement.status === "error"
//  not_found    → 404 with no status field (bad ID)
//  redirecting  → report ready, navigating to /report/[id]
//
//  Poll every 3s. On complete (200 from /api/report/[id]), redirect to report page.
// ─────────────────────────────────────────────────────────────────────────────

type PageState =
  | { kind: "loading" }
  | { kind: "processing"; engagementStatus: string; clientName: string }
  | { kind: "error"; clientName: string }
  | { kind: "not_found" }
  | { kind: "redirecting" };

const POLL_INTERVAL_MS = 3000;

const STATUS_LABEL: Record<string, string> = {
  pending: "Queued for processing...",
  extracting: "Extracting data from your documents...",
  analyzing: "Generating your renewal report...",
  review: "Your report is being reviewed and finalized.",
};

export default function StatusPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [state, setState] = useState<PageState>({ kind: "loading" });
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function poll() {
    try {
      const res = await fetch(`/api/report/${id}`);

      if (res.ok) {
        // Report is ready — stop polling and redirect
        const engagement = await res.json();
        if (pollRef.current) {
          clearInterval(pollRef.current);
          pollRef.current = null;
        }
        setState({ kind: "redirecting" });
        router.replace(`/report/${engagement.id}`);
        return;
      }

      const data = await res.json().catch(() => ({}));

      if (data.status === "error") {
        if (pollRef.current) {
          clearInterval(pollRef.current);
          pollRef.current = null;
        }
        setState({ kind: "error", clientName: data.clientName ?? "" });
      } else if (data.status) {
        setState({
          kind: "processing",
          engagementStatus: data.status,
          clientName: data.clientName ?? "",
        });
      } else {
        // No status field → invalid engagement ID
        if (pollRef.current) {
          clearInterval(pollRef.current);
          pollRef.current = null;
        }
        setState({ kind: "not_found" });
      }
    } catch {
      // Network error — keep polling, don't update state
    }
  }

  useEffect(() => {
    poll();
    pollRef.current = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (state.kind === "loading") {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-400 text-sm">Loading...</p>
      </main>
    );
  }

  if (state.kind === "not_found") {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-10 max-w-sm w-full text-center">
          <p className="text-slate-800 font-medium">Engagement not found</p>
          <p className="text-slate-400 text-sm mt-1">
            This link may be invalid or expired.
          </p>
        </div>
      </main>
    );
  }

  if (state.kind === "error") {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-10 max-w-sm w-full text-center">
          <p className="text-slate-800 font-medium">Processing failed</p>
          <p className="text-slate-400 text-sm mt-1">
            Something went wrong while processing
            {state.clientName ? ` ${state.clientName}'s` : ""} documents.
          </p>
          <p className="text-slate-400 text-sm mt-3">
            Please contact your Vantage Risk advisor to resubmit.
          </p>
        </div>
      </main>
    );
  }

  if (state.kind === "redirecting") {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-400 text-sm">Loading your report...</p>
      </main>
    );
  }

  // processing state
  const label =
    STATUS_LABEL[state.engagementStatus] ?? "Processing your documents...";

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-10 max-w-sm w-full">
        <div className="mb-6">
          <p className="text-xs text-slate-400 uppercase tracking-widest mb-1">
            Vantage Risk
          </p>
          <h1 className="text-xl font-bold text-slate-900">
            {state.clientName || "Processing your submission"}
          </h1>
        </div>

        <div className="flex items-center gap-3 mb-6">
          <Spinner />
          <p className="text-sm text-slate-600">{label}</p>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          {"We'll email you when your report is ready. You can also keep this " +
            "page open — it will redirect automatically once processing is complete."}
        </p>
      </div>
    </main>
  );
}

function Spinner() {
  return (
    <div
      className="w-4 h-4 rounded-full border-2 border-slate-200 border-t-slate-600 shrink-0"
      style={{ animation: "spin 0.8s linear infinite" }}
    >
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
