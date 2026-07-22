const FONT_BODY = "'DM Sans',system-ui,sans-serif";
const FONT_MONO = "'DM Mono',ui-monospace,monospace";
const MUTED = "#9A8F84";
const INK = "#1A1614";

type Series = {
  key: string;
  label: string;
  color: string;
  dashed?: boolean;
  startYear: number; // T0
  startRate: number; // %
  decayPerYr: number; // fraction, e.g. 0.15
  floor: number;
  points: { year: number; status: "Received" | "Pending" | "Projected"; amount?: number }[];
};

const rateAt = (s: Series, year: number) => {
  if (year < s.startYear) return null;
  const n = year - s.startYear;
  return Math.max(s.startRate * (1 - s.decayPerYr * n), s.floor);
};

const SERIES: Series[] = [
  {
    key: "kaptumo",
    label: "Kaptumo premium pool",
    color: "#5C7A3A",
    startYear: 2022,
    startRate: 8,
    decayPerYr: 0.15,
    floor: 3,
    points: [
      { year: 2022, status: "Received", amount: 58000 },
      { year: 2023, status: "Received", amount: 68000 },
      { year: 2024, status: "Pending", amount: 62000 },
      { year: 2025, status: "Projected" },
      { year: 2026, status: "Projected" },
      { year: 2027, status: "Projected" },
    ],
  },
  {
    key: "kabitet",
    label: "Kabitet derivative licence",
    color: "#C4892A",
    dashed: true,
    startYear: 2023,
    startRate: 3,
    decayPerYr: 0.2,
    floor: 0,
    points: [
      { year: 2023, status: "Received", amount: 14200 },
      { year: 2024, status: "Pending", amount: 11400 },
      { year: 2025, status: "Projected" },
    ],
  },
  {
    key: "cheptebo",
    label: "Cheptebo derivative licence",
    color: "#2A5C8A",
    dashed: true,
    startYear: 2024,
    startRate: 3,
    decayPerYr: 0.2,
    floor: 0,
    points: [
      { year: 2024, status: "Pending", amount: 13800 },
      { year: 2025, status: "Projected" },
      { year: 2026, status: "Projected" },
    ],
  },
];

const YEARS = [2022, 2023, 2024, 2025, 2026, 2027];
const Y_MAX = 8;

// Layout
const W = 640;
const H = 220;
const PAD_L = 34;
const PAD_R = 12;
const PAD_T = 14;
const PAD_B = 28;
const IW = W - PAD_L - PAD_R;
const IH = H - PAD_T - PAD_B;

const xFor = (year: number) =>
  PAD_L + ((year - YEARS[0]) / (YEARS[YEARS.length - 1] - YEARS[0])) * IW;
const yFor = (rate: number) => PAD_T + IH - (rate / Y_MAX) * IH;

export const AgriDecayTimeline = () => {
  const today = 2024;
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
          entitlement rate (%) · 2022 – 2027
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
          {/* Gridlines + Y ticks */}
          {[0, 2, 4, 6, 8].map((v) => (
            <g key={v}>
              <line
                x1={PAD_L}
                x2={PAD_L + IW}
                y1={yFor(v)}
                y2={yFor(v)}
                stroke="rgba(26,22,14,0.06)"
              />
              <text
                x={PAD_L - 6}
                y={yFor(v)}
                textAnchor="end"
                dominantBaseline="middle"
                fontFamily="'DM Mono',ui-monospace,monospace"
                fontSize={9}
                fill={MUTED}
              >
                {v}%
              </text>
            </g>
          ))}

          {/* X ticks / year labels */}
          {YEARS.map((y) => (
            <g key={y}>
              <line
                x1={xFor(y)}
                x2={xFor(y)}
                y1={PAD_T + IH}
                y2={PAD_T + IH + 4}
                stroke="rgba(26,22,14,0.15)"
              />
              <text
                x={xFor(y)}
                y={PAD_T + IH + 16}
                textAnchor="middle"
                fontFamily="'DM Mono',ui-monospace,monospace"
                fontSize={10}
                fill={MUTED}
              >
                {y}
              </text>
            </g>
          ))}

          {/* Today marker */}
          <line
            x1={xFor(today)}
            x2={xFor(today)}
            y1={PAD_T}
            y2={PAD_T + IH}
            stroke="rgba(26,22,14,0.25)"
            strokeDasharray="2 3"
          />
          <text
            x={xFor(today) + 4}
            y={PAD_T + 10}
            fontFamily="'DM Mono',ui-monospace,monospace"
            fontSize={9}
            fill={MUTED}
          >
            today
          </text>

          {/* Floor line for primary (3%) */}
          <line
            x1={PAD_L}
            x2={PAD_L + IW}
            y1={yFor(3)}
            y2={yFor(3)}
            stroke="#5C7A3A"
            strokeDasharray="1 3"
            opacity={0.35}
          />
          <text
            x={PAD_L + IW - 2}
            y={yFor(3) - 3}
            textAnchor="end"
            fontFamily="'DM Mono',ui-monospace,monospace"
            fontSize={9}
            fill="#5C7A3A"
            opacity={0.7}
          >
            Kaptumo floor 3%
          </text>

          {/* Series */}
          {SERIES.map((s) => {
            const pts = s.points
              .map((p) => ({ ...p, rate: rateAt(s, p.year) }))
              .filter((p) => p.rate != null) as Array<{ year: number; status: string; amount?: number; rate: number }>;
            const path = pts
              .map((p, i) => `${i === 0 ? "M" : "L"} ${xFor(p.year).toFixed(2)} ${yFor(p.rate).toFixed(2)}`)
              .join(" ");
            return (
              <g key={s.key}>
                <path
                  d={path}
                  fill="none"
                  stroke={s.color}
                  strokeWidth={1.75}
                  strokeDasharray={s.dashed ? "4 3" : undefined}
                />
                {pts.map((p) => {
                  const cx = xFor(p.year);
                  const cy = yFor(p.rate);
                  const isProjected = p.status === "Projected";
                  return (
                    <g key={p.year}>
                      <circle
                        cx={cx}
                        cy={cy}
                        r={isProjected ? 3 : 4}
                        fill={isProjected ? "#FDFAF4" : s.color}
                        stroke={s.color}
                        strokeWidth={1.5}
                      />
                      <title>{`${s.label} · ${p.year} · ${p.rate.toFixed(2)}% · ${p.status}${p.amount ? ` · KSh${(p.amount/1000).toFixed(1)}K` : ""}`}</title>
                    </g>
                  );
                })}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Legend */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 14, marginTop: 10 }}>
        {SERIES.map((s) => (
          <div key={s.key} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <svg width={22} height={8}>
              <line
                x1={0}
                x2={22}
                y1={4}
                y2={4}
                stroke={s.color}
                strokeWidth={2}
                strokeDasharray={s.dashed ? "4 3" : undefined}
              />
              <circle cx={11} cy={4} r={3} fill={s.color} />
            </svg>
            <span style={{ fontFamily: FONT_MONO, fontSize: 10, color: INK }}>{s.label}</span>
          </div>
        ))}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <svg width={12} height={12}>
            <circle cx={6} cy={6} r={4} fill="#FDFAF4" stroke={MUTED} strokeWidth={1.5} />
          </svg>
          <span style={{ fontFamily: FONT_MONO, fontSize: 10, color: MUTED }}>projected season</span>
        </div>
      </div>
    </div>
  );
};