import * as React from "react";
import { rateAt, todayYear, type DecaySchedule, type SeriesKey } from "@/data/decaySchedule";
import { formatDemoAmount } from "@/data/demoProfiles";

const FONT_BODY = "'DM Sans',system-ui,sans-serif";
const FONT_MONO = "'DM Mono',ui-monospace,monospace";
const MUTED = "#9A8F84";
const INK = "#1A1614";

// Layout
const W = 640;
const H = 220;
const PAD_L = 34;
const PAD_R = 12;
const PAD_T = 14;
const PAD_B = 28;
const IW = W - PAD_L - PAD_R;
const IH = H - PAD_T - PAD_B;

type Props = {
  schedule: DecaySchedule;
  visibleKeys?: SeriesKey[];
  today?: number;
};

export const DecayTimeline: React.FC<Props> = ({ schedule, visibleKeys, today = todayYear() }) => {
  const YEARS = schedule.years;
  const Y_MAX = schedule.yAxisMax;
  const firstYear = YEARS[0];
  const lastYear = YEARS[YEARS.length - 1];

  const xFor = (year: number) =>
    PAD_L + ((year - firstYear) / Math.max(lastYear - firstYear, 1)) * IW;
  const yFor = (rate: number) => PAD_T + IH - (rate / Y_MAX) * IH;

  const keep = visibleKeys ? new Set(visibleKeys) : null;
  const seriesShown = schedule.series.filter((s) => !keep || keep.has(s.key));

  // Y ticks — roughly 5 evenly spaced ticks up to Y_MAX
  const step = Y_MAX <= 3 ? 0.5 : Y_MAX <= 5 ? 1 : 2;
  const yTicks: number[] = [];
  for (let v = 0; v <= Y_MAX + 0.0001; v += step) yTicks.push(Number(v.toFixed(2)));

  const floorSeries = schedule.floorAnnotation
    ? schedule.series.find((s) => s.key === schedule.floorAnnotation!.seriesKey)
    : undefined;

  return (
    <div
      style={{
        border: "1px solid rgba(26,22,14,0.10)",
        borderRadius: 6,
        background: "#FDFAF4",
        padding: 16,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, flexWrap: "wrap", marginBottom: 4 }}>
        <div style={{ fontFamily: FONT_BODY, fontSize: 14, fontWeight: 600, color: INK }}>
          Decay & vesting timeline
        </div>
        <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: MUTED }}>
          entitlement rate (%) · {firstYear} – {lastYear}
        </div>
      </div>
      <p style={{ fontFamily: FONT_BODY, fontSize: 12, color: "#5C5248", lineHeight: 1.55, margin: "0 0 12px", maxWidth: 620 }}>
        Primary and derivative stakes shown on one axis. Each licence decays independently from its own execution date.
      </p>

      <div style={{ overflowX: "auto" }}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          role="img"
          aria-label="Decay and vesting timeline chart"
          style={{ width: "100%", minWidth: 420, height: "auto", display: "block" }}
        >
          {yTicks.map((v) => (
            <g key={v}>
              <line x1={PAD_L} x2={PAD_L + IW} y1={yFor(v)} y2={yFor(v)} stroke="rgba(26,22,14,0.06)" />
              <text x={PAD_L - 6} y={yFor(v)} textAnchor="end" dominantBaseline="middle" fontFamily={FONT_MONO} fontSize={9} fill={MUTED}>
                {v}%
              </text>
            </g>
          ))}

          {YEARS.map((y) => (
            <g key={y}>
              <line x1={xFor(y)} x2={xFor(y)} y1={PAD_T + IH} y2={PAD_T + IH + 4} stroke="rgba(26,22,14,0.15)" />
              <text x={xFor(y)} y={PAD_T + IH + 16} textAnchor="middle" fontFamily={FONT_MONO} fontSize={10} fill={MUTED}>
                {y}
              </text>
            </g>
          ))}

          {today >= firstYear && today <= lastYear && (
            <>
              <line x1={xFor(today)} x2={xFor(today)} y1={PAD_T} y2={PAD_T + IH} stroke="rgba(26,22,14,0.25)" strokeDasharray="2 3" />
              <text x={xFor(today) + 4} y={PAD_T + 10} fontFamily={FONT_MONO} fontSize={9} fill={MUTED}>today</text>
            </>
          )}

          {floorSeries && (
            <>
              <line x1={PAD_L} x2={PAD_L + IW} y1={yFor(floorSeries.floor)} y2={yFor(floorSeries.floor)} stroke={floorSeries.color} strokeDasharray="1 3" opacity={0.35} />
              <text x={PAD_L + IW - 2} y={yFor(floorSeries.floor) - 3} textAnchor="end" fontFamily={FONT_MONO} fontSize={9} fill={floorSeries.color} opacity={0.7}>
                {schedule.floorAnnotation!.label}
              </text>
            </>
          )}

          {seriesShown.map((s) => {
            const pts = s.points
              .map((p) => ({ ...p, rate: rateAt(s, p.year) }))
              .filter((p) => p.rate != null) as Array<{ year: number; status: string; amount?: number; rate: number }>;
            const path = pts
              .map((p, i) => `${i === 0 ? "M" : "L"} ${xFor(p.year).toFixed(2)} ${yFor(p.rate).toFixed(2)}`)
              .join(" ");
            return (
              <g key={s.key}>
                <path d={path} fill="none" stroke={s.color} strokeWidth={1.75} strokeDasharray={s.dashed ? "4 3" : undefined} />
                {pts.map((p) => {
                  const cx = xFor(p.year);
                  const cy = yFor(p.rate);
                  const isProjected = p.status === "Projected";
                  return (
                    <g key={p.year}>
                      <circle cx={cx} cy={cy} r={isProjected ? 3 : 4} fill={isProjected ? "#FDFAF4" : s.color} stroke={s.color} strokeWidth={1.5} />
                      <title>{`${s.label} · ${p.year} · ${p.rate.toFixed(2)}% · ${p.status}${p.amount ? ` · ${formatDemoAmount(p.amount, schedule.currency)}` : ""}`}</title>
                    </g>
                  );
                })}
              </g>
            );
          })}
        </svg>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 14, marginTop: 10 }}>
        {seriesShown.map((s) => (
          <div key={s.key} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <svg width={22} height={8}>
              <line x1={0} x2={22} y1={4} y2={4} stroke={s.color} strokeWidth={2} strokeDasharray={s.dashed ? "4 3" : undefined} />
              <circle cx={11} cy={4} r={3} fill={s.color} />
            </svg>
            <span style={{ fontFamily: FONT_MONO, fontSize: 10, color: INK }}>{s.label}</span>
          </div>
        ))}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <svg width={12} height={12}>
            <circle cx={6} cy={6} r={4} fill="#FDFAF4" stroke={MUTED} strokeWidth={1.5} />
          </svg>
          <span style={{ fontFamily: FONT_MONO, fontSize: 10, color: MUTED }}>projected period</span>
        </div>
      </div>
    </div>
  );
};
