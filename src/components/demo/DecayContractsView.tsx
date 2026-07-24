import * as React from "react";
import { demoProfiles, formatDemoAmount, type DemoKey } from "@/data/demoProfiles";
import { DecayTimeline } from "@/components/demo/DecayTimeline";
import {
  rateAt,
  derivedAmount,
  effectiveStatus,
  computeTotals,
  allSeriesKeys,
  scheduleFor,
  todayYear,
  type DecaySchedule,
  type DecaySeries,
  type PointStatus,
  type SeriesKey,
} from "@/data/decaySchedule";

const FONT_DISPLAY = "'Playfair Display',Georgia,serif";
const FONT_BODY = "'DM Sans',system-ui,sans-serif";
const FONT_MONO = "'DM Mono',ui-monospace,monospace";
const AMBER = "#C4892A";
const GREEN = "#2A6A45";
const INK = "#1A1614";
const MUTED = "#9A8F84";
const BORDER = "rgba(26,22,14,0.10)";

const statusPill = (status: PointStatus) => {
  const map = {
    Received: { bg: "rgba(42,106,69,0.10)", fg: GREEN },
    Pending: { bg: "rgba(196,137,42,0.10)", fg: AMBER },
    Projected: { bg: "rgba(154,143,132,0.14)", fg: "#5C5248" },
  } as const;
  const c = map[status];
  return (
    <span style={{ background: c.bg, color: c.fg, fontFamily: FONT_MONO, fontSize: 9, padding: "2px 6px", borderRadius: 3, whiteSpace: "nowrap" }}>
      {status}
    </span>
  );
};

const DecayBar = ({ pct, max, accent }: { pct: number; max: number; accent: string }) => (
  <div style={{ position: "relative", height: 6, background: "rgba(26,22,14,0.06)", borderRadius: 3, overflow: "hidden" }}>
    <div style={{ position: "absolute", top: 0, left: 0, bottom: 0, width: `${(pct / max) * 100}%`, background: accent, opacity: 0.85 }} />
  </div>
);

const ScheduleTable = ({ schedule, visible }: { schedule: DecaySchedule; visible: Set<SeriesKey> }) => {
  const years = schedule.years;
  const primary = schedule.series.find((s) => s.kind === "primary" && visible.has(s.key));
  const derivatives = schedule.series.filter((s) => s.kind === "derivative" && visible.has(s.key));
  const fmt = (v: number | null) => formatDemoAmount(v, schedule.currency);

  const cellFor = (s: DecaySeries, year: number) => {
    const point = s.points.find((p) => p.year === year);
    const rate = rateAt(s, year);
    if (rate == null) return { rate: null as number | null, amount: null as number | null };
    const amount = point ? derivedAmount(s, point) : null;
    return { rate, amount };
  };

  const th = { textAlign: "left" as const, padding: "8px 10px", fontFamily: FONT_MONO, fontSize: 10, color: MUTED, fontWeight: 500 };
  const thRight = { ...th, textAlign: "right" as const };

  return (
    <div style={{ border: `1px solid ${BORDER}`, borderRadius: 6, background: "#FDFAF4", padding: 16 }}>
      <div style={{ fontFamily: FONT_MONO, fontSize: 9, color: MUTED, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>
        Schedule data · yearly percentages and vesting values
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: FONT_BODY, fontSize: 12 }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
              <th style={th}>Year</th>
              {primary && (
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
              const primaryCell = primary ? cellFor(primary, year) : null;
              return (
                <tr key={year} style={{ borderBottom: `1px solid ${BORDER}` }}>
                  <td style={{ padding: "8px 10px", fontFamily: FONT_MONO, fontSize: 11, color: INK }}>{year}</td>
                  {primaryCell && (
                    <>
                      <td style={{ padding: "8px 10px", textAlign: "right", fontFamily: FONT_MONO, fontSize: 11, color: INK }}>
                        {primaryCell.rate != null ? `${primaryCell.rate.toFixed(2)}%` : "—"}
                      </td>
                      <td style={{ padding: "8px 10px", textAlign: "right", fontFamily: FONT_MONO, fontSize: 11, color: primaryCell.amount ? GREEN : MUTED }}>
                        {fmt(primaryCell.amount)}
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
                          {fmt(d.amount)}
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
      {primary && (
        <div style={{ marginTop: 10, fontFamily: FONT_MONO, fontSize: 9, color: MUTED }}>
          Primary: {primary.startRate}% start, −{Math.round(primary.decayPerYr * 100)}%/yr, {primary.floor}% floor
          {derivatives.length > 0 &&
            ` · Derivatives: ${derivatives[0].startRate}% start, −${Math.round(derivatives[0].decayPerYr * 100)}%/yr` +
              (derivatives[0].perSeasonCap ? `, ${fmt(derivatives[0].perSeasonCap)}/season cap.` : ".")}
        </div>
      )}
    </div>
  );
};

const ContractHeader = ({ title, counterparty, chipBg, chipFg, chipText }: {
  title: string; counterparty: string; chipBg: string; chipFg: string; chipText: string;
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

export const DecayContractsView = ({ profileKey }: { profileKey: DemoKey }) => {
  const schedule = scheduleFor(profileKey);
  if (!schedule) return null; // caller decides the fallback for profiles with no schedule

  const profile = demoProfiles[profileKey];
  const primaryContract = profile.contracts[schedule.primaryContractIndex ?? 0];
  const derivativeContract = profile.contracts[schedule.derivativeContractIndex ?? 1];
  const primarySeries = schedule.series.find((s) => s.kind === "primary");
  const allDerivatives = schedule.series.filter((s) => s.kind === "derivative");
  const kaptumoMax = primarySeries?.startRate ?? 10;
  const derivMax = Math.max(...allDerivatives.map((d) => d.startRate), 1);
  const fmt = (v: number | null) => formatDemoAmount(v, schedule.currency);
  const today = todayYear();

  const [selected, setSelected] = React.useState<Set<SeriesKey>>(() => new Set(allSeriesKeys(schedule)));
  const toggle = (k: SeriesKey) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(k)) {
        if (next.size === 1) return prev;
        next.delete(k);
      } else next.add(k);
      return next;
    });
  };
  const setAll = () => setSelected(new Set(allSeriesKeys(schedule)));
  const isAll = selected.size === allSeriesKeys(schedule).length;

  const totals = React.useMemo(() => computeTotals(schedule, Array.from(selected), today), [schedule, selected, today]);
  const showPrimary = primarySeries ? selected.has(primarySeries.key) : false;
  const shownDerivatives = allDerivatives.filter((s) => selected.has(s.key));
  const visibleKeys = Array.from(selected);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div>
        <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 28, fontWeight: 600, margin: "0 0 8px", color: INK }}>
          Contracts
        </h2>
        <p style={{ fontFamily: FONT_BODY, fontSize: 13, color: "#5C5248", lineHeight: 1.6, margin: 0, maxWidth: 620 }}>
          {profile.contracts.length} active contract{profile.contracts.length === 1 ? "" : "s"} for {profile.contributor.name.split(" ")[0]}
          {allDerivatives.length > 0 ? ", each with a linear decay schedule and — for derivative licences — a link back to the origin asset." : ", with a linear decay schedule."}
        </p>
      </div>

      {/* Contract selector */}
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, padding: "10px 12px", border: `1px solid ${BORDER}`, borderRadius: 6, background: "#FDFAF4" }}>
        <span style={{ fontFamily: FONT_MONO, fontSize: 9, color: MUTED, textTransform: "uppercase", letterSpacing: "0.06em", marginRight: 4 }}>
          Show contract
        </span>
        <button type="button" onClick={setAll} style={{ fontFamily: FONT_MONO, fontSize: 10, padding: "4px 9px", borderRadius: 3, cursor: "pointer", border: `1px solid ${isAll ? INK : BORDER}`, background: isAll ? INK : "transparent", color: isAll ? "#F5F1E8" : INK }}>
          All
        </button>
        {schedule.series.map((s) => {
          const active = selected.has(s.key);
          return (
            <button key={s.key} type="button" onClick={() => toggle(s.key)} aria-pressed={active} style={{ fontFamily: FONT_MONO, fontSize: 10, padding: "4px 9px", borderRadius: 3, cursor: "pointer", border: `1px solid ${active ? s.color : BORDER}`, background: active ? `${s.color}18` : "transparent", color: active ? s.color : MUTED, display: "inline-flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: 8, background: s.color, opacity: active ? 1 : 0.4 }} />
              {s.shortLabel}
              <span style={{ opacity: 0.6 }}>· {s.kind === "primary" ? "primary" : "derivative"}</span>
            </button>
          );
        })}
      </div>

      {/* Live totals */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: 10 }}>
        {[
          { k: "Received to date", v: totals.received, tone: GREEN, sub: "settled amounts" },
          { k: "Pending", v: totals.pending, tone: AMBER, sub: "awaiting settlement" },
          { k: "Projected", v: totals.projected, tone: MUTED, sub: "future periods at current decay" },
        ].map((s) => (
          <div key={s.k} style={{ border: `1px solid ${BORDER}`, borderRadius: 6, background: "#FDFAF4", padding: "12px 14px" }}>
            <div style={{ fontFamily: FONT_MONO, fontSize: 9, color: MUTED, textTransform: "uppercase", letterSpacing: "0.06em" }}>{s.k}</div>
            <div style={{ fontFamily: FONT_MONO, fontSize: 18, color: s.tone, marginTop: 4 }}>{fmt(s.v)}</div>
            <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: MUTED, marginTop: 2 }}>{s.sub}</div>
          </div>
        ))}
      </div>
      <div style={{ fontFamily: FONT_MONO, fontSize: 9, color: MUTED, marginTop: -8 }}>
        Totals reflect today ({today}) across the {selected.size} selected contract{selected.size === 1 ? "" : "s"}.
      </div>

      <DecayTimeline schedule={schedule} visibleKeys={visibleKeys} today={today} />
      <ScheduleTable schedule={schedule} visible={selected} />

      {/* Primary contract */}
      {showPrimary && primarySeries && (
        <div style={{ border: `1px solid ${BORDER}`, borderRadius: 6, background: "#FDFAF4", padding: 16 }}>
          <ContractHeader title={primaryContract.name} counterparty={primaryContract.counterparty} chipBg="rgba(196,137,42,0.10)" chipFg="#8B5E1A" chipText="Financial" />
          <p style={{ fontFamily: FONT_BODY, fontSize: 12, color: "#5C5248", lineHeight: 1.55, margin: "10px 0 14px" }}>{primaryContract.entitlement}</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 14 }}>
            {[
              { k: "Starting rate", v: `${primarySeries.startRate}%`, tone: INK },
              { k: "Decay", v: `−${Math.round(primarySeries.decayPerYr * 100)}%/yr`, tone: AMBER },
              { k: "Floor", v: `${primarySeries.floor}%`, tone: GREEN },
            ].map((s) => (
              <div key={s.k} style={{ background: "rgba(26,22,14,0.03)", padding: "8px 10px", borderRadius: 4 }}>
                <div style={{ fontFamily: FONT_MONO, fontSize: 9, color: MUTED, textTransform: "uppercase", letterSpacing: "0.06em" }}>{s.k}</div>
                <div style={{ fontFamily: FONT_MONO, fontSize: 14, color: s.tone, marginTop: 3 }}>{s.v}</div>
              </div>
            ))}
          </div>
          <div style={{ fontFamily: FONT_MONO, fontSize: 9, color: MUTED, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
            Decay schedule · periods since {primarySeries.startYear}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {primarySeries.points.map((p) => {
              const status = effectiveStatus(p, today);
              const meta = primarySeries.pointMeta?.[p.year] ?? { label: `${p.year}` };
              const amount = derivedAmount(primarySeries, p);
              const ratePct = rateAt(primarySeries, p.year) ?? 0;
              return (
                <div key={p.year} style={{ display: "grid", gridTemplateColumns: "48px 1fr 90px 84px 90px", alignItems: "center", gap: 10, padding: "8px 10px", background: status === "Projected" ? "transparent" : "rgba(92,122,58,0.04)", border: `1px solid ${status === "Projected" ? "rgba(26,22,14,0.06)" : "rgba(92,122,58,0.15)"}`, borderRadius: 4 }}>
                  <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: INK }}>{p.year}</div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: INK, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{meta.label}</div>
                    {meta.proof && <div style={{ fontFamily: FONT_MONO, fontSize: 9, color: MUTED, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{meta.proof}</div>}
                  </div>
                  <div>
                    <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: MUTED, marginBottom: 3 }}>{ratePct.toFixed(2)}%</div>
                    <DecayBar pct={ratePct} max={kaptumoMax} accent={primarySeries.color} />
                  </div>
                  <div style={{ fontFamily: FONT_MONO, fontSize: 12, color: status === "Received" ? GREEN : status === "Pending" ? AMBER : MUTED, textAlign: "right" }}>{fmt(amount)}</div>
                  <div style={{ textAlign: "right" }}>{statusPill(status)}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Derivative licence contract(s) with linkage diagram */}
      {shownDerivatives.length > 0 && derivativeContract && (
        <div style={{ border: `1px solid ${BORDER}`, borderRadius: 6, background: "#FDFAF4", padding: 16 }}>
          <ContractHeader title={derivativeContract.name} counterparty={derivativeContract.counterparty} chipBg="rgba(42,92,138,0.10)" chipFg="#2A5C8A" chipText="Attribution" />
          <p style={{ fontFamily: FONT_BODY, fontSize: 12, color: "#5C5248", lineHeight: 1.55, margin: "10px 0 14px" }}>{derivativeContract.entitlement}</p>

          {schedule.originAsset && (
            <>
              <div style={{ fontFamily: FONT_MONO, fontSize: 9, color: MUTED, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
                Derivative linkage
              </div>
              <div style={{ border: `1px dashed ${BORDER}`, borderRadius: 4, padding: 12, marginBottom: 14, background: `${primarySeries?.color ?? "#5C7A3A"}08` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                  <div style={{ flex: "0 0 auto", minWidth: 200, padding: "10px 12px", background: "#FDFAF4", border: `1px solid ${primarySeries?.color ?? "#5C7A3A"}`, borderRadius: 4 }}>
                    <div style={{ fontFamily: FONT_MONO, fontSize: 9, color: primarySeries?.color ?? "#5C7A3A", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                      Origin asset
                    </div>
                    <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: INK, fontWeight: 600, marginTop: 3 }}>{schedule.originAsset.name}</div>
                    <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: MUTED, marginTop: 2 }}>
                      {schedule.originAsset.fingerprint} · {schedule.originAsset.anchoredNote}
                    </div>
                  </div>
                  <div style={{ fontFamily: FONT_MONO, fontSize: 14, color: MUTED, alignSelf: "center" }}>→</div>
                  <div style={{ flex: 1, minWidth: 220, display: "flex", flexDirection: "column", gap: 6 }}>
                    {shownDerivatives.map((l) => (
                      <div key={l.key} style={{ padding: "8px 10px", background: "#FDFAF4", border: `1px solid ${BORDER}`, borderLeft: `2px solid ${AMBER}`, borderRadius: 4 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "baseline" }}>
                          <div style={{ fontFamily: FONT_BODY, fontSize: 12, fontWeight: 600, color: INK }}>{l.label}</div>
                          {l.executedDate && <div style={{ fontFamily: FONT_MONO, fontSize: 9, color: MUTED }}>Exec {l.executedDate}</div>}
                        </div>
                        {l.fingerprint && <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: MUTED, marginTop: 2 }}>{l.fingerprint}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {shownDerivatives.map((l) => (
              <div key={l.key}>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 6, gap: 8, flexWrap: "wrap" }}>
                  <div style={{ fontFamily: FONT_BODY, fontSize: 12, fontWeight: 600, color: INK }}>{l.label} · vesting</div>
                  {l.executedDate && <div style={{ fontFamily: FONT_MONO, fontSize: 9, color: MUTED }}>T₀ = {l.executedDate}</div>}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {l.points.map((s) => {
                    const rate = rateAt(l, s.year) ?? 0;
                    const status = effectiveStatus(s, today);
                    const amount = derivedAmount(l, s);
                    return (
                      <div key={s.year} style={{ display: "grid", gridTemplateColumns: "48px 1fr 90px 84px 90px", alignItems: "center", gap: 10, padding: "6px 10px", background: status === "Projected" ? "transparent" : "rgba(122,92,42,0.04)", border: `1px solid ${status === "Projected" ? "rgba(26,22,14,0.06)" : "rgba(122,92,42,0.15)"}`, borderRadius: 4 }}>
                        <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: INK }}>{s.year}</div>
                        <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: MUTED, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          Period {s.year - l.startYear + 1}{s.note ? ` · ${s.note}` : ""}
                        </div>
                        <div>
                          <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: MUTED, marginBottom: 3 }}>{rate.toFixed(2)}%</div>
                          <DecayBar pct={rate} max={derivMax} accent={AMBER} />
                        </div>
                        <div style={{ fontFamily: FONT_MONO, fontSize: 12, color: status === "Received" ? GREEN : status === "Pending" ? AMBER : MUTED, textAlign: "right" }}>{fmt(amount)}</div>
                        <div style={{ textAlign: "right" }}>{statusPill(status)}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 10, fontFamily: FONT_MONO, fontSize: 9, color: MUTED }}>
            Each licence decays independently from its own execution date
            {allDerivatives[0]?.perSeasonCap ? ` · ${fmt(allDerivatives[0].perSeasonCap)}/season cap applies.` : "."}
          </div>
        </div>
      )}
    </div>
  );
};
