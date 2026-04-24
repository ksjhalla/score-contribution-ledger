import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

const FONT_DISPLAY = "'Playfair Display',Georgia,serif";
const FONT_BODY = "'DM Sans',system-ui,sans-serif";
const FONT_MONO = "'DM Mono',ui-monospace,monospace";

const symbolFor = (c: string) => (c === "ZAR" ? "R" : c === "USD" ? "$" : c === "EUR" ? "€" : c === "GBP" ? "£" : "");
const fmt = (n: number, c: string) => {
  const s = symbolFor(c);
  if (n >= 1_000_000) return `${s}${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`;
  if (n >= 1_000) return `${s}${(n / 1_000).toFixed(n % 1_000 === 0 ? 0 : 1)}K`;
  return `${s}${Math.round(n).toLocaleString()}`;
};

type Props = {
  settled: number;
  pending: number;
  future?: number;
  currency: string;
  label: string;
};

export const ValueMixDonut = ({ settled, pending, future = 0, currency, label }: Props) => {
  const data = [
    { name: "Settled", value: settled, color: "#2A6A45" },
    { name: "Pending", value: pending, color: "#C4892A" },
    { name: "Future", value: future, color: "#2A5C8A" },
  ].filter((d) => d.value > 0);
  const total = settled + pending + future;

  return (
    <div>
      <div style={{ position: "relative", width: "100%", height: 180 }}>
        <ResponsiveContainer width="100%" height={180}>
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius={60} outerRadius={80} paddingAngle={1} stroke="none">
              {data.map((d) => <Cell key={d.name} fill={d.color} />)}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const p = payload[0];
                return (
                  <div style={{ background: "#1A1614", color: "#F5F1E8", fontFamily: FONT_MONO, fontSize: 10, borderRadius: 4, padding: "6px 10px" }}>
                    {p.name}: {fmt(Number(p.value), currency)}
                  </div>
                );
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
          <div style={{ fontFamily: FONT_DISPLAY, fontSize: 20, fontWeight: 700, color: "#1A1614" }}>{fmt(total, currency)}</div>
          <div style={{ fontFamily: FONT_MONO, fontSize: 9, color: "#9A8F84", textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 2 }}>{label}</div>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 12 }}>
        {[
          { name: "Settled", value: settled, color: "#2A6A45" },
          { name: "Pending", value: pending, color: "#C4892A" },
          { name: "Future", value: future, color: "#2A5C8A" },
        ].map((row) => (
          <div key={row.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#EDE8DC", border: "1px solid rgba(26,22,14,0.08)", borderRadius: 4, padding: "7px 10px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: row.color, display: "inline-block" }} />
              <span style={{ fontFamily: FONT_BODY, fontSize: 12, color: "#1A1614" }}>{row.name}</span>
            </div>
            <span style={{ fontFamily: FONT_MONO, fontSize: 11, fontWeight: 500, color: row.color }}>{fmt(row.value, currency)}</span>
          </div>
        ))}
      </div>
    </div>
  );
};