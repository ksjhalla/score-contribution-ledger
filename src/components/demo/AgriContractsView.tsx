import * as React from "react";
import { demoProfiles } from "@/data/demoProfiles";
import { AgriDecayTimeline } from "@/components/demo/AgriDecayTimeline";
import {
  AGRI_SERIES,
  AGRI_TODAY_YEAR,
  ALL_SERIES_KEYS,
  computeAgriTotals,
  derivedAmount,
  effectiveStatus,
  getSeries,
  rateAt,
  type AgriSeries,
  type PointStatus,
  type SeriesKey,
} from "@/data/agriSchedule";

const FONT_DISPLAY = "'Playfair Display',Georgia,serif";
const FONT_BODY = "'DM Sans',system-ui,sans-serif";
const FONT_MONO = "'DM Mono',ui-monospace,monospace";
const ACCENT = "#5C7A3A";
const AMBER = "#C4892A";
const GREEN = "#2A6A45";
const INK = "#1A1614";
const MUTED = "#9A8F84";
const BORDER = "rgba(26,22,14,0.10)";

// Per-season labels & proof strings that aren't part of the shared schedule
// (kept UI-side so the schedule module stays presentation-agnostic).
const KAPTUMO_META: Record<number, { label: string; proof?: string }> = {
  2022: { label: "Season 2022 · Lot KMT-2022-011", proof: "M-PESA · sha256: 2c8b5f…" },
  2023: { label: "Season 2023 · Lot KMT-2023-019", proof: "M-PESA · sha256: 7d1e4a…" },
  2024: { label: "Season 2024 · Lot KMT-2024-007", proof: "NCE Week 18 · awaiting M-PESA" },
  2025: { label: "Season 2025 (projected)" },
  2026: { label: "Season 2026 (projected)" },
  2027: { label: "Season 2027 (projected · at floor)" },
};

const LICENCE_META: Record<SeriesKey, { fingerprint: string; executed: string }> = {
  kaptumo: { fingerprint: "", executed: "" },
  kabitet: { fingerprint: "sha256: 4f7a1c… → 9b4e2a1c…", executed: "14 Apr 2023" },
  cheptebo: { fingerprint: "sha256: 8c2e5b… → 9b4e2a1c…", executed: "22 Feb 2024" },
};

const fmtKES = (v: number | null) =>
  v == null ? "—" : v >= 1000 ? `KSh${(v / 1000).toFixed(v % 1000 === 0 ? 0 : 1)}K` : `KSh${v.toLocaleString()}`;

const statusPill = (status: PointStatus) => {
  const map = {
    Received: { bg: "rgba(42,106,69,0.10)", fg: GREEN },
    Pending: { bg: "rgba(196,137,42,0.10)", fg: AMBER },
    Projected: { bg: "rgba(154,143,132,0.14)", fg: "#5C5248" },
  } as const;
  const c = map[status];
  return (
    <span
      style={{
        background: c.bg,
        color: c.fg,
        fontFamily: FONT_MONO,
        fontSize: 9,
        padding: "2px 6px",
        borderRadius: 3,
        whiteSpace: "nowrap",
      }}
    >
      {status}
    </span>
  );
};

const DecayBar = ({ pct, max, accent }: { pct: number; max: number; accent: string }) => (
  <div
    style={{
      position: "relative",
      height: 6,
      background: "rgba(26,22,14,0.06)",
      borderRadius: 3,
      overflow: "hidden",
    }}
  >
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        bottom: 0,
        width: `${(pct / max) * 100}%`,
        background: accent,
        opacity: 0.85,
      }}
    />
  </div>
);

const ScheduleTable = ({ visible }: { visible: Set<SeriesKey> }) => {
  const years = [2022, 2023, 2024, 2025, 2026, 2027];
  const primaryShown = visible.has("kaptumo");
  const derivatives = AGRI_SERIES.filter((s) => s.kind === "derivative" && visible.has(s.key));

  const cellFor = (s: AgriSeries, year: number) => {
    const point = s.points.find((p) => p.year === year);
    const rate = rateAt(s, year);
    if (rate == null) return { rate: null as number | null, amount: null as number | null };
    const amount = point ? derivedAmount(s, point) : null;
    return { rate, amount };
  };

  const th = {
    textAlign: "left" as const,
    padding: "8px 10px",
    fontFamily: FONT_MONO,
    fontSize: 10,
    color: MUTED,
    fontWeight: 500,
  };

  const thRight = { ...th, textAlign: "right" as const };

  return (
    <div style={{ border: `1px solid ${BORDER}`, borderRadius: 6, background: "#FDFAF4", padding: 16 }}>
      <div
        style={{
          fontFamily: FONT_MONO,
          fontSize: 9,
          color: MUTED,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          marginBottom: 12,
        }}
      >
        Schedule data · yearly percentages and vesting values
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: FONT_BODY, fontSize: 12 }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
              <th style={th}>Year</th>
              {primaryShown && (
                <>
                  <th style={thRight}>Primary rate</th>
                  <th style={thRight}>Primary value</th>
                </>
              )}
              {derivatives.map((s) => (
                <React.Fragment key={`${s.key}-header`}>
                  <th style={thRight}>{s.shortLabel} rate</th>
                  <th style={thRight}>{s.shortLabel} value</th>
                </React.Fragment>
              ))}
            </tr>
          </thead>
          <tbody>
            {years.map((year) => {
              const primary = primaryShown ? cellFor(getSeries("kaptumo"), year) : null;
              return (
                <tr key={year} style={{ borderBottom: `1px solid ${BORDER}` }}>
                  <td style={{ padding: "8px 10px", fontFamily: FONT_MONO, fontSize: 11, color: INK }}>{year}</td>
                  {primary && (
                    <>
                      <td style={{ padding: "8px 10px", textAlign: "right", fontFamily: FONT_MONO, fontSize: 11, color: INK }}>
                        {primary.rate != null ? `${primary.rate.toFixed(2)}%` : "—"}
                      </td>
                      <td style={{ padding: "8px 10px", textAlign: "right", fontFamily: FONT_MONO, fontSize: 11, color: primary.amount ? GREEN : MUTED }}>
                        {fmtKES(primary.amount)}
                      </td>
                    </>
                  )}
                  {derivatives.map((s) => {
                    const d = cellFor(s, year);
                    return (
                      <React.Fragment key={`${s.key}-${year}`}>
                        <td style={{ padding: "8px 10px", textAlign: "right", fontFamily: FONT_MONO, fontSize: 11, color: INK }}>
                          {d.rate != null ? `${d.rate.toFixed(2)}%` : "—"}
                        </td>
                        <td style={{ padding: "8px 10px", textAlign: "right", fontFamily: FONT_MONO, fontSize: 11, color: d.amount ? AMBER : MUTED }}>
                          {fmtKES(d.amount)}
                        </td>
                      </React.Fragment>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div style={{ marginTop: 10, fontFamily: FONT_MONO, fontSize: 9, color: MUTED }}>
        Primary: 8% start, −15%/yr, 3% floor · Derivatives: 3% start, −20%/yr, KES 5,000/season cap.
      </div>
    </div>
  );
};

const ContractHeader = ({ title, counterparty, chipBg, chipFg, chipText }: {
  title: string;
  counterparty: string;
  chipBg: string;
  chipFg: string;
  chipText: string;
}) => (
  <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
    <span style={{ background: chipBg, color: chipFg, fontFamily: FONT_MONO, fontSize: 9, padding: "2px 7px", borderRadius: 3 }}>
      {chipText}
    </span>
    <div style={{ minWidth: 0, flex: 1 }}>
      <div style={{ fontFamily: FONT_BODY, fontSize: 14, fontWeight: 600, color: INK }}>{title}</div>
      <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: MUTED, marginTop: 2 }}>{counterparty}</div>
    </div>
  </div>
);

export const AgriContractsView = () => {
  const profile = demoProfiles.agri;
  const primary = profile.contracts[0];
  const derivative = profile.contracts[1];
  const kaptumoMax = 8;
  const derivMax = 3;

  // Contract selector state (multi-select). Defaults to all three.
  const [selected, setSelected] = React.useState<Set<SeriesKey>>(
    () => new Set<SeriesKey>(ALL_SERIES_KEYS),
  );
  const toggle = (k: SeriesKey) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(k)) {
        if (next.size === 1) return prev; // keep at least one
        next.delete(k);
      } else {
        next.add(k);
      }
      return next;
    });
  };
  const setAll = () => setSelected(new Set(ALL_SERIES_KEYS));
  const isAll = selected.size === ALL_SERIES_KEYS.length;

  const totals = React.useMemo(
    () => computeAgriTotals(Array.from(selected)),
    [selected],
  );

  const showKaptumo = selected.has("kaptumo");
  const shownDerivatives = AGRI_SERIES.filter((s) => s.kind === "derivative" && selected.has(s.key));
  const visibleKeys = Array.from(selected);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div>
        <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 28, fontWeight: 600, margin: "0 0 8px", color: INK }}>
          Contracts
        </h2>
        <p style={{ fontFamily: FONT_BODY, fontSize: 13, color: "#5C5248", lineHeight: 1.6, margin: 0, maxWidth: 620 }}>
          Two active contracts for Aisha, each with a linear decay schedule and — for the derivative licence — an on-chain link back to the origin IP asset.
        </p>
      </div>

      {/* Contract selector */}
      <div style={{
        display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8,
        padding: "10px 12px", border: `1px solid ${BORDER}`, borderRadius: 6, background: "#FDFAF4",
      }}>
        <span style={{
          fontFamily: FONT_MONO, fontSize: 9, color: MUTED,
          textTransform: "uppercase", letterSpacing: "0.06em", marginRight: 4,
        }}>
          Show contract
        </span>
        <button
          type="button"
          onClick={setAll}
          style={{
            fontFamily: FONT_MONO, fontSize: 10, padding: "4px 9px", borderRadius: 3, cursor: "pointer",
            border: `1px solid ${isAll ? INK : BORDER}`,
            background: isAll ? INK : "transparent",
            color: isAll ? "#F5F1E8" : INK,
          }}
        >
          All
        </button>
        {AGRI_SERIES.map((s) => {
          const active = selected.has(s.key);
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => toggle(s.key)}
              aria-pressed={active}
              style={{
                fontFamily: FONT_MONO, fontSize: 10, padding: "4px 9px", borderRadius: 3, cursor: "pointer",
                border: `1px solid ${active ? s.color : BORDER}`,
                background: active ? `${s.color}18` : "transparent",
                color: active ? s.color : MUTED,
                display: "inline-flex", alignItems: "center", gap: 6,
              }}
            >
              <span style={{ width: 8, height: 8, borderRadius: 8, background: s.color, opacity: active ? 1 : 0.4 }} />
              {s.shortLabel}
              <span style={{ opacity: 0.6 }}>· {s.kind === "primary" ? "primary" : "derivative"}</span>
            </button>
          );
        })}
      </div>

      {/* Live totals — computed from today ({AGRI_TODAY_YEAR}) and the decay schedule */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, minmax(0,1fr))",
        gap: 10,
      }}>
        {[
          { k: "Received to date", v: totals.received, tone: GREEN, sub: "settled amounts" },
          { k: "Pending", v: totals.pending, tone: AMBER, sub: "awaiting settlement" },
          { k: "Projected", v: totals.projected, tone: MUTED, sub: "future seasons at current decay" },
        ].map((s) => (
          <div key={s.k} style={{
            border: `1px solid ${BORDER}`, borderRadius: 6, background: "#FDFAF4",
            padding: "12px 14px",
          }}>
            <div style={{
              fontFamily: FONT_MONO, fontSize: 9, color: MUTED,
              textTransform: "uppercase", letterSpacing: "0.06em",
            }}>
              {s.k}
            </div>
            <div style={{ fontFamily: FONT_MONO, fontSize: 18, color: s.tone, marginTop: 4 }}>
              {fmtKES(s.v)}
            </div>
            <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: MUTED, marginTop: 2 }}>
              {s.sub}
            </div>
          </div>
        ))}
      </div>
      <div style={{ fontFamily: FONT_MONO, fontSize: 9, color: MUTED, marginTop: -8 }}>
        Totals reflect today ({AGRI_TODAY_YEAR}) across the {isAll ? "3 selected contracts" : `${selected.size} selected contract${selected.size === 1 ? "" : "s"}`}.
      </div>

      <AgriDecayTimeline visibleKeys={visibleKeys} />

      <ScheduleTable visible={selected} />

      {/* Primary contract — Kaptumo premium pool with vesting/decay table */}
      {showKaptumo && (
      <div style={{ border: `1px solid ${BORDER}`, borderRadius: 6, background: "#FDFAF4", padding: 16 }}>
        <ContractHeader
          title={primary.name}
          counterparty={primary.counterparty}
          chipBg="rgba(196,137,42,0.10)"
          chipFg="#8B5E1A"
          chipText="Financial"
        />
        <p style={{ fontFamily: FONT_BODY, fontSize: 12, color: "#5C5248", lineHeight: 1.55, margin: "10px 0 14px" }}>
          {primary.entitlement}
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 8,
            marginBottom: 14,
          }}
        >
          {[
            { k: "Starting rate", v: "8%", tone: INK },
            { k: "Decay", v: "−15%/yr", tone: AMBER },
            { k: "Floor", v: "3%", tone: GREEN },
          ].map((s) => (
            <div key={s.k} style={{ background: "rgba(26,22,14,0.03)", padding: "8px 10px", borderRadius: 4 }}>
              <div style={{ fontFamily: FONT_MONO, fontSize: 9, color: MUTED, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                {s.k}
              </div>
              <div style={{ fontFamily: FONT_MONO, fontSize: 14, color: s.tone, marginTop: 3 }}>{s.v}</div>
            </div>
          ))}
        </div>

        <div style={{ fontFamily: FONT_MONO, fontSize: 9, color: MUTED, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
          Decay schedule · seasons since first delivery (2022)
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {getSeries("kaptumo").points.map((p) => {
            const status = effectiveStatus(p);
            const meta = KAPTUMO_META[p.year] ?? { label: `Season ${p.year}` };
            const amount = derivedAmount(getSeries("kaptumo"), p);
            const ratePct = rateAt(getSeries("kaptumo"), p.year) ?? 0;
            return (
            <div
              key={p.year}
              style={{
                display: "grid",
                gridTemplateColumns: "48px 1fr 90px 84px 90px",
                alignItems: "center",
                gap: 10,
                padding: "8px 10px",
                background: status === "Projected" ? "transparent" : "rgba(92,122,58,0.04)",
                border: `1px solid ${status === "Projected" ? "rgba(26,22,14,0.06)" : "rgba(92,122,58,0.15)"}`,
                borderRadius: 4,
              }}
            >
              <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: INK }}>{p.year}</div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: INK, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {meta.label}
                </div>
                {meta.proof && (
                  <div style={{ fontFamily: FONT_MONO, fontSize: 9, color: MUTED, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {meta.proof}
                  </div>
                )}
              </div>
              <div>
                <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: MUTED, marginBottom: 3 }}>
                  {ratePct.toFixed(2)}% pool
                </div>
                <DecayBar pct={ratePct} max={kaptumoMax} accent={ACCENT} />
              </div>
              <div style={{ fontFamily: FONT_MONO, fontSize: 12, color: status === "Received" ? GREEN : status === "Pending" ? AMBER : MUTED, textAlign: "right" }}>
                {fmtKES(amount)}
              </div>
              <div style={{ textAlign: "right" }}>{statusPill(status)}</div>
            </div>
            );
          })}
        </div>

        <div style={{ marginTop: 10, fontFamily: FONT_MONO, fontSize: 9, color: MUTED }}>
          Buyout available at 4× cumulative earnings · rate floor engages Season 2027.
        </div>
      </div>
      )}

      {/* Derivative licence contract with linkage diagram */}
      {shownDerivatives.length > 0 && (
      <div style={{ border: `1px solid ${BORDER}`, borderRadius: 6, background: "#FDFAF4", padding: 16 }}>
        <ContractHeader
          title={derivative.name}
          counterparty={derivative.counterparty}
          chipBg="rgba(42,92,138,0.10)"
          chipFg="#2A5C8A"
          chipText="Attribution"
        />
        <p style={{ fontFamily: FONT_BODY, fontSize: 12, color: "#5C5248", lineHeight: 1.55, margin: "10px 0 14px" }}>
          {derivative.entitlement}
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 8,
            marginBottom: 14,
          }}
        >
          {[
            { k: "Starting rate", v: "3%", tone: INK },
            { k: "Decay", v: "−20%/yr", tone: AMBER },
            { k: "Per-season cap", v: "KES 5K", tone: GREEN },
          ].map((s) => (
            <div key={s.k} style={{ background: "rgba(26,22,14,0.03)", padding: "8px 10px", borderRadius: 4 }}>
              <div style={{ fontFamily: FONT_MONO, fontSize: 9, color: MUTED, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                {s.k}
              </div>
              <div style={{ fontFamily: FONT_MONO, fontSize: 14, color: s.tone, marginTop: 3 }}>{s.v}</div>
            </div>
          ))}
        </div>

        {/* Linkage diagram */}
        <div style={{ fontFamily: FONT_MONO, fontSize: 9, color: MUTED, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
          Derivative linkage
        </div>
        <div
          style={{
            border: `1px dashed ${BORDER}`,
            borderRadius: 4,
            padding: 12,
            marginBottom: 14,
            background: "rgba(92,122,58,0.03)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <div
              style={{
                flex: "0 0 auto",
                minWidth: 200,
                padding: "10px 12px",
                background: "#FDFAF4",
                border: `1px solid ${ACCENT}`,
                borderRadius: 4,
              }}
            >
              <div style={{ fontFamily: FONT_MONO, fontSize: 9, color: ACCENT, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Origin IP asset
              </div>
              <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: INK, fontWeight: 600, marginTop: 3 }}>
                Anaerobic fermentation technique
              </div>
              <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: MUTED, marginTop: 2 }}>
                sha256: 9b4e2a1c… · anchored 2022
              </div>
            </div>
            <div style={{ fontFamily: FONT_MONO, fontSize: 14, color: MUTED, alignSelf: "center" }}>→</div>
            <div style={{ flex: 1, minWidth: 220, display: "flex", flexDirection: "column", gap: 6 }}>
              {shownDerivatives.map((l) => (
                <div
                  key={l.key}
                  style={{
                    padding: "8px 10px",
                    background: "#FDFAF4",
                    border: `1px solid ${BORDER}`,
                    borderLeft: `2px solid ${AMBER}`,
                    borderRadius: 4,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "baseline" }}>
                    <div style={{ fontFamily: FONT_BODY, fontSize: 12, fontWeight: 600, color: INK }}>{l.label}</div>
                    <div style={{ fontFamily: FONT_MONO, fontSize: 9, color: MUTED }}>Exec {LICENCE_META[l.key].executed}</div>
                  </div>
                  <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: MUTED, marginTop: 2 }}>
                    {LICENCE_META[l.key].fingerprint}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Per-licence decay & vesting */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {shownDerivatives.map((l) => (
            <div key={l.key}>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 6, gap: 8, flexWrap: "wrap" }}>
                <div style={{ fontFamily: FONT_BODY, fontSize: 12, fontWeight: 600, color: INK }}>
                  {l.label} · vesting
                </div>
                <div style={{ fontFamily: FONT_MONO, fontSize: 9, color: MUTED }}>
                  T₀ = {LICENCE_META[l.key].executed}
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {l.points.map((s) => {
                  const rate = rateAt(l, s.year) ?? 0;
                  const status = effectiveStatus(s);
                  const amount = derivedAmount(l, s);
                  return (
                    <div
                      key={s.year}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "48px 1fr 90px 84px 90px",
                        alignItems: "center",
                        gap: 10,
                        padding: "6px 10px",
                        background: status === "Projected" ? "transparent" : "rgba(122,92,42,0.04)",
                        border: `1px solid ${status === "Projected" ? "rgba(26,22,14,0.06)" : "rgba(122,92,42,0.15)"}`,
                        borderRadius: 4,
                      }}
                    >
                      <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: INK }}>{s.year}</div>
                      <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: MUTED, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        Season {s.year - l.startYear + 1}
                        {s.note ? ` · ${s.note}` : ""}
                      </div>
                      <div>
                        <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: MUTED, marginBottom: 3 }}>
                          {rate.toFixed(2)}% pool
                        </div>
                        <DecayBar pct={rate} max={derivMax} accent={AMBER} />
                      </div>
                      <div style={{ fontFamily: FONT_MONO, fontSize: 12, color: status === "Received" ? GREEN : status === "Pending" ? AMBER : MUTED, textAlign: "right" }}>
                        {fmtKES(amount)}
                      </div>
                      <div style={{ textAlign: "right" }}>{statusPill(status)}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 10, fontFamily: FONT_MONO, fontSize: 9, color: MUTED }}>
          Each licence decays independently from its own execution date · KES 5,000/season cap applies before decay.
        </div>
      </div>
      )}
    </div>
  );
};