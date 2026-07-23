import { Helmet } from "react-helmet-async";
import { useDemo } from "@/contexts/DemoContext";
import { Navigate } from "react-router-dom";

const FONT_DISPLAY = "'Playfair Display',Georgia,serif";
const FONT_BODY = "'DM Sans',system-ui,sans-serif";
const FONT_MONO = "'DM Mono',ui-monospace,monospace";
const INK = "#1A1614";
const MUTED = "#5C5248";
const FAINT = "#9A8F84";
const BORDER = "rgba(26,22,14,0.10)";
const PANEL = "#FDFAF4";

type Strength = "Very strong" | "Strong" | "Moderate" | "Gap";
type Status = "FIRED" | "CONFIRMED" | "PENDING" | "ASSERTED" | "NOT DETECTED";

type Trigger = {
  id: number;
  title: string;
  status: Status;
  statusDetail?: string;
  evidence: string;
  source: string;
  verification: string;
  strength: Strength;
  strengthDetail: string;
  value?: string;
  note?: string;
};

const TRIGGERS: Trigger[] = [
  {
    id: 1,
    title: "NCE auction price > floor",
    status: "FIRED",
    statusDetail: "Week 18 · 2024",
    evidence: "NCE public auction result",
    source: "nce.co.ke · weekly publication",
    verification: "Any party · no login required",
    strength: "Very strong",
    strengthDetail: "Independent · public fact",
    value: "KES 62,000 entitlement calculated",
  },
  {
    id: 2,
    title: "CRE grade AA assigned",
    status: "CONFIRMED",
    evidence: "CRE grade certificate · Lot KMT-2024-007",
    source: "Kenya Coffee Research and Extension Directorate · official",
    verification: "CRE lot register · third-party issuer",
    strength: "Strong",
    strengthDetail: "Third-party verified",
    value: "Quality grade factor 1.0 applied to apportionment formula",
  },
  {
    id: 3,
    title: "Delivery logged at wet mill",
    status: "CONFIRMED",
    evidence: "QR scan · SHA-256 fingerprint",
    source: "Kaptumo wet mill operator",
    verification: "Hash immutable · RFC 3161 timestamp · Polygon anchor",
    strength: "Strong",
    strengthDetail: "Automated · tamper-evident",
    value: "2,780 kg contribution record created",
  },
  {
    id: 4,
    title: "Ripe cherry assessment",
    status: "ASSERTED",
    statusDetail: "Single attestor",
    evidence: "Mill operator visual assessment at delivery",
    source: "Kaptumo mill operator",
    verification: "Single attestor only · not independently confirmed",
    strength: "Moderate",
    strengthDetail: "Weakest point in the chain",
    note: "CRE AA grade implicitly confirms quality — linkage should be explicit. Recommended: add CRE grader as second attestor for cherry quality assessment.",
  },
  {
    id: 5,
    title: "Licence execution · Kabitet",
    status: "CONFIRMED",
    statusDetail: "Settled",
    evidence: "Licence agreement signed + derivative record sha256: 4f7a1c… linked to origin 9b4e2a1c…",
    source: "Bilateral agreement · on-chain record",
    verification: "On-chain link · independently verifiable",
    strength: "Strong",
    strengthDetail: "On-chain · bilateral",
    value: "KES 14,200 royalty triggered",
  },
  {
    id: 6,
    title: "Licence execution · Cheptebo",
    status: "CONFIRMED",
    statusDetail: "Pending",
    evidence: "Licence agreement signed + derivative record sha256: 8c2e5b… linked to origin 9b4e2a1c…",
    source: "Bilateral agreement · on-chain record",
    verification: "On-chain link · independently verifiable",
    strength: "Strong",
    strengthDetail: "On-chain · bilateral",
    value: "KES 13,800 royalty pending",
  },
  {
    id: 7,
    title: "M-Pesa settlement confirmed",
    status: "CONFIRMED",
    statusDetail: "Seasons 2022, 2023",
    evidence: "M-PESA transaction IDs",
    source: "Safaricom · independent payment confirmation",
    verification: "Safaricom transaction registry · any party can verify with transaction ID",
    strength: "Very strong",
    strengthDetail: "Independent financial institution",
    value: "KES 126,000 settlement history confirmed (KES 58K + KES 68K)",
  },
  {
    id: 8,
    title: "Informal technique adoption",
    status: "NOT DETECTED",
    evidence: "None — no licence executed",
    source: "Would require attestation or downstream quality signal",
    verification: "Cannot be automated without a digital touchpoint",
    strength: "Gap",
    strengthDetail: "Requires either licence execution or attestation flow",
    note: "This is the 'embedded tacit knowledge' problem Prasanna identified. SCORE detects reuse only when a licence is executed or an attestation is filed. Informal adoption is invisible.",
  },
];

const strengthColor = (s: Strength) => {
  if (s === "Very strong") return { fg: "#1F5A38", bg: "rgba(42,106,69,0.10)", border: "rgba(42,106,69,0.35)" };
  if (s === "Strong") return { fg: "#2A6A45", bg: "rgba(42,106,69,0.08)", border: "rgba(196,137,42,0.30)" };
  if (s === "Moderate") return { fg: "#8A5F14", bg: "rgba(196,137,42,0.10)", border: "rgba(196,137,42,0.35)" };
  return { fg: "#8A2A20", bg: "rgba(138,42,32,0.08)", border: "rgba(138,42,32,0.30)" };
};

const statusColor = (s: Status) => {
  if (s === "FIRED") return { fg: "#8A5F14", bg: "rgba(196,137,42,0.14)" };
  if (s === "CONFIRMED") return { fg: "#1F5A38", bg: "rgba(42,106,69,0.12)" };
  if (s === "PENDING") return { fg: "#8A5F14", bg: "rgba(196,137,42,0.12)" };
  if (s === "ASSERTED") return { fg: "#5C5248", bg: "rgba(26,22,14,0.06)" };
  return { fg: "#8A2A20", bg: "rgba(138,42,32,0.08)" };
};

const Row = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 12, padding: "8px 0", borderTop: `1px solid ${BORDER}` }}>
    <div style={{ fontFamily: FONT_MONO, fontSize: 9, color: FAINT, textTransform: "uppercase", letterSpacing: "0.08em", paddingTop: 2 }}>
      {label}
    </div>
    <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: INK, lineHeight: 1.55, wordBreak: "break-word" }}>{value}</div>
  </div>
);

const EvidenceTriggers = () => {
  const { activeDemo } = useDemo();
  if (activeDemo !== "agri") {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div style={{ padding: "24px 24px 48px", maxWidth: 960, margin: "0 auto", fontFamily: FONT_BODY, color: INK }}>
      <Helmet>
        <title>Evidence & Triggers · Nandi sandbox</title>
        <meta name="description" content="Every trigger event in Aisha's workflow mapped to its evidence, source, and verification method." />
      </Helmet>

      <header style={{ marginBottom: 20 }}>
        <div style={{ fontFamily: FONT_MONO, fontSize: 9, color: FAINT, textTransform: "uppercase", letterSpacing: "0.08em" }}>
          Nandi sandbox
        </div>
        <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: 26, fontWeight: 600, margin: "4px 0 6px" }}>
          Evidence &amp; Triggers
        </h1>
        <p style={{ margin: 0, fontSize: 13, color: MUTED, maxWidth: 640, lineHeight: 1.6 }}>
          Every trigger in Aisha Ng'etich's workflow, mapped to the evidence backing it, the named source, and how anyone
          can verify it. Strength ratings show how independent each signal is.
        </p>
      </header>

      {/* Legend */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
          marginBottom: 20,
          padding: "10px 12px",
          background: PANEL,
          border: `1px solid ${BORDER}`,
          borderRadius: 6,
        }}
      >
        <span style={{ fontFamily: FONT_MONO, fontSize: 9, color: FAINT, alignSelf: "center", marginRight: 4 }}>
          Strength
        </span>
        {(["Very strong", "Strong", "Moderate", "Gap"] as Strength[]).map((s) => {
          const c = strengthColor(s);
          return (
            <span
              key={s}
              style={{
                fontFamily: FONT_MONO,
                fontSize: 10,
                color: c.fg,
                background: c.bg,
                border: `1px solid ${c.border}`,
                padding: "3px 8px",
                borderRadius: 3,
              }}
            >
              {s}
            </span>
          );
        })}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {TRIGGERS.map((t) => {
          const sc = statusColor(t.status);
          const strC = strengthColor(t.strength);
          return (
            <article
              key={t.id}
              style={{
                background: PANEL,
                border: `1px solid ${BORDER}`,
                borderLeft: `3px solid ${strC.border.replace(/[\d.]+\)$/, "0.75)")}`,
                borderRadius: 6,
                padding: "16px 18px",
              }}
            >
              <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 10, alignItems: "baseline", marginBottom: 6 }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 10, minWidth: 0 }}>
                  <span style={{ fontFamily: FONT_MONO, fontSize: 10, color: FAINT }}>#{String(t.id).padStart(2, "0")}</span>
                  <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 17, fontWeight: 600, margin: 0, color: INK }}>{t.title}</h2>
                </div>
                <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                  <span
                    style={{
                      fontFamily: FONT_MONO,
                      fontSize: 9,
                      color: sc.fg,
                      background: sc.bg,
                      padding: "3px 7px",
                      borderRadius: 3,
                      letterSpacing: "0.06em",
                    }}
                  >
                    {t.status}
                  </span>
                  {t.statusDetail && (
                    <span style={{ fontFamily: FONT_MONO, fontSize: 9, color: FAINT }}>· {t.statusDetail}</span>
                  )}
                </div>
              </div>

              <Row label="Evidence" value={t.evidence} />
              <Row label="Source" value={t.source} />
              <Row label="Verification" value={t.verification} />
              <Row
                label="Strength"
                value={
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span
                      style={{
                        fontFamily: FONT_MONO,
                        fontSize: 10,
                        color: strC.fg,
                        background: strC.bg,
                        border: `1px solid ${strC.border}`,
                        padding: "2px 7px",
                        borderRadius: 3,
                      }}
                    >
                      {t.strength}
                    </span>
                    <span style={{ fontSize: 12, color: MUTED }}>{t.strengthDetail}</span>
                  </span>
                }
              />
              {t.value && <Row label="Value" value={<span style={{ color: INK }}>{t.value}</span>} />}
              {t.note && (
                <div
                  style={{
                    marginTop: 10,
                    padding: "10px 12px",
                    background: t.strength === "Gap" ? "rgba(138,42,32,0.05)" : "rgba(196,137,42,0.06)",
                    border: `1px dashed ${t.strength === "Gap" ? "rgba(138,42,32,0.30)" : "rgba(196,137,42,0.35)"}`,
                    borderRadius: 4,
                    fontSize: 12,
                    color: MUTED,
                    lineHeight: 1.55,
                  }}
                >
                  <span style={{ fontFamily: FONT_MONO, fontSize: 9, color: FAINT, textTransform: "uppercase", letterSpacing: "0.08em", marginRight: 6 }}>
                    Note
                  </span>
                  {t.note}
                </div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
};

export default EvidenceTriggers;