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

type Q = { n: number; title: string; body: string };

const GROUPS: { heading: string; note: string; items: Q[] }[] = [
  {
    heading: "Needs primary research — not yet done",
    note: "No one has done this work. Nothing below should be asserted to IFC until it is.",
    items: [
      {
        n: 1,
        title: "Africa's share of world coffee production and export over time",
        body:
          "Whether Africa's overall share has risen or declined, in which destination markets it has grown, and — where it has grown — whether the gain accrued to farmers or was absorbed by intermediaries. The third part is the one that matters for SCORE's argument and is the least likely to be answerable from published aggregates alone.",
      },
      {
        n: 2,
        title: "Robusta vs. Arabica consumption shift and what it implies for Africa",
        body:
          "The figures currently circulating in our documents — Arabica commanding 56–68% of specialty value, ~7% CAGR — have not been independently verified. They should be fact-checked against a primary source before being repeated to IFC. Treat them as unsourced until then.",
      },
    ],
  },
  {
    heading: "Needs a structural decision — more research will not resolve these",
    note: "Currently undetermined. These are choices, not unknowns.",
    items: [
      {
        n: 3,
        title: "SCORE's legal entity",
        body: "Jurisdiction, entity type, ownership structure, and cap table are all undetermined.",
      },
      {
        n: 4,
        title: "Long-term ownership, maintenance, and go-to-market",
        body:
          "Who owns, maintains, and markets the platform after a pilot, and by what mechanism new cooperatives are onboarded. Undetermined.",
      },
    ],
  },
  {
    heading: "Needs a sharper argument — the material exists but is not consolidated",
    note: "These are writing and positioning gaps, not evidence gaps.",
    items: [
      {
        n: 5,
        title: "\"Doesn't IFC already have this data through the cooperatives?\"",
        body:
          "The rebuttal exists in pieces: HIPSO indicators capture aggregate yield and farmer counts, not individual income attribution; CSRD/ESRS from 2025 requires individual-level verification that cooperative-level reporting cannot supply. It has never been written as one direct answer to the question as asked.",
      },
      {
        n: 6,
        title: "The cooperative's actual incentive to adopt SCORE",
        body:
          "This sandbox's own cooperative view states that accurate managers gain a governance tool while inaccurate ones are exposed. That is honest, and it is a reason a cooperative manager might resist adoption rather than seek it. The strongest counter-argument so far is the cooperative's improved credit profile with lenders — it is under-developed and currently rests on an unpriced assumption about how lenders would weigh distribution accuracy.",
      },
      {
        n: 7,
        title: "A dedicated case for standards organisations",
        body:
          "Fairtrade, CRE and similar bodies currently get one paragraph inside the Development Actor view. If standards organisations are a distinct pitch target, that is not enough and they likely need their own audience view.",
      },
      {
        n: 8,
        title: "End-to-end data-pipeline explainer",
        body:
          "QR scan → hash → timestamp → chain anchor → NCE listener → CRE certificate. This exists implicitly in the Source and Verification columns of the evidence tables across the sandbox, but has never been written as a standalone \"how it works\" narrative that a technical reviewer could evaluate.",
      },
    ],
  },
];

export const NandiMethodologyView = () => (
  <>
    <div style={{ marginBottom: 22 }}>
      <div className="kicker">Meta · about this sandbox</div>
      <h1 style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: 28, fontWeight: 600, margin: "6px 0 6px" }}>
        Methodology &amp; Open Research Questions
      </h1>
      <p className="body" style={{ maxWidth: 680 }}>
        This page is not a stakeholder view. It states which claims in the sandbox are sourced, which are
        placeholders, and which questions remain unanswered. It is written to be read as an internal audit
        rather than as a pitch. Where something is undetermined, it says so.
      </p>
    </div>

    <h3 className="sec">1 · What's verified vs. illustrative</h3>
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
        <div className="kicker" style={{ color: "var(--red)" }}>Illustrative / placeholder — not verified</div>
        <h4 className="sub" style={{ marginTop: 6 }}>Do not quote these as findings</h4>
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

    <h3 className="sec">2 · Open research questions</h3>
    <p className="body" style={{ maxWidth: 680 }}>
      Eight items, unresolved. They are grouped by what would actually close them — research, a decision, or
      writing — because the three require different work and are often confused for one another.
    </p>

    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {GROUPS.map((g) => (
        <div key={g.heading} className="panel">
          <h4 className="sub">{g.heading}</h4>
          <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--faint)", marginBottom: 12 }}>{g.note}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {g.items.map((q) => (
              <div key={q.n} style={{ display: "flex", gap: 12 }}>
                <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--accent)", paddingTop: 1 }}>
                  {String(q.n).padStart(2, "0")}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)" }}>{q.title}</div>
                  <div style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.65, marginTop: 3 }}>{q.body}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>

    <div className="note" style={{ marginTop: 20 }}>
      Nothing on this page is resolved by the sandbox itself. The sandbox demonstrates the tracking layer; it does
      not establish the market data, the entity, or the adoption incentive.
    </div>
  </>
);
