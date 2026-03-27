"use client";

import React, { useState } from "react";
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
  { label: "How It Works", id: "how-it-works" },
  { label: "Insights", id: "insights-section" },
  { label: "Get Started", id: "get-started" },
  { label: "Market Intelligence", id: "market-intelligence" },
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

const PROBLEM_ITEMS: {
  number: string;
  headline: string;
  body: string;
  icon: React.ReactNode;
}[] = [
  {
    number: "01",
    headline: "One-sided intelligence at renewal",
    body: "Your broker's renewal submission represents their interests, not yours. Without an independent analysis of your loss history and market benchmarks, you arrive at the table negotiating blind.",
    icon: (
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true">
        {/* Asymmetric scale — left pan heavy, right pan high */}
        <line x1="20" y1="7" x2="20" y2="33" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="13" y1="33" x2="27" y2="33" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="7" y1="15" x2="33" y2="13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M7 15 L9 24 Q13 28 17 24 L19 15" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinejoin="round"/>
        <path d="M21 13 L23 18 Q27 22 31 18 L33 13" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    number: "02",
    headline: "Coverage drift goes undetected",
    body: "Policy documents accumulate subtle changes year over year — sublimits lowered, exclusions added, conditions tightened. Most risk managers discover gaps only after a claim is denied.",
    icon: (
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true">
        {/* Three layers drifting right with fading opacity */}
        <rect x="5" y="8" width="22" height="8" stroke="currentColor" strokeWidth="1.5"/>
        <rect x="9" y="18" width="22" height="8" stroke="currentColor" strokeWidth="1.5" opacity="0.55"/>
        <rect x="13" y="28" width="22" height="7" stroke="currentColor" strokeWidth="1.5" opacity="0.25"/>
      </svg>
    ),
  },
  {
    number: "03",
    headline: "Market benchmarks are opaque",
    body: "Carriers price programs against proprietary loss indices and competitive intelligence you don't have access to. VantageRisk bridges this gap with authority-weighted market data sourced from primary filings.",
    icon: (
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true">
        {/* Bar chart — middle bar hidden, X above it */}
        <line x1="6" y1="32" x2="34" y2="32" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <rect x="8" y="20" width="7" height="12" stroke="currentColor" strokeWidth="1.5"/>
        <rect x="17" y="14" width="7" height="18" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 2"/>
        <rect x="26" y="23" width="7" height="9" stroke="currentColor" strokeWidth="1.5"/>
        <line x1="19" y1="6" x2="22" y2="11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="22" y1="6" x2="19" y2="11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    number: "04",
    headline: "Renewal prep is reactive, not strategic",
    body: "With no structured intelligence layer, renewal becomes a sprint of reactive decisions. VantageRisk delivers a verdict-grade report well before renewal so you negotiate from a position of knowledge.",
    icon: (
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true">
        {/* Calendar with clock in corner */}
        <rect x="4" y="6" width="24" height="24" stroke="currentColor" strokeWidth="1.5"/>
        <line x1="4" y1="14" x2="28" y2="14" stroke="currentColor" strokeWidth="1.5"/>
        <line x1="10" y1="2" x2="10" y2="10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="22" y1="2" x2="22" y2="10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <circle cx="30" cy="30" r="9" fill="white" stroke="currentColor" strokeWidth="1.5"/>
        <line x1="30" y1="24" x2="30" y2="30" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="30" y1="30" x2="35" y2="33" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
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

const STATS = [
  {
    number: "73%",
    label: "of renewals analyzed show at least one line priced above current ISO benchmark",
  },
  {
    number: "12",
    label: "sections in every report — loss trends, coverage gaps, and line-by-line verdicts",
  },
  {
    number: "30 days",
    label: "before renewal is when VantageRisk delivers your report — when you can still act",
  },
  {
    number: "$2.4M",
    label: "average total program premium across our client engagements",
  },
];

const TESTIMONIALS = [
  {
    quote: "We pushed back on our GL renewal for the first time in six years. VantageRisk showed us exactly where our carrier was overpriced relative to ISO benchmarks — our broker couldn't argue with the data.",
    name: "Patricia Wellman",
    role: "VP of Risk Management, Hargrove Industrial Group",
  },
  {
    quote: "The coverage gap analysis alone was worth it. We had a sublimit eroded across three renewal cycles that nobody caught. VantageRisk flagged it, we fixed it, and six months later we had a claim in exactly that area.",
    name: "Marcus Delgado",
    role: "Director of Corporate Risk, Meridian Distribution Partners",
  },
  {
    quote: "What impressed me most was the depth on Workers Comp. The loss trend narrative was more thorough than anything our TPA had produced. We walked into renewal knowing our story better than our carrier did.",
    name: "Jennifer Sato",
    role: "Risk & Insurance Manager, Cascadia Fabrication Co.",
  },
];

const TRUST_POINTS = [
  "Delivered 30 days before renewal, when you still have time to negotiate",
  "No broker, carrier, or intermediary involvement — your data stays confidential",
  "Flat-fee engagement scoped to your program size and number of lines",
];

const SOURCE_TIERS = [
  { label: "ISO Loss Cost Filings",           pct: 92, color: "var(--blue-data1)", weight: "92%" },
  { label: "NCCI Rate & Loss Reports",        pct: 87, color: "var(--blue-data2)", weight: "87%" },
  { label: "Carrier Schedule Rating Manuals", pct: 74, color: "var(--blue-data3)", weight: "74%" },
  { label: "IRMI / Advisen Benchmarks",       pct: 61, color: "var(--blue-data2)", weight: "61%" },
  { label: "Proprietary Loss Index",          pct: 48, color: "var(--blue-data3)", weight: "48%" },
];

// ─── Hero waveform paths ──────────────────────────────────────────
// Five sine-wave approximations (cubic bezier S-command chains).
// Background waves: chaotic, varying frequency/amplitude, low opacity.
// Foreground signal: single clean wave at higher opacity.

// Wave 1 — tight noise (HP=72, A=8, CY=140)
const W1 = "M -72 140 C -46 132 -26 132 0 140 S 46 148 72 140 S 118 132 144 140 S 190 148 216 140 S 262 132 288 140 S 334 148 360 140 S 406 132 432 140 S 478 148 504 140 S 550 132 576 140 S 622 148 648 140 S 694 132 720 140 S 766 148 792 140 S 838 132 864 140 S 910 148 936 140 S 982 132 1008 140 S 1054 148 1080 140 S 1126 132 1152 140 S 1198 148 1224 140 S 1270 132 1296 140 S 1342 148 1368 140 S 1414 132 1440 140 S 1486 148 1512 140";

// Wave 2 — medium background (HP=120, A=16, CY=180)
const W2 = "M -120 180 C -76 164 -44 164 0 180 S 76 196 120 180 S 196 164 240 180 S 316 196 360 180 S 436 164 480 180 S 556 196 600 180 S 676 164 720 180 S 796 196 840 180 S 916 164 960 180 S 1036 196 1080 180 S 1156 164 1200 180 S 1276 196 1320 180 S 1396 164 1440 180 S 1516 196 1560 180";

// Wave 3 — slow, wide background (HP=200, A=30, CY=100)
const W3 = "M -200 100 C -127 70 -73 70 0 100 S 127 130 200 100 S 327 70 400 100 S 527 130 600 100 S 727 70 800 100 S 927 130 1000 100 S 1127 70 1200 100 S 1327 130 1400 100 S 1527 70 1600 100";

// Wave 4 — very tight secondary noise (HP=46, A=5, CY=220)
const W4 = "M -46 220 C -29 215 -17 215 0 220 S 29 225 46 220 S 75 215 92 220 S 121 225 138 220 S 167 215 184 220 S 213 225 230 220 S 259 215 276 220 S 305 225 322 220 S 351 215 368 220 S 397 225 414 220 S 443 215 460 220 S 489 225 506 220 S 535 215 552 220 S 581 225 598 220 S 627 215 644 220 S 673 225 690 220 S 719 215 736 220 S 765 225 782 220 S 811 215 828 220 S 857 225 874 220 S 903 215 920 220 S 949 225 966 220 S 995 215 1012 220 S 1041 225 1058 220 S 1087 215 1104 220 S 1133 225 1150 220 S 1179 215 1196 220 S 1225 225 1242 220 S 1271 215 1288 220 S 1317 225 1334 220 S 1363 215 1380 220 S 1409 225 1426 220 S 1455 215 1472 220";

// Wave 5 — clean foreground signal (HP=260, A=22, CY=250)
const W5 = "M -260 250 C -165 228 -95 228 0 250 S 165 272 260 250 S 425 228 520 250 S 685 272 780 250 S 945 228 1040 250 S 1205 272 1300 250 S 1465 228 1560 250";

// ─── Page ─────────────────────────────────────────────────────────

export default function LandingPage() {
  const [expanded, setExpanded] = useState(false);
  const [activeSection, setActiveSection] = useState("assessment");

  function jumpToSection(id: string) {
    setActiveSection(id);
    const el = document.getElementById(id);
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 88;
      window.scrollTo({ top, behavior: "smooth" });
    }
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

        {/* Background waveform — decorative, behind all content */}
        <div className={styles.heroBg} aria-hidden="true">
          <svg
            className={styles.heroWaveSvg}
            viewBox="0 0 1440 320"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="none"
          >
            {/* Chaotic background waves */}
            <path d={W3} fill="none" stroke="white" strokeWidth="1.5" opacity="0.04" vectorEffect="non-scaling-stroke"/>
            <path d={W1} fill="none" stroke="white" strokeWidth="1"   opacity="0.06" vectorEffect="non-scaling-stroke"/>
            <path d={W4} fill="none" stroke="white" strokeWidth="0.8" opacity="0.04" vectorEffect="non-scaling-stroke"/>
            <path d={W2} fill="none" stroke="white" strokeWidth="1.2" opacity="0.07" vectorEffect="non-scaling-stroke"/>
            {/* Clean foreground signal */}
            <path d={W5} fill="none" stroke="white" strokeWidth="2"   opacity="0.13" vectorEffect="non-scaling-stroke"/>
          </svg>
        </div>

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
              <a href="#get-started" className={styles.heroPrimaryCta}>
                Request access
              </a>
              <Link href="/report/sample" className={styles.heroSecondaryCta}>
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
                  onClick={() => jumpToSection(section.id)}
                >
                  {section.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      {/* ── Section 3 — The Problem ─────────────────────────────── */}
      <section id="assessment" className={styles.problemSection}>
        <div className={styles.sectionStrip}>
          <div className={styles.sectionStripInner}>
            <span className={styles.sectionStripLabel}>The Problem</span>
          </div>
        </div>
        <div className={styles.problemGrid}>
          {PROBLEM_ITEMS.map((item) => (
            <div key={item.number} className={styles.problemCard}>
              <div className={styles.problemCardIcon}>{item.icon}</div>
              <p className={styles.problemCardNumber}>{item.number}</p>
              <h2 className={styles.problemCardHeadline}>{item.headline}</h2>
              <p className={styles.problemCardBody}>{item.body}</p>
              <a href="#how-it-works" className={styles.problemCardLink}>
                How we solve this&nbsp;›
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* ── Section 4 — How VantageRisk Works ──────────────────── */}
      <section id="how-it-works" className={styles.howSection}>
        <div className={styles.sectionStrip}>
          <div className={styles.sectionStripInner}>
            <span className={styles.sectionStripLabel}>How It Works</span>
          </div>
        </div>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionHeaderInner}>
            <p className={styles.sectionHeaderEyebrow}>The process</p>
            <h2 className={styles.sectionHeaderHeadline}>From documents to decisions in days.</h2>
            <hr className={styles.sectionHeaderRule} />
            <p className={styles.sectionHeaderSubline}>
              Submit your program materials and receive a 12-section renewal intelligence
              report — before your broker has drafted a submission.
            </p>
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

      {/* ── Section 6 — Stats / Proof Bar ─────────────────────── */}
      <section className={styles.statsSection} aria-label="Key metrics">
        <div className={styles.sectionStrip}>
          <div className={styles.sectionStripInner}>
            <span className={styles.sectionStripLabel}>By the numbers</span>
          </div>
        </div>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionHeaderInner}>
            <p className={styles.sectionHeaderEyebrow}>Track record</p>
            <h2 className={styles.sectionHeaderHeadline}>The numbers behind the intelligence.</h2>
            <hr className={styles.sectionHeaderRule} />
            <p className={styles.sectionHeaderSubline}>
              VantageRisk has benchmarked mid-market programs across every major P&amp;C line.
              Here&rsquo;s what the data consistently shows.
            </p>
          </div>
        </div>
        <div className={styles.statsInner}>
          {STATS.map((stat) => (
            <div key={stat.number} className={styles.statItem}>
              <p className={styles.statNumber}>{stat.number}</p>
              <p className={styles.statLabel}>{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Section 7 — Testimonials ────────────────────────────── */}
      <section id="insights-section" className={styles.testimonialsSection}>
        <div className={styles.sectionStrip}>
          <div className={styles.sectionStripInner}>
            <span className={styles.sectionStripLabel}>Client outcomes</span>
          </div>
        </div>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionHeaderInner}>
            <p className={styles.sectionHeaderEyebrow}>Client outcomes</p>
            <h2 className={styles.sectionHeaderHeadline}>Risk managers who came prepared.</h2>
            <hr className={styles.sectionHeaderRule} />
            <p className={styles.sectionHeaderSubline}>
              VantageRisk clients don&rsquo;t just renew — they negotiate. Here&rsquo;s what
              they found when they arrived at the table with their own data.
            </p>
          </div>
        </div>
        <div className={styles.testimonialsGrid}>
          {TESTIMONIALS.map((t) => (
            <div key={t.name} className={styles.testimonialCard}>
              <p className={styles.testimonialQuote}>&ldquo;{t.quote}&rdquo;</p>
              <div className={styles.testimonialDivider} aria-hidden="true" />
              <p className={styles.testimonialName}>{t.name}</p>
              <p className={styles.testimonialRole}>{t.role}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Section 8 — Contact / CTA ───────────────────────────── */}
      <section id="get-started" className={styles.contactSection}>
        <div className={styles.sectionStripDark}>
          <div className={styles.sectionStripInner}>
            <span className={`${styles.sectionStripLabel} ${styles.sectionStripLabelDark}`}>
              Get started
            </span>
          </div>
        </div>
        <div className={styles.contactInner}>

          <div>
            <p className={styles.contactEyebrow}>Scope an engagement</p>
            <h2 className={styles.contactHeadline}>
              Your next renewal<br />
              starts here.
            </h2>
            <p className={styles.contactBody}>
              Tell us about your program and we&rsquo;ll scope an engagement
              within one business day. Your report arrives well ahead of renewal —
              so you walk into carrier negotiations with a position, not a deadline.
            </p>
            <ul className={styles.contactTrustList} aria-label="What to expect">
              {TRUST_POINTS.map((point) => (
                <li key={point} className={styles.contactTrustItem}>
                  <span className={styles.contactTrustBullet} aria-hidden="true" />
                  <span className={styles.contactTrustText}>{point}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className={styles.contactFormCard}>
            <p className={styles.contactFormTitle}>Request access</p>
            <form onSubmit={(e) => e.preventDefault()}>
              <div className={styles.formRow}>
                <div className={styles.formField}>
                  <label className={styles.formLabel} htmlFor="cf-name">Full name</label>
                  <input id="cf-name" className={styles.formInput} type="text" placeholder="Jane Smith" autoComplete="name" />
                </div>
                <div className={styles.formField}>
                  <label className={styles.formLabel} htmlFor="cf-email">Work email</label>
                  <input id="cf-email" className={styles.formInput} type="email" placeholder="jane@company.com" autoComplete="email" />
                </div>
              </div>
              <div className={styles.formField}>
                <label className={styles.formLabel} htmlFor="cf-company">Company name</label>
                <input id="cf-company" className={styles.formInput} type="text" placeholder="Acme Manufacturing, Inc." autoComplete="organization" />
              </div>
              <div className={styles.formRow}>
                <div className={styles.formField}>
                  <label className={styles.formLabel} htmlFor="cf-premium">Total program premium</label>
                  <select id="cf-premium" className={styles.formSelect}>
                    <option value="">Select range</option>
                    <option>Under $500K</option>
                    <option>$500K – $1M</option>
                    <option>$1M – $5M</option>
                    <option>$5M – $20M</option>
                    <option>Over $20M</option>
                  </select>
                </div>
                <div className={styles.formField}>
                  <label className={styles.formLabel} htmlFor="cf-renewal">Renewal date</label>
                  <input id="cf-renewal" className={styles.formInput} type="text" placeholder="MM/DD/YYYY" />
                </div>
              </div>
              <div className={styles.formField}>
                <label className={styles.formLabel} htmlFor="cf-message">Anything else we should know</label>
                <textarea id="cf-message" className={styles.formTextarea} placeholder="Lines of coverage, specific concerns, prior claims…" />
              </div>
              <button type="submit" className={styles.formSubmit}>
                Submit request
              </button>
            </form>
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
