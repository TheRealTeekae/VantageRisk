import Link from "next/link";
import styles from "./who-we-serve.module.css";

// ─── Data ──────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { label: "Who We Serve", href: "/who-we-serve" },
  { label: "Solutions",    href: "/solutions" },
  { label: "Capabilities", href: "/capabilities" },
  { label: "Insights",     href: "/insights" },
  { label: "About",        href: "/about" },
  { label: "Support",      href: "/support" },
];

const AUDIENCES = [
  {
    label: "In-House Risk Managers",
    headline: "The only party at the table without carrier-side data.",
    pain: "Your broker's renewal submission was built for the carrier's underwriting process, not your negotiation. You receive the quote, not the logic behind it. At renewal, you're defending a position you didn't construct — against a carrier who priced it.",
    solution: "VantageRisk delivers an independent loss trend analysis, line-by-line coverage gap findings, and specific renewal verdicts — push back, accept, remediate, or remarket — before your broker submits. You arrive at renewal with your own position, backed by your own data.",
    icon: (
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true">
        {/* Shield with eye — protection + visibility */}
        <path d="M20 5 L33 10 L33 22 C33 29 20 36 20 36 C20 36 7 29 7 22 L7 10 Z"
          stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinejoin="round"/>
        <ellipse cx="20" cy="21" rx="5" ry="3.5" stroke="currentColor" strokeWidth="1.5" fill="none"/>
        <circle cx="20" cy="21" r="1.5" fill="currentColor"/>
      </svg>
    ),
  },
  {
    label: "Independent Risk Consultants",
    headline: "Your independence needs an intelligence layer to back it up.",
    pain: "Clients hire you for an objective view. But at renewal, you're working from the same policy documents and loss runs the incumbent broker already has. Without proprietary market data, your independence is a posture, not a position.",
    solution: "VantageRisk is built for consultant-led engagements. You upload your client's documents, we deliver the analysis. Authority-weighted market benchmarks, coverage drift detection across five years of policies, and a 12-section report you can present under your own practice.",
    icon: (
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true">
        {/* Magnifying glass over layered documents */}
        <rect x="5" y="8" width="20" height="6" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
        <rect x="5" y="17" width="20" height="6" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" opacity="0.5"/>
        <rect x="5" y="26" width="20" height="6" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" opacity="0.25"/>
        <circle cx="30" cy="14" r="7" stroke="currentColor" strokeWidth="1.5" fill="none"/>
        <line x1="35" y1="19" x2="38" y2="23" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    label: "CFOs and Finance Leaders",
    headline: "Approving a renewal without a benchmark is approving a number, not a decision.",
    pain: "Insurance premium is one of your largest non-operating expense lines and one of the least scrutinized. Your broker has no incentive to tell you the program is overpriced. Your risk team may not have the tools to prove it. You approve the invoice.",
    solution: "VantageRisk gives finance the view risk management rarely provides: is this program competitively priced? Where are we above ISO benchmark? What would loss remediation on your worst lines actually cost in premium terms? A finance-readable report with numbers that connect to your P&L.",
    icon: (
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true">
        {/* Bar chart with rising trend line */}
        <line x1="6" y1="34" x2="38" y2="34" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="6" y1="6" x2="6" y2="34" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <rect x="10" y="22" width="6" height="12" stroke="currentColor" strokeWidth="1.5"/>
        <rect x="19" y="16" width="6" height="18" stroke="currentColor" strokeWidth="1.5"/>
        <rect x="28" y="10" width="6" height="24" stroke="currentColor" strokeWidth="1.5"/>
        <polyline points="13,22 22,16 31,10" stroke="currentColor" strokeWidth="1.5"
          strokeLinecap="round" strokeLinejoin="round" strokeDasharray="2 2"/>
      </svg>
    ),
  },
  {
    label: "Brokers and MGAs",
    headline: "Your best accounts expect more than a submission. They expect analysis.",
    pain: "Sophisticated buyers are comparing you against alternatives who come to the table with data. Renewal is no longer just placement — it's strategic counsel. Producing a true intelligence layer for every account you value isn't scalable without the right infrastructure.",
    solution: "VantageRisk is a white-label-compatible intelligence layer for your highest-value accounts. Upload the client's documents, configure the engagement, and deliver a 12-section renewal report that goes well beyond your standard submission. Differentiate your practice. Protect your book.",
    icon: (
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true">
        {/* Two nodes connected — intermediary network */}
        <circle cx="10" cy="20" r="5" stroke="currentColor" strokeWidth="1.5" fill="none"/>
        <circle cx="30" cy="20" r="5" stroke="currentColor" strokeWidth="1.5" fill="none"/>
        <line x1="15" y1="20" x2="25" y2="20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <circle cx="20" cy="20" r="2.5" fill="currentColor"/>
        <line x1="20" y1="8" x2="20" y2="14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.4"/>
        <line x1="20" y1="26" x2="20" y2="32" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.4"/>
      </svg>
    ),
  },
];

// ─── Page ──────────────────────────────────────────────────────────

export default function WhoWeServePage() {
  return (
    <div className={styles.page}>

      {/* ── Topbar ──────────────────────────────────────────────── */}
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
                  <Link
                    href={item.href}
                    className={`${styles.topbarNavLink}${item.href === "/who-we-serve" ? ` ${styles.topbarNavLinkActive}` : ""}`}
                  >
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
            <Link href="/#get-started" className={styles.topbarCta}>
              Request access
            </Link>
          </div>

        </div>
      </header>

      {/* ── Section 1 — Hero ────────────────────────────────────── */}
      <section className={styles.hero} aria-labelledby="wws-headline">
        <div className={styles.heroInner}>
          <p className={styles.heroEyebrow}>Who We Serve</p>
          <h1 id="wws-headline" className={styles.heroHeadline}>
            Every renewal has<br />
            a blind spot.
          </h1>
          <hr className={styles.heroRule} />
          <p className={styles.heroSubline}>
            Risk managers, consultants, finance leaders, and brokers all sit
            at the same table at renewal. The carrier shows up with proprietary
            loss indices, schedule rating manuals, and competitive pricing data
            you&rsquo;ve never seen. VantageRisk closes that gap — regardless
            of where you sit.
          </p>
        </div>
      </section>

      {/* ── Section 2 — Audience Cards ──────────────────────────── */}
      <section aria-label="Audiences">
        <div className={styles.sectionStrip}>
          <div className={styles.sectionStripInner}>
            <span className={styles.sectionStripLabel}>The audiences we serve</span>
          </div>
        </div>

        <div className={styles.sectionHeader}>
          <div className={styles.sectionHeaderInner}>
            <p className={styles.sectionHeaderEyebrow}>Four roles. One problem.</p>
            <h2 className={styles.sectionHeaderHeadline}>
              Carrier intelligence is asymmetric by design.
            </h2>
            <hr className={styles.sectionHeaderRule} />
            <p className={styles.sectionHeaderSubline}>
              Whether you manage, advise, approve, or place — your counterpart
              at renewal has access to data you don&rsquo;t. VantageRisk
              rebuilds that parity.
            </p>
          </div>
        </div>

        <div className={styles.audienceGrid}>
          {AUDIENCES.map((audience) => (
            <article key={audience.label} className={styles.audienceCard}>
              <div className={styles.audienceCardIcon} aria-hidden="true">
                {audience.icon}
              </div>
              <p className={styles.audienceLabel}>{audience.label}</p>
              <h3 className={styles.audienceCardHeadline}>{audience.headline}</h3>
              <hr className={styles.audienceDivider} />
              <p className={styles.audiencePainLabel}>The challenge</p>
              <p className={styles.audiencePainBody}>{audience.pain}</p>
              <p className={styles.audienceSolutionLabel}>How VantageRisk helps</p>
              <p className={styles.audienceSolutionBody}>{audience.solution}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ── Section 3 — Unifying value proposition ──────────────── */}
      <section aria-label="Core value proposition">
        <div className={styles.sectionStrip}>
          <div className={styles.sectionStripInner}>
            <span className={styles.sectionStripLabel}>The common thread</span>
          </div>
        </div>
        <div className={styles.unifySection}>
          <div className={styles.unifyInner}>
            <p className={styles.unifyEyebrow}>What every engagement delivers</p>
            <h2 className={styles.unifyHeadline}>
              Different roles.<br />One negotiation.
            </h2>
            <hr className={styles.unifyRule} />
            <p className={styles.unifyBody}>
              A carrier arrives at renewal with years of loss data indexed
              against a book of business you&rsquo;ve never seen, market pricing
              you can&rsquo;t independently verify, and schedule rating adjustments
              applied without explanation. VantageRisk gives every party on your
              side of the table the same caliber of analysis: five years of your
              own loss trends, authority-weighted ISO and NCCI benchmarks,
              line-by-line coverage gap detection, and specific renewal verdicts
              you can act on — 30 days before the renewal date, when there&rsquo;s
              still time to negotiate.
            </p>
          </div>
        </div>
      </section>

      {/* ── Section 4 — CTA Strip ───────────────────────────────── */}
      <section className={styles.ctaStrip} aria-label="Get started">
        <div className={styles.ctaInner}>
          <p className={styles.ctaEyebrow}>Start your engagement</p>
          <h2 className={styles.ctaHeadline}>
            Ready to see your program&rsquo;s<br />full picture?
          </h2>
          <p className={styles.ctaBody}>
            Tell us about your program and we&rsquo;ll scope an engagement within
            one business day. Your report arrives 30 days before renewal —
            so you walk in with a position, not a deadline.
          </p>
          <Link href="/#get-started" className={styles.ctaButton}>
            Get Started
          </Link>
        </div>
      </section>

    </div>
  );
}
