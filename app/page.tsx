import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Vantage Risk</h1>
        <p className="text-slate-500 mb-8">AI-powered renewal intelligence for P&C risk managers</p>
        <Link
          href="/upload"
          className="inline-block bg-slate-900 text-white px-6 py-3 rounded-lg text-sm font-medium hover:bg-slate-700 transition-colors"
        >
          Submit Documents
        </Link>
      </div>
    </main>
  );
}
