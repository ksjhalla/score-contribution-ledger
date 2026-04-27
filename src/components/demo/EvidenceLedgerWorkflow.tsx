import type { EvidenceMapping } from "@/data/demoProfiles";
import { formatDemoAmount } from "@/data/demoProfiles";
import { Activity, Smartphone, Gauge, FileText, Building2, ArrowRight } from "lucide-react";

const FONT_DISPLAY = "'Playfair Display',Georgia,serif";
const FONT_BODY = "'DM Sans',system-ui,sans-serif";
const FONT_MONO = "'DM Mono',ui-monospace,monospace";

const BUCKET_COLOR: Record<EvidenceMapping["ledger"]["bucket"], string> = {
  Paid: "#2A6A45",
  Pending: "#C4892A",
  Contract: "#2A5C8A",
};

const STATUS_COLOR: Record<EvidenceMapping["status"], string> = {
  Reconciled: "#2A6A45",
  "Awaiting sign-off": "#C4892A",
  Watching: "#2A5C8A",
};

const evidenceIcon = (type: EvidenceMapping["evidence"]["type"]) => {
  if (type === "kWh audit") return Activity;
  if (type === "Mobile-money collection") return Smartphone;
  if (type === "Uptime audit") return Gauge;
  if (type === "Annual financials") return FileText;
  return Building2;
};

export const EvidenceLedgerWorkflow = ({
  mappings,
  accent,
}: {
  mappings: EvidenceMapping[];
  accent: string;
}) => {
  const counts = mappings.reduce(
    (acc, m) => {
      acc[m.ledger.bucket] = (acc[m.ledger.bucket] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  return (
    <section style={{ marginBottom: 28, fontFamily: FONT_BODY }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
        <h3
          style={{
            fontFamily: FONT_DISPLAY,
            fontSize: 20,
            fontWeight: 600,
            margin: 0,
            color: "#1A1614",
          }}
        >
          Evidence → Ledger
        </h3>
        <span
          style={{
            fontFamily: FONT_MONO,
            fontSize: 9,
            color: accent,
            background: "rgba(0,0,0,0.03)",
            padding: "2px 6px",
            borderRadius: 3,
          }}
        >
          {mappings.length} mappings · {counts.Paid ?? 0} paid · {counts.Pending ?? 0} pending · {counts.Contract ?? 0} contract
        </span>
      </div>
      <p style={{ fontSize: 12, color: "#5C5248", margin: "0 0 14px", maxWidth: 720, lineHeight: 1.6 }}>
        How audited kWh sales and mobile-money collection logs flow into Sunlite's contribution ledger. Each piece of
        evidence is traced to one ledger entry and the rule that gates it.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {mappings.map((m, i) => {
          const Icon = evidenceIcon(m.evidence.type);
          const bucketColor = BUCKET_COLOR[m.ledger.bucket];
          const statusColor = STATUS_COLOR[m.status];
          return (
            <div
              key={`${m.evidence.title}-${i}`}
              style={{
                border: "1px solid rgba(26,22,14,0.10)",
                borderRadius: 6,
                background: "#FDFAF4",
                padding: "14px 16px",
                display: "grid",
                gridTemplateColumns: "minmax(0,1fr) auto minmax(0,1fr)",
                gap: 14,
                alignItems: "stretch",
              }}
              className="ev-ledger-row"
            >
              {/* Evidence side */}
              <div style={{ minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <Icon size={14} color={accent} style={{ flexShrink: 0 }} />
                  <span
                    style={{
                      fontFamily: FONT_MONO,
                      fontSize: 9,
                      color: "#9A8F84",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                    }}
                  >
                    Evidence · {m.evidence.type}
                  </span>
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#1A1614", marginBottom: 2 }}>
                  {m.evidence.title}
                </div>
                <div style={{ fontSize: 12, color: "#5C5248", lineHeight: 1.55 }}>
                  {m.evidence.metric}
                </div>
                <div style={{ fontSize: 11, color: "#9A8F84", marginTop: 4 }}>
                  {m.evidence.source} · {m.evidence.period}
                </div>
                {m.evidence.fingerprint && (
                  <div style={{ fontFamily: FONT_MONO, fontSize: 9, color: "#9A8F84", marginTop: 4, wordBreak: "break-all" }}>
                    {m.evidence.fingerprint}
                  </div>
                )}
              </div>

              {/* Arrow + rule */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  minWidth: 120,
                  maxWidth: 180,
                  gap: 6,
                }}
                className="ev-ledger-mid"
              >
                <ArrowRight size={16} color={accent} />
                <div
                  style={{
                    fontFamily: FONT_BODY,
                    fontSize: 10,
                    color: "#5C5248",
                    textAlign: "center",
                    lineHeight: 1.5,
                    fontStyle: "italic",
                  }}
                >
                  {m.rule}
                </div>
                <span
                  style={{
                    fontFamily: FONT_MONO,
                    fontSize: 8,
                    color: statusColor,
                    background: `${statusColor}14`,
                    border: `1px solid ${statusColor}33`,
                    padding: "2px 6px",
                    borderRadius: 3,
                    whiteSpace: "nowrap",
                  }}
                >
                  {m.status}
                </span>
              </div>

              {/* Ledger side */}
              <div style={{ minWidth: 0, borderLeft: `3px solid ${bucketColor}`, paddingLeft: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8, marginBottom: 6 }}>
                  <span
                    style={{
                      fontFamily: FONT_MONO,
                      fontSize: 9,
                      color: bucketColor,
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                    }}
                  >
                    Ledger · {m.ledger.bucket}
                  </span>
                  <span style={{ fontFamily: FONT_MONO, fontSize: 13, color: bucketColor, whiteSpace: "nowrap" }}>
                    {formatDemoAmount(m.ledger.amount, m.ledger.currency)}
                  </span>
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#1A1614", marginBottom: 2 }}>
                  {m.ledger.entry}
                </div>
                <div style={{ fontSize: 11, color: "#5C5248", lineHeight: 1.55 }}>
                  {m.ledger.contract}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <style>{`
        @media (max-width: 720px) {
          .ev-ledger-row {
            grid-template-columns: 1fr !important;
          }
          .ev-ledger-mid {
            max-width: none !important;
            flex-direction: row !important;
            justify-content: flex-start !important;
            text-align: left !important;
          }
        }
      `}</style>
    </section>
  );
};