const VERIFIED: { claim: string; source: string }[] = [
  {
    claim: "~19.5% of the Nairobi Coffee Exchange auction price reached farmers (2010 figures, before labour and input costs are deducted).",
    source: "European Commission, 2013 study of the Kenyan coffee value chain.",
  },
  {
    claim: "Kenya's Coffee Act 2025 and the Direct Settlement System changed the legal route by which auction proceeds reach growers.",
    source: "Coffee Act 2025 (Kenya); Direct Settlement System, Capital Markets Authority / NCE.",
  },
  {
    claim: "Kirinyaga County 2025/2026 season payouts ranged KES 100–145/kg, implying a farmer share of roughly 80–94% depending on which point in the chain the share is measured against.",
    source: "Published Kirinyaga County 2025/2026 season payout data.",
  },
  {
    claim: "The Nandi Coffee Cooperative Union grew from 18 to 100+ member cooperatives.",
    source: "Nandi Coffee Cooperative Union reporting.",
  },
];

const ILLUSTRATIVE: { claim: string; why: string }[] = [
  {
    claim: "Every pricing figure in this sandbox — trader $2,000–5,000 per cooperative per year, brand $5,000–20,000 per season, lender ~1% referral fee.",
    why: "Cost-benchmarked hypotheses. No rate has been negotiated, quoted, or agreed with any trader, brand, or lender.",
  },
  {
    claim: "Kaptumo cooperative member count of 600, used in early aggregate estimates.",
    why: "Assumed figure. Not confirmed against a cooperative register.",
  },
  {
    claim: "TechnoServe Haiti Hope / Agripro repayment statistics (96% / 2% / 9.4%).",
    why: "A real programme, cited as precedent for smallholder repayment behaviour. It is not a projection for this pilot and should not be read as one.",
  },
  {
    claim: "All Aisha Ng'etich and Kaptumo contribution, contract, evidence, and payout data shown across the six audience views.",
    why: "Demonstration data, labelled as such throughout the sandbox. No live record exists behind it.",
  },
];

const FAQS: { q: string; a: string }[] = [
  {
    q: "How reliable are the market figures behind this (Africa's coffee share, Arabica vs. Robusta trends)?",
    a: "The core value-chain figures — the ~19.5% farmer share and the Coffee Act 2025 reforms — are drawn from the published sources cited above. Broader market-share and consumption-trend figures are still being validated against primary trade data; we'll share the latest as we confirm it.",
  },
  {
    q: "Doesn't IFC already get this data through the cooperatives you work with?",
    a: "Cooperative- and programme-level indicators (like HIPSO) capture aggregate yield and farmer counts. What they don't capture is individual-level income attribution — which farmer earned what, from which delivery, verified against which price. That's the layer SCORE adds, and it's also the layer that reporting standards like CSRD/ESRS increasingly require.",
  },
  {
    q: "How does the traceability actually work?",
    a: "Each delivery is scanned and fingerprinted (SHA-256) and timestamped (RFC 3161) at the point of intake, then linked to Nairobi Coffee Exchange auction pricing and Coffee Research & Extension grade certificates. That chain is what every audience view in this sandbox is built on.",
  },
  {
    q: "What's SCORE's legal and ownership structure?",
    a: "We're finalising entity structure and governance ahead of scaling past the pilot phase — happy to walk through current thinking in a working session.",
  },
  {
    q: "Who owns and maintains this after the pilot, and how would other cooperatives come on board?",
    a: "We're designing the long-term stewardship and onboarding model now. This is one of the things we'd most value structured input on from a partner like IFC.",
  },
  {
    q: "What's in it for the cooperative?",
    a: "A verifiable distribution record the cooperative can show lenders and buyers — improving its credit profile and market access. That's the value case we're building out with Kaptumo.",
  },
  {
    q: "Is this relevant to certification and standards bodies, like Fairtrade?",
    a: "Yes. We see a distinct case for standards organisations and are developing that positioning as a next step.",
  },
];

export const NandiMethodologyView = () => (
  <>
    <div style={{ marginBottom: 22 }}>
      <div className="kicker">Methodology</div>
      <h1 style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: 28, fontWeight: 600, margin: "6px 0 6px" }}>
        Methodology &amp; FAQ
      </h1>
      <p className="body" style={{ maxWidth: 680 }}>
        Straight answers on what's confirmed, what's an estimate, and what we're still working out as the Nandi pilot scales.
      </p>
      <a
        href="/downloads/score-background-note-summary.docx"
        download
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          marginTop: 14,
          padding: "9px 16px",
          borderRadius: 8,
          background: "var(--green)",
          color: "#FDFAF4",
          fontFamily: "'DM Sans',system-ui,sans-serif",
          fontSize: 13,
          fontWeight: 500,
          textDecoration: "none",
          border: "1px solid var(--green)",
        }}
      >
        ↓ Download background note (DOCX)
      </a>
      <div className="kicker" style={{ marginTop: 8 }}>Summary · Kenya coffee value chain · Nandi County pilot</div>
    </div>

    <h3 className="sec">1 · What's confirmed vs. illustrative</h3>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 14, marginBottom: 30 }}>
      <div className="panel" style={{ borderLeft: "3px solid var(--green)" }}>
        <div className="kicker" style={{ color: "var(--green)" }}>Verified / sourced</div>
        <h4 className="sub" style={{ marginTop: 6 }}>Claims with an external source</h4>
        <ul className="bullets" style={{ marginTop: 10 }}>
          {VERIFIED.map((v) => (
            <li key={v.claim} style={{ marginBottom: 12 }}>
              <span style={{ color: "var(--ink)" }}>{v.claim}</span>
              <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--faint)", marginTop: 4 }}>{v.source}</div>
            </li>
          ))}
        </ul>
      </div>

      <div className="panel" style={{ borderLeft: "3px solid var(--red)" }}>
        <div className="kicker" style={{ color: "var(--red)" }}>Illustrative — not yet verified</div>
        <h4 className="sub" style={{ marginTop: 6 }}>Treat these as planning estimates, not measured results.</h4>
        <ul className="bullets" style={{ marginTop: 10 }}>
          {ILLUSTRATIVE.map((v) => (
            <li key={v.claim} style={{ marginBottom: 12 }}>
              <span style={{ color: "var(--ink)" }}>{v.claim}</span>
              <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>{v.why}</div>
            </li>
          ))}
        </ul>
      </div>
    </div>

    <h3 className="sec">2 · Frequently asked questions</h3>
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {FAQS.map((f) => (
        <div key={f.q} className="panel">
          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)", marginBottom: 6 }}>{f.q}</div>
          <div style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.65 }}>{f.a}</div>
        </div>
      ))}
    </div>

    <div className="note" style={{ marginTop: 20 }}>
      This page reflects where the Nandi pilot stands today. We'll update it as figures are confirmed and open questions are resolved.
    </div>
  </>
);
