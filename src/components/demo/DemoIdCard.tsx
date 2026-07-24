import { QRCodeSVG } from "qrcode.react";
import { demoProfiles, type DemoKey } from "@/data/demoProfiles";
import { CARDS } from "@/components/demo/DemoProfileCards";

const FONT_DISPLAY = "'Playfair Display',Georgia,serif";
const FONT_BODY = "'DM Sans',system-ui,sans-serif";
const FONT_MONO = "'DM Mono',ui-monospace,monospace";

const yearFromId = (id: string) => {
  const m = id.match(/-(\d{4})-/);
  return m ? m[1] : "—";
};

export const DemoIdCard = ({ profileKey }: { profileKey: DemoKey }) => {
  const profile = demoProfiles[profileKey];
  const card = CARDS.find((c) => c.key === profileKey)!;
  const { contributor } = profile;
  const accent = card.accent;
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const passportUrl = `${origin}/passport/${contributor.id}`;
  const verifiedSince = yearFromId(contributor.id);

  return (
    <div className="px-4 sm:px-6 py-8" style={{ maxWidth: 720, margin: "0 auto", fontFamily: FONT_BODY }}>
      <div
        style={{
          fontFamily: FONT_MONO,
          fontSize: 9,
          color: accent,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          marginBottom: 10,
        }}
      >
        Digital ID · Demonstration
      </div>

      <div
        style={{
          borderRadius: 10,
          overflow: "hidden",
          background: "#FDFAF4",
          border: "1px solid rgba(26,22,14,0.12)",
          boxShadow: "0 8px 24px -12px rgba(26,22,14,0.18)",
        }}
      >
        {/* Tri-color header band */}
        <div style={{ display: "flex", height: 8 }}>
          <div style={{ flex: 1, background: accent }} />
          <div style={{ flex: 1, background: "#1A1614" }} />
          <div style={{ flex: 1, background: "#C4892A" }} />
        </div>

        {/* Header bar */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "14px 20px",
            background: card.accentBg,
            borderBottom: `1px solid ${card.accentBorder}`,
          }}
        >
          <div>
            <div style={{ fontFamily: FONT_MONO, fontSize: 16, color: accent, letterSpacing: "0.04em" }}>
              SCORE
            </div>
            <div
              style={{
                fontFamily: FONT_MONO,
                fontSize: 9,
                color: "#5C5248",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                marginTop: 2,
              }}
            >
              Contributor ID
            </div>
          </div>
          <div
            style={{
              fontFamily: FONT_MONO,
              fontSize: 9,
              color: accent,
              background: card.accentSoft,
              padding: "4px 8px",
              borderRadius: 3,
              border: `1px solid ${card.accentBorder}`,
            }}
          >
            {card.tag}
          </div>
        </div>

        {/* Body */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0,1fr) auto",
            gap: 20,
            padding: 20,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 16, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: "50%",
                  background: card.avatarBg,
                  border: `1.5px solid ${card.avatarBorder}`,
                  color: accent,
                  fontFamily: FONT_MONO,
                  fontSize: 22,
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                {card.initials}
              </div>
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontFamily: FONT_DISPLAY,
                    fontSize: 22,
                    fontWeight: 600,
                    color: "#1A1614",
                    lineHeight: 1.2,
                  }}
                >
                  {contributor.name}
                </div>
                <div style={{ fontSize: 12, color: "#5C5248", marginTop: 4 }}>
                  {contributor.role} · {contributor.org}
                </div>
              </div>
            </div>

            <div>
              <div
                style={{
                  fontFamily: FONT_MONO,
                  fontSize: 9,
                  color: "#9A8F84",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}
              >
                ID Number
              </div>
              <div
                style={{
                  fontFamily: FONT_MONO,
                  fontSize: 20,
                  color: "#1A1614",
                  marginTop: 4,
                  letterSpacing: "0.04em",
                  wordBreak: "break-all",
                }}
              >
                {contributor.id}
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                gap: 12,
                borderTop: "1px dashed rgba(26,22,14,0.14)",
                paddingTop: 14,
              }}
            >
              {[
                { label: "Sector", value: contributor.sector },
                { label: "Verified since", value: verifiedSince },
                { label: "Status", value: "Verified contributor" },
              ].map((f) => (
                <div key={f.label}>
                  <div
                    style={{
                      fontFamily: FONT_MONO,
                      fontSize: 8.5,
                      color: "#9A8F84",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                    }}
                  >
                    {f.label}
                  </div>
                  <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: "#1A1614", marginTop: 3 }}>
                    {f.value}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* QR block */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "flex-end",
              gap: 6,
              minWidth: 128,
            }}
          >
            <div
              style={{
                padding: 8,
                background: "#FFFFFF",
                border: `1px solid ${card.accentBorder}`,
                borderRadius: 6,
              }}
            >
              <QRCodeSVG
                value={passportUrl}
                size={112}
                bgColor="#FFFFFF"
                fgColor="#1A1614"
                level="M"
              />
            </div>
            <div
              style={{
                fontFamily: FONT_MONO,
                fontSize: 8,
                color: "#9A8F84",
                textAlign: "center",
                maxWidth: 128,
                lineHeight: 1.4,
              }}
            >
              Scan to view public passport.
            </div>
          </div>
        </div>

        {/* Footer microprint */}
        <div
          style={{
            borderTop: "1px solid rgba(26,22,14,0.10)",
            padding: "10px 20px",
            background: "rgba(26,22,14,0.02)",
            fontFamily: FONT_MONO,
            fontSize: 9,
            color: "#9A8F84",
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <span>SCORE Contribution Ledger · Demonstration Sandbox</span>
          <span style={{ color: accent }}>Not a legal identity document</span>
        </div>
      </div>
    </div>
  );
};