import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const FONT_MONO = "'DM Mono',ui-monospace,monospace";
const FONT_BODY = "'DM Sans',system-ui,sans-serif";

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

const STATUS_LABEL: Record<string, string> = {
  settled: "Paid",
  pending: "Pending",
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

const fullNumber = (n: number, c: string) => {
  const s = symbolFor(c);
  return `${s}${Math.round(n).toLocaleString()}`;
};

export const ContractSparkBars = ({ contracts, currency }: { contracts: SparkContract[]; currency: string }) => {
  if (!contracts.length) return null;
  // Use sqrt scaling so a single huge entry (e.g. a multi-million "Phase 2" bet)
  // doesn't flatten the smaller paid/pending bars to invisibility.
  const max = Math.max(...contracts.map((c) => c.value), 1);
  const widthFor = (v: number) => {
    const ratio = Math.sqrt(Math.max(0, v) / max);
    // Floor so even tiny values keep a visible sliver.
    return Math.max(4, Math.round(ratio * 100));
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {contracts.map((c, i) => {
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
                  fontSize: 11,
                  color: "#1A1614",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  flex: 1,
                  minWidth: 0,
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
            <div
              style={{
                fontFamily: FONT_MONO,
                fontSize: 8,
                color: "#9A8F84",
                marginTop: 3,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              {STATUS_LABEL[c.status]}
              {c.evidence_count ? ` · ${c.evidence_count} evidence` : ""}
            </div>
              </button>
            </PopoverTrigger>
            <PopoverContent
              side="top"
              align="center"
              className="w-64 p-3"
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{ fontFamily: FONT_BODY, fontSize: 12, fontWeight: 600, color: "#1A1614" }}>
                  {c.label}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                  <span style={{ fontFamily: FONT_MONO, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.06em", color: "#9A8F84" }}>
                    Contract ID
                  </span>
                  <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: "#1A1614", wordBreak: "break-all", textAlign: "right" }}>
                    {c.contract_id ?? "—"}
                  </span>
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
                {c.evidence_count ? (
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                    <span style={{ fontFamily: FONT_MONO, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.06em", color: "#9A8F84" }}>
                      Evidence
                    </span>
                    <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: "#1A1614" }}>
                      {c.evidence_count}
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