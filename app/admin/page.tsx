"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Engagement } from "@/types";
import { formatDateTime } from "@/lib/utils";

type Tab = "active" | "archived";

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [authError, setAuthError] = useState("");
  const [engagements, setEngagements] = useState<Engagement[]>([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<Tab>("active");
  const [generating, setGenerating] = useState<string | null>(null);
  const [resetting, setResetting] = useState<string | null>(null);
  const [archiving, setArchiving] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setAuthError("");
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      setAuthed(true);
      loadEngagements();
    } else {
      const data = await res.json();
      setAuthError(data.error ?? "Invalid password");
    }
  }

  async function loadEngagements() {
    setLoading(true);
    const res = await fetch("/api/reports");
    if (res.ok) {
      setEngagements(await res.json());
    }
    setLoading(false);
  }

  async function triggerGenerate(engagementId: string) {
    setGenerating(engagementId);
    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ engagementId }),
    });
    if (res.ok) {
      await loadEngagements();
    } else {
      const { error } = await res.json();
      alert(`Generation failed: ${error}`);
    }
    setGenerating(null);
  }

  async function triggerReset(engagementId: string) {
    setResetting(engagementId);
    const res = await fetch("/api/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ engagementId }),
    });
    if (res.ok) {
      await loadEngagements();
    } else {
      const { error } = await res.json();
      alert(`Reset failed: ${error}`);
    }
    setResetting(null);
  }

  async function triggerArchive(engagementId: string) {
    setArchiving(engagementId);
    const res = await fetch(`/api/report/${engagementId}/archive`, { method: "POST" });
    if (res.ok) {
      await loadEngagements();
    } else {
      const { error } = await res.json().catch(() => ({}));
      alert(`Archive failed: ${error ?? "Unknown error"}`);
    }
    setArchiving(null);
  }

  async function triggerRestore(engagementId: string) {
    setArchiving(engagementId);
    const res = await fetch(`/api/report/${engagementId}/archive`, { method: "DELETE" });
    if (res.ok) {
      await loadEngagements();
    } else {
      const { error } = await res.json().catch(() => ({}));
      alert(`Restore failed: ${error ?? "Unknown error"}`);
    }
    setArchiving(null);
  }

  async function triggerDelete(engagementId: string, clientName: string) {
    if (!confirm(`Permanently delete "${clientName}"? This cannot be undone.`)) return;
    setDeleting(engagementId);
    const res = await fetch(`/api/report/${engagementId}`, { method: "DELETE" });
    if (res.ok) {
      await loadEngagements();
    } else {
      const { error } = await res.json().catch(() => ({}));
      alert(`Delete failed: ${error ?? "Unknown error"}`);
    }
    setDeleting(null);
  }

  async function handleLogout() {
    await fetch("/api/admin/login", { method: "DELETE" });
    setAuthed(false);
    setEngagements([]);
  }

  useEffect(() => {
    fetch("/api/reports")
      .then((r) => {
        if (r.ok) {
          setAuthed(true);
          r.json().then(setEngagements);
        }
      })
      .catch(() => {});
  }, []);

  if (!authed) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-10 max-w-sm w-full">
          <h1 className="text-xl font-bold text-slate-900 mb-1">Admin</h1>
          <p className="text-slate-500 text-sm mb-6">Vantage Risk — internal view</p>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
            {authError && <p className="text-sm text-red-600">{authError}</p>}
            <button
              type="submit"
              className="w-full bg-slate-900 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-slate-700 transition-colors"
            >
              Sign In
            </button>
          </form>
        </div>
      </main>
    );
  }

  const activeEngagements = engagements.filter((e) => e.status !== "archived");
  const archivedEngagements = engagements.filter((e) => e.status === "archived");
  const displayed = tab === "active" ? activeEngagements : archivedEngagements;

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Engagements</h1>
            <p className="text-slate-500 text-sm mt-0.5">Review uploads and trigger report generation</p>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={loadEngagements} className="text-sm text-slate-500 hover:text-slate-700">
              Refresh
            </button>
            <button onClick={handleLogout} className="text-sm text-slate-500 hover:text-slate-700">
              Sign out
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-slate-100 rounded-lg p-1 w-fit">
          <button
            onClick={() => setTab("active")}
            className={`text-sm px-4 py-1.5 rounded-md font-medium transition-colors ${
              tab === "active"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Active
            {activeEngagements.length > 0 && (
              <span className="ml-1.5 text-xs bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded-full">
                {activeEngagements.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setTab("archived")}
            className={`text-sm px-4 py-1.5 rounded-md font-medium transition-colors ${
              tab === "archived"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Archived
            {archivedEngagements.length > 0 && (
              <span className="ml-1.5 text-xs bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded-full">
                {archivedEngagements.length}
              </span>
            )}
          </button>
        </div>

        {loading && <p className="text-slate-500 text-sm">Loading...</p>}

        {!loading && displayed.length === 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-10 text-center">
            <p className="text-slate-500 text-sm">
              {tab === "active" ? "No active engagements." : "No archived engagements."}
            </p>
          </div>
        )}

        <div className="space-y-3">
          {displayed.map((eng) => (
            <div
              key={eng.id}
              className="bg-white rounded-xl border border-slate-200 p-5 flex items-center justify-between"
            >
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="font-medium text-slate-900">{eng.clientName}</h2>
                  <StatusBadge status={eng.status} />
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  {eng.files.length} file(s) &middot; {eng.clientEmail ?? "no email"} &middot; Submitted{" "}
                  {formatDateTime(eng.submittedAt)} &middot;{" "}
                  <span className="font-mono">{eng.id}</span>
                </p>
              </div>

              <div className="flex items-center gap-2">
                {tab === "active" && (
                  <>
                    {eng.status === "review" && (
                      <Link
                        href={`/admin/review/${eng.id}`}
                        className="bg-violet-700 text-white text-sm px-4 py-1.5 rounded-lg hover:bg-violet-600 transition-colors"
                      >
                        Review &amp; Send
                      </Link>
                    )}
                    {eng.status === "complete" && eng.report && (
                      <Link
                        href={`/report/${eng.id}`}
                        className="text-sm text-blue-600 hover:underline"
                      >
                        View Report
                      </Link>
                    )}
                    {(eng.status === "extracting" || eng.status === "error") && (
                      <button
                        onClick={() => triggerReset(eng.id)}
                        disabled={resetting === eng.id}
                        className="text-sm text-slate-500 border border-slate-300 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-40"
                      >
                        {resetting === eng.id ? "Resetting..." : "Reset"}
                      </button>
                    )}
                    {(eng.status === "pending" || eng.status === "error") && (
                      <button
                        onClick={() => triggerGenerate(eng.id)}
                        disabled={generating === eng.id}
                        className="bg-slate-900 text-white text-sm px-4 py-1.5 rounded-lg hover:bg-slate-700 transition-colors disabled:opacity-40"
                      >
                        {generating === eng.id ? "Generating..." : "Generate Report"}
                      </button>
                    )}
                    <button
                      onClick={() => triggerArchive(eng.id)}
                      disabled={archiving === eng.id}
                      className="text-sm text-slate-400 hover:text-slate-600 px-2 py-1.5 disabled:opacity-40"
                      title="Archive"
                    >
                      {archiving === eng.id ? "…" : "Archive"}
                    </button>
                  </>
                )}

                {tab === "archived" && (
                  <>
                    {eng.report && (
                      <Link
                        href={`/report/${eng.id}`}
                        className="text-sm text-blue-600 hover:underline"
                      >
                        View Report
                      </Link>
                    )}
                    <button
                      onClick={() => triggerRestore(eng.id)}
                      disabled={archiving === eng.id}
                      className="text-sm text-slate-600 border border-slate-300 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-40"
                    >
                      {archiving === eng.id ? "Restoring..." : "Restore"}
                    </button>
                    <button
                      onClick={() => triggerDelete(eng.id, eng.clientName)}
                      disabled={deleting === eng.id}
                      className="text-sm text-red-500 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-40"
                    >
                      {deleting === eng.id ? "Deleting..." : "Delete"}
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

function StatusBadge({ status }: { status: Engagement["status"] }) {
  const styles: Record<Engagement["status"], string> = {
    pending: "bg-slate-100 text-slate-600",
    extracting: "bg-yellow-100 text-yellow-700",
    analyzing: "bg-blue-100 text-blue-700",
    review: "bg-violet-100 text-violet-700",
    complete: "bg-green-100 text-green-700",
    archived: "bg-slate-100 text-slate-400",
    error: "bg-red-100 text-red-700",
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${styles[status]}`}>
      {status}
    </span>
  );
}
