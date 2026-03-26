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
                their broker's. VantageRisk provides a second opinion built from
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

    </div>
  );
}
