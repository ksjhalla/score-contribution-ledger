const FONT_BODY = "'DM Sans',system-ui,sans-serif";
const FONT_MONO = "'DM Mono',ui-monospace,monospace";

export type Milestone = {
  status: "ok" | "info" | "watch";
  title: string;
  meta: string;
  amount?: string | null;
  amountColor?: "green" | "amber" | "blue";
};

const DOT: Record<Milestone["status"], { bg: string; symbol: string; color: string }> = {
  ok: { bg: "#2A6A45", symbol: "✓", color: "#FFFFFF" },
  info: { bg: "#2A5C8A", symbol: "i", color: "#FFFFFF" },
  watch: { bg: "#C4892A", symbol: "!", color: "#FFFFFF" },
};

const AMOUNT_COLOR = { green: "#2A6A45", amber: "#C4892A", blue: "#2A5C8A" } as const;

export const MilestoneArc = ({ milestones }: { milestones: Milestone[] }) => {
  return (
    <div style={{ border: "1px solid rgba(26,22,14,0.10)", borderRadius: 6, background: "#FDFAF4", padding: "14px 16px" }}>
      {milestones.map((m, i) => {
        const d = DOT[m.status];
        const isLast = i === milestones.length - 1;
        return (
          <div key={i} style={{ display: "flex", gap: 12, position: "relative" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ width: 18, height: 18, borderRadius: "50%", background: d.bg, color: d.color, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT_MONO, fontSize: 10, fontWeight: 600 }}>
                {d.symbol}
              </div>
              {!isLast && <div style={{ width: 1, flex: 1, background: "rgba(26,22,14,0.15)", marginTop: 2 }} />}
            </div>
            <div style={{ flex: 1, paddingBottom: isLast ? 0 : 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
                <div style={{ fontFamily: FONT_BODY, fontSize: 13, fontWeight: 500, color: "#1A1614", lineHeight: 1.4 }}>{m.title}</div>
                {m.amount && (
                  <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: m.amountColor ? AMOUNT_COLOR[m.amountColor] : "#1A1614", whiteSpace: "nowrap" }}>
                    {m.amount}
                  </span>
                )}
              </div>
              <div style={{ fontFamily: FONT_MONO, fontSize: 9, color: "#9A8F84", marginTop: 2 }}>{m.meta}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
};