import { QRCodeSVG } from "qrcode.react";

const FONT_DISPLAY = "'Playfair Display',Georgia,serif";
const FONT_BODY = "'DM Sans',system-ui,sans-serif";
const FONT_MONO = "'DM Mono',ui-monospace,monospace";
const ACCENT = "#5C7A3A";

export const NandiFarmerIdCard = ({
  verifiedSince,
  name = "Aisha Ng'etich",
  initials = "AN",
  contributorId = "NANDI-AISHA-001",
  roleLine = "Smallholder Farmer · Kaptumo Cooperative",
  sector = "Coffee — Arabica, Kaptumo Cooperative",
}: {
  verifiedSince: string;
  name?: string;
  initials?: string;
  contributorId?: string;
  roleLine?: string;
  sector?: string;
}) => {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const qrValue = `${origin}/nandi/farmer`;

  return (
    <div style={{ maxWidth: 420, width: "100%", margin: "0 auto", fontFamily: FONT_BODY }}>
      <div
        style={{
          borderRadius: 10,
          overflow: "hidden",
          background: "#FDFAF4",
          border: "1px solid rgba(26,22,14,0.12)",
          boxShadow: "0 8px 24px -12px rgba(26,22,14,0.18)",
        }}
      >
        <div style={{ display: "flex", height: 8 }}>
          <div style={{ flex: 1, background: ACCENT }} />
          <div style={{ flex: 1, background: "#1A1614" }} />
          <div style={{ flex: 1, background: "#C4892A" }} />
        </div>

        <div
          style={{
            display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10,
            padding: "14px 18px",
            background: "rgba(92,122,58,0.08)",
            borderBottom: `1px solid ${ACCENT}33`,
          }}
        >
          <div>
            <div style={{ fontFamily: FONT_MONO, fontSize: 16, color: ACCENT, letterSpacing: "0.04em" }}>SCORE</div>
            <div
              style={{
                fontFamily: FONT_MONO, fontSize: 9, color: "#5C5248",
                letterSpacing: "0.12em", textTransform: "uppercase", marginTop: 2,
              }}
            >
              Contributor ID
            </div>
          </div>
          <div
            style={{
              fontFamily: FONT_MONO, fontSize: 9, color: ACCENT,
              background: "rgba(92,122,58,0.12)", padding: "4px 8px",
              borderRadius: 3, border: `1px solid ${ACCENT}33`, whiteSpace: "nowrap",
            }}
          >
            AGRICULTURE
          </div>
        </div>

        <div style={{ padding: 18, display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              style={{
                width: 64, height: 64, borderRadius: "50%",
                background: "rgba(92,122,58,0.10)", border: `1.5px solid ${ACCENT}55`,
                color: ACCENT, fontFamily: FONT_MONO, fontSize: 22, fontWeight: 600,
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}
            >
              {initials}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontFamily: FONT_DISPLAY, fontSize: 22, fontWeight: 600, color: "#1A1614", lineHeight: 1.2 }}>
                {name}
              </div>
              <div style={{ fontSize: 12, color: "#5C5248", marginTop: 4 }}>{roleLine}</div>
            </div>
          </div>

          <div>
            <div
              style={{
                fontFamily: FONT_MONO, fontSize: 9, color: "#9A8F84",
                textTransform: "uppercase", letterSpacing: "0.08em",
              }}
            >
              ID Number
            </div>
            <div
              style={{
                fontFamily: FONT_MONO, fontSize: 18, color: "#1A1614",
                marginTop: 4, letterSpacing: "0.04em", wordBreak: "break-all",
              }}
            >
              {contributorId}
            </div>
          </div>

          <div
            style={{
              display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 12,
              borderTop: "1px dashed rgba(26,22,14,0.14)", paddingTop: 14,
            }}
          >
            {[
              { label: "Sector", value: sector },
              { label: "Verified since", value: verifiedSince },
              { label: "Status", value: "Verified contributor" },
            ].map((f) => (
              <div key={f.label}>
                <div
                  style={{
                    fontFamily: FONT_MONO, fontSize: 8.5, color: "#9A8F84",
                    textTransform: "uppercase", letterSpacing: "0.08em",
                  }}
                >
                  {f.label}
                </div>
                <div style={{ fontSize: 12, color: "#1A1614", marginTop: 3, lineHeight: 1.4 }}>{f.value}</div>
              </div>
            ))}
          </div>

          <div
            style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
              borderTop: "1px dashed rgba(26,22,14,0.14)", paddingTop: 16,
            }}
          >
            <div style={{ padding: 8, background: "#FFFFFF", border: `1px solid ${ACCENT}33`, borderRadius: 6 }}>
              <QRCodeSVG value={qrValue} size={124} bgColor="#FFFFFF" fgColor="#1A1614" level="M" />
            </div>
            <div
              style={{
                fontFamily: FONT_MONO, fontSize: 8, color: "#9A8F84",
                textAlign: "center", maxWidth: 200, lineHeight: 1.4,
              }}
            >
              Demo profile — not a real scannable record.
            </div>
          </div>
        </div>

        <div
          style={{
            borderTop: "1px solid rgba(26,22,14,0.10)", padding: "10px 18px",
            background: "rgba(26,22,14,0.02)", fontFamily: FONT_MONO, fontSize: 9,
            color: "#9A8F84", display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap",
          }}
        >
          <span>Nandi Sandbox · Demonstration</span>
          <span style={{ color: ACCENT }}>Not a legal identity document</span>
        </div>
      </div>
    </div>
  );
};
