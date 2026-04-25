import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { useEffect, useState } from "react";

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
  esg?: number;
  esgColor?: string;
  esgLabel?: string;
  currency: string;
  label: string;
};

export const ValueMixDonut = ({
  settled,
  pending,
  future = 0,
  esg = 0,
  esgColor = "#4A784A",
  esgLabel = "ESG / system value",
  currency,
  label,
}: Props) => {
  const allRows = [
    { name: "Settled", value: settled, color: "#2A6A45" },
    { name: "Pending", value: pending, color: "#C4892A" },
    ...(esg > 0 ? [{ name: esgLabel, value: esg, color: esgColor }] : []),
    { name: "Future", value: future, color: "#2A5C8A" },
  ];
  const data = allRows.filter((d) => d.value > 0);
  const total = settled + pending + future + esg;
  const [isNarrow, setIsNarrow] = useState(() => typeof window !== "undefined" && window.innerWidth < 640);
  useEffect(() => {
    const onResize = () => setIsNarrow(window.innerWidth < 640);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  // Suppress Canvas2D readback warning by hinting willReadFrequently on
  // any canvases recharts creates inside this chart.
  useEffect(() => {
    const canvases = document.querySelectorAll("canvas");
    canvases.forEach((canvas) => {
      try { canvas.getContext("2d", { willReadFrequently: true }); } catch { /* noop */ }
    });
  }, []);
  const inner = isNarrow ? 45 : 60;
  const outer = isNarrow ? 65 : 80;
  const chartHeight = isNarrow ? 140 : 180;

  return (
    <div>
      <div style={{ position: "relative", width: "100%", height: chartHeight }}>
        <ResponsiveContainer width="100%" height={chartHeight}>
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius={inner} outerRadius={outer} paddingAngle={1} stroke="none">
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
        {allRows.map((row) => (
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