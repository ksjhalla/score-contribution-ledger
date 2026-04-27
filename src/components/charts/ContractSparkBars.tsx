import { useMemo } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const FONT_MONO = "'DM Mono',ui-monospace,monospace";
const FONT_BODY = "'DM Sans',system-ui,sans-serif";

const symbolFor = (c: string) =>
  c === "ZAR" ? "R" : c === "USD" ? "$" : c === "EUR" ? "€" : c === "GBP" ? "£" : "";

const fmt = (n: number, c: string) => {
  const s = symbolFor(c);
  if (n >= 1_000_000) return `${s}${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`;
  if (n >= 1_000) return `${s}${(n / 1_000).toFixed(n % 1_000 === 0 ? 0 : 1)}K`;
  return `${s}${Math.round(n).toLocaleString()}`;
};

const fullNumber = (n: number, c: string) => `${symbolFor(c)}${Math.round(n).toLocaleString()}`;

const STATUS_COLOR: Record<string, string> = {
  settled: "#2A6A45",
  pending: "#C4892A",
  watching: "#2A5C8A",
  attributed: "rgba(26,22,14,0.30)",
};

const STATUS_LABEL: Record<string, string> = {
  settled: "Received",
  pending: "Waiting",
  watching: "Watching",
  attributed: "Attributed",
};

export type SparkContract = {
  label: string;
  value: number;
  status: "settled" | "pending" | "watching" | "attributed";
  evidence_count?: number;
  color?: string;
  contract_id?: string;
};

export const ContractSparkBars = ({
  contracts,
  currency,
}: {
  contracts: SparkContract[];
  currency: string;
}) => {
  if (!contracts.length) return null;

  // Sort by value descending so the visual order matches the magnitude.
  const ordered = useMemo(
    () => [...contracts].sort((a, b) => b.value - a.value),
    [contracts],
  );

  // sqrt scaling so a single huge bet doesn't flatten smaller bars.
  const max = Math.max(...ordered.map((c) => c.value), 1);
  const widthFor = (v: number) => {
    if (v <= 0) return 0;
    return Math.max(4, Math.round(Math.sqrt(v / max) * 100));
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {ordered.map((c, i) => {
        const color = c.color ?? STATUS_COLOR[c.status];
        const w = widthFor(c.value);
        return (
          <Popover key={`${c.label}-${i}`}>
            <PopoverTrigger asChild>
              <button
                type="button"
                style={{
                  background: "transparent",
                  border: 0,
                  padding: 0,
                  textAlign: "left",
                  width: "100%",
                  cursor: "pointer",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                    gap: 8,
                    marginBottom: 4,
                    minWidth: 0,
                  }}
                >
                  <span
                    style={{
                      fontFamily: FONT_BODY,
                      fontSize: 12,
                      color: "#1A1614",
                      flex: 1,
                      minWidth: 0,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      lineHeight: 1.3,
                    }}
                  >
                    {c.label}
                  </span>
                  <span
                    style={{
                      fontFamily: FONT_MONO,
                      fontSize: 11,
                      color,
                      flexShrink: 0,
                    }}
                  >
                    {fmt(c.value, currency)}
                  </span>
                </div>
                <div
                  style={{
                    position: "relative",
                    height: 6,
                    borderRadius: 3,
                    background: "rgba(26,22,14,0.06)",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      width: `${w}%`,
                      background: color,
                      borderRadius: 3,
                      transition: "width .25s ease",
                    }}
                  />
                </div>
              </button>
            </PopoverTrigger>
            <PopoverContent side="top" align="center" className="w-56 p-3">
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{ fontFamily: FONT_BODY, fontSize: 12, fontWeight: 600, color: "#1A1614" }}>
                  {c.label}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                  <span style={{ fontFamily: FONT_MONO, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.06em", color: "#9A8F84" }}>
                    Status
                  </span>
                  <span style={{ fontFamily: FONT_MONO, fontSize: 11, color }}>
                    {STATUS_LABEL[c.status]}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                  <span style={{ fontFamily: FONT_MONO, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.06em", color: "#9A8F84" }}>
                    Value
                  </span>
                  <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: "#1A1614" }}>
                    {fullNumber(c.value, currency)}
                  </span>
                </div>
                {c.contract_id ? (
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                    <span style={{ fontFamily: FONT_MONO, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.06em", color: "#9A8F84" }}>
                      ID
                    </span>
                    <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: "#1A1614", wordBreak: "break-all", textAlign: "right" }}>
                      {c.contract_id}
                    </span>
                  </div>
                ) : null}
              </div>
            </PopoverContent>
          </Popover>
        );
      })}
    </div>
  );
};
