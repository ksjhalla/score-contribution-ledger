import type { DemoProfile } from "@/data/demoProfiles";
import { formatDemoAmount } from "@/data/demoProfiles";
import { ValueEventCard } from "@/components/value-events/ValueEventCard";
import { ValueMixDonut } from "@/components/charts/ValueMixDonut";
import { ContractSparkBars } from "@/components/charts/ContractSparkBars";
import { QuickReadPanel } from "@/components/charts/QuickReadPanel";
import { MilestoneArc } from "@/components/charts/MilestoneArc";
import { Droplets, Leaf, Network, Code2, GitFork, Brain } from "lucide-react";

const FONT_DISPLAY = "'Playfair Display',Georgia,serif";
const FONT_BODY = "'DM Sans',system-ui,sans-serif";
const FONT_MONO = "'DM Mono',ui-monospace,monospace";

const STATUS_COLOR: Record<string, string> = {
  Settled: "#2A6A45",
  Pending: "#C4892A",
  Attributed: "#2A5C8A",
};

export const DemoPassportView = ({ profile }: { profile: DemoProfile }) => {
  const { contributor, stats, contracts, whatChanged, accent, valueMix, bars, quickRead, milestones, bio, badges, valueStreams } = profile;
  return (
    <div className="px-4 sm:px-6 py-6 sm:py-8" style={{ maxWidth: 920, margin: "0 auto", fontFamily: FONT_BODY }}>
      <div style={{ marginBottom: 20 }}>
        <div
          style={{
            fontFamily: FONT_MONO,
            fontSize: 9,
            color: accent,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
          }}
        >
          Passport · {contributor.id}
        </div>
        <h2
          style={{
            fontFamily: FONT_DISPLAY,
            fontSize: 28,
            fontWeight: 600,
            margin: "6px 0 4px",
            color: "#1A1614",
          }}
        >
          {contributor.name}
        </h2>
        <div style={{ fontSize: 13, color: "#5C5248" }}>
          {contributor.role} · {contributor.org} · {contributor.sector}
        </div>
        {bio && (
          <div
            style={{
              marginTop: 14,
              border: "1px solid rgba(26,22,14,0.10)",
              borderLeft: `3px solid ${accent}`,
              borderRadius: 5,
              background: "#FDFAF4",
              padding: "14px 16px",
              fontSize: 13,
              lineHeight: 1.7,
              color: "#1A1614",
            }}
          >
            {bio}
            {badges && badges.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 12 }}>
                {badges.map((b) => (
                  <span
                    key={b}
                    style={{
                      fontFamily: FONT_MONO,
                      fontSize: 9,
                      color: accent,
                      background: "rgba(74,120,74,0.08)",
                      border: `1px solid ${accent}33`,
                      borderRadius: 3,
                      padding: "3px 8px",
                    }}
                  >
                    {b}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3" style={{ marginBottom: 28 }}>
        {[
          { label: "Settled", value: formatDemoAmount(stats.settled, stats.currency), color: "#2A6A45" },
          { label: "Pending", value: formatDemoAmount(stats.pending, stats.currency), color: "#C4892A" },
          { label: "Contracts", value: String(stats.contracts), color: accent },
          { label: "Executions", value: String(stats.executions), color: "#1A1614" },
        ].map((s) => (
          <div
            key={s.label}
            style={{
              border: "1px solid rgba(26,22,14,0.10)",
              borderRadius: 6,
              background: "#FDFAF4",
              padding: "14px 16px",
            }}
          >
            <div
              style={{
                fontFamily: FONT_MONO,
                fontSize: 9,
                color: "#9A8F84",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              {s.label}
            </div>
            <div style={{ fontFamily: FONT_MONO, fontSize: 18, color: s.color, marginTop: 4 }}>
              {s.value}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5" style={{ marginBottom: 28 }}>
        <div style={{ border: "1px solid rgba(26,22,14,0.10)", borderRadius: 6, background: "#FDFAF4", padding: "14px 16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <span style={{ fontFamily: FONT_MONO, fontSize: 9, color: "#9A8F84", textTransform: "uppercase", letterSpacing: "0.06em" }}>Value mix</span>
            <span style={{ fontFamily: FONT_MONO, fontSize: 9, color: "#2A5C8A", background: "rgba(42,92,138,0.08)", padding: "2px 6px", borderRadius: 3 }}>At a glance</span>
          </div>
          <ValueMixDonut {...valueMix} />
        </div>
        <div style={{ border: "1px solid rgba(26,22,14,0.10)", borderRadius: 6, background: "#FDFAF4", padding: "14px 16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <span style={{ fontFamily: FONT_MONO, fontSize: 9, color: "#9A8F84", textTransform: "uppercase", letterSpacing: "0.06em" }}>By contract</span>
            <span style={{ fontFamily: FONT_MONO, fontSize: 9, color: "#2A6A45", background: "rgba(42,106,69,0.08)", padding: "2px 6px", borderRadius: 3 }}>{bars.length} tracked</span>
          </div>
          <ContractSparkBars contracts={bars} currency={valueMix.currency} />
        </div>
      </div>

      <h3
        style={{
          fontFamily: FONT_DISPLAY,
          fontSize: 20,
          fontWeight: 600,
          margin: "0 0 12px",
        }}
      >
        What changed
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-[3fr_2fr] gap-3.5" style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {whatChanged.map((c, i) => (
            <ValueEventCard
              key={`${c.headline}-${i}`}
              amount={c.amount}
              currency={c.currency}
              headline={c.headline}
              subheadline={c.subheadline}
              status={c.status}
              confidence={c.confidence}
              trigger={c.trigger}
              resolver={c.resolver}
              evidence_count={c.evidence_count}
              expected_resolution={c.expected_resolution}
            />
          ))}
        </div>
        <QuickReadPanel rows={quickRead} />
      </div>

      <h3
        style={{
          fontFamily: FONT_DISPLAY,
          fontSize: 18,
          fontWeight: 600,
          margin: "0 0 12px",
        }}
      >
        {valueStreams ? "Value streams" : "Contracts"}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5" style={{ marginBottom: 28, alignItems: "start" }}>
      {valueStreams ? (
        <div
          style={{
            border: "1px solid rgba(26,22,14,0.10)",
            borderRadius: 6,
            background: "#FDFAF4",
            padding: 16,
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          {valueStreams.map((s) => {
            const Icon =
              s.icon === "droplets" ? Droplets :
              s.icon === "leaf" ? Leaf :
              s.icon === "code" ? Code2 :
              s.icon === "git-fork" ? GitFork :
              s.icon === "brain" ? Brain :
              Network;
            return (
              <div key={s.name} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <Icon size={18} color={s.iconColor} style={{ flexShrink: 0, marginTop: 2 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
                    <div style={{ fontFamily: FONT_BODY, fontSize: 13, fontWeight: 600, color: "#1A1614" }}>{s.name}</div>
                    <div style={{ fontFamily: FONT_MONO, fontSize: 12, color: "#1A1614", whiteSpace: "nowrap" }}>{s.value}</div>
                  </div>
                  <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: "#5C5248", marginTop: 4, lineHeight: 1.6 }}>
                    {s.description}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {contracts.map((c) => (
          <div
            key={c.name}
            style={{
              border: "1px solid rgba(26,22,14,0.10)",
              borderLeft: `3px solid ${accent}`,
              borderRadius: 5,
              background: "#FDFAF4",
              padding: "14px 16px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
              <div style={{ fontWeight: 600, fontSize: 14, color: "#1A1614" }}>{c.name}</div>
              <span
                style={{
                  fontFamily: FONT_MONO,
                  fontSize: 9,
                  color: accent,
                  background: "rgba(0,0,0,0.03)",
                  padding: "2px 6px",
                  borderRadius: 3,
                  whiteSpace: "nowrap",
                  alignSelf: "flex-start",
                }}
              >
                {c.status}
              </span>
            </div>
            <div style={{ fontSize: 12, color: "#5C5248", marginTop: 4 }}>
              {c.counterparty} · {c.stake_type}
            </div>
            <div style={{ fontSize: 13, color: "#1A1614", marginTop: 8, lineHeight: 1.6 }}>
              {c.entitlement}
            </div>
            <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: "#9A8F84", marginTop: 6 }}>
              Trigger: {c.trigger}
            </div>
          </div>
        ))}
      </div>
      )}
        <div>
          <div style={{ fontFamily: FONT_MONO, fontSize: 9, color: "#9A8F84", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Milestone arc</div>
          <MilestoneArc milestones={milestones} />
        </div>
      </div>
    </div>
  );
};
