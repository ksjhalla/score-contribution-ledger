import type { ExampleCard } from "@/data/demoProfiles";
import { formatDemoAmount } from "@/data/demoProfiles";
import { Activity, Smartphone, Gauge } from "lucide-react";

const FONT_DISPLAY = "'Playfair Display',Georgia,serif";
const FONT_BODY = "'DM Sans',system-ui,sans-serif";
const FONT_MONO = "'DM Mono',ui-monospace,monospace";

const STATUS_COLOR: Record<ExampleCard["status"], string> = {
  Settled: "#2A6A45",
  Pending: "#C4892A",
  Watching: "#2A5C8A",
};

const iconFor = (kind: ExampleCard["kind"]) => {
  if (kind === "kWh sales") return Activity;
  if (kind === "Mobile-money collection") return Smartphone;
  return Gauge;
};

type Props = {
  cards: ExampleCard[];
  accent: string;
  title?: string;
  description?: string;
  compact?: boolean;
};

export const MiniGridExampleCards = ({
  cards,
  accent,
  title = "Mini-grid examples · Ghana",
  description = "Three concrete contributions — what was measured, what it paid, who confirmed it.",
  compact = false,
}: Props) => {
  return (
    <section style={{ marginBottom: compact ? 16 : 28, fontFamily: FONT_BODY }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4, flexWrap: "wrap", gap: 8 }}>
        <h3
          style={{
            fontFamily: FONT_DISPLAY,
            fontSize: compact ? 16 : 20,
            fontWeight: 600,
            margin: 0,
            color: "#1A1614",
          }}
        >
          {title}
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
          {cards.length} examples
        </span>
      </div>
      <p style={{ fontSize: 12, color: "#5C5248", margin: "0 0 14px", maxWidth: 720, lineHeight: 1.6 }}>
        {description}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {cards.map((c) => {
          const Icon = iconFor(c.kind);
          const color = STATUS_COLOR[c.status];
          return (
            <div
              key={c.title}
              style={{
                border: "1px solid rgba(26,22,14,0.10)",
                borderLeft: `3px solid ${color}`,
                borderRadius: 6,
                background: "#FDFAF4",
                padding: "14px 16px",
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
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
                  {c.kind}
                </span>
                <span
                  style={{
                    marginLeft: "auto",
                    fontFamily: FONT_MONO,
                    fontSize: 9,
                    color,
                    background: `${color}14`,
                    border: `1px solid ${color}33`,
                    padding: "1px 6px",
                    borderRadius: 3,
                  }}
                >
                  {c.status}
                </span>
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#1A1614", lineHeight: 1.4 }}>
                {c.title}
              </div>
              <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: "#9A8F84" }}>
                {c.village} · {c.period}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8, marginTop: 4 }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontFamily: FONT_MONO, fontSize: 9, color: "#9A8F84", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    {c.metricLabel}
                  </div>
                  <div style={{ fontFamily: FONT_MONO, fontSize: 12, color: "#1A1614", marginTop: 2 }}>
                    {c.metricValue}
                  </div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontFamily: FONT_MONO, fontSize: 9, color: "#9A8F84", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    Amount
                  </div>
                  <div style={{ fontFamily: FONT_MONO, fontSize: 13, color, marginTop: 2 }}>
                    {formatDemoAmount(c.amount, c.currency)}
                  </div>
                </div>
              </div>
              <div style={{ fontSize: 11, color: "#5C5248", lineHeight: 1.55, marginTop: 4 }}>
                {c.note}
              </div>
              <div style={{ fontFamily: FONT_MONO, fontSize: 9, color: "#9A8F84", borderTop: "1px solid rgba(26,22,14,0.06)", paddingTop: 6, marginTop: "auto" }}>
                Evidence: {c.evidence}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};