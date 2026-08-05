import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ValueEventCard, type ValueEventCardProps } from "@/components/value-events/ValueEventCard";
import { ValueMixDonut } from "@/components/charts/ValueMixDonut";
import { ContractSparkBars, type SparkContract } from "@/components/charts/ContractSparkBars";
import { QuickReadPanel, type QuickReadRow } from "@/components/charts/QuickReadPanel";
import { MilestoneArc, type Milestone } from "@/components/charts/MilestoneArc";
import { NandiMethodologyView } from "@/components/nandi/NandiMethodologyView";

const FONT_DISPLAY = "'Playfair Display',Georgia,serif";
const FONT_BODY = "'DM Sans',system-ui,sans-serif";
const FONT_MONO = "'DM Mono',ui-monospace,monospace";
const ACCENT = "#5C7A3A";

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=DM+Sans:wght@400;500;700&family=Playfair+Display:wght@600;700&display=swap');
.nandi{--paper:#FDFAF4;--ink:#1A1614;--muted:#5C5248;--faint:#9A8F84;--accent:#5C7A3A;--accent-soft:rgba(92,122,58,.10);--accent-border:rgba(92,122,58,.25);--green:#2A6A45;--amber:#C4892A;--red:#8A2A20;--blue:#2A5C8A;--line:rgba(26,22,14,.12);--display:'Playfair Display',Georgia,serif;--body:'DM Sans',system-ui,sans-serif;--mono:'DM Mono',ui-monospace,monospace;
background:var(--paper);color:var(--ink);font-family:var(--body);line-height:1.55;min-height:100vh;-webkit-font-smoothing:antialiased}
.nandi *{box-sizing:border-box}
.nandi .wrap{max-width:920px;margin:0 auto;padding:20px 20px 64px}
.nandi .kicker{font-family:var(--mono);font-size:9px;letter-spacing:.10em;text-transform:uppercase;color:var(--faint)}
.nandi .back{font-family:var(--mono);font-size:11px;color:var(--accent);text-decoration:none;display:inline-block;margin-bottom:12px}
.nandi .back:hover{text-decoration:underline}
.nandi .banner{font-family:var(--mono);font-size:11px;color:var(--accent);background:var(--accent-soft);border:1px solid var(--accent-border);border-radius:5px;padding:8px 12px;margin-bottom:18px}
.nandi .tabs{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:20px}
.nandi .tab{display:block;text-decoration:none;border:1px solid var(--line);background:#fff;border-radius:8px;padding:8px 12px;min-width:150px;flex:1 1 150px}
.nandi .tab .tl{font-size:13px;font-weight:700;color:var(--ink)}
.nandi .tab .tt{font-family:var(--mono);font-size:9px;text-transform:uppercase;letter-spacing:.07em;color:var(--faint);margin-top:2px}
.nandi .tab[data-active="true"]{border-color:var(--accent-border);background:var(--accent-soft)}
.nandi .tab[data-active="true"] .tl{color:var(--accent)}
.nandi .tabs .tabdiv{width:1px;align-self:stretch;background:var(--line);margin:2px 4px}
.nandi .tab.meta{background:transparent;border-style:dashed;flex:0 0 auto;min-width:190px}
.nandi .tab.meta .tl{font-family:var(--display);font-weight:600;color:var(--muted)}
.nandi .tab.meta[data-active="true"]{border-style:solid;border-color:var(--ink);background:rgba(26,22,14,.04)}
.nandi .tab.meta[data-active="true"] .tl{color:var(--ink)}
.nandi h3.sec{font-family:var(--display);font-size:20px;font-weight:600;margin:0 0 12px}
.nandi h4.sub{font-family:var(--display);font-size:15px;font-weight:600;margin:0 0 6px;color:var(--ink)}
.nandi .panel{border:1px solid var(--line);border-radius:6px;background:var(--paper);padding:14px 16px}
.nandi .green{color:var(--green)}.nandi .amber{color:var(--amber)}.nandi .blue{color:var(--blue)}.nandi .red{color:var(--red)}.nandi .accent{color:var(--accent)}
.nandi p.body{margin:0 0 10px;color:var(--muted);font-size:13px;line-height:1.65}
.nandi ul.bullets{margin:0;padding-left:18px}
.nandi ul.bullets li{font-size:13px;color:var(--muted);margin-bottom:6px;line-height:1.6}
.nandi table{width:100%;border-collapse:collapse;font-size:12px}
.nandi th{font-family:var(--mono);font-size:9px;text-transform:uppercase;letter-spacing:.08em;color:var(--faint);text-align:left;padding:8px 10px;border-bottom:1px solid var(--line)}
.nandi td{padding:9px 10px;border-bottom:1px solid rgba(26,22,14,.07);vertical-align:top;color:var(--muted)}
.nandi td.mono{font-family:var(--mono);color:var(--ink)}
.nandi .pill{display:inline-block;font-family:var(--mono);font-size:9px;border-radius:3px;padding:2px 6px;white-space:nowrap}
.nandi .note{font-size:12px;color:var(--muted);background:rgba(196,137,42,.06);border:1px dashed rgba(196,137,42,.35);border-radius:6px;padding:8px 10px;margin-top:8px;line-height:1.6}
.nandi .note.gap{background:rgba(138,42,32,.05);border-color:rgba(138,42,32,.30)}
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

const CONF_COLOR: Record<string, string> = {
  "Very strong": "#2A6A45",
  Strong: "#4A8A5C",
  Moderate: "#C4892A",
  Gap: "#8A2A20",
};
const CONF_WEIGHT: Record<string, number> = { "Very strong": 4, Strong: 3, Moderate: 2, Gap: 1 };

const statusPill = (status: string) => {
  const s = status.toUpperCase();
  const color = s.includes("NOT DETECTED") ? "var(--red)" : s.includes("ASSERTED") || s.includes("PENDING") ? "var(--amber)" : "var(--green)";
  const bg = s.includes("NOT DETECTED") ? "rgba(138,42,32,.08)" : s.includes("ASSERTED") || s.includes("PENDING") ? "rgba(196,137,42,.10)" : "rgba(42,106,69,.10)";
  return <span className="pill" style={{ color, background: bg }}>{status}</span>;
};

// ---------------------------------------------------------------------------
// Shared objective record — identical for every audience.
// ---------------------------------------------------------------------------

type Confirmation = { name: string; org?: string; status: "Confirmed" | "Pending" | "Disputed" };
type NandiEvent = Omit<ValueEventCardProps, "confirmations"> & { confirmations: Confirmation[] };

const EVENTS: NandiEvent[] = [
  {
    amount: 62000,
    currency: "KES",
    headline: "Season 2024 premium pending settlement",
    subheadline:
      "NCE auction Week 18 confirmed an AA-grade premium of KES 22.40/kg above the cooperative floor. Awaiting the cooperative's M-PESA transfer.",
    status: "Under review",
    confidence: "High",
    trigger: "NCE AA-grade auction price ≥ KES 120.00/kg",
    resolver: "Nairobi Coffee Exchange Week 18 auction sheet",
    evidence_count: 4,
    expected_resolution: "Within 60 days of NCE settlement",
    proofPack: {
      why_recorded:
        "2,780 kg of AA-grade cherry delivered in the 2024 main crop, entitled to 8% of the Kaptumo premium pool above the NCE floor.",
      evidence_items: [
        "Kaptumo wet mill delivery receipts (3 lots, 2,780 kg)",
        "Coffee Research Institute AA grade certificate",
        "NCE Week 18 published auction sheet — KES 142.40/kg",
        "Ripe-cherry quality attestation, 97–100%",
      ],
      verifier: "Kaptumo Mill Operator + CRE Grader",
      source: "Nairobi Coffee Exchange (public) · cooperative mill records",
      confidence_level: "High",
      last_verified_date: "2024-05-06",
      status: "Awaiting verification",
    },
    confirmations: [
      { name: "Joseph Kiptoo", org: "Kaptumo Mill Operator", status: "Confirmed" },
      { name: "Grace Wanjiru", org: "CRE Grader", status: "Confirmed" },
      { name: "Daniel Rono", org: "Cooperative Manager", status: "Pending" },
    ],
  },
  {
    amount: 14200,
    currency: "KES",
    headline: "Kabitet licence royalty received",
    subheadline:
      "Kabitet Cooperative adopted the anaerobic fermentation technique under licence. First derivative settlement confirmed on-chain and by M-PESA.",
    status: "Resolved",
    confidence: "High",
    trigger: "Licence execution + adopter's NCE settlement",
    resolver: "Kabitet Cooperative Society · M-PESA reference",
    evidence_count: 3,
    proofPack: {
      why_recorded:
        "3% of Kabitet's premium pool above the NCE floor, under the derivative licence executed 2023-04-14, capped at KES 5,000 per season and decaying 20%/yr.",
      evidence_items: [
        "Executed licence agreement (2023-04-14)",
        "Technique fingerprint sha256 9b4e2a1c… anchored 2022",
        "M-PESA settlement confirmation",
      ],
      verifier: "Kabitet Cooperative Secretary",
      source: "Licence registry · M-PESA transaction record",
      confidence_level: "High",
      last_verified_date: "2024-01-18",
      status: "Verified",
    },
    confirmations: [
      { name: "Peter Kemboi", org: "Kabitet Cooperative Secretary", status: "Confirmed" },
      { name: "Daniel Rono", org: "Cooperative Manager", status: "Confirmed" },
    ],
  },
  {
    amount: 13800,
    currency: "KES",
    headline: "Cheptebo licence royalty pending",
    subheadline:
      "Cheptebo Cooperative adopted the technique in Feb 2024. Royalty is due within 90 days of their own season settlement.",
    status: "Watching",
    confidence: "Medium",
    trigger: "Adopter's NCE settlement, then 90 days",
    resolver: "Cheptebo Cooperative Society",
    evidence_count: 2,
    expected_resolution: "90 days after Cheptebo's season settlement",
    proofPack: {
      why_recorded:
        "2.4% of Cheptebo's premium pool above the NCE floor under the licence executed 2024-02-22, after 20%/yr decay from the original 3%.",
      evidence_items: [
        "Executed licence agreement (2024-02-22)",
        "Adoption attestation filed by Cheptebo",
      ],
      verifier: "Cheptebo Cooperative Secretary",
      source: "Licence registry",
      confidence_level: "Medium",
      last_verified_date: "2024-03-02",
      status: "Awaiting verification",
    },
    confirmations: [
      { name: "Miriam Chelagat", org: "Cheptebo Cooperative Secretary", status: "Confirmed" },
      { name: "Daniel Rono", org: "Cooperative Manager", status: "Pending" },
    ],
  },
];

const VALUE_STREAMS = [
  {
    name: "Kaptumo premium pool · Season 2024",
    value: "8% of pool above floor",
    description:
      "8% of the cooperative premium pool above the NCE floor (KES 120/kg), proportional to delivery weight × quality grade. Linear decay 15%/yr, 3% floor. Trigger: NCE AA-grade auction price ≥ KES 120.00/kg.",
  },
  {
    name: "Anaerobic fermentation technique · derivative licences",
    value: "3% per adopter",
    description:
      "3% of each adopting cooperative's premium pool above the NCE floor, per licence. Linear decay 20%/yr from execution, capped at KES 5,000 per derivative per season. Trigger: licence execution + adopter's NCE settlement.",
  },
];

const MILESTONES: Milestone[] = [
  { status: "ok", title: "Technique fingerprinted and anchored", meta: "2022 · sha256 9b4e2a1c…" },
  { status: "ok", title: "Three consecutive AA-grade main-crop deliveries", meta: "2022–2024 · 2,210 / 2,440 / 2,780 kg" },
  { status: "ok", title: "Kabitet licence executed and settled", meta: "2023-04-14 · M-PESA confirmed", amount: "KSh 14,200", amountColor: "green" },
  { status: "info", title: "Cheptebo licence executed", meta: "2024-02-22 · awaiting adopter settlement", amount: "KSh 13,800", amountColor: "blue" },
  { status: "watch", title: "Season 2024 premium triggered at NCE Week 18", meta: "KES 142.40/kg · awaiting cooperative transfer", amount: "KSh 62,000", amountColor: "amber" },
];

const CONTRIBUTION_BULLETS = [
  "Delivered three consecutive AA-grade main-crop lots to the Kaptumo wet mill — 2,210 kg (2022), 2,440 kg (2023), 2,780 kg (2024).",
  "Developed an anaerobic fermentation technique, registered as an IP asset (sha256: 9b4e2a1c…, anchored 2022).",
  "Licensed that technique to two neighbouring cooperatives — Kabitet (2023, received) and Cheptebo (2024, pending).",
  "Sustained 97–100% ripe-cherry quality across every delivery, holding grade factor 1.0 in the apportionment formula.",
  "Triggered the Season 2024 premium at NCE Week 18 · KES 142.40/kg, KES 22.40/kg above the cooperative floor.",
];

// ---------------------------------------------------------------------------

const CONF_DOT: Record<Confirmation["status"], string> = {
  Confirmed: "#2A6A45",
  Pending: "#C4892A",
  Disputed: "#9A3020",
};

const EventConfirmations = ({ confirmations }: { confirmations: Confirmation[] }) => {
  const confirmed = confirmations.filter((c) => c.status === "Confirmed").length;
  const pending = confirmations.filter((c) => c.status === "Pending").length;
  return (
    <div style={{ marginTop: 8, padding: "10px 12px", background: "rgba(42,106,69,0.06)", border: "1px solid rgba(42,106,69,0.15)", borderRadius: 4 }}>
      <div style={{ fontFamily: FONT_MONO, fontSize: 9, marginBottom: 8 }}>
        <span style={{ color: "#2A6A45" }}>{confirmed} of {confirmations.length} confirmed</span>
        {pending > 0 && (
          <>
            <span style={{ color: "#9A8F84" }}> · </span>
            <span style={{ color: "#C4892A" }}>{pending} pending</span>
          </>
        )}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {confirmations.map((c) => (
          <div key={`${c.name}-${c.org ?? ""}`} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: CONF_DOT[c.status], flexShrink: 0 }} />
            <span style={{ fontFamily: FONT_BODY, fontSize: 11, color: "#1A1614", flex: 1 }}>
              {c.name}{c.org ? ` · ${c.org}` : ""}
            </span>
            <span style={{ fontFamily: FONT_MONO, fontSize: 8, color: CONF_DOT[c.status] }}>{c.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const StatCards = ({ stats }: { stats: { label: string; value: string; color: string }[] }) => (
  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3" style={{ marginBottom: 20 }}>
    {stats.map((s) => (
      <div key={s.label} className="panel">
        <div style={{ fontFamily: FONT_MONO, fontSize: 9, color: "#9A8F84", textTransform: "uppercase", letterSpacing: "0.06em" }}>
          {s.label}
        </div>
        <div style={{ fontFamily: FONT_MONO, fontSize: 18, color: s.color, marginTop: 4 }}>{s.value}</div>
      </div>
    ))}
  </div>
);

const TriggerTable = ({ triggers, full = true }: { triggers: Trigger[]; full?: boolean }) => (
  <div className="scroll">
    <table>
      <thead>
        <tr>
          <th>Trigger</th><th>Status</th>{full && <th>Evidence</th>}<th>Source</th><th>How it is checked</th><th>Strength</th>
        </tr>
      </thead>
      <tbody>
        {triggers.map((t) => (
          <tr key={t.id}>
            <td className="mono">{t.trigger_name}</td>
            <td>{statusPill(t.status)}</td>
            {full && <td>{t.evidence}</td>}
            <td>{t.source}</td>
            <td>{t.verification_method}</td>
            <td className={confClass(t.confidence)}>{t.confidence}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const DecayTable = ({ decay }: { decay: Decay[] }) => (
  <div>
    <h4 className="sub">Decay schedule · how the share falls over time</h4>
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
  </div>
);

// ---------------------------------------------------------------------------

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

  const countOf = (label: string) => confidenceCounts.find((c) => c.label === label)?.count ?? 0;

  const paidAudience = active === "trader" || active === "brand" || active === "lender";

  const traceablePct = triggers.length
    ? Math.round((triggers.filter((t) => t.confidence !== "Gap").length / triggers.length) * 100)
    : 0;
  const strongPct = triggers.length
    ? Math.round((triggers.filter((t) => t.confidence === "Very strong" || t.confidence === "Strong").length / triggers.length) * 100)
    : 0;
  const gapTriggers = triggers.filter((t) => t.confidence === "Gap");
  const seasons = coop?.seasons_active ?? decay.filter((d) => d.status !== "Projected").length;

  useEffect(() => {
    if (activeProfile) document.title = `Nandi Sandbox — ${activeProfile.label} | SCORE`;
  }, [activeProfile]);

  const allConfs = EVENTS.flatMap((e) => e.confirmations);
  const confirmedTotal = allConfs.filter((c) => c.status === "Confirmed").length;
  const pendingTotal = allConfs.filter((c) => c.status === "Pending").length;
  const confidencePct = allConfs.length ? Math.round((confirmedTotal / allConfs.length) * 100) : 0;

  const contributionBars: SparkContract[] = contributions.map((c) => ({
    label: c.label,
    value: Number(c.amount_ksh),
    status: c.status === "Received" ? "settled" : "pending",
  }));

  const confidenceBars: SparkContract[] = triggers.map((t) => ({
    label: t.trigger_name,
    value: CONF_WEIGHT[t.confidence] ?? 1,
    status: t.confidence === "Gap" ? "pending" : "settled",
    color: CONF_COLOR[t.confidence] ?? "#9A8F84",
    displayValue: t.confidence,
    statusLabel: t.status,
  }));

  const licenceBars: SparkContract[] = [
    { label: "Kaptumo premium pool · Season 2024", value: 62000, status: "pending" },
    { label: "Kabitet derivative licence", value: 14200, status: "settled" },
    { label: "Cheptebo derivative licence", value: 13800, status: "pending" },
  ];

  type View = {
    kicker: string;
    name: string;
    roleLine: string;
    bio: string;
    badges: string[];
    stats: { label: string; value: string; color: string }[];
    donut: ReactNode;
    bars: ReactNode;
    barsLabel: string;
    quickRead: QuickReadRow[];
    details: ReactNode;
  };

  const confidenceDonut = (
    <ValueMixDonut
      settled={countOf("Very strong") + countOf("Strong")}
      pending={countOf("Moderate")}
      future={countOf("Gap")}
      currency="KES"
      label="Tracked triggers"
      settledLabel="Strong or better"
      pendingLabel="Moderate"
      futureLabel="Gap"
      formatValue={(n) => String(n)}
    />
  );

  const evidenceDetails = (
    <div>
      <h4 className="sub">Evidence &amp; triggers</h4>
      <p className="body">
        Every trigger event in the Nandi workflow, mapped to the evidence behind it, who published that evidence, and how
        anyone can check it.
      </p>
      <TriggerTable triggers={triggers} />
      <div className="note gap"><strong>Known gap:</strong> SCORE detects reuse of the fermentation technique only when a licence is executed or an attestation is filed. Informal adoption by a neighbouring farm stays invisible.</div>
      <div className="note"><strong>Weakest link:</strong> ripe-cherry quality rests on a single attestor. The CRE AA grade implicitly confirms it — that linkage should be made explicit, or the CRE grader added as a second attestor.</div>
    </div>
  );

  const contributionsTable = (
    <div>
      <h4 className="sub">Recorded contributions</h4>
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
    </div>
  );

  const contractsTable = (
    <div>
      <h4 className="sub">Contracts ({contracts.length})</h4>
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
    </div>
  );

  const VIEWS: Record<Audience, View> = {
    farmer: {
      kicker: "Passport · NANDI-AISHA-001",
      name: "Aisha Ng'etich",
      roleLine: "Smallholder Farmer · Kaptumo Cooperative Society Ltd. · Nandi County, Kenya",
      bio: "Three seasons of AA-grade main-crop deliveries to the Kaptumo wet mill, plus an anaerobic fermentation technique now licensed to two neighbouring cooperatives. What used to end at the cooperative gate is now a record she carries.",
      badges: ["3 seasons consistent AA", "NCE trigger public & independent", "2 derivative licences", "Verifiable borrower"],
      stats: [
        { label: "Received", value: ksh(totals.received), color: "#2A6A45" },
        { label: "Waiting", value: ksh(totals.pending), color: "#C4892A" },
        { label: "Contracts", value: String(contracts.length), color: ACCENT },
        { label: "Executions", value: String(contributions.length), color: "#1A1614" },
      ],
      donut: <ValueMixDonut settled={totals.received} pending={totals.pending} currency="KES" label="Tracked" />,
      bars: <ContractSparkBars contracts={contributionBars} currency="KES" />,
      barsLabel: "By contribution",
      quickRead: [
        { question: "What have I actually received?", answer: "Settled through M-PESA and confirmed by the counterparty.", value: ksh(totals.received), valueColor: "green" },
        { question: "What is still owed to me?", answer: "Triggered, evidenced, awaiting the cooperative's transfer.", value: ksh(totals.pending), valueColor: "amber" },
        { question: "How many seasons are on record?", answer: "Consecutive AA-grade main-crop deliveries.", value: String(seasons), valueColor: "blue" },
      ],
      details: (
        <>
          {evidenceDetails}
          {contributionsTable}
          {contractsTable}
          <DecayTable decay={decay} />
        </>
      ),
    },
    cooperative: {
      kicker: "Passport · KAPTUMO-COOP",
      name: "Kaptumo Farmers Cooperative Society Ltd.",
      roleLine: "Cooperative · Nandi County, Kenya",
      bio: "Aggregate view of how auction proceeds are apportioned across the membership. With every delivery, auction price and payout observable against the same record, distribution accuracy becomes checkable rather than asserted — a governance tool where it is right, and a fast signal where it is not.",
      badges: [
        `${coop?.member_count ?? "—"} members`,
        "2 derivative licences distributed",
        "Distribution auditable",
        `${seasons} seasons active`,
      ],
      stats: [
        { label: "Total distributed", value: ksh(totals.received), color: "#2A6A45" },
        { label: "Pending distribution", value: ksh(totals.pending), color: "#C4892A" },
        { label: "Active licences", value: "2", color: ACCENT },
        { label: "Members covered", value: String(coop?.member_count ?? "—"), color: "#1A1614" },
      ],
      donut: (
        <ValueMixDonut
          settled={62000}
          pending={14200}
          future={13800}
          currency="KES"
          label="Distribution"
          settledLabel="Primary pool"
          pendingLabel="Kabitet licence"
          futureLabel="Cheptebo licence"
        />
      ),
      bars: <ContractSparkBars contracts={licenceBars} currency="KES" />,
      barsLabel: "By licence",
      quickRead: [
        { question: "How much has reached members?", answer: "Distributed and confirmed against auction proceeds.", value: ksh(totals.received), valueColor: "green" },
        { question: "What is still to be apportioned?", answer: "Triggered but not yet transferred.", value: ksh(totals.pending), valueColor: "amber" },
        { question: "How auditable is the distribution?", answer: "Share of tracked triggers with strong-or-better evidence.", value: `${strongPct}%`, valueColor: "blue" },
      ],
      details: (
        <>
          <div>
            <h4 className="sub">Derivative licence roll-up</h4>
            <p className="body">Technique licences held by the cooperative's members, viewed as distribution across the membership rather than one farmer's line items.</p>
            <div className="scroll">
              <table>
                <thead><tr><th>Adopting cooperative</th><th>Licence executed</th><th>Rate this season</th><th>Members benefiting</th><th>Distribution status</th></tr></thead>
                <tbody>
                  <tr>
                    <td className="mono">Kabitet Cooperative Society</td>
                    <td className="mono">2023-04-14</td>
                    <td className="mono">3.0% of premium pool above floor</td>
                    <td className="mono">1 of {coop?.member_count ?? "—"}</td>
                    <td className="green">Distributed · M-PESA confirmed</td>
                  </tr>
                  <tr>
                    <td className="mono">Cheptebo Cooperative Society</td>
                    <td className="mono">2024-02-22</td>
                    <td className="mono">2.4% of premium pool above floor</td>
                    <td className="mono">1 of {coop?.member_count ?? "—"}</td>
                    <td className="amber">Awaiting adopter's NCE settlement</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="note">Each licence is capped at KES 5,000 per derivative per season and decays 20%/yr from execution, so no single member's derivative claim compounds against the pool.</div>
          </div>
          <div>
            <h4 className="sub">Governance framing</h4>
            <p className="body">
              With every delivery, auction price and payout observable against the same record, distribution accuracy is now
              checkable rather than asserted — a governance tool for managers who are getting it right, and a way to surface it
              quickly where they are not.
            </p>
            <p className="body" style={{ margin: 0 }}>
              That auditability is also a credit-profile benefit: lenders can assess the cooperative itself on demonstrated
              distribution accuracy, not just on collateral.
            </p>
            <div className="note gap"><strong>Illustrative aggregate, not a verified cooperative-wide figure.</strong> {coop?.note}</div>
          </div>
          {contractsTable}
          <DecayTable decay={decay} />
        </>
      ),
    },
    lender: {
      kicker: "Passport · CREDIT ASSESSMENT",
      name: "KCB / Equity Bank / SACCOs",
      roleLine: "Credit Assessment View · Nandi County, Kenya",
      bio: "What a lender would see before this existed: nothing verifiable — no delivery history, no income record, no way to check a claim against a third party. A repeated, third-party-checkable delivery record is the underwriting input that has been missing. It does not replace a credit decision — it gives one something to sit on.",
      badges: [`${seasons} seasons verified`, `${strongPct}% evidence strong or better`, `${gapTriggers.length} gap${gapTriggers.length === 1 ? "" : "s"} disclosed`],
      stats: [
        { label: "Verified income", value: ksh(totals.received), color: "#2A6A45" },
        { label: "Pending entitlement", value: ksh(totals.pending), color: "#C4892A" },
        { label: "Seasons verified", value: String(seasons), color: ACCENT },
        { label: "Evidence strong+", value: `${strongPct}%`, color: "#1A1614" },
      ],
      donut: (
        <ValueMixDonut
          settled={totals.received}
          pending={totals.pending}
          currency="KES"
          label="Borrower record"
          settledLabel="Verified income"
          pendingLabel="Collateral signal"
        />
      ),
      bars: <ContractSparkBars contracts={contributionBars} currency="KES" />,
      barsLabel: "By season delivery",
      quickRead: [
        { question: "Is there verified income?", answer: "Settled and independently checkable.", value: ksh(totals.received), valueColor: "green" },
        { question: "What supports repayment?", answer: "Entitlement visible before it pays out.", value: ksh(totals.pending), valueColor: "amber" },
        { question: "How reliable is the record?", answer: "Tracked triggers with strong-or-better evidence.", value: `${strongPct}%`, valueColor: "blue" },
      ],
      details: (
        <>
          <div>
            <h4 className="sub">Two lending relationships</h4>
            <p className="body">The same record supports two different loan books, assessed on different risk.</p>
            <div className="panel" style={{ marginBottom: 10 }}>
              <div className="kicker">1 · Individual farmer</div>
              <h4 className="sub" style={{ marginTop: 6 }}>Seasonal pre-harvest credit</h4>
              <p className="body" style={{ margin: 0 }}>
                Four-month term, balloon repayment timed to NCE settlement rather than a fixed monthly schedule. The pending
                entitlement already firing in the evidence data acts as the repayment trigger: when the cooperative settles, the
                loan clears. Exposure is bounded by an entitlement that is visible before it pays out.
              </p>
            </div>
            <div className="panel">
              <div className="kicker">2 · Cooperative</div>
              <h4 className="sub" style={{ marginTop: 6 }}>Institutional credit on distribution accuracy</h4>
              <p className="body" style={{ margin: 0 }}>
                The same confidence data a trader reads as compliance, a lender reads as risk. A cooperative whose individual
                distributions reconcile against auction proceeds season after season is a materially different borrower from one
                whose payout logic is unobservable — {strongPct}% of tracked triggers are strong or better, with {gapTriggers.length} open
                gap{gapTriggers.length === 1 ? "" : "s"} disclosed.
              </p>
            </div>
          </div>
          <div>
            <h4 className="sub">Precedent</h4>
            <div className="note">
              TechnoServe's <strong>Haiti Hope / Agripro</strong> programme lent against verified smallholder delivery records
              rather than land title or guarantors, and reported <strong>96% repayment</strong> with a <strong>2% loan loss
              rate</strong> — against a roughly <strong>9.4% sector average</strong> for comparable agricultural lending. The
              mechanism was the same: make the delivery relationship legible, and the credit risk changes shape. Cited as
              supporting evidence, not as a projection for this pilot.
            </div>
          </div>
          {contributionsTable}
          <div>
            <h4 className="sub">Evidence confidence</h4>
            <TriggerTable triggers={triggers} full={false} />
          </div>
        </>
      ),
    },
    trader: {
      kicker: "Passport · EUDR COMPLIANCE",
      name: "Ecom Kenya / Volcafe",
      roleLine: "EUDR Compliance View · Nandi County, Kenya",
      bio: "EUDR documentation assembled automatically from the same delivery records you already receive — instead of a manual audit at the end of the season. Nothing is smoothed over: gaps are surfaced rather than softened.",
      badges: [`${traceablePct}% traceability`, `${gapTriggers.length} gap${gapTriggers.length === 1 ? "" : "s"} disclosed`, `${seasons} seasons verified`],
      stats: [
        { label: "Traceable triggers", value: `${traceablePct}%`, color: "#2A6A45" },
        { label: "Strong or better", value: `${strongPct}%`, color: ACCENT },
        { label: "Tracked triggers", value: String(triggers.length), color: "#1A1614" },
        { label: "Open gaps", value: String(gapTriggers.length), color: gapTriggers.length ? "#8A2A20" : "#2A6A45" },
      ],
      donut: confidenceDonut,
      bars: <ContractSparkBars contracts={confidenceBars} currency="KES" />,
      barsLabel: "By trigger confidence",
      quickRead: [
        { question: "Can the chain be traced?", answer: "Share of triggers with independently checkable evidence.", value: `${traceablePct}%`, valueColor: "green" },
        { question: "How strong is that evidence?", answer: "Strong or very strong against a published source.", value: `${strongPct}%`, valueColor: "blue" },
        { question: "What cannot be claimed?", answer: "Open gaps disclosed in the compliance file.", value: String(gapTriggers.length), valueColor: "amber" },
      ],
      details: (
        <>
          <div>
            <h4 className="sub">What this delivers for your compliance file</h4>
            <p className="body">
              EUDR documentation assembled automatically from the same delivery records you already receive — instead of a manual
              audit at the end of the season.
            </p>
            <TriggerTable triggers={triggers} full={false} />
          </div>
          <div>
            <h4 className="sub">Stated plainly: the gap</h4>
            {gapTriggers.length === 0 ? (
              <div className="note">No open gaps recorded this season.</div>
            ) : (
              gapTriggers.map((t) => (
                <div className="panel" key={t.id} style={{ marginBottom: 10 }}>
                  <h4 className="sub">{t.trigger_name} {statusPill(t.status)}</h4>
                  <p className="body" style={{ margin: 0 }}>{t.evidence}</p>
                  <p className="body" style={{ margin: "6px 0 0" }}><strong>Source:</strong> {t.source} · <strong>Check:</strong> {t.verification_method}</p>
                </div>
              ))
            )}
            <div className="note gap"><strong>Known gap:</strong> informal reuse of the fermentation technique is only detected when a licence is executed or an attestation is filed.</div>
          </div>
          <div>
            <h4 className="sub">Cooperative you would be filing for</h4>
            <div className="note gap"><strong>Illustrative aggregate, not a verified cooperative-wide figure.</strong> {coop?.note}</div>
          </div>
        </>
      ),
    },
    brand: {
      kicker: "Passport · ESG DATA",
      name: "Nestlé / JDE / Starbucks",
      roleLine: "ESG Data View · Nandi County, Kenya",
      bio: "Anonymised, aggregate attribution statistics for CSRD/ESRS reporting — individual-level supply chain impact, without individual identities. No farmer names, no payout amounts, no counterparty terms.",
      badges: [`${seasons} seasons verified`, "Replaces $50K–$200K consultant reporting", `${traceablePct}% traceability coverage`],
      stats: [
        { label: "Traceable triggers", value: `${traceablePct}%`, color: "#2A6A45" },
        { label: "Strong or better", value: `${strongPct}%`, color: ACCENT },
        { label: "Tracked triggers", value: String(triggers.length), color: "#1A1614" },
        { label: "Open gaps", value: String(gapTriggers.length), color: gapTriggers.length ? "#8A2A20" : "#2A6A45" },
      ],
      donut: confidenceDonut,
      bars: <ContractSparkBars contracts={confidenceBars} currency="KES" />,
      barsLabel: "By attribution claim",
      quickRead: [
        { question: "How much of the chain is covered?", answer: "Traceability coverage across tracked triggers.", value: `${traceablePct}%`, valueColor: "green" },
        { question: "How defensible is a disclosure?", answer: "Claims with strong-or-better evidence.", value: `${strongPct}%`, valueColor: "blue" },
        { question: "What must be disclosed as limitation?", answer: "Claims not independently detectable.", value: String(gapTriggers.length), valueColor: "amber" },
      ],
      details: (
        <>
          <div>
            <h4 className="sub">Attribution quality, aggregated</h4>
            <p className="body">The evidence strength profile behind every claim you would carry into an ESG disclosure.</p>
            <div className="scroll">
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
          </div>
          <div>
            <h4 className="sub">Cost comparison</h4>
            <div className="note">
              Equivalent manual reporting currently costs brands <strong>$50,000–$200,000</strong> per supply chain
              sustainability report via consultants. SCORE generates the same attribution evidence continuously, as a by-product
              of the record itself.
            </div>
          </div>
        </>
      ),
    },
    development_actor: {
      kicker: "Passport · VALIDATION",
      name: "IFC / FAO / Nandi County Government",
      roleLine: "Validation View · Nandi County, Kenya",
      bio: "A 2013 European Commission study found farmers delivering through cooperatives received roughly 19.5% of the Nairobi Coffee Exchange auction price (2010 figures), before labour and inputs. The Coffee Act 2025 and its Direct Settlement System closed the exchange-to-cooperative gap — not the cooperative-to-individual one. SCORE starts where the Direct Settlement System ends.",
      badges: ["19.5% → 80%+ farmer share (2010–2025)", "Coffee Act 2025 aligned", "NCCU-integrated"],
      stats: [
        { label: "Confidence strong+", value: `${strongPct}%`, color: "#2A6A45" },
        { label: "Open gaps", value: String(gapTriggers.length), color: gapTriggers.length ? "#8A2A20" : "#2A6A45" },
        { label: "Cooperatives in NCCU", value: "100+", color: ACCENT },
        { label: "Farmer share today", value: "~80%", color: "#1A1614" },
      ],
      donut: confidenceDonut,
      bars: <ContractSparkBars contracts={confidenceBars} currency="KES" />,
      barsLabel: "By trigger confidence",
      quickRead: [
        { question: "Does the record hold up?", answer: "Tracked triggers with strong-or-better evidence.", value: `${strongPct}%`, valueColor: "green" },
        { question: "What is still unobservable?", answer: "Gaps disclosed rather than smoothed over.", value: String(gapTriggers.length), valueColor: "amber" },
        { question: "What existing structure does it use?", answer: "Nandi Coffee Cooperative Union member cooperatives.", value: "100+", valueColor: "blue" },
      ],
      details: (
        <>
          <div>
            <h4 className="sub">Why this gap persists</h4>
            <p className="body">
              A 2013 European Commission study of the Kenyan coffee value chain found that farmers delivering through
              cooperatives received roughly <strong>19.5% of the Nairobi Coffee Exchange auction price</strong> (2010 figures) —
              and that is before labour and input costs are deducted. The loss is not primarily at the border or the roaster; it
              happens between the auction and the individual farmer, inside the intermediary layer, where nothing is
              independently observable.
            </p>
          </div>
          <div>
            <h4 className="sub">What Kenyan law already changed, and what it didn't</h4>
            <p className="body">
              The <strong>Coffee Act 2025</strong> caps cooperative deductions at 10% and establishes the{" "}
              <strong>Direct Settlement System</strong>, routing NCE auction proceeds directly to cooperatives through the
              Cooperative Bank of Kenya rather than through marketing agents.
            </p>
            <p className="body" style={{ margin: 0 }}>
              That closes the exchange-to-cooperative gap. It does not close the cooperative-to-individual gap: once money lands
              in the cooperative account, apportionment to each farmer remains unobservable.{" "}
              <strong>SCORE starts where the Direct Settlement System ends.</strong>
            </p>
          </div>
          <div>
            <h4 className="sub">Existing infrastructure to integrate with, not duplicate</h4>
            <p className="body" style={{ margin: 0 }}>
              The <strong>Nandi Coffee Cooperative Union (NCCU)</strong> was formed at county level and has grown from 18 to over
              100 member cooperatives. It is already mapping and registering farmers. SCORE is a record layer on top of that
              registration work — not a parallel registry, and not a replacement for the union's convening role.
            </p>
          </div>
          <div>
            <h4 className="sub">What this is, in three analogies</h4>
            <ul className="bullets">
              <li><strong>GitHub</strong> — a portable contribution record that follows the contributor, not the employer.</li>
              <li><strong>Land Registry</strong> — records entitlement; it does not buy or sell the land.</li>
              <li><strong>Credit Bureau</strong> — records creditworthiness; it does not issue the loan.</li>
            </ul>
          </div>
          <div>
            <h4 className="sub">Where this sits relative to certification</h4>
            <p className="body" style={{ margin: 0 }}>
              Fairtrade, UTZ and Rainforest Alliance audit at the cooperative governance layer: they verify that an organisation
              has acceptable policies, premiums and practices. SCORE operates one layer below that, at the individual
              transaction — this delivery, this grade, this auction price, this payout. A certified cooperative can still
              distribute opaquely; a SCORE record shows whether it did. The two are complementary, not competing, and
              certification bodies are a plausible consumer of the record rather than a competitor to it.
            </p>
          </div>
          <div>
            <h4 className="sub">Verified trigger coverage</h4>
            <TriggerTable triggers={triggers} full={false} />
            <div className="note gap"><strong>Known gap:</strong> reuse of the fermentation technique is detected only when a licence is executed or an attestation is filed. Informal adoption by a neighbouring farm stays invisible.</div>
          </div>
        </>
      ),
    },
  };

  const isMethodology = audience === "methodology";

  const tabsNav = (
    <nav className="tabs" aria-label="Audience view">
      {profiles.map((p) => (
        <Link key={p.key} to={`/nandi/${p.key}`} className="tab" data-active={p.key === active}>
          <div className="tl">{p.label}</div>
          <div className="tt">{p.tagline}</div>
        </Link>
      ))}
      <span className="tabdiv" aria-hidden="true" />
      <Link to="/nandi/methodology" className="tab meta" data-active={isMethodology}>
        <div className="tl">Methodology</div>
        <div className="tt">About this sandbox</div>
      </Link>
    </nav>
  );

  if (isMethodology) {
    return (
      <div className="nandi">
        <style>{CSS}</style>
        <main className="wrap">
          <Link to="/" className="back">← SCORE Passport</Link>
          <div className="banner">
            Meta page · what in this sandbox is sourced, what is placeholder, and what is still unanswered.
          </div>
          {tabsNav}
          <NandiMethodologyView />
          <footer>
            <span>SCORE Contribution Ledger · Nandi Sandbox · Methodology</span>
            <span style={{ color: "var(--accent)" }}>SCORE tracks and verifies value. Contracts and payments remain with their respective systems.</span>
          </footer>
        </main>
      </div>
    );
  }

  if (!active) return <Navigate to="/nandi/farmer" replace />;

  const view = VIEWS[active];

  return (
    <div className="nandi">
      <style>{CSS}</style>
      <main className="wrap">
        <Link to="/" className="back">← SCORE Passport</Link>
        <div className="banner">
          Sandbox · Aisha Ng'etich · Kaptumo Cooperative · Nandi County, Kenya — demonstration data, not a live record.
        </div>

        {tabsNav}

        {loading ? (
          <div className="panel">Loading sandbox data…</div>
        ) : (
          <>
            {/* 1 · HEADER */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontFamily: FONT_MONO, fontSize: 9, color: ACCENT, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                {view.kicker}
              </div>
              <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: 28, fontWeight: 600, margin: "6px 0 4px", color: "#1A1614" }}>
                {view.name}
              </h1>
              <div style={{ fontSize: 13, color: "#5C5248" }}>{view.roleLine}</div>
              <div
                style={{
                  marginTop: 14,
                  border: "1px solid rgba(26,22,14,0.10)",
                  borderLeft: `3px solid ${ACCENT}`,
                  borderRadius: 5,
                  background: "#FDFAF4",
                  padding: "14px 16px",
                  fontSize: 13,
                  lineHeight: 1.7,
                  color: "#1A1614",
                }}
              >
                {view.bio}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 12 }}>
                  {view.badges.map((b) => (
                    <span
                      key={b}
                      style={{
                        fontFamily: FONT_MONO, fontSize: 9, color: ACCENT,
                        background: "rgba(92,122,58,0.08)", border: `1px solid ${ACCENT}33`,
                        borderRadius: 3, padding: "3px 8px",
                      }}
                    >
                      {b}
                    </span>
                  ))}
                </div>
              </div>

              {active === "farmer" && (
                <div style={{ marginTop: 14 }}>
                  <div style={{ fontFamily: FONT_MONO, fontSize: 9, color: "#9A8F84", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
                    What you did
                  </div>
                  <ul style={{ margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 4 }}>
                    {CONTRIBUTION_BULLETS.map((b) => (
                      <li key={b} style={{ fontSize: 13, color: "#1A1614", lineHeight: 1.6 }}>{b}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* 2 · STAT CARDS */}
            <div style={{ fontFamily: FONT_MONO, fontSize: 9, color: "#9A8F84", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
              {active === "farmer" ? "Your value in this project" : "What this view measures"}
            </div>
            <StatCards stats={view.stats} />

            {/* Pricing — folded in directly below the stat cards */}
            {activePricing && (
              <div
                className="panel"
                style={{
                  marginBottom: 24,
                  ...(paidAudience ? { borderColor: "rgba(92,122,58,.25)", background: "rgba(92,122,58,.08)" } : {}),
                }}
              >
                <div style={{ fontFamily: FONT_DISPLAY, fontSize: 16, fontWeight: 600, color: "#1A1614" }}>
                  {paidAudience ? "Commercial model — this is the paying stakeholder" : "Indicative access model"}
                </div>
                <div className="kicker" style={{ margin: "4px 0 10px" }}>
                  {active === "development_actor"
                    ? "Validation, not a funding ask. No commercial relationship implied."
                    : "Illustrative — for pilot conversation only. Not live billing."}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { l: "Who pays", v: activePricing.payer, c: "#1A1614" },
                    { l: "Indicative rate", v: activePricing.indicative_rate, c: ACCENT },
                    { l: "Basis", v: activePricing.basis ?? "—", c: "#1A1614" },
                  ].map((s) => (
                    <div key={s.l} className="panel">
                      <div style={{ fontFamily: FONT_MONO, fontSize: 9, color: "#9A8F84", textTransform: "uppercase", letterSpacing: "0.06em" }}>{s.l}</div>
                      <div style={{ fontFamily: FONT_MONO, fontSize: paidAudience && s.c === ACCENT ? 15 : 13, color: s.c, marginTop: 4 }}>{s.v}</div>
                    </div>
                  ))}
                </div>
                {activePricing.note && <div className="note">{activePricing.note}</div>}
              </div>
            )}

            {/* 3 · DONUT + BARS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5" style={{ marginBottom: 28 }}>
              <div className="panel">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <span style={{ fontFamily: FONT_MONO, fontSize: 9, color: "#9A8F84", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    {active === "trader" || active === "brand" || active === "development_actor" ? "Confidence mix" : "Value mix"}
                  </span>
                  <span style={{ fontFamily: FONT_MONO, fontSize: 9, color: "#2A5C8A", background: "rgba(42,92,138,0.08)", padding: "2px 6px", borderRadius: 3 }}>At a glance</span>
                </div>
                {view.donut}
              </div>
              <div className="panel">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <span style={{ fontFamily: FONT_MONO, fontSize: 9, color: "#9A8F84", textTransform: "uppercase", letterSpacing: "0.06em" }}>{view.barsLabel}</span>
                  <span style={{ fontFamily: FONT_MONO, fontSize: 9, color: "#2A6A45", background: "rgba(42,106,69,0.08)", padding: "2px 6px", borderRadius: 3 }}>
                    {triggers.length || contributions.length} tracked
                  </span>
                </div>
                {view.bars}
              </div>
            </div>

            {/* 4 · WHAT CHANGED + CONFIRMATIONS */}
            <h3 className="sec">What changed</h3>
            <div className="panel" style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
                <div>
                  <div style={{ fontFamily: FONT_MONO, fontSize: 9, color: "#9A8F84", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    Contribution confidence
                  </div>
                  <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: "#1A1614", marginTop: 4 }}>
                    {confirmedTotal} of {allConfs.length} parties confirmed
                    {pendingTotal > 0 && <span style={{ color: "#9A8F84" }}> · {pendingTotal} pending</span>}
                  </div>
                </div>
                <div style={{ fontFamily: FONT_DISPLAY, fontSize: 26, fontWeight: 700, color: "#2A6A45" }}>{confidencePct}%</div>
              </div>
              <div style={{ marginTop: 10, height: 6, borderRadius: 3, background: "rgba(26,22,14,0.06)", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${confidencePct}%`, background: "#2A6A45" }} />
              </div>
              <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: "#5C5248", marginTop: 8, lineHeight: 1.5 }}>
                Not just claimed — confirmed by people who would know.
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[3fr_2fr] gap-3.5" style={{ marginBottom: 28 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {EVENTS.map((e) => (
                  <div key={e.headline}>
                    <ValueEventCard
                      amount={e.amount}
                      currency={e.currency}
                      headline={e.headline}
                      subheadline={e.subheadline}
                      status={e.status}
                      confidence={e.confidence}
                      trigger={e.trigger}
                      resolver={e.resolver}
                      evidence_count={e.evidence_count}
                      expected_resolution={e.expected_resolution}
                      proofPack={e.proofPack}
                      confirmations={e.confirmations.map((c) => ({ name: c.name, role: c.org }))}
                    />
                    <EventConfirmations confirmations={e.confirmations} />
                  </div>
                ))}
              </div>
              <QuickReadPanel rows={view.quickRead} />
            </div>

            {/* 5 · VALUE STREAMS + MILESTONE ARC */}
            <h3 className="sec" style={{ fontSize: 18 }}>Where value comes from</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5" style={{ marginBottom: 28, alignItems: "start" }}>
              <div className="panel" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {VALUE_STREAMS.map((s) => (
                  <div key={s.name}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
                      <div style={{ fontFamily: FONT_BODY, fontSize: 13, fontWeight: 600, color: "#1A1614" }}>{s.name}</div>
                      <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: "#1A1614", whiteSpace: "nowrap" }}>{s.value}</div>
                    </div>
                    <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: "#5C5248", marginTop: 4, lineHeight: 1.6 }}>{s.description}</div>
                  </div>
                ))}
              </div>
              <div>
                <div style={{ fontFamily: FONT_MONO, fontSize: 9, color: "#9A8F84", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Milestone arc</div>
                <MilestoneArc milestones={MILESTONES} />
              </div>
            </div>

            {/* 6 · EXPANDABLE DETAILS */}
            <details style={{ marginTop: 8, border: "1px solid rgba(26,22,14,0.10)", borderRadius: 6, background: "#FDFAF4" }}>
              <summary
                style={{
                  cursor: "pointer", listStyle: "none", padding: "14px 16px",
                  display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, userSelect: "none",
                }}
              >
                <div>
                  <div style={{ fontFamily: FONT_DISPLAY, fontSize: 16, fontWeight: 600, color: "#1A1614" }}>View details</div>
                  <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: "#5C5248", marginTop: 2 }}>
                    {activeProfile?.description ?? "Supporting evidence and the detail behind this view."}
                  </div>
                </div>
                <span style={{ fontFamily: FONT_MONO, fontSize: 10, color: ACCENT, background: "rgba(0,0,0,0.03)", padding: "4px 8px", borderRadius: 3, whiteSpace: "nowrap" }}>
                  Expand ↓
                </span>
              </summary>
              <div style={{ padding: "0 16px 16px", display: "flex", flexDirection: "column", gap: 20 }}>
                {view.details}
              </div>
            </details>
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

export default NandiSandbox;