import { useState } from "react";

const FONT_DISPLAY = "'Playfair Display',Georgia,serif";
const FONT_BODY = "'DM Sans',system-ui,sans-serif";
const FONT_MONO = "'DM Mono',ui-monospace,monospace";

export type ValueEventStatus = "Resolved" | "Under review" | "Watching" | "Pending";
export type ValueEventConfidence = "High" | "Medium" | "Low";

export type ValueEventCardProps = {
  amount: number | null;
  currency: string;
  headline: string;
  subheadline: string;
  status: ValueEventStatus;
  confidence: ValueEventConfidence | null;
  trigger?: string | null;
  resolver?: string | null;
  evidence_count?: number;
  expected_resolution?: string | null;
  attestationEnabled?: boolean;
  onAddEvidence?: () => void;
  onRequestConfirmation?: () => void;
  onViewDetails?: () => void;
};

const amountColor: Record<ValueEventStatus, string> = {
  Resolved: "#2A6A45",
  "Under review": "#C4892A",
  Pending: "#C4892A",
  Watching: "#2A5C8A",
};

const statusChip: Record<ValueEventStatus, { bg: string; fg: string }> = {
  Resolved: { bg: "rgba(42,106,69,0.10)", fg: "#2A6A45" },
  "Under review": { bg: "rgba(196,137,42,0.10)", fg: "#8B5E1A" },
  Pending: { bg: "rgba(196,137,42,0.10)", fg: "#8B5E1A" },
  Watching: { bg: "rgba(42,92,138,0.10)", fg: "#2A5C8A" },
};

const confidenceColor: Record<ValueEventConfidence, string> = {
  High: "#2A6A45",
  Medium: "#C4892A",
  Low: "#9A8F84",
};

const currencySymbol = (c: string) => (c === "ZAR" ? "R" : c === "USD" ? "$" : c === "EUR" ? "€" : c === "GBP" ? "£" : "");

const formatAmount = (amount: number | null, currency: string) => {
  if (amount == null) return null;
  const sym = currencySymbol(currency);
  return `${sym}${Math.round(amount).toLocaleString()}`;
};

export const ValueEventCard = (props: ValueEventCardProps) => {
  const {
    amount, currency, headline, subheadline, status, confidence,
    trigger, resolver, evidence_count, expected_resolution,
    attestationEnabled, onAddEvidence, onRequestConfirmation, onViewDetails,
  } = props;
  const [open, setOpen] = useState(false);
  const formatted = formatAmount(amount, currency);
  const chip = statusChip[status];

  const detailRows: { label: string; value: React.ReactNode }[] = [];
  if (trigger) detailRows.push({ label: "TRIGGER", value: trigger });
  if (resolver) detailRows.push({ label: "CONFIRMS IT", value: resolver });
  if (typeof evidence_count === "number") {
    detailRows.push({
      label: "EVIDENCE",
      value: evidence_count > 0 ? `${evidence_count} record${evidence_count === 1 ? "" : "s"} attached` : "None yet",
    });
  }
  if (expected_resolution) detailRows.push({ label: "EXPECTED", value: expected_resolution });
  if (confidence) {
    detailRows.push({
      label: "CONFIDENCE",
      value: (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <span aria-hidden style={{ width: 8, height: 8, borderRadius: 999, background: confidenceColor[confidence], display: "inline-block" }} />
          {confidence}
        </span>
      ),
    });
  }

  return (
    <article style={{
      border: "1px solid rgba(26,22,14,0.10)", borderRadius: 6,
      background: "#FDFAF4", padding: "16px 18px",
      boxShadow: "0 1px 3px rgba(26,22,14,0.04)", fontFamily: FONT_BODY,
    }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          {formatted && (
            <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 28, lineHeight: 1.1, color: amountColor[status] }}>
              {formatted}
            </div>
          )}
          <div style={{ fontSize: 13, fontWeight: 500, color: "#1A1614", marginTop: formatted ? 4 : 0 }}>
            {headline}
          </div>
        </div>
        <span style={{
          background: chip.bg, color: chip.fg,
          fontFamily: FONT_MONO, fontSize: 8, padding: "2px 7px", borderRadius: 3,
          textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap",
        }}>
          {status}
        </span>
      </header>

      <p style={{ fontSize: 12, color: "#5C5248", lineHeight: 1.6, margin: "8px 0 0" }}>
        {subheadline}
      </p>

      {detailRows.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            style={{
              background: "transparent", border: "none", padding: 0, cursor: "pointer",
              fontFamily: FONT_MONO, fontSize: 9, color: "#C4892A",
            }}
          >
            {open ? "Hide ↑" : "Show details ↓"}
          </button>
          {open && (
            <div style={{ marginTop: 8, borderTop: "1px solid rgba(26,22,14,0.07)" }}>
              {detailRows.map((r) => (
                <div key={r.label} style={{
                  display: "grid", gridTemplateColumns: "120px 1fr", gap: 12,
                  padding: "8px 0", borderBottom: "1px solid rgba(26,22,14,0.07)",
                }}>
                  <div style={{ fontFamily: FONT_MONO, fontSize: 9, color: "#9A8F84", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    {r.label}
                  </div>
                  <div style={{ fontSize: 12, color: "#1A1614" }}>{r.value}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 14, flexWrap: "wrap" }}>
        {onViewDetails && (
          <button type="button" onClick={onViewDetails} style={{
            background: "transparent", border: "none", padding: 0, cursor: "pointer",
            fontFamily: FONT_MONO, fontSize: 9, color: "#C4892A",
          }}>
            View details →
          </button>
        )}
        <div style={{ flex: 1 }} />
        {onAddEvidence && (
          <button type="button" onClick={onAddEvidence} style={{
            background: "transparent", border: "none", padding: 0, cursor: "pointer",
            fontFamily: FONT_BODY, fontSize: 12, color: "#5C5248", textDecoration: "underline",
          }}>
            Add evidence
          </button>
        )}
        {onRequestConfirmation && (
          <button
            type="button"
            onClick={attestationEnabled === false ? undefined : onRequestConfirmation}
            disabled={attestationEnabled === false}
            title={attestationEnabled === false ? "Enable attestation on this contract first" : undefined}
            style={{
              background: "transparent", border: "none", padding: 0,
              cursor: attestationEnabled === false ? "not-allowed" : "pointer",
              fontFamily: FONT_BODY, fontSize: 12,
              color: attestationEnabled === false ? "#9A8F84" : "#5C5248",
              textDecoration: "underline",
            }}
          >
            Request confirmation
          </button>
        )}
      </div>
    </article>
  );
};
