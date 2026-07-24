import { toast } from "sonner";
import { demoProfiles, formatDemoAmount, type DemoKey } from "@/data/demoProfiles";
import { scheduleFor, computeTotals } from "@/data/decaySchedule";
import { CARDS } from "@/components/demo/DemoProfileCards";

const FONT_DISPLAY = "'Playfair Display',Georgia,serif";
const FONT_BODY = "'DM Sans',system-ui,sans-serif";
const FONT_MONO = "'DM Mono',ui-monospace,monospace";

const STATUS_COLOR: Record<string, string> = {
  Settled: "#2A6A45",
  Pending: "#C4892A",
  Attributed: "#2A5C8A",
  "Intent logged": "#5C5248",
};

export const DemoWallet = ({ profileKey }: { profileKey: DemoKey }) => {
  const schedule = scheduleFor(profileKey);
  if (!schedule) return null;

  const profile = demoProfiles[profileKey];
  const card = CARDS.find((c) => c.key === profileKey)!;
  const totals = computeTotals(schedule);
  const currency = schedule.currency;
  const recent = [...profile.executions]
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, 3);

  const onRequest = () =>
    toast.info("Settlement requests aren't wired to real payouts in this sandbox.");

  return (
    <div
      className="px-4 py-6"
      style={{
        maxWidth: 420,
        margin: "0 auto",
        fontFamily: FONT_BODY,
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}
    >
      <div
        style={{
          borderRadius: 20,
          background: `linear-gradient(160deg, ${card.accent} 0%, #1A1614 120%)`,
          color: "#FDFAF4",
          padding: "22px 22px 26px",
          boxShadow: "0 10px 30px -16px rgba(26,22,14,0.4)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 34, height: 34, borderRadius: "50%",
                background: "rgba(253,250,244,0.15)",
                border: "1px solid rgba(253,250,244,0.3)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: FONT_MONO, fontSize: 12, fontWeight: 600,
              }}
            >
              {card.initials}
            </div>
            <div>
              <div style={{ fontFamily: FONT_BODY, fontSize: 13, fontWeight: 500 }}>
                {profile.contributor.name}
              </div>
              <div style={{ fontFamily: FONT_MONO, fontSize: 9, opacity: 0.7, marginTop: 1 }}>
                {profile.contributor.id}
              </div>
            </div>
          </div>
          <div
            style={{
              fontFamily: FONT_MONO, fontSize: 9,
              padding: "3px 8px", borderRadius: 3,
              background: "rgba(253,250,244,0.12)", letterSpacing: "0.06em",
            }}
          >
            SCORE WALLET
          </div>
        </div>

        <div style={{ marginTop: 22 }}>
          <div
            style={{
              fontFamily: FONT_MONO, fontSize: 10, opacity: 0.72,
              textTransform: "uppercase", letterSpacing: "0.1em",
            }}
          >
            Available now
          </div>
          <div
            style={{
              fontFamily: FONT_DISPLAY, fontSize: 40, fontWeight: 600,
              marginTop: 6, lineHeight: 1.05, letterSpacing: "-0.01em",
            }}
          >
            {formatDemoAmount(totals.received, currency)}
          </div>
        </div>

        <div style={{ display: "flex", gap: 14, marginTop: 22 }}>
          {[
            { label: "Pending settlement", value: totals.pending },
            { label: "Projected", value: totals.projected },
          ].map((f) => (
            <div key={f.label} style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontFamily: FONT_MONO, fontSize: 9, opacity: 0.7,
                  textTransform: "uppercase", letterSpacing: "0.08em",
                }}
              >
                {f.label}
              </div>
              <div
                style={{
                  fontFamily: FONT_MONO, fontSize: 16, marginTop: 4,
                  whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                }}
              >
                {formatDemoAmount(f.value, currency)}
              </div>
            </div>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={onRequest}
        style={{
          background: card.accent, color: "#FDFAF4", border: "none",
          borderRadius: 999, padding: "14px 20px",
          fontFamily: FONT_BODY, fontSize: 14, fontWeight: 600, cursor: "pointer",
          boxShadow: "0 6px 16px -10px rgba(26,22,14,0.4)",
        }}
      >
        Request settlement
      </button>

      <div
        style={{
          borderRadius: 16, background: "#FDFAF4",
          border: "1px solid rgba(26,22,14,0.08)", padding: "16px 18px",
        }}
      >
        <div
          style={{
            fontFamily: FONT_MONO, fontSize: 9, color: "#9A8F84",
            textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12,
          }}
        >
          Recent activity
        </div>
        {recent.length === 0 ? (
          <div style={{ fontSize: 12, color: "#5C5248" }}>No settlement events yet.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {recent.map((e, i) => {
              const color = STATUS_COLOR[e.status] ?? "#5C5248";
              return (
                <div key={`${e.title}-${i}`} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div
                    style={{
                      width: 34, height: 34, borderRadius: "50%",
                      background: `${color}1A`, color,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontFamily: FONT_MONO, fontSize: 12, flexShrink: 0,
                    }}
                  >
                    {e.status === "Settled" ? "\u2193" : e.status === "Pending" ? "\u2026" : "\u2022"}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontFamily: FONT_BODY, fontSize: 13, color: "#1A1614",
                        whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                      }}
                    >
                      {e.title}
                    </div>
                    <div style={{ fontFamily: FONT_MONO, fontSize: 9, color: "#9A8F84", marginTop: 2 }}>
                      {e.date} · <span style={{ color }}>{e.status}</span>
                    </div>
                  </div>
                  <div
                    style={{ fontFamily: FONT_MONO, fontSize: 13, color: "#1A1614", whiteSpace: "nowrap" }}
                  >
                    {e.amount != null ? formatDemoAmount(e.amount, e.currency) : "—"}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div
        style={{
          fontFamily: FONT_MONO, fontSize: 9, color: "#9A8F84",
          textAlign: "center", lineHeight: 1.6, padding: "0 12px",
        }}
      >
        Demo wallet · not a real mobile-money account.
      </div>
    </div>
  );
};