import type { SiteUptime } from "@/data/demoProfiles";

const FONT_DISPLAY = "'Playfair Display',Georgia,serif";
const FONT_BODY = "'DM Sans',system-ui,sans-serif";
const FONT_MONO = "'DM Mono',ui-monospace,monospace";

const STATUS_COLOR: Record<SiteUptime["status"], string> = {
  "Bonus driver": "#2A6A45",
  "On track": "#5C5248",
  Watch: "#C4892A",
};

const SLA = 99.0;
const RANGE_MIN = 98.0;
const RANGE_MAX = 100.0;

export const SiteUptimeBreakdown = ({
  sites,
  accent,
}: {
  sites: SiteUptime[];
  accent: string;
}) => {
  const totalHouseholds = sites.reduce((s, x) => s + x.households, 0);
  const weighted = sites.reduce((s, x) => s + x.uptimePct * x.households, 0) / Math.max(totalHouseholds, 1);
  const aboveSla = sites.filter((s) => s.uptimePct >= SLA).length;
  const watch = sites.filter((s) => s.status === "Watch").length;

  return (
    <section style={{ marginBottom: 28, fontFamily: FONT_BODY }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4, flexWrap: "wrap", gap: 8 }}>
        <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: 20, fontWeight: 600, margin: 0, color: "#1A1614" }}>
          Site uptime · 12 villages
        </h3>
        <span
          style={{
            fontFamily: FONT_MONO,
            fontSize: 9,
            color: accent,
            background: "rgba(0,0,0,0.03)",
            padding: "2px 6px",
            borderRadius: 3,
          }}
        >
          Weighted {weighted.toFixed(2)}% · {aboveSla}/12 above {SLA}% SLA · {watch} on watch
        </span>
      </div>
      <p style={{ fontSize: 12, color: "#5C5248", margin: "0 0 14px", maxWidth: 720, lineHeight: 1.6 }}>
        Drivers behind the 99.2% programme-level grid availability that triggered the pending performance bonus.
        Bars scale {RANGE_MIN}–{RANGE_MAX}%; SLA line at {SLA}%.
      </p>

      <div
        style={{
          border: "1px solid rgba(26,22,14,0.10)",
          borderRadius: 6,
          background: "#FDFAF4",
          padding: "12px 16px",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {sites.map((s) => {
            const color = STATUS_COLOR[s.status];
            const pct = Math.max(0, Math.min(1, (s.uptimePct - RANGE_MIN) / (RANGE_MAX - RANGE_MIN)));
            const slaPct = (SLA - RANGE_MIN) / (RANGE_MAX - RANGE_MIN);
            return (
              <div
                key={s.village}
                style={{
                  display: "grid",
                  gridTemplateColumns: "minmax(0,1.4fr) minmax(140px,2fr) auto",
                  gap: 12,
                  alignItems: "center",
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#1A1614" }}>{s.village}</div>
                  <div style={{ fontFamily: FONT_MONO, fontSize: 9, color: "#9A8F84", marginTop: 2 }}>
                    {s.households} households · SAIDI {s.saidiHours.toFixed(1)}h
                  </div>
                  {s.note && (
                    <div style={{ fontSize: 11, color: "#5C5248", marginTop: 2, fontStyle: "italic" }}>
                      {s.note}
                    </div>
                  )}
                </div>
                <div
                  style={{
                    position: "relative",
                    height: 8,
                    background: "rgba(26,22,14,0.06)",
                    borderRadius: 4,
                    overflow: "hidden",
                  }}
                  aria-label={`${s.village} uptime ${s.uptimePct}%`}
                >
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      width: `${pct * 100}%`,
                      background: color,
                      borderRadius: 4,
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      top: -2,
                      bottom: -2,
                      left: `${slaPct * 100}%`,
                      width: 1,
                      background: "rgba(26,22,14,0.45)",
                    }}
                    aria-hidden
                  />
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2, flexShrink: 0 }}>
                  <span style={{ fontFamily: FONT_MONO, fontSize: 12, color: "#1A1614" }}>
                    {s.uptimePct.toFixed(1)}%
                  </span>
                  <span
                    style={{
                      fontFamily: FONT_MONO,
                      fontSize: 8,
                      color,
                      background: `${color}14`,
                      border: `1px solid ${color}33`,
                      padding: "1px 5px",
                      borderRadius: 3,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {s.status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};