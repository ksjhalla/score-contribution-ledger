import { demoProfiles } from "@/data/demoProfiles";
import { AgriDecayTimeline } from "@/components/demo/AgriDecayTimeline";

const FONT_DISPLAY = "'Playfair Display',Georgia,serif";
const FONT_BODY = "'DM Sans',system-ui,sans-serif";
const FONT_MONO = "'DM Mono',ui-monospace,monospace";
const ACCENT = "#5C7A3A";
const AMBER = "#C4892A";
const GREEN = "#2A6A45";
const INK = "#1A1614";
const MUTED = "#9A8F84";
const BORDER = "rgba(26,22,14,0.10)";

type Row = {
  year: number;
  label: string;
  ratePct: number;
  status: "Received" | "Pending" | "Projected";
  amount: number | null;
  proof?: string;
};

// Kaptumo premium pool — 8% starting, 15%/yr linear decay, 3% floor,
// first delivery 2022. rate(n) = max(8 - 15%*8*(n-0), 3) = max(8*(1 - 0.15*n), 3).
const kaptumoRate = (yearsSinceStart: number) =>
  Math.max(8 * (1 - 0.15 * yearsSinceStart), 3);

const kaptumoSchedule: Row[] = [
  { year: 2022, label: "Season 2022 · Lot KMT-2022-011", ratePct: kaptumoRate(0), status: "Received", amount: 58000, proof: "M-PESA · sha256: 2c8b5f…" },
  { year: 2023, label: "Season 2023 · Lot KMT-2023-019", ratePct: kaptumoRate(1), status: "Received", amount: 68000, proof: "M-PESA · sha256: 7d1e4a…" },
  { year: 2024, label: "Season 2024 · Lot KMT-2024-007", ratePct: kaptumoRate(2), status: "Pending", amount: 62000, proof: "NCE Week 18 · awaiting M-PESA" },
  { year: 2025, label: "Season 2025 (projected)", ratePct: kaptumoRate(3), status: "Projected", amount: null },
  { year: 2026, label: "Season 2026 (projected)", ratePct: kaptumoRate(4), status: "Projected", amount: null },
  { year: 2027, label: "Season 2027 (projected · at floor)", ratePct: kaptumoRate(5), status: "Projected", amount: null },
];

// Derivative rate — 3% starting, 20%/yr linear decay from licence execution.
// Capped at KES 5,000 per derivative per season.
const derivativeRate = (yearsSinceExec: number) =>
  Math.max(3 * (1 - 0.2 * yearsSinceExec), 0);

type Licence = {
  name: string;
  fingerprint: string;
  executed: string;
  execYear: number;
  seasons: Array<{ year: number; status: Row["status"]; amount: number | null; note?: string }>;
};

const licences: Licence[] = [
  {
    name: "Kabitet Cooperative Society",
    fingerprint: "sha256: 4f7a1c… → 9b4e2a1c…",
    executed: "14 Apr 2023",
    execYear: 2023,
    seasons: [
      { year: 2023, status: "Received", amount: 14200, note: "M-PESA settled" },
      { year: 2024, status: "Pending", amount: 11400, note: "awaiting Kabitet NCE settlement" },
      { year: 2025, status: "Projected", amount: null },
    ],
  },
  {
    name: "Cheptebo Cooperative Society",
    fingerprint: "sha256: 8c2e5b… → 9b4e2a1c…",
    executed: "22 Feb 2024",
    execYear: 2024,
    seasons: [
      { year: 2024, status: "Pending", amount: 13800, note: "awaiting Cheptebo NCE settlement" },
      { year: 2025, status: "Projected", amount: null },
      { year: 2026, status: "Projected", amount: null },
    ],
  },
];

const fmtKES = (v: number | null) =>
  v == null ? "—" : v >= 1000 ? `KSh${(v / 1000).toFixed(v % 1000 === 0 ? 0 : 1)}K` : `KSh${v.toLocaleString()}`;

const statusPill = (status: Row["status"]) => {
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

const ScheduleTable = () => {
  const years = [2022, 2023, 2024, 2025, 2026, 2027];

  const getPrimary = (year: number) => {
    const row = kaptumoSchedule.find((r) => r.year === year);
    return row
      ? { rate: row.ratePct, amount: row.amount }
      : { rate: kaptumoRate(year - 2022), amount: null };
  };

  const getDerivative = (licence: Licence, year: number) => {
    const season = licence.seasons.find((s) => s.year === year);
    const rate = derivativeRate(year - licence.execYear);
    return { rate, amount: season?.amount ?? null };
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
              <th style={thRight}>Primary rate</th>
              <th style={thRight}>Primary value</th>
              {licences.map((l) => {
                const short = l.name.replace(" Cooperative Society", "");
                return (
                  <>
                    <th key={`${l.name}-rate`n style={thRight}>{short} rate</th>
                    <th key={`${l.name}-value`} style={thRight}>{short} value</th>
                  </>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {years.map((year) => {
              const primary = getPrimary(year);
              return (
                <tr key={year} style={{ borderBottom: `1px solid ${BORDER}` }}>
                  <td style={{ padding: "8px 10px", fontFamily: FONT_MONO, fontSize: 11, color: INK }}>{year}</td>
                  <td style={{ padding: "8px 10px", textAlign: "right", fontFamily: FONT_MONO, fontSize: 11, color: INK }}>
                    {primary.rate.toFixed(2)}%
                  </td>
                  <td
                    style={{
                      padding: "8px 10px",
                      textAlign: "right",
                      fontFamily: FONT_MONO,
                      fontSize: 11,
                      color: primary.amount ? GREEN : MUTED,
                    }}
                  >
                    {fmtKES(primary.amount)}
                  </td>
                  {licences.map((l) => {
                    const d = getDerivative(l, year);
                    return (
                      <>
                        <td
                          key={`${l.name}-${year}-rate`}
                          style={{
                            padding: "8px 10px",
                            textAlign: "right",
                            fontFamily: FONT_MONO,
                            fontSize: 11,
                            color: INK,
                          }}
                        >
                          {d.rate.toFixed(2)}%
                        </td>
                        <td
                          key={`${l.name}-${year}-value`}
                          style={{
                            padding: "8px 10px",
                            textAlign: "right",
                            fontFamily: FONT_MONO,
                            fontSize: 11,
                            color: d.amount ? AMBER : MUTED,
                          }}
                        >
                          {fmtKES(d.amount)}
                        </td>
                      </>
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

      <AgriDecayTimeline />

      <ScheduleTable />

      {/* Primary contract — Kaptumo premium pool with vesting/decay table */}
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
          {kaptumoSchedule.map((r) => (
            <div
              key={r.year}
              style={{
                display: "grid",
                gridTemplateColumns: "48px 1fr 90px 84px 90px",
                alignItems: "center",
                gap: 10,
                padding: "8px 10px",
                background: r.status === "Projected" ? "transparent" : "rgba(92,122,58,0.04)",
                border: `1px solid ${r.status === "Projected" ? "rgba(26,22,14,0.06)" : "rgba(92,122,58,0.15)"}`,
                borderRadius: 4,
              }}
            >
              <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: INK }}>{r.year}</div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: INK, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {r.label}
                </div>
                {r.proof && (
                  <div style={{ fontFamily: FONT_MONO, fontSize: 9, color: MUTED, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {r.proof}
                  </div>
                )}
              </div>
              <div>
                <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: MUTED, marginBottom: 3 }}>
                  {r.ratePct.toFixed(2)}% pool
                </div>
                <DecayBar pct={r.ratePct} max={kaptumoMax} accent={ACCENT} />
              </div>
              <div style={{ fontFamily: FONT_MONO, fontSize: 12, color: r.status === "Received" ? GREEN : r.status === "Pending" ? AMBER : MUTED, textAlign: "right" }}>
                {fmtKES(r.amount)}
              </div>
              <div style={{ textAlign: "right" }}>{statusPill(r.status)}</div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 10, fontFamily: FONT_MONO, fontSize: 9, color: MUTED }}>
          Buyout available at 4× cumulative earnings · rate floor engages Season 2027.
        </div>
      </div>

      {/* Derivative licence contract with linkage diagram */}
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
              {licences.map((l) => (
                <div
                  key={l.name}
                  style={{
                    padding: "8px 10px",
                    background: "#FDFAF4",
                    border: `1px solid ${BORDER}`,
                    borderLeft: `2px solid ${AMBER}`,
                    borderRadius: 4,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "baseline" }}>
                    <div style={{ fontFamily: FONT_BODY, fontSize: 12, fontWeight: 600, color: INK }}>{l.name}</div>
                    <div style={{ fontFamily: FONT_MONO, fontSize: 9, color: MUTED }}>Exec {l.executed}</div>
                  </div>
                  <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: MUTED, marginTop: 2 }}>
                    {l.fingerprint}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Per-licence decay & vesting */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {licences.map((l) => (
            <div key={l.name}>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 6, gap: 8, flexWrap: "wrap" }}>
                <div style={{ fontFamily: FONT_BODY, fontSize: 12, fontWeight: 600, color: INK }}>
                  {l.name} · vesting
                </div>
                <div style={{ fontFamily: FONT_MONO, fontSize: 9, color: MUTED }}>
                  T₀ = {l.executed}
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {l.seasons.map((s) => {
                  const rate = derivativeRate(s.year - l.execYear);
                  return (
                    <div
                      key={s.year}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "48px 1fr 90px 84px 90px",
                        alignItems: "center",
                        gap: 10,
                        padding: "6px 10px",
                        background: s.status === "Projected" ? "transparent" : "rgba(122,92,42,0.04)",
                        border: `1px solid ${s.status === "Projected" ? "rgba(26,22,14,0.06)" : "rgba(122,92,42,0.15)"}`,
                        borderRadius: 4,
                      }}
                    >
                      <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: INK }}>{s.year}</div>
                      <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: MUTED, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        Season {s.year - l.execYear + 1}
                        {s.note ? ` · ${s.note}` : ""}
                      </div>
                      <div>
                        <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: MUTED, marginBottom: 3 }}>
                          {rate.toFixed(2)}% pool
                        </div>
                        <DecayBar pct={rate} max={derivMax} accent={AMBER} />
                      </div>
                      <div style={{ fontFamily: FONT_MONO, fontSize: 12, color: s.status === "Received" ? GREEN : s.status === "Pending" ? AMBER : MUTED, textAlign: "right" }}>
                        {fmtKES(s.amount)}
                      </div>
                      <div style={{ textAlign: "right" }}>{statusPill(s.status)}</div>
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
    </div>
  );
};