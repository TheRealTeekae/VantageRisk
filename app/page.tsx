"use client";

import { useState } from "react";
import Link from "next/link";
import styles from "./landing.module.css";

// ─── Data ─────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { label: "Who We Serve", href: "/who-we-serve" },
  { label: "Solutions", href: "/solutions" },
  { label: "Capabilities", href: "/capabilities" },
  { label: "Insights", href: "/insights" },
  { label: "About", href: "/about" },
  { label: "Support", href: "/support" },
];

const JUMP_SECTIONS = [
  { label: "Assessment", id: "assessment" },
  { label: "Market Intelligence", id: "market-intelligence" },
  { label: "How It Works", id: "how-it-works" },
  { label: "Pricing", id: "pricing" },
  { label: "Insights", id: "insights-section" },
];

const PANEL_ROWS: {
  line: string;
  verdict: string;
  verdictKey: "verdictPushback" | "verdictAccept" | "verdictRemediate";
  premium: string;
  change: string;
  changeKey: "changeNeg" | "changePos" | "changeMuted";
}[] = [
  {
    line: "General Liability",
    verdict: "Push back",
    verdictKey: "verdictPushback",
    premium: "$142K",
    change: "−4.2%",
    changeKey: "changeNeg",
  },
  {
    line: "Property",
    verdict: "Accept",
    verdictKey: "verdictAccept",
    premium: "$318K",
    change: "+12.8%",
    changeKey: "changePos",
  },
  {
    line: "Workers Comp",
    verdict: "Remediate",
    verdictKey: "verdictRemediate",
    premium: "$87K",
    change: "—",
    changeKey: "changeMuted",
  },
  {
    line: "Commercial Auto",
    verdict: "Push back",
    verdictKey: "verdictPushback",
    premium: "$45K",
    change: "−1.5%",
    changeKey: "changeNeg",
  },
];

const CHART_BARS: {
  year: string;
  value: string;
  pct: number;
  color: string;
}[] = [
  { year: "2021", value: "$98K",  pct: 63,  color: "var(--blue-data3)" },
  { year: "2022", value: "$156K", pct: 100, color: "var(--blue-data1)" },
  { year: "2023", value: "$141K", pct: 90,  color: "var(--blue-data2)" },
  { year: "2024", value: "$124K", pct: 79,  color: "var(--blue-data2)" },
];

const PROBLEM_ITEMS = [
  {
    number: "01",
    headline: "One-sided intelligence at renewal",
    body: "Your broker's renewal submission represents their interests, not yours. Without an independent analysis of your loss history and market benchmarks, you arrive at the table negotiating blind.",
  },
  {
    number: "02",
    headline: "Coverage drift goes undetected",
    body: "Policy documents accumulate subtle changes year over year — sublimits lowered, exclusions added, conditions tightened. Most risk managers discover gaps only after a claim is denied.",
  },
  {
    number: "03",
    headline: "Market benchmarks are opaque",
    body: "Carriers price programs against proprietary loss indices and competitive intelligence you don't have access to. VantageRisk bridges this gap with authority-weighted market data sourced from primary filings.",
  },
  {
    number: "04",
    headline: "Renewal prep is reactive, not strategic",
    body: "With no structured intelligence layer, renewal becomes a sprint of reactive decisions. VantageRisk delivers a verdict-grade report 30 days before renewal so you negotiate from a position of knowledge.",
  },
];

const FILE_ROWS = [
  { type: "PDF", name: "Loss Run — GL 2020–2024" },
  { type: "PDF", name: "Property Schedule 2024" },
  { type: "XLSX", name: "Exposure Summary.xlsx" },
  { type: "PDF", name: "Prior Policy — Commercial Auto" },
];

const ANALYSIS_ROWS = [
  { label: "Loss trend extraction", pct: 100, status: "Complete" },
  { label: "Coverage gap detection", pct: 100, status: "Complete" },
  { label: "Market benchmarking", pct: 78,  status: "Running…" },
  { label: "Verdict generation",    pct: 0,   status: "Queued" },
];

