import type { DemoProfile } from "@/data/demoProfiles";
import { formatDemoAmount } from "@/data/demoProfiles";

const FONT_DISPLAY = "'Playfair Display',Georgia,serif";
const FONT_BODY = "'DM Sans',system-ui,sans-serif";
const FONT_MONO = "'DM Mono',ui-monospace,monospace";

const STATUS_COLOR: Record<string, string> = {
  Settled: "#2A6A45",
  Pending: "#C4892A",
  Attributed: "#2A5C8A",
};

export const DemoPassportView = ({ profile }: { profile: DemoProfile }) => {
  const { contributor, stats, contracts, executions, accent } = profile;
  return (
    <div style={{ padding: "32px 24px", maxWidth: 920, margin: "0 auto", fontFamily: FONT_BODY }}>
      <div style={{ marginBottom: 20 }}>
        <div
          style={{
            fontFamily: FONT_MONO,
            fontSize: 9,
            color: accent,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
          }}
        >
          Passport · {contributor.id}
        </div>
        <h2
          style={{
            fontFamily: FONT_DISPLAY,
            fontSize: 28,
            fontWeight: 600,
            margin: "6px 0 4px",
            color: "#1A1614",
          }}
        >
          {contributor.name}
        </h2>
        <div style={{ fontSize: 13, color: "#5C5248" }}>
          {contributor.role} · {contributor.org} · {contributor.sector}
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 12,
          marginBottom: 28,
        }}
      >
        {[
          { label: "Settled", value: formatDemoAmount(stats.settled, stats.currency), color: "#2A6A45" },
          { label: "Pending", value: formatDemoAmount(stats.pending, stats.currency), color: "#C4892A" },
          { label: "Contracts", value: String(stats.contracts), color: accent },
          { label: "Executions", value: String(stats.executions), color: "#1A1614" },
        ].map((s) => (
          <div
            key={s.label}
            style={{
              border: "1px solid rgba(26,22,14,0.10)",
              borderRadius: 6,
              background: "#FDFAF4",
              padding: "14px 16px",
            }}
          >
            <div
              style={{
                fontFamily: FONT_MONO,
                fontSize: 9,
                color: "#9A8F84",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              {s.label}
            </div>
            <div style={{ fontFamily: FONT_MONO, fontSize: 18, color: s.color, marginTop: 4 }}>
              {s.value}
            </div>
          </div>
        ))}
      </div>

      <h3
        style={{
          fontFamily: FONT_DISPLAY,
          fontSize: 18,
          fontWeight: 600,
          margin: "0 0 12px",
        }}
      >
        Contracts
      </h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 28 }}>
        {contracts.map((c) => (
          <div
            key={c.name}
            style={{
              border: "1px solid rgba(26,22,14,0.10)",
              borderLeft: `3px solid ${accent}`,
              borderRadius: 5,
              background: "#FDFAF4",
              padding: "14px 16px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
              <div style={{ fontWeight: 600, fontSize: 14, color: "#1A1614" }}>{c.name}</div>
              <span
                style={{
                  fontFamily: FONT_MONO,
                  fontSize: 9,
                  color: accent,
                  background: "rgba(0,0,0,0.03)",
                  padding: "2px 6px",
                  borderRadius: 3,
                  whiteSpace: "nowrap",
                  alignSelf: "flex-start",
                }}
              >
                {c.status}
              </span>
            </div>
            <div style={{ fontSize: 12, color: "#5C5248", marginTop: 4 }}>
              {c.counterparty} · {c.stake_type}
            </div>
            <div style={{ fontSize: 13, color: "#1A1614", marginTop: 8, lineHeight: 1.6 }}>
              {c.entitlement}
            </div>
            <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: "#9A8F84", marginTop: 6 }}>
              Trigger: {c.trigger}
            </div>
          </div>
        ))}
      </div>

      <h3
        style={{
          fontFamily: FONT_DISPLAY,
          fontSize: 18,
          fontWeight: 600,
          margin: "0 0 12px",
        }}
      >
        Executions
      </h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {executions.map((e) => (
          <div
            key={e.title}
            style={{
              border: "1px solid rgba(26,22,14,0.10)",
              borderRadius: 5,
              background: "#FDFAF4",
              padding: "12px 14px",
              display: "grid",
              gridTemplateColumns: "1fr auto",
              gap: 8,
            }}
          >
            <div>
              <div style={{ fontSize: 13, fontWeight: 500, color: "#1A1614" }}>{e.title}</div>
              <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: "#9A8F84", marginTop: 4 }}>
                {e.proof}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div
                style={{
                  fontFamily: FONT_MONO,
                  fontSize: 9,
                  color: STATUS_COLOR[e.status] ?? "#1A1614",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                {e.status}
              </div>
              <div style={{ fontFamily: FONT_MONO, fontSize: 12, color: "#1A1614", marginTop: 4 }}>
                {formatDemoAmount(e.amount, e.currency)}
              </div>
              <div style={{ fontFamily: FONT_MONO, fontSize: 9, color: "#9A8F84", marginTop: 2 }}>
                {e.date}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
