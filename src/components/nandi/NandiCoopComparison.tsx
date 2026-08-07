export type NandiCooperative = {
  key: string;
  name: string;
  county: string;
  member_count: number | null;
  value_tracked_ksh: number | null;
  traceability_pct: number | null;
  is_pilot: boolean;
  note: string | null;
  sort_order: number;
};

export const eudrReadiness = (pct: number | null) => {
  const p = Number(pct ?? 0);
  if (p >= 70) return { label: "Ready", cls: "green" as const };
  if (p >= 50) return { label: "Partial", cls: "amber" as const };
  return { label: "Not yet", cls: "red" as const };
};

const pctBar = (pct: number | null, color: string) => (
  <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 120 }}>
    <div style={{ flex: 1, height: 6, borderRadius: 3, background: "rgba(26,22,20,.08)", overflow: "hidden" }}>
      <div style={{ width: `${Math.max(0, Math.min(100, Number(pct ?? 0)))}%`, height: "100%", background: color }} />
    </div>
    <span className="mono" style={{ fontSize: 11 }}>{pct == null ? "—" : `${Math.round(Number(pct))}%`}</span>
  </div>
);

/** Sourcing / compliance readiness table — Trader view. */
export const CoopComplianceTable = ({ coops }: { coops: NandiCooperative[] }) => (
  <div>
    <h4 className="sub">Cooperative sourcing readiness · Nandi County</h4>
    <p className="body">
      Which cooperatives are documentation-ready to source from this season. Only Kaptumo — the active pilot — carries
      instrumented, trigger-level evidence; the rest are shown for comparison at scale.
    </p>
    <div className="scroll">
      <table>
        <thead>
          <tr><th>Cooperative</th><th>Members</th><th>Traceability</th><th>EUDR readiness</th><th>Instrumented</th></tr>
        </thead>
        <tbody>
          {coops.map((c) => {
            const r = eudrReadiness(c.traceability_pct);
            return (
              <tr key={c.key}>
                <td>
                  {c.name}
                  {c.is_pilot && <span className="pill" style={{ marginLeft: 6, color: "#5C7A3A", background: "rgba(92,122,58,.10)" }}>PILOT</span>}
                </td>
                <td className="mono">{c.member_count ?? "—"}</td>
                <td>{pctBar(c.traceability_pct, r.cls === "green" ? "#2A6A45" : r.cls === "amber" ? "#C4892A" : "#8A2A20")}</td>
                <td className={r.cls}>{r.label}</td>
                <td className={c.is_pilot ? "green" : "amber"}>{c.is_pilot ? "Trigger-level evidence" : "Not yet onboarded"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
    <div className="note gap">
      <strong>Illustrative scoring logic.</strong> Readiness bands (≥70% Ready, 50–69% Partial, &lt;50% Not yet) are a
      placeholder heuristic for this sandbox, not an EUDR-certified assessment. Only Kaptumo's percentage is derived from
      tracked triggers; the other three cooperatives are illustrative and not yet onboarded.
    </div>
  </div>
);

/** Sourcing-mix breakdown — Brand view. */
export const CoopSourcingMix = ({ coops }: { coops: NandiCooperative[] }) => {
  const total = coops.reduce((a, c) => a + Number(c.member_count ?? 0), 0) || 1;
  return (
    <div>
      <h4 className="sub">Sourcing mix across Nandi pilot-adjacent cooperatives</h4>
      <p className="body">
        Where the volume behind a disclosure would come from, weighted by membership. This is Nandi County only — a
        single-origin pilot, not a multi-country sourcing footprint.
      </p>
      <div className="scroll">
        <table>
          <thead>
            <tr><th>Cooperative</th><th>Members</th><th>Share of pilot membership</th><th>Attribution coverage</th><th>Status</th></tr>
          </thead>
          <tbody>
            {coops.map((c) => {
              const share = Math.round((Number(c.member_count ?? 0) / total) * 100);
              return (
                <tr key={c.key}>
                  <td>{c.name}</td>
                  <td className="mono">{c.member_count ?? "—"}</td>
                  <td>{pctBar(share, "#5C7A3A")}</td>
                  <td className={c.is_pilot ? "green" : "amber"}>{c.traceability_pct == null ? "—" : `${Math.round(Number(c.traceability_pct))}%`}</td>
                  <td className={c.is_pilot ? "green" : "amber"}>{c.is_pilot ? "Live pilot" : "Illustrative"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="note gap">
        <strong>Only Kaptumo is live.</strong> The other three cooperatives are illustrative and not yet onboarded — included
        to show what a cooperative-to-cooperative sourcing mix looks like once Phase 1 covers five cooperatives.
      </div>
    </div>
  );
};

/** Instrumentation coverage — Development Partner view. */
export const CoopInstrumentationTable = ({
  coops,
  strongPct,
  gapCount,
  triggerCount,
}: {
  coops: NandiCooperative[];
  strongPct: number;
  gapCount: number;
  triggerCount: number;
}) => (
  <div>
    <h4 className="sub">Verification confidence by cooperative</h4>
    <p className="body">
      Confidence tiers are only computable where triggers are instrumented. Rather than fabricate a score for cooperatives
      that have no data yet, they are reported as not yet instrumented.
    </p>
    <div className="scroll">
      <table>
        <thead>
          <tr><th>Cooperative</th><th>Members</th><th>Instrumentation</th><th>Tracked triggers</th><th>Strong or better</th><th>Open gaps</th></tr>
        </thead>
        <tbody>
          {coops.map((c) => (
            <tr key={c.key}>
              <td>
                {c.name}
                {c.is_pilot && <span className="pill" style={{ marginLeft: 6, color: "#5C7A3A", background: "rgba(92,122,58,.10)" }}>PILOT</span>}
              </td>
              <td className="mono">{c.member_count ?? "—"}</td>
              <td className={c.is_pilot ? "green" : "amber"}>{c.is_pilot ? "Instrumented" : "Not yet instrumented"}</td>
              <td className="mono">{c.is_pilot ? triggerCount : "—"}</td>
              <td className={c.is_pilot ? "green" : ""}>{c.is_pilot ? `${strongPct}%` : "No data"}</td>
              <td className={c.is_pilot && gapCount ? "red" : ""}>{c.is_pilot ? gapCount : "No data"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);