const CARD3_ROWS: {
  line: string;
  tag: string;
  tagKey: "verdictTagPush" | "verdictTagAccept" | "verdictTagRemediate";
  change: string;
}[] = [
  { line: "General Liability", tag: "Push back",  tagKey: "verdictTagPush",      change: "−4.2%" },
  { line: "Property",          tag: "Accept",     tagKey: "verdictTagAccept",     change: "+12.8%" },
  { line: "Workers Comp",      tag: "Remediate",  tagKey: "verdictTagRemediate",  change: "—" },
  { line: "Commercial Auto",   tag: "Push back",  tagKey: "verdictTagPush",       change: "−1.5%" },
];

const SOURCE_TIERS = [
  { label: "ISO Loss Cost Filings",           pct: 92, color: "var(--blue-data1)", weight: "92%" },
  { label: "NCCI Rate & Loss Reports",        pct: 87, color: "var(--blue-data2)", weight: "87%" },
  { label: "Carrier Schedule Rating Manuals", pct: 74, color: "var(--blue-data3)", weight: "74%" },
  { label: "IRMI / Advisen Benchmarks",       pct: 61, color: "var(--blue-data2)", weight: "61%" },
  { label: "Proprietary Loss Index",          pct: 48, color: "var(--blue-data3)", weight: "48%" },
];

// ─── Page ─────────────────────────────────────────────────────────

export default function LandingPage() {
  const [expanded, setExpanded] = useState(false);
  const [activeSection, setActiveSection] = useState("assessment");

  function scrollTo(id: string) {
    setActiveSection(id);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <div className={styles.page}>

      {/* ── Global Topbar ──────────────────────────────────────── */}
      <header className={styles.topbar}>
        <div className={styles.topbarInner}>

          <Link href="/" className={styles.wordmark} aria-label="VantageRisk — home">
            <span className={styles.wordmarkVantage}>Vantage</span>
            <span className={styles.wordmarkRisk}>Risk</span>
          </Link>

          <nav className={styles.topbarNavWrapper} aria-label="Primary">
            <ul className={styles.topbarNavList}>
              {NAV_ITEMS.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className={styles.topbarNavLink}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className={styles.topbarRight}>
            <Link href="/admin" className={styles.topbarSignIn}>
              Sign in
            </Link>
            <Link href="/upload" className={styles.topbarCta}>
              Request access
            </Link>
          </div>

        </div>
      </header>

      {/* ── Section 1 — Hero ───────────────────────────────────── */}
      <section className={styles.hero} aria-labelledby="hero-headline">
        <div className={styles.heroInner}>

          {/* Left — copy */}
          <div className={styles.heroContent}>
            <p className={styles.heroEyebrow}>Renewal Intelligence Platform</p>

            <h1 id="hero-headline" className={styles.heroHeadline}>
              The renewal intelligence<br />
              report your broker<br />
              never gave you.
            </h1>

            <p className={styles.heroSubline}>
              VantageRisk analyzes your program history and loss data against
              current market benchmarks to deliver verdict-grade renewal
              intelligence — line by line, year over year.
            </p>

            <button
              className={styles.heroExpandToggle}
              onClick={() => setExpanded((v) => !v)}
              aria-expanded={expanded}
            >
              <span className={styles.heroExpandIcon} aria-hidden="true">
                {expanded ? "−" : "+"}
              </span>
              {expanded ? "Collapse" : "Read more about VantageRisk"}
            </button>

            {expanded && (
              <p className={styles.heroExpandBody}>
                Most risk managers arrive at renewal with a single perspective:
                their broker&rsquo;s. VantageRisk provides a second opinion built from
                your own loss history, authority-weighted market data, and
                coverage drift detection across five years of policy documents.
                The result is a 12-section intelligence report with specific
                renewal verdicts — push back, accept, remediate, or remarket —
                for every line of coverage in your program.
              </p>
            )}

            <div className={styles.heroCtaGroup}>
              <Link href="/upload" className={styles.heroPrimary}>
                Request access
              </Link>
              <Link href="/report/sample" className={styles.heroGhost}>
                See a sample report
              </Link>
            </div>
          </div>

          {/* Right — dashboard abstraction */}
          <div className={styles.heroPanel} role="img" aria-label="VantageRisk report preview">

            <div className={styles.heroPanelHeader}>
              <p className={styles.heroPanelBrand}>VantageRisk — Renewal Intelligence</p>
              <p className={styles.heroPanelMeta}>
                Acme Manufacturing, Inc. &middot; Program Year 2024–2025
              </p>
            </div>

            <div className={styles.heroPanelTableHead}>
              <span className={styles.heroPanelColHead}>Coverage line</span>
              <span className={styles.heroPanelColHead}>Verdict</span>
              <span className={`${styles.heroPanelColHead} ${styles.heroPanelColHeadRight}`}>
                Premium
              </span>
              <span className={`${styles.heroPanelColHead} ${styles.heroPanelColHeadRight}`}>
                YoY
              </span>
            </div>

            {PANEL_ROWS.map((row) => (
              <div key={row.line} className={styles.heroPanelRow}>
                <span className={styles.heroPanelLineName}>{row.line}</span>
                <span className={`${styles.heroPanelVerdict} ${styles[row.verdictKey]}`}>
                  {row.verdict}
                </span>
                <span className={styles.heroPanelPremium}>{row.premium}</span>
                <span className={`${styles.heroPanelChange} ${styles[row.changeKey]}`}>
                  {row.change}
                </span>
              </div>
            ))}

            <div className={styles.heroPanelChart}>
              <p className={styles.heroPanelChartLabel}>Incurred losses by year</p>
              {CHART_BARS.map((bar) => (
                <div key={bar.year} className={styles.chartRow}>
                  <span className={styles.chartRowYear}>{bar.year}</span>
                  <div className={styles.chartRowTrack}>
                    <div
                      className={styles.chartRowFill}
                      style={{ width: `${bar.pct}%`, background: bar.color }}
                    />
                  </div>
                  <span className={styles.chartRowValue}>{bar.value}</span>
                </div>
              ))}
            </div>

          </div>
        </div>
      </section>

      {/* ── Section 2 — Jump-to Navigation Strip ───────────────── */}
      <nav className={styles.jumpNav} aria-label="Page sections">
        <div className={styles.jumpNavInner}>
          <span className={styles.jumpNavLabel}>Jump to</span>
          <ul className={styles.jumpNavLinks}>
            {JUMP_SECTIONS.map((section) => (
              <li key={section.id}>
                <button
                  className={`${styles.jumpNavBtn} ${
                    activeSection === section.id ? styles.jumpNavBtnActive : ""
                  }`}
                  onClick={() => scrollTo(section.id)}
                >
                  {section.label}
                </button>
              </li>
            ))}
          </ul>
          <Link href="/upload" className={styles.jumpNavCta}>
            Request access
          </Link>
        </div>
      </nav>

      {/* ── Section 3 — The Problem ─────────────────────────────── */}
      <section id="assessment" className={styles.problemSection}>
        <div className={styles.sectionStrip}>
          <div className={styles.sectionStripInner}>
            <span className={styles.sectionStripLabel}>The Problem</span>
            <span className={styles.sectionStripMeta}>Section 02 of 06</span>
          </div>
        </div>
        <div className={styles.problemGrid}>
          {PROBLEM_ITEMS.map((item) => (
            <div key={item.number} className={styles.problemItem}>
              <p className={styles.problemNumber}>{item.number}</p>
              <h2 className={styles.problemHeadline}>{item.headline}</h2>
              <p className={styles.problemBody}>{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Section 4 — How VantageRisk Works ──────────────────── */}
      <section id="how-it-works" className={styles.howSection}>
        <div className={styles.sectionStrip}>
          <div className={styles.sectionStripInner}>
            <span className={styles.sectionStripLabel}>How It Works</span>
            <span className={styles.sectionStripMeta}>Section 03 of 06</span>
          </div>
        </div>
        <div className={styles.howGrid}>

          {/* Card 1 — Upload */}
          <div className={styles.card}>
            <div className={styles.cardVizArea} aria-hidden="true">
              <div className={styles.fileList}>
                {FILE_ROWS.map((f) => (
                  <div key={f.name} className={styles.fileRow}>
                    <span className={styles.fileType}>{f.type}</span>
                    <span className={styles.fileName}>{f.name}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className={styles.cardBody}>
              <p className={styles.cardStep}>Step 01</p>
              <h3 className={styles.cardTitle}>Upload your documents</h3>
              <p className={styles.cardText}>
                Securely submit your loss runs, policy schedules, and exposure
                summaries. We accept PDF, Excel, and CSV — no formatting required.
              </p>
            </div>
          </div>

          {/* Card 2 — Analyze */}
          <div className={styles.card}>
            <div className={styles.cardVizArea} aria-hidden="true">
              <div className={styles.analysisList}>
                {ANALYSIS_ROWS.map((row) => (
                  <div key={row.label} className={styles.analysisRow}>
                    <span className={styles.analysisLabel}>{row.label}</span>
                    <div className={styles.analysisTrack}>
                      <div
                        className={styles.analysisFill}
                        style={{ width: `${row.pct}%` }}
                      />
                    </div>
                    <span className={styles.analysisStatus}>{row.status}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className={styles.cardBody}>
              <p className={styles.cardStep}>Step 02</p>
              <h3 className={styles.cardTitle}>We analyze everything</h3>
              <p className={styles.cardText}>
                Our pipeline extracts loss trends, detects coverage drift across
                policy years, and benchmarks your program against current market
                rates and authority-weighted loss indices.
              </p>
            </div>
          </div>

          {/* Card 3 — Receive */}
          <div className={styles.card}>
            <div className={styles.cardVizArea} aria-hidden="true">
              <div className={styles.verdictList}>
                {CARD3_ROWS.map((row) => (
                  <div key={row.line} className={styles.verdictRow}>
                    <span className={styles.verdictLine}>{row.line}</span>
                    <span className={`${styles.verdictTag} ${styles[row.tagKey]}`}>
                      {row.tag}
                    </span>
                    <span className={styles.verdictChange}>{row.change}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className={styles.cardBody}>
              <p className={styles.cardStep}>Step 03</p>
              <h3 className={styles.cardTitle}>Receive your report</h3>
              <p className={styles.cardText}>
                A 12-section renewal intelligence report lands in your inbox —
                with line-by-line verdicts, coverage gap findings, and specific
                negotiating recommendations for each carrier.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* ── Section 5 — Market Intelligence Layer ──────────────── */}
      <section id="market-intelligence" className={styles.marketSection}>
        <div className={styles.sectionStripDark}>
          <div className={styles.sectionStripInner}>
            <span className={`${styles.sectionStripLabel} ${styles.sectionStripLabelDark}`}>
              Market Intelligence
            </span>
            <span className={`${styles.sectionStripMeta} ${styles.sectionStripMetaDark}`}>
              Section 04 of 06
            </span>
          </div>
        </div>
        <div className={styles.marketInner}>

          <div className={styles.marketContent}>
            <p className={styles.marketEyebrow}>Authority-weighted data layer</p>
            <h2 className={styles.marketHeadline}>
              Not opinion.<br />
              Primary-source market data.
            </h2>
            <p className={styles.marketBody}>
              VantageRisk benchmarks your program against a curated stack of
              regulatory filings, rate bureau publications, and carrier rating
              manuals — weighted by source authority and recency.
            </p>
            <p className={styles.marketBody}>
              When we tell you a rate increase is unjustified, we can point to
              the ISO loss cost filing that says so. That&rsquo;s the difference
              between an opinion and a negotiating position.
            </p>
          </div>

          <div>
            <p className={styles.sourceTierHeading}>Source authority weights</p>
            <div className={styles.sourceTiers}>
              {SOURCE_TIERS.map((tier) => (
                <div key={tier.label} className={styles.sourceTierRow}>
                  <span className={styles.sourceTierLabel}>{tier.label}</span>
                  <div className={styles.sourceTierTrack}>
                    <div
                      className={styles.sourceTierFill}
                      style={{ width: `${tier.pct}%`, background: tier.color }}
                    />
                  </div>
                  <span className={styles.sourceTierWeight}>{tier.weight}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

    </div>
  );
}
