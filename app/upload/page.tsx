"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import styles from "./upload.module.css";

function formatTimeRemaining(ms: number): string {
  const totalSeconds = Math.round(ms / 1000);
  if (totalSeconds >= 60) {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m}m ${s}s remaining`;
  }
  return `${totalSeconds}s remaining`;
}

export default function UploadPage() {
  const router = useRouter();
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [files, setFiles] = useState<FileList | null>(null);
  const [status, setStatus] = useState<"idle" | "uploading" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<1 | 2>(1);
  const [timeRemaining, setTimeRemaining] = useState<string>("Estimating...");

  const crawlInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const uploadStart = useRef<number>(0);

  function startCrawl(fromProgress: number) {
    setPhase(2);
    let current = fromProgress;
    crawlInterval.current = setInterval(() => {
      current = Math.min(current + 1.5, 95);
      setProgress(Math.round(current));
      if (current >= 95) {
        clearInterval(crawlInterval.current!);
        crawlInterval.current = null;
      }
    }, 1000);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!clientName || !clientEmail || !files || files.length === 0) return;

    setStatus("uploading");
    setProgress(0);
    setPhase(1);
    setTimeRemaining("Estimating...");
    setErrorMessage("");
    uploadStart.current = Date.now();

    if (crawlInterval.current) {
      clearInterval(crawlInterval.current);
      crawlInterval.current = null;
    }

    const formData = new FormData();
    formData.append("clientName", clientName);
    formData.append("clientEmail", clientEmail);
    for (const file of Array.from(files)) {
      formData.append("files", file);
    }

    const xhr = new XMLHttpRequest();

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable) return;

      const elapsedMs = Date.now() - uploadStart.current;
      const networkProgress = Math.round((event.loaded / event.total) * 70);
      setProgress(networkProgress);

      if (elapsedMs >= 3000 && event.loaded > 0) {
        const bytesPerMs = event.loaded / elapsedMs;
        const bytesRemaining = event.total - event.loaded;
        const msRemaining = bytesRemaining / bytesPerMs;
        setTimeRemaining(formatTimeRemaining(msRemaining));
      }

      if (event.loaded === event.total) {
        startCrawl(70);
      }
    };

    xhr.onload = () => {
      if (crawlInterval.current) {
        clearInterval(crawlInterval.current);
        crawlInterval.current = null;
      }
      try {
        const data = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300) {
          // Redirect to status page — client can bookmark it
          router.push(`/status/${data.engagementId}`);
        } else {
          setErrorMessage(data.error || "Upload failed");
          setStatus("error");
        }
      } catch {
        setErrorMessage("Unexpected server response");
        setStatus("error");
      }
    };

    xhr.onerror = () => {
      if (crawlInterval.current) {
        clearInterval(crawlInterval.current);
        crawlInterval.current = null;
      }
      setErrorMessage("Network error. Please try again.");
      setStatus("error");
    };

    xhr.open("POST", "/api/upload");
    xhr.send(formData);
  }

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-10 max-w-lg w-full">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Renewal Intelligence</h1>
          <p className="text-slate-500 mt-1 text-sm">
            Upload your policy documents and loss runs to receive your analysis.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Company / Insured Name
            </label>
            <input
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Acme Corporation"
              required
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              value={clientEmail}
              onChange={(e) => setClientEmail(e.target.value)}
              placeholder="you@company.com"
              required
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
            />
            <p className="text-xs text-slate-400 mt-1">
              We&apos;ll email you when your report is ready.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Documents
            </label>
            <div className="border-2 border-dashed border-slate-200 rounded-lg p-6 text-center hover:border-slate-400 transition-colors">
              <input
                type="file"
                multiple
                accept=".pdf,.xlsx,.xls,.csv,.docx"
                onChange={(e) => setFiles(e.target.files)}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <div className="text-slate-400 text-sm">
                  <span className="font-medium text-slate-700">Click to upload</span> or drag and drop
                </div>
                <p className="text-xs text-slate-400 mt-1">PDF, Excel, CSV, Word — policies and loss runs</p>
              </label>
              {files && files.length > 0 && (
                <div className="mt-3 text-left space-y-1">
                  {Array.from(files).map((f) => (
                    <div key={f.name} className="text-xs text-slate-600 flex items-center gap-1">
                      <span className="text-slate-400">&#8212;</span> {f.name}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {status === "error" && (
            <p className="text-sm text-red-600">{errorMessage}</p>
          )}

          {status === "uploading" ? (
            <div className={styles.loaderWrap}>
              <div className={styles.loader}>
                <div className={`${styles.box} ${styles.box1}`}>
                  <div className={styles.sideLeft} />
                  <div className={styles.sideRight} />
                  <div className={styles.sideTop} />
                </div>
                <div className={`${styles.box} ${styles.box2}`}>
                  <div className={styles.sideLeft} />
                  <div className={styles.sideRight} />
                  <div className={styles.sideTop} />
                </div>
                <div className={`${styles.box} ${styles.box3}`}>
                  <div className={styles.sideLeft} />
                  <div className={styles.sideRight} />
                  <div className={styles.sideTop} />
                </div>
                <div className={`${styles.box} ${styles.box4}`}>
                  <div className={styles.sideLeft} />
                  <div className={styles.sideRight} />
                  <div className={styles.sideTop} />
                </div>
              </div>
              <p className="text-xs text-slate-400">
                {phase === 1 ? "Uploading documents…" : "Processing documents…"}
              </p>
            </div>
          ) : (
            <button
              type="submit"
              disabled={!clientName || !clientEmail || !files?.length}
              className="w-full bg-slate-900 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-slate-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Submit Documents
            </button>
          )}
        </form>

        <p className="text-xs text-slate-400 mt-6 text-center">
          Documents are processed securely and deleted after extraction. No files are retained.
        </p>
      </div>
    </main>
  );
}
