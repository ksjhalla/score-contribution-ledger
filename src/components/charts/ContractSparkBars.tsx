import { BarChart, Bar, XAxis, Cell, Tooltip, ResponsiveContainer } from "recharts";

const FONT_MONO = "'DM Mono',ui-monospace,monospace";

const symbolFor = (c: string) => (c === "ZAR" ? "R" : c === "USD" ? "$" : c === "EUR" ? "€" : c === "GBP" ? "£" : "");
const fmt = (n: number, c: string) => {
  const s = symbolFor(c);
  if (n >= 1_000_000) return `${s}${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`;
  if (n >= 1_000) return `${s}${(n / 1_000).toFixed(n % 1_000 === 0 ? 0 : 1)}K`;
  return `${s}${Math.round(n).toLocaleString()}`;
};

const STATUS_COLOR: Record<string, string> = {
  settled: "#2A6A45",
  pending: "#C4892A",
  watching: "#2A5C8A",
  attributed: "rgba(26,22,14,0.15)",
};

export type SparkContract = {
  label: string;
  value: number;
  status: "settled" | "pending" | "watching" | "attributed";
  evidence_count?: number;
  color?: string;
};

export const ContractSparkBars = ({ contracts, currency }: { contracts: SparkContract[]; currency: string }) => {
  if (!contracts.length) return null;
  const dense = contracts.length > 3;
  return (
    <ResponsiveContainer width="100%" height={140}>
      <BarChart data={contracts} margin={{ top: 8, right: 4, left: 4, bottom: 0 }}>
        <XAxis
          dataKey="label"
          tick={{ fontFamily: "DM Mono", fontSize: 9, fill: "#9A8F84" }}
          axisLine={false}
          tickLine={false}
          {...(dense ? { angle: -35, textAnchor: "end" as const, height: 48, interval: 0 } : {})}
        />
        <Tooltip
          cursor={{ fill: "rgba(26,22,14,0.04)" }}
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const d = payload[0].payload as SparkContract;
            return (
              <div style={{ background: "#1A1614", color: "#F5F1E8", fontFamily: FONT_MONO, fontSize: 10, borderRadius: 4, padding: "6px 10px" }}>
                <div>{d.label}: {fmt(d.value, currency)}</div>
                <div style={{ opacity: 0.7 }}>{d.status}{d.evidence_count ? ` · ${d.evidence_count} evidence` : ""}</div>
              </div>
            );
          }}
        />
        <Bar dataKey="value" radius={[3, 3, 0, 0]}>
          {contracts.map((c, i) => (
            <Cell key={i} fill={c.color ?? STATUS_COLOR[c.status]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};