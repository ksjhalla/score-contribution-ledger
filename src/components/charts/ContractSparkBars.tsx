import { useEffect, useMemo, useRef, useState } from "react";
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
  const [sortMode, setSortMode] = useState<"original" | "value">("original");
  const [activeStatuses, setActiveStatuses] = useState<Set<SparkContract["status"]>>(
    () => new Set(["settled", "pending", "watching", "attributed"]),
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setNarrow(entry.contentRect.width < 380);
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const toggleStatus = (s: SparkContract["status"]) => {
    setActiveStatuses((prev) => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s);
      else next.add(s);
      // Don't allow empty filter — re-enable everything if user just turned the last one off.
      if (next.size === 0) return new Set(["settled", "pending", "watching", "attributed"]);
      return next;
    });
  };
  const ordered = useMemo(() => {
    const filtered = contracts.filter((c) => activeStatuses.has(c.status));
    if (sortMode === "value") {
      return [...filtered].sort((a, b) => b.value - a.value);
    }
    return filtered;
  }, [contracts, sortMode, activeStatuses]);
  const presentStatuses = useMemo(() => {
    const set = new Set<string>(contracts.map((c) => c.status));
    return (Object.keys(STATUS_LABEL) as Array<SparkContract["status"]>).filter((s) => set.has(s));
  }, [contracts]);
  // Use sqrt scaling so a single huge entry (e.g. a multi-million "Phase 2" bet)
  // doesn't flatten the smaller paid/pending bars to invisibility.
  const max = Math.max(...ordered.map((c) => c.value), 1);
  const widthFor = (v: number) => {
    const ratio = Math.sqrt(Math.max(0, v) / max);
    // Floor so even tiny values keep a visible sliver.
    return Math.max(4, Math.round(ratio * 100));
  };
  const rowGap = narrow ? 14 : 10;
  const labelSize = narrow ? 12 : 11;
  const valueSize = narrow ? 12 : 11;
  const metaSize = narrow ? 9 : 8;
  const barHeight = narrow ? 8 : 6;
  return (
    <div ref={containerRef} style={{ display: "flex", flexDirection: "column", gap: rowGap }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "inline-flex", borderRadius: 6, border: "1px solid rgba(26,22,14,0.12)", overflow: "hidden" }}>
          {([
            { key: "original", label: "Original" },
            { key: "value", label: "Highest value" },
          ] as const).map((opt) => {
            const active = sortMode === opt.key;
            return (
              <button
                key={opt.key}
                type="button"
                onClick={() => setSortMode(opt.key)}
                style={{
                  fontFamily: FONT_MONO,
                  fontSize: 9,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  padding: "4px 8px",
                  background: active ? "#1A1614" : "transparent",
                  color: active ? "#FFFFFF" : "#1A1614",
                  border: 0,
                  cursor: "pointer",
                }}
                aria-pressed={active}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
          {presentStatuses.map((s) => {
            const active = activeStatuses.has(s);
            return (
              <button
                key={s}
                type="button"
                onClick={() => toggleStatus(s)}
                aria-pressed={active}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  padding: "3px 7px",
                  borderRadius: 999,
                  border: `1px solid ${active ? STATUS_COLOR[s] : "rgba(26,22,14,0.15)"}`,
                  background: active ? `${STATUS_COLOR[s]}1A` : "transparent",
                  cursor: "pointer",
                  opacity: active ? 1 : 0.55,
                }}
              >
                <span
                  aria-hidden
                  style={{
                    display: "inline-block",
                    width: 8,
                    height: 8,
                    borderRadius: 2,
                    background: STATUS_COLOR[s],
                  }}
                />
                <span
                  style={{
                    fontFamily: FONT_MONO,
                    fontSize: 9,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    color: "#1A1614",
                  }}
                >
                  {STATUS_LABEL[s]}
                </span>
              </button>
            );
          })}
        </div>
      </div>
      <div
        style={{
          fontFamily: FONT_MONO,
          fontSize: metaSize,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          color: "#9A8F84",
        }}
      >
        Bar length = relative {currency} value (√-scaled). Tap a row for details.
      </div>
      {ordered.length === 0 ? (
        <div
          style={{
            fontFamily: FONT_BODY,
            fontSize: 11,
            color: "#9A8F84",
            padding: "12px 0",
            textAlign: "center",
          }}
        >
          No contracts match the current filters.
        </div>
      ) : null}
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
                flexDirection: narrow ? "column" : "row",
                justifyContent: "space-between",
                alignItems: narrow ? "flex-start" : "baseline",
                gap: narrow ? 2 : 8,
                marginBottom: 4,
                minWidth: 0,
              }}
            >
              <span
                style={{
                  fontFamily: FONT_BODY,
                  fontSize: labelSize,
                  color: "#1A1614",
                  // On narrow widths, wrap rather than truncate so nothing is hidden.
                  whiteSpace: narrow ? "normal" : "nowrap",
                  overflow: narrow ? "visible" : "hidden",
                  textOverflow: narrow ? "clip" : "ellipsis",
                  wordBreak: narrow ? "break-word" : "normal",
                  flex: 1,
                  minWidth: 0,
                  lineHeight: 1.3,
                }}
              >
                {c.label}
              </span>
              <span
                style={{
                  fontFamily: FONT_MONO,
                  fontSize: valueSize,
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
                height: barHeight,
                borderRadius: barHeight / 2,
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
                  borderRadius: barHeight / 2,
                  transition: "width .25s ease",
                }}
              />
            </div>
            <div
              style={{
                fontFamily: FONT_MONO,
                fontSize: metaSize,
                color: "#9A8F84",
                marginTop: 3,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                whiteSpace: narrow ? "normal" : "nowrap",
                overflow: "visible",
                wordBreak: "break-word",
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