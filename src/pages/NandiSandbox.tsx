import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=DM+Sans:wght@400;500;700&family=Playfair+Display:wght@600;700&display=swap');
.nandi{--paper:#FDFAF4;--ink:#1A1614;--muted:#5C5248;--faint:#9A8F84;--accent:#5C7A3A;--accent-soft:rgba(92,122,58,.10);--accent-border:rgba(92,122,58,.25);--green:#2A6A45;--amber:#C4892A;--red:#8A2A20;--blue:#2A5C8A;--line:rgba(26,22,14,.12);--display:'Playfair Display',Georgia,serif;--body:'DM Sans',system-ui,sans-serif;--mono:'DM Mono',ui-monospace,monospace;
background:var(--paper);color:var(--ink);font-family:var(--body);line-height:1.55;min-height:100vh;-webkit-font-smoothing:antialiased}
.nandi *{box-sizing:border-box}
.nandi .wrap{max-width:920px;margin:0 auto;padding:20px 20px 64px}
.nandi .kicker{font-family:var(--mono);font-size:9px;letter-spacing:.10em;text-transform:uppercase;color:var(--faint)}
.nandi h1{font-family:var(--display);font-size:clamp(24px,4.2vw,34px);line-height:1.15;margin:6px 0 4px}
.nandi h2{font-family:var(--display);font-size:20px;margin:0 0 4px}
.nandi h3{font-family:var(--body);font-size:14px;font-weight:700;margin:0 0 6px}
.nandi p{margin:0 0 10px;color:var(--muted);font-size:14px}
.nandi .back{font-family:var(--mono);font-size:11px;color:var(--accent);text-decoration:none;display:inline-block;margin-bottom:12px}
.nandi .back:hover{text-decoration:underline}
.nandi .banner{font-family:var(--mono);font-size:11px;color:var(--accent);background:var(--accent-soft);border:1px solid var(--accent-border);border-radius:5px;padding:8px 12px;margin-bottom:18px}
.nandi .card{background:#fff;border:1px solid var(--line);border-radius:10px;padding:18px 20px;margin-bottom:16px;box-shadow:0 6px 18px -14px rgba(26,22,14,.25)}
.nandi .tabs{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:16px}
.nandi .tab{display:block;text-decoration:none;border:1px solid var(--line);background:#fff;border-radius:8px;padding:8px 12px;min-width:150px;flex:1 1 150px}
.nandi .tab .tl{font-size:13px;font-weight:700;color:var(--ink)}
.nandi .tab .tt{font-family:var(--mono);font-size:9px;text-transform:uppercase;letter-spacing:.07em;color:var(--faint);margin-top:2px}
.nandi .tab[data-active="true"]{border-color:var(--accent-border);background:var(--accent-soft)}
.nandi .tab[data-active="true"] .tl{color:var(--accent)}
.nandi .grid{display:grid;gap:12px}
.nandi .g3{grid-template-columns:repeat(auto-fit,minmax(180px,1fr))}
.nandi .g2{grid-template-columns:repeat(auto-fit,minmax(260px,1fr))}
.nandi .g4{grid-template-columns:repeat(auto-fit,minmax(140px,1fr))}
.nandi .stat{border:1px solid var(--line);border-radius:8px;padding:12px 14px;background:var(--paper)}
.nandi .stat .v{font-family:var(--mono);font-size:22px}
.nandi .stat .l{font-family:var(--mono);font-size:9px;text-transform:uppercase;letter-spacing:.08em;color:var(--faint);margin-top:2px}
.nandi .green{color:var(--green)}.nandi .amber{color:var(--amber)}.nandi .blue{color:var(--blue)}.nandi .red{color:var(--red)}.nandi .accent{color:var(--accent)}
.nandi ul.bullets{margin:0;padding-left:18px}
.nandi ul.bullets li{font-size:14px;color:var(--muted);margin-bottom:6px}
.nandi table{width:100%;border-collapse:collapse;font-size:13px}
.nandi th{font-family:var(--mono);font-size:9px;text-transform:uppercase;letter-spacing:.08em;color:var(--faint);text-align:left;padding:8px 10px;border-bottom:1px solid var(--line)}
.nandi td{padding:10px;border-bottom:1px solid rgba(26,22,14,.07);vertical-align:top;color:var(--muted)}
.nandi td.mono{font-family:var(--mono);color:var(--ink)}
.nandi .pill{display:inline-block;font-family:var(--mono);font-size:9px;border-radius:3px;padding:2px 6px;white-space:nowrap}
.nandi .badge{display:inline-block;font-family:var(--mono);font-size:10px;color:var(--accent);background:var(--accent-soft);border:1px solid var(--accent-border);border-radius:3px;padding:3px 8px}
.nandi .note{font-size:12px;color:var(--muted);background:rgba(196,137,42,.06);border:1px dashed rgba(196,137,42,.35);border-radius:6px;padding:8px 10px;margin-top:8px}
.nandi .note.gap{background:rgba(138,42,32,.05);border-color:rgba(138,42,32,.30)}
.nandi .bar{height:8px;border-radius:4px;background:rgba(26,22,14,.06);overflow:hidden}
.nandi .bar>span{display:block;height:100%;border-radius:4px}
.nandi .barrow{margin-bottom:12px}
.nandi .barrow .top{display:flex;justify-content:space-between;gap:10px;font-size:13px;margin-bottom:4px;flex-wrap:wrap}
.nandi .barrow .amt{font-family:var(--mono)}
.nandi .scroll{overflow-x:auto}
.nandi footer{margin-top:28px;border-top:1px solid var(--line);padding-top:14px;font-family:var(--mono);font-size:10px;color:var(--faint);display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap}
`;

const AUDIENCES = ["farmer", "cooperative", "lender", "trader", "brand", "development_actor"] as const;
type Audience = (typeof AUDIENCES)[number];

type AudienceProfile = { key: string; label: string; tagline: string | null; description: string | null; sort_order: number };
type Pricing = { audience_key: string; payer: string; model_type: string; indicative_rate: string; basis: string | null; note: string | null };
type Contribution = { id: string; label: string; occurred_on: string; amount_ksh: number; status: string; proof_note: string | null; sort_order: number | null };
type Contract = { id: string; title: string; counterparty: string; entitlement: string; trigger_desc: string; status: string };
type Trigger = { id: string; trigger_name: string; status: string; evidence: string; source: string; verification_method: string; confidence: string; sort_order: number | null };
type Decay = { year: number; kaptumo_pool_pct: number | null; derivative_pct: number | null; status: string | null };
type CoopSummary = { key: string; member_count: number | null; total_value_tracked_ksh: number | null; seasons_active: number | null; note: string | null };

const ksh = (n: number) => `KSh ${Math.round(n).toLocaleString("en-KE")}`;

const confClass = (c: string) =>
  c === "Very strong" || c === "Strong" ? "green" : c === "Moderate" ? "amber" : "red";

const statusPill = (status: string) => {
  const s = status.toUpperCase();
  const color = s.includes("NOT DETECTED") ? "var(--red)" : s.includes("ASSERTED") || s.includes("PENDING") ? "var(--amber)" : "var(--green)";
  const bg = s.includes("NOT DETECTED") ? "rgba(138,42,32,.08)" : s.includes("ASSERTED") || s.includes("PENDING") ? "rgba(196,137,42,.10)" : "rgba(42,106,69,.10)";
  return <span className="pill" style={{ color, background: bg }}>{status}</span>;
};

const NandiSandbox = () => {
  const { audience } = useParams<{ audience: string }>();
  const active = (AUDIENCES as readonly string[]).includes(audience ?? "") ? (audience as Audience) : null;

  const [profiles, setProfiles] = useState<AudienceProfile[]>([]);
  const [pricing, setPricing] = useState<Pricing[]>([]);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [triggers, setTriggers] = useState<Trigger[]>([]);
  const [decay, setDecay] = useState<Decay[]>([]);
  const [coop, setCoop] = useState<CoopSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [p, pr, c, ct, tr, d, cs] = await Promise.all([
        supabase.from("nandi_audience_profiles").select("*").order("sort_order"),
        supabase.from("nandi_pricing_models").select("*"),
        supabase.from("nandi_contributions").select("*").order("sort_order"),
        supabase.from("nandi_contracts").select("*"),
        supabase.from("nandi_evidence_triggers").select("*").order("sort_order"),
        supabase.from("nandi_decay_schedule").select("*").order("year"),
        supabase.from("nandi_cooperative_summary").select("*").eq("key", "kaptumo").maybeSingle(),
      ]);
      setProfiles((p.data ?? []) as AudienceProfile[]);
      setPricing((pr.data ?? []) as Pricing[]);
      setContributions((c.data ?? []) as Contribution[]);
      setContracts((ct.data ?? []) as Contract[]);
      setTriggers((tr.data ?? []) as Trigger[]);
      setDecay((d.data ?? []) as Decay[]);
      setCoop((cs.data as CoopSummary) ?? null);
      setLoading(false);
    })();
  }, []);

  const activeProfile = profiles.find((p) => p.key === active);
  const activePricing = pricing.find((p) => p.audience_key === active);

  const totals = useMemo(() => {
    const sum = (s: string) => contributions.filter((c) => c.status === s).reduce((a, c) => a + Number(c.amount_ksh), 0);
    return { received: sum("Received"), pending: sum("Pending") };
  }, [contributions]);

  const confidenceCounts = useMemo(() => {
    const order = ["Very strong", "Strong", "Moderate", "Gap"];
    return order.map((k) => ({ label: k, count: triggers.filter((t) => t.confidence === k).length }));
  }, [triggers]);

  const paidAudience = active === "trader" || active === "brand" || active === "lender";

  const traceablePct = triggers.length
    ? Math.round((triggers.filter((t) => t.confidence !== "Gap").length / triggers.length) * 100)
    : 0;
  const strongPct = triggers.length
    ? Math.round(
        (triggers.filter((t) => t.confidence === "Very strong" || t.confidence === "Strong").length /
          triggers.length) *
          100,
      )
    : 0;
  const gapTriggers = triggers.filter((t) => t.confidence === "Gap");

  useEffect(() => {
    if (activeProfile) document.title = `Nandi Sandbox — ${activeProfile.label} | SCORE`;
  }, [activeProfile]);

  if (!active) return <Navigate to="/sandbox/nandi/farmer" replace />;

  return (
    <div className="nandi">
      <style>{CSS}</style>
      <main className="wrap">
        <Link to="/" className="back">← SCORE Passport</Link>
        <div className="banner">
          Sandbox · Aisha Ng'etich · Kaptumo Cooperative · Nandi County, Kenya — demonstration data, not a live record.
        </div>

        <header className="card">
          <div className="kicker">SCORE Contribution Ledger · Nandi Sandbox</div>
          <h1>{activeProfile?.label ?? "Nandi Sandbox"}</h1>
          <p style={{ margin: 0 }}>{activeProfile?.description ?? ""}</p>
        </header>

        <nav className="tabs" aria-label="Audience view">
          {profiles.map((p) => (
            <Link key={p.key} to={`/sandbox/nandi/${p.key}`} className="tab" data-active={p.key === active}>
              <div className="tl">{p.label}</div>
              <div className="tt">{p.tagline}</div>
            </Link>
          ))}
        </nav>

        {activePricing && (
          <section
            className="card"
            style={
              paidAudience
                ? { borderColor: "var(--accent-border)", background: "var(--accent-soft)" }
                : undefined
            }
          >
            <h2>
              {paidAudience ? "Commercial model — this is the paying stakeholder" : "Indicative access model"}
            </h2>
            <p className="kicker" style={{ marginBottom: 10 }}>
              {active === "development_actor"
                ? "Validation, not a funding ask. No commercial relationship implied."
                : "Illustrative — for pilot conversation only. Not live billing."}
            </p>
            <div className="grid g3">
              <div className="stat"><div className="v" style={{ fontSize: 14 }}>{activePricing.payer}</div><div className="l">Who pays</div></div>
              <div className="stat"><div className="v accent" style={{ fontSize: paidAudience ? 18 : 14 }}>{activePricing.indicative_rate}</div><div className="l">Indicative rate</div></div>
              <div className="stat"><div className="v" style={{ fontSize: 14 }}>{activePricing.basis ?? "—"}</div><div className="l">Basis</div></div>
            </div>
            {activePricing.note && (
              <div className="note" style={{ marginTop: 12 }}>{activePricing.note}</div>
            )}
          </section>
        )}

        {loading ? (
          <div className="card"><p style={{ margin: 0 }}>Loading sandbox data…</p></div>
        ) : (
          <>
            {active === "farmer" && (
              <>
                <section className="card">
                  <h2>Contribution</h2>
                  <ul className="bullets">
                    <li>Delivered three consecutive AA-grade main-crop lots to the Kaptumo wet mill — 2,210 kg (2022), 2,440 kg (2023), 2,780 kg (2024).</li>
                    <li>Developed an anaerobic fermentation technique, registered as an IP asset (sha256: 9b4e2a1c…, anchored 2022).</li>
                    <li>Licensed that technique to two neighbouring cooperatives — Kabitet (2023, settled) and Cheptebo (2024, pending).</li>
                    <li>Sustained 97–100% ripe-cherry quality across every delivery, holding grade factor 1.0 in the apportionment formula.</li>
                    <li>Triggered the Season 2024 premium at NCE Week 18 · KES 142.40/kg, KES 22.40/kg above the cooperative floor.</li>
                  </ul>
                </section>

                <section className="card">
                  <h2>What changed</h2>
                  <div className="grid g2">
                    <div className="stat">
                      <div className="kicker">Under review · High confidence</div>
                      <h3 style={{ marginTop: 6 }}>Season 2024 premium pending settlement <span className="amber" style={{ fontFamily: "var(--mono)" }}>KSh 62,000</span></h3>
                      <p style={{ fontSize: 13, margin: 0 }}>NCE auction Week 18 confirmed an AA-grade premium of KES 22.40/kg above floor. Awaiting the cooperative's M-PESA transfer. 2 of 3 confirmations in.</p>
                    </div>
                    <div className="stat">
                      <div className="kicker">Resolved · High confidence</div>
                      <h3 style={{ marginTop: 6 }}>Kabitet licence royalty received <span className="green" style={{ fontFamily: "var(--mono)" }}>KSh 14,200</span></h3>
                      <p style={{ fontSize: 13, margin: 0 }}>Kabitet Cooperative adopted the fermentation technique under licence. First derivative settlement confirmed on-chain and by M-PESA.</p>
                    </div>
                    <div className="stat">
                      <div className="kicker">Watching · Medium confidence</div>
                      <h3 style={{ marginTop: 6 }}>Cheptebo licence royalty pending <span className="amber" style={{ fontFamily: "var(--mono)" }}>KSh 13,800</span></h3>
                      <p style={{ fontSize: 13, margin: 0 }}>Cheptebo Cooperative adopted the technique in Feb 2024. Royalty is due within 90 days of their own season settlement.</p>
                    </div>
                  </div>
                </section>

                <section className="card">
                  <h2>Value streams</h2>
                  <div className="grid g2" style={{ marginTop: 8 }}>
                    <div className="stat">
                      <h3>Kaptumo premium pool · Season 2024</h3>
                      <p style={{ fontSize: 13, margin: 0 }}>8% of the cooperative premium pool above the NCE floor (KES 120/kg), proportional to delivery weight × quality grade. Linear decay 15%/yr, 3% floor.</p>
                      <div className="kicker" style={{ marginTop: 8 }}>Trigger · NCE AA-grade auction price ≥ KES 120.00/kg</div>
                    </div>
                    <div className="stat">
                      <h3>Anaerobic fermentation technique · derivative licences</h3>
                      <p style={{ fontSize: 13, margin: 0 }}>3% of each adopting cooperative's premium pool above the NCE floor, per licence. Linear decay 20%/yr from execution, capped at KES 5,000 per derivative per season.</p>
                      <div className="kicker" style={{ marginTop: 8 }}>Trigger · Licence execution + adopter's NCE settlement</div>
                    </div>
                  </div>
                </section>

                <section className="card">
                  <h2>Value summary</h2>
                  <p>What has been tracked across three seasons, in Kenyan shillings.</p>
                  <div className="grid g3">
                    <div className="stat"><div className="v green">{ksh(totals.received)}</div><div className="l">Received</div></div>
                    <div className="stat"><div className="v amber">{ksh(totals.pending)}</div><div className="l">Pending</div></div>
                    <div className="stat"><div className="v blue">{coop?.seasons_active ?? decay.filter((d) => d.status !== "Projected").length}</div><div className="l">Seasons active</div></div>
                  </div>
                </section>

                <section className="card">
                  <h2>Evidence &amp; triggers</h2>
                  <p>Every trigger event in the Nandi workflow, mapped to the evidence behind it, who published that evidence, and how anyone can check it.</p>
                  <div className="scroll">
                    <table>
                      <thead><tr><th>Trigger</th><th>Status</th><th>Evidence</th><th>Source</th><th>How it is checked</th><th>Strength</th></tr></thead>
                      <tbody>
                        {triggers.map((t) => (
                          <tr key={t.id}>
                            <td className="mono">{t.trigger_name}</td>
                            <td>{statusPill(t.status)}</td>
                            <td>{t.evidence}</td>
                            <td>{t.source}</td>
                            <td>{t.verification_method}</td>
                            <td className={confClass(t.confidence)}>{t.confidence}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="note gap"><strong>Known gap:</strong> SCORE detects reuse of the fermentation technique only when a licence is executed or an attestation is filed. Informal adoption by a neighbouring farm stays invisible.</div>
                  <div className="note"><strong>Weakest link:</strong> ripe-cherry quality rests on a single attestor. The CRE AA grade implicitly confirms it — that linkage should be made explicit, or the CRE grader added as a second attestor.</div>
                </section>

                <section className="card">
                  <h2>Recorded contributions</h2>
                  <p>Each entry, with the proof recorded alongside it.</p>
                  <div className="scroll">
                    <table>
                      <thead><tr><th>Contribution</th><th>Date</th><th>Amount</th><th>Status</th><th>Proof</th></tr></thead>
                      <tbody>
                        {contributions.map((c) => (
                          <tr key={c.id}>
                            <td>{c.label}</td>
                            <td className="mono">{c.occurred_on}</td>
                            <td className={`mono ${c.status === "Received" ? "green" : "amber"}`}>{ksh(Number(c.amount_ksh))}</td>
                            <td>{c.status}</td>
                            <td>{c.proof_note}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>

                <section className="card">
                  <h2>By contribution</h2>
                  <p>Each recorded amount, largest first. Green is received, amber is pending.</p>
                  {[...contributions]
                    .sort((a, b) => Number(b.amount_ksh) - Number(a.amount_ksh))
                    .map((c) => {
                      const max = Math.max(...contributions.map((x) => Number(x.amount_ksh)), 1);
                      const pct = (Number(c.amount_ksh) / max) * 100;
                      const col = c.status === "Received" ? "var(--green)" : "var(--amber)";
                      return (
                        <div className="barrow" key={c.id}>
                          <div className="top"><span>{c.label}</span><span className={`amt ${c.status === "Received" ? "green" : "amber"}`}>{ksh(Number(c.amount_ksh))}</span></div>
                          <div className="bar"><span style={{ width: `${pct}%`, background: col }} /></div>
                        </div>
                      );
                    })}
                </section>

                <ContractsCard contracts={contracts} />
                <DecayCard decay={decay} />
              </>
            )}

            {active === "cooperative" && (
              <>
                <section className="card">
                  <h2>Kaptumo Cooperative · aggregate</h2>
                  <div className="grid g3">
                    <div className="stat"><div className="v">{coop?.member_count ?? "—"}</div><div className="l">Members (assumed)</div></div>
                    <div className="stat"><div className="v accent">{coop?.total_value_tracked_ksh ? ksh(Number(coop.total_value_tracked_ksh)) : "—"}</div><div className="l">Value tracked (proxy)</div></div>
                    <div className="stat"><div className="v">{coop?.seasons_active ?? "—"}</div><div className="l">Seasons active</div></div>
                  </div>
                  <div className="note gap"><strong>Illustrative aggregate, not a verified cooperative-wide figure.</strong> {coop?.note}</div>
                </section>

                <section className="card">
                  <h2>Pool &amp; licence distribution</h2>
                  <p>How value flows across the cooperative and its adopting neighbours, rather than one farmer's line items.</p>
                  <div className="scroll">
                    <table>
                      <thead><tr><th>Stream</th><th>Counterparty</th><th>Entitlement</th><th>Trigger</th><th>Status</th></tr></thead>
                      <tbody>
                        {contracts.map((c) => (
                          <tr key={c.id}>
                            <td className="mono">{c.title}</td>
                            <td>{c.counterparty}</td>
                            <td>{c.entitlement}</td>
                            <td>{c.trigger_desc}</td>
                            <td>{c.status}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="note">Derivative licence royalties are distributed per adopting cooperative — Kabitet (settled) and Cheptebo (pending) — and shared back into the Kaptumo premium pool allocation for the season.</div>
                </section>

                <DecayCard decay={decay} title="Pool decay across the membership" />
              </>
            )}

            {active === "development_actor" && (
              <>
                <section className="card">
                  <h2>Evidence confidence distribution</h2>
                  <p>
                    Compliance and risk posture across every tracked trigger, for institutions assessing whether the model holds:
                    IFC as investment partner, FAO as a standards and food-systems observer, and Nandi County government as the
                    convening authority. Reliability first — individual payout detail is not the concern here.
                  </p>
                  <div className="grid g4">
                    {confidenceCounts.map((c) => (
                      <div className="stat" key={c.label}>
                        <div className={`v ${confClass(c.label)}`}>{c.count}</div>
                        <div className="l">{c.label}</div>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="card">
                  <h2>Traceability gaps</h2>
                  <p>Surfaced, not softened. These are the points where an EUDR claim cannot currently be independently checked.</p>
                  {triggers.filter((t) => t.confidence === "Gap" || t.confidence === "Moderate").map((t) => (
                    <div className="stat" key={t.id} style={{ marginBottom: 10 }}>
                      <div className="kicker">{t.confidence === "Gap" ? "Gap" : "Weak link"}</div>
                      <h3 style={{ marginTop: 6 }}>{t.trigger_name} {statusPill(t.status)}</h3>
                      <p style={{ fontSize: 13, margin: 0 }}>{t.evidence}</p>
                      <p style={{ fontSize: 12, margin: "6px 0 0" }}><strong>Source:</strong> {t.source} · <strong>Check:</strong> {t.verification_method}</p>
                    </div>
                  ))}
                  <div className="note gap"><strong>Known gap:</strong> reuse of the fermentation technique is detected only when a licence is executed or an attestation is filed. Informal adoption by a neighbouring farm stays invisible.</div>
                </section>

                <section className="card">
                  <h2>Verified trigger coverage</h2>
                  <div className="scroll">
                    <table>
                      <thead><tr><th>Trigger</th><th>Status</th><th>Confidence</th></tr></thead>
                      <tbody>
                        {triggers.map((t) => (
                          <tr key={t.id}>
                            <td className="mono">{t.trigger_name}</td>
                            <td>{statusPill(t.status)}</td>
                            <td className={confClass(t.confidence)}>{t.confidence}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              </>
            )}

            {active === "lender" && (
              <>
                <section className="card">
                  <h2>Borrower readiness</h2>
                  <p>
                    What a lender would see before this existed: <strong>nothing verifiable</strong> — no delivery history, no
                    income record, no way to check a claim against a third party. What they see now:
                  </p>
                  <div className="grid g4">
                    <div className="stat"><div className="v green">{ksh(totals.received)}</div><div className="l">Verified income received</div></div>
                    <div className="stat"><div className="v amber">{ksh(totals.pending)}</div><div className="l">Pending entitlement (collateral signal)</div></div>
                    <div className="stat"><div className="v">{coop?.seasons_active ?? decay.filter((d) => d.status !== "Projected").length}</div><div className="l">Seasons of verified delivery</div></div>
                    <div className="stat"><div className="v accent">{strongPct}%</div><div className="l">Evidence strong or better</div></div>
                  </div>
                  <div className="scroll" style={{ marginTop: 14 }}>
                    <table>
                      <thead><tr><th>Season record</th><th>Date</th><th>Amount</th><th>Status</th><th>Independent check</th></tr></thead>
                      <tbody>
                        {contributions.map((c) => (
                          <tr key={c.id}>
                            <td>{c.label}</td>
                            <td className="mono">{c.occurred_on}</td>
                            <td className={`mono ${c.status === "Received" ? "green" : "amber"}`}>{ksh(Number(c.amount_ksh))}</td>
                            <td>{c.status}</td>
                            <td>{c.proof_note}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="note">
                    A repeated, third-party-checkable delivery record is the underwriting input that has been missing. It does not
                    replace a credit decision — it gives one something to sit on.
                  </div>
                </section>

                <section className="card">
                  <h2>Two lending relationships</h2>
                  <p>The same record supports two different loan books, assessed on different risk.</p>
                  <div className="stat" style={{ marginBottom: 10 }}>
                    <div className="kicker">1 · Individual farmer</div>
                    <h3 style={{ marginTop: 6 }}>Seasonal pre-harvest credit</h3>
                    <p style={{ fontSize: 13, margin: 0 }}>
                      Four-month term, balloon repayment timed to NCE settlement rather than a fixed monthly schedule. The pending
                      entitlement already firing in the evidence data acts as the repayment trigger: when the cooperative settles,
                      the loan clears. Exposure is bounded by an entitlement that is visible before it pays out.
                    </p>
                  </div>
                  <div className="stat">
                    <div className="kicker">2 · Cooperative</div>
                    <h3 style={{ marginTop: 6 }}>Institutional credit on distribution accuracy</h3>
                    <p style={{ fontSize: 13, margin: 0 }}>
                      The same confidence data a trader reads as compliance, a lender reads as risk. A cooperative whose
                      individual distributions reconcile against auction proceeds season after season is a materially different
                      borrower from one whose payout logic is unobservable — {strongPct}% of tracked triggers are strong or
                      better, with {gapTriggers.length} open gap{gapTriggers.length === 1 ? "" : "s"} disclosed.
                    </p>
                  </div>
                  <div className="grid g4" style={{ marginTop: 14 }}>
                    {confidenceCounts.map((c) => (
                      <div className="stat" key={c.label}>
                        <div className={`v ${confClass(c.label)}`}>{c.count}</div>
                        <div className="l">{c.label}</div>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="card">
                  <h2>Precedent</h2>
                  <div className="note">
                    TechnoServe's <strong>Haiti Hope / Agripro</strong> programme lent against verified smallholder delivery
                    records rather than land title or guarantors, and reported <strong>96% repayment</strong> with a{" "}
                    <strong>2% loan loss rate</strong> — against a roughly <strong>9.4% sector average</strong> for comparable
                    agricultural lending. The mechanism was the same: make the delivery relationship legible, and the credit
                    risk changes shape. Cited as supporting evidence, not as a projection for this pilot.
                  </div>
                </section>
              </>
            )}

            {active === "trader" && (
              <>
                <section className="card">
                  <h2>What this delivers for your compliance file</h2>
                  <p>
                    EUDR documentation assembled automatically from the same delivery records you already receive — instead of a
                    manual audit at the end of the season.
                  </p>
                  <div className="grid g4">
                    <div className="stat"><div className="v green">{traceablePct}%</div><div className="l">Traceable triggers</div></div>
                    <div className="stat"><div className="v accent">{strongPct}%</div><div className="l">Strong or better</div></div>
                    <div className="stat"><div className="v">{triggers.length}</div><div className="l">Tracked triggers</div></div>
                    <div className="stat"><div className={`v ${gapTriggers.length ? "red" : "green"}`}>{gapTriggers.length}</div><div className="l">Open gaps</div></div>
                  </div>
                </section>

                <section className="card">
                  <h2>Confidence distribution</h2>
                  <p>How the evidence behind each trigger stands up, aggregated across the season.</p>
                  <div className="grid g4">
                    {confidenceCounts.map((c) => (
                      <div className="stat" key={c.label}>
                        <div className={`v ${confClass(c.label)}`}>{c.count}</div>
                        <div className="l">{c.label}</div>
                      </div>
                    ))}
                  </div>
                  <div className="scroll" style={{ marginTop: 14 }}>
                    <table>
                      <thead><tr><th>Trigger</th><th>Status</th><th>Source</th><th>Verification method</th><th>Confidence</th></tr></thead>
                      <tbody>
                        {triggers.map((t) => (
                          <tr key={t.id}>
                            <td className="mono">{t.trigger_name}</td>
                            <td>{statusPill(t.status)}</td>
                            <td>{t.source}</td>
                            <td>{t.verification_method}</td>
                            <td className={confClass(t.confidence)}>{t.confidence}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>

                <section className="card">
                  <h2>Stated plainly: the gap</h2>
                  <p>Nothing is smoothed over. This is what a compliance file cannot currently claim.</p>
                  {gapTriggers.length === 0 ? (
                    <div className="note">No open gaps recorded this season.</div>
                  ) : (
                    gapTriggers.map((t) => (
                      <div className="stat" key={t.id} style={{ marginBottom: 10 }}>
                        <h3>{t.trigger_name} {statusPill(t.status)}</h3>
                        <p style={{ fontSize: 13, margin: 0 }}>{t.evidence}</p>
                        <p style={{ fontSize: 12, margin: "6px 0 0" }}><strong>Source:</strong> {t.source} · <strong>Check:</strong> {t.verification_method}</p>
                      </div>
                    ))
                  )}
                  <div className="note gap"><strong>Known gap:</strong> informal reuse of the fermentation technique is only detected when a licence is executed or an attestation is filed.</div>
                </section>

                <section className="card">
                  <h2>Cooperative you would be filing for</h2>
                  <div className="grid g3">
                    <div className="stat"><div className="v">{coop?.member_count ?? "—"}</div><div className="l">Members (assumed)</div></div>
                    <div className="stat"><div className="v accent">{coop?.total_value_tracked_ksh ? ksh(Number(coop.total_value_tracked_ksh)) : "—"}</div><div className="l">Value tracked (proxy)</div></div>
                    <div className="stat"><div className="v">{coop?.seasons_active ?? "—"}</div><div className="l">Seasons active</div></div>
                  </div>
                  <div className="note gap"><strong>Illustrative aggregate, not a verified cooperative-wide figure.</strong> {coop?.note}</div>
                </section>
              </>
            )}

            {active === "brand" && (
              <>
                <section className="card">
                  <h2>The dataset a brand would license</h2>
                  <p>
                    Anonymised, aggregate attribution statistics for CSRD/ESRS reporting — individual-level supply chain impact,
                    without individual identities. No farmer names, no payout amounts, no counterparty terms.
                  </p>
                  <div className="grid g4">
                    <div className="stat"><div className="v green">{traceablePct}%</div><div className="l">Traceability coverage</div></div>
                    <div className="stat"><div className="v accent">{strongPct}%</div><div className="l">Quality consistency</div></div>
                    <div className="stat"><div className="v">{coop?.seasons_active ?? "—"}</div><div className="l">Seasons verified</div></div>
                    <div className="stat"><div className="v">{coop?.member_count ?? "—"}</div><div className="l">Contributors covered</div></div>
                  </div>
                  <div className="note">
                    Equivalent manual reporting currently costs brands <strong>$50,000–$200,000</strong> per supply chain
                    sustainability report via consultants. SCORE generates the same attribution evidence continuously, as a
                    by-product of the record itself.
                  </div>
                </section>

                <section className="card">
                  <h2>Attribution quality, aggregated</h2>
                  <p>The evidence strength profile behind every claim you would carry into an ESG disclosure.</p>
                  <div className="grid g4">
                    {confidenceCounts.map((c) => (
                      <div className="stat" key={c.label}>
                        <div className={`v ${confClass(c.label)}`}>{c.count}</div>
                        <div className="l">{c.label}</div>
                      </div>
                    ))}
                  </div>
                  <div className="scroll" style={{ marginTop: 14 }}>
                    <table>
                      <thead><tr><th>Attribution claim</th><th>Independently checkable</th><th>Verification method</th></tr></thead>
                      <tbody>
                        {triggers.map((t) => (
                          <tr key={t.id}>
                            <td className="mono">{t.trigger_name}</td>
                            <td className={confClass(t.confidence)}>{t.confidence === "Gap" ? "Not detectable" : t.confidence}</td>
                            <td>{t.verification_method}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="note gap"><strong>Disclosed limitation:</strong> informal technique adoption cannot be automated without a digital touchpoint, so reuse figures understate real diffusion.</div>
                </section>
              </>
            )}
          </>
        )}

        <footer>
          <span>SCORE Contribution Ledger · Nandi Sandbox · Demonstration data</span>
          <span style={{ color: "var(--accent)" }}>SCORE tracks and verifies value. Contracts and payments remain with their respective systems.</span>
        </footer>
      </main>
    </div>
  );
};

const ContractsCard = ({ contracts }: { contracts: Contract[] }) => (
  <section className="card">
    <h2>Contracts ({contracts.length})</h2>
    <div className="scroll">
      <table>
        <thead><tr><th>Contract</th><th>Counterparty</th><th>Entitlement</th><th>Trigger</th><th>Status</th></tr></thead>
        <tbody>
          {contracts.map((c) => (
            <tr key={c.id}>
              <td>{c.title}</td>
              <td>{c.counterparty}</td>
              <td>{c.entitlement}</td>
              <td>{c.trigger_desc}</td>
              <td>{c.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </section>
);

const DecayCard = ({ decay, title = "Decay schedule · how the share falls over time" }: { decay: Decay[]; title?: string }) => (
  <section className="card">
    <h2>{title}</h2>
    <div className="scroll">
      <table>
        <thead><tr><th>Year</th><th>Kaptumo premium pool</th><th>Derivative licences</th><th>Status</th></tr></thead>
        <tbody>
          {decay.map((d) => (
            <tr key={d.year}>
              <td className="mono">{d.year}</td>
              <td className="mono">{d.kaptumo_pool_pct != null ? `${Number(d.kaptumo_pool_pct).toFixed(1)}%` : "—"}</td>
              <td className="mono">{d.derivative_pct != null ? `${Number(d.derivative_pct).toFixed(1)}%` : "—"}</td>
              <td>{d.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    <div className="note">Primary pool decays 15%/yr with a 3% floor. Derivative licences decay 20%/yr and are capped at KES 5,000 per derivative per season. Projected figures are indicative, not owed.</div>
  </section>
);

export default NandiSandbox;