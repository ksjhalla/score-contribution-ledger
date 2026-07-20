import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";

const FONT_DISPLAY = "'Playfair Display',Georgia,serif";
const FONT_BODY = "'DM Sans',system-ui,sans-serif";
const FONT_MONO = "'DM Mono',ui-monospace,monospace";

export type ValueEventStatus = "Resolved" | "Under review" | "Watching" | "Pending";
export type ValueEventConfidence = "High" | "Medium" | "Low";

export type ValueEventProofPack = {
  why_recorded: string;
  evidence_items: string[];
  verifier: string;
  source: string;
  confidence_level: "High" | "Medium" | "Low";
  last_verified_date: string;
  status: "Verified" | "Awaiting verification";
};

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
  proofPack?: ValueEventProofPack;
  confirmations?: { name: string; role?: string; date?: string }[];
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

const currencySymbol = (c: string) => (c === "ZAR" ? "R" : c === "USD" ? "$" : c === "EUR" ? "€" : c === "GBP" ? "£" : "");

const formatAmount = (amount: number | null, currency: string) => {
  if (amount == null) return null;
  const sym = currencySymbol(currency);
  return `${sym}${Math.round(amount).toLocaleString()}`;
};

const ProofPackBlock = ({ pack, confirmations = [] }: { pack: ValueEventProofPack; confirmations?: { name: string; role?: string; date?: string }[] }) => {
  const Row = ({ label, value }: { label: string; value: string }) => (
    <div className="proof-row" style={{ display: "grid", gridTemplateColumns: "92px 1fr", gap: 8 }}>
      <div style={{ fontFamily: FONT_MONO, fontSize: 9, color: "#9A8F84", textTransform: "uppercase", letterSpacing: "0.06em", paddingTop: 2 }}>
        {label}
      </div>
      <div style={{ fontSize: 12, color: "#1A1614", lineHeight: 1.5 }}>{value}</div>
    </div>
  );
  const hasEvidence = pack.evidence_items.length > 0;
  const hasConfirmations = confirmations.length > 0;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, wordBreak: "break-word" }}>
      <style>{`@media (max-width: 640px){.proof-row{grid-template-columns:1fr !important;gap:2px !important;}}`}</style>
      <div style={{ fontFamily: FONT_DISPLAY, fontSize: 14, fontWeight: 600, color: "#1A1614" }}>
        Why this value is recorded
      </div>
      <Row label="Why" value={pack.why_recorded} />
      <div className="proof-row" style={{ display: "grid", gridTemplateColumns: "92px 1fr", gap: 8 }}>
        <div style={{ fontFamily: FONT_MONO, fontSize: 9, color: "#9A8F84", textTransform: "uppercase", letterSpacing: "0.06em", paddingTop: 2 }}>
          Evidence
        </div>
        {hasEvidence ? (
          <ul style={{ margin: 0, paddingLeft: 16, display: "flex", flexDirection: "column", gap: 3 }}>
            {pack.evidence_items.map((e) => (
              <li key={e} style={{ fontSize: 12, color: "#1A1614", lineHeight: 1.5 }}>{e}</li>
            ))}
          </ul>
        ) : hasConfirmations ? (
          <div style={{ fontSize: 12, color: "#5C5248", lineHeight: 1.5, fontStyle: "italic" }}>
            Confirmed by {confirmations.map((c) => c.name).join(", ")}. No documents attached yet.
          </div>
        ) : (
          <div style={{ fontSize: 12, color: "#9A8F84", lineHeight: 1.5, fontStyle: "italic" }}>
            No documents or confirmations yet. This value is recorded based on direct confirmation.
          </div>
        )}
      </div>
      {hasConfirmations && (
        <div className="proof-row" style={{ display: "grid", gridTemplateColumns: "92px 1fr", gap: 8 }}>
          <div style={{ fontFamily: FONT_MONO, fontSize: 9, color: "#9A8F84", textTransform: "uppercase", letterSpacing: "0.06em", paddingTop: 2 }}>
            Confirmed by
          </div>
          <ul style={{ margin: 0, paddingLeft: 16, display: "flex", flexDirection: "column", gap: 3 }}>
            {confirmations.map((c) => (
              <li key={c.name} style={{ fontSize: 12, color: "#1A1614", lineHeight: 1.5 }}>
                {c.name}{c.role ? ` — ${c.role}` : ""}
              </li>
            ))}
          </ul>
        </div>
      )}
      <Row label="Verifier" value={pack.verifier} />
      <Row label="Source" value={pack.source} />
      <Row label="Confidence" value={pack.confidence_level} />
      <Row label="Updated" value={pack.last_verified_date} />
    </div>
  );
};

export const ValueEventCard = (props: ValueEventCardProps) => {
  const {
    amount, currency, headline, subheadline, status,
    resolver, evidence_count,
    attestationEnabled, onAddEvidence, onRequestConfirmation, onViewDetails,
    proofPack,
    confirmations = [],
  } = props;
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();
  const formatted = formatAmount(amount, currency);
  const chip = statusChip[status];

  // Proof: 1–2 plain-language lines per event. No timestamps, no technical fields.
  const verifiedLine = resolver ? `Verified by ${resolver}` : null;
  const supportingLine =
    typeof evidence_count === "number" && evidence_count > 0
      ? `${evidence_count} supporting record${evidence_count === 1 ? "" : "s"} attached`
      : null;
  const hasProof = Boolean(verifiedLine || supportingLine || proofPack);

  const isVerified = proofPack?.status === "Verified";
  const badgeBg = isVerified ? "rgba(42,106,69,0.10)" : "rgba(196,137,42,0.10)";
  const badgeFg = isVerified ? "#2A6A45" : "#8B5E1A";

  // Phase 3: on mobile, the proof badge opens a bottom sheet.
  // On desktop, keep inline expand as the fallback.
  const handleBadgeClick = () => setOpen((v) => !v);
  const inlineOpen = open && !isMobile;
  const drawerOpen = open && isMobile && Boolean(proofPack);

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
        <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-end" }}>
          <span style={{
            background: chip.bg, color: chip.fg,
            fontFamily: FONT_MONO, fontSize: 8, padding: "2px 7px", borderRadius: 3,
            textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap",
          }}>
            {status}
          </span>
          {proofPack && (
            <button
              type="button"
              onClick={handleBadgeClick}
              style={{
                background: badgeBg, color: badgeFg, border: "none", cursor: "pointer",
                fontFamily: FONT_MONO, fontSize: 8, padding: "6px 10px", borderRadius: 3,
                minHeight: 28,
                textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap",
              }}
              title="Why this value is recorded"
            >
              {isVerified ? "✔ Verified" : "⚠ Awaiting verification"}
            </button>
          )}
        </div>
      </header>

      <p style={{ fontSize: 12, color: "#5C5248", lineHeight: 1.6, margin: "8px 0 0" }}>
        {subheadline}
      </p>

      {hasProof && (
        <div style={{ marginTop: 12 }}>
          <button
            type="button"
            onClick={handleBadgeClick}
            style={{
              background: "transparent", border: "none", padding: 0, cursor: "pointer",
              fontFamily: FONT_MONO, fontSize: 9, color: "#C4892A",
              minHeight: 28,
            }}
          >
            {open ? "Hide proof ↑" : proofPack ? "Why is this recorded? ↓" : "How this is verified ↓"}
          </button>
          {inlineOpen && (
            <div
              style={{
                marginTop: 8,
                padding: "10px 12px",
                background: "rgba(42,106,69,0.05)",
                border: "1px solid rgba(42,106,69,0.15)",
                borderRadius: 4,
                display: "flex",
                flexDirection: "column",
                gap: 4,
              }}
            >
              {proofPack ? (
                <ProofPackBlock pack={proofPack} />
              ) : (
                <>
                  {verifiedLine && (
                <div style={{ fontSize: 12, color: "#1A1614", lineHeight: 1.5 }}>
                  {verifiedLine}
                </div>
                  )}
                  {supportingLine && (
                <div style={{ fontSize: 11, color: "#5C5248", lineHeight: 1.5 }}>
                  {supportingLine}
                </div>
                  )}
                </>
              )}
            </div>
          )}
          {proofPack && (
            <Drawer open={drawerOpen} onOpenChange={(o) => { if (!o) setOpen(false); }}>
              <DrawerContent style={{ background: "#FDFAF4" }}>
                <DrawerHeader>
                  <DrawerTitle style={{ fontFamily: FONT_DISPLAY, fontSize: 18, color: "#1A1614" }}>
                    {headline}
                  </DrawerTitle>
                  <DrawerDescription style={{ fontSize: 12, color: "#5C5248" }}>
                    {subheadline}
                  </DrawerDescription>
                </DrawerHeader>
                <div style={{ padding: "0 16px 24px", maxHeight: "70vh", overflowY: "auto" }}>
                  <p style={{ fontSize: 12, color: "#5C5248", lineHeight: 1.6, margin: "0 0 14px" }}>
                    Here is why this value is recorded and who confirmed it.
                  </p>
                  <ProofPackBlock pack={proofPack} />
                </div>
              </DrawerContent>
            </Drawer>
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
