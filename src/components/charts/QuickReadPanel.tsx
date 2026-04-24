const FONT_BODY = "'DM Sans',system-ui,sans-serif";
const FONT_MONO = "'DM Mono',ui-monospace,monospace";

export type QuickReadRow = {
  question: string;
  answer: string;
  value: string;
  valueColor: "green" | "amber" | "blue" | "default";
};

const COLOR: Record<QuickReadRow["valueColor"], string> = {
  green: "#2A6A45",
  amber: "#C4892A",
  blue: "#2A5C8A",
  default: "#1A1614",
};

export const QuickReadPanel = ({ rows }: { rows: QuickReadRow[] }) => {
  return (
    <div style={{ border: "1px solid rgba(26,22,14,0.10)", borderRadius: 6, background: "#FDFAF4", padding: "14px 16px" }}>
      {rows.map((r, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            padding: "10px 0",
            borderBottom: i === rows.length - 1 ? "none" : "1px solid rgba(26,22,14,0.07)",
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: FONT_BODY, fontSize: 12, fontWeight: 600, color: "#1A1614" }}>{r.question}</div>
            <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: "#5C5248", marginTop: 2, lineHeight: 1.5 }}>{r.answer}</div>
          </div>
          <div style={{ flexShrink: 0, marginLeft: 16, fontFamily: FONT_MONO, fontSize: 12, color: COLOR[r.valueColor] }}>
            {r.value}
          </div>
        </div>
      ))}
    </div>
  );
};