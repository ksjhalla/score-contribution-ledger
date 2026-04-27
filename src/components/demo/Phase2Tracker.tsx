import type { Phase2Milestone } from "@/data/demoProfiles";
import { Check, Loader2, Clock, AlertTriangle } from "lucide-react";

const FONT_DISPLAY = "'Playfair Display',Georgia,serif";
const FONT_BODY = "'DM Sans',system-ui,sans-serif";
const FONT_MONO = "'DM Mono',ui-monospace,monospace";

const STATUS_COLOR: Record<Phase2Milestone["status"], string> = {
  Done: "#2A6A45",
  "In progress": "#C4892A",
  Upcoming: "#5C5248",
  "At risk": "#9A3020",
};

const StatusIcon = ({ status }: { status: Phase2Milestone["status"] }) => {
  if (status === "Done") return <Check size={12} color="#2A6A45" />;
  if (status === "In progress") return <Loader2 size={12} color="#C4892A" />;
  if (status === "At risk") return <AlertTriangle size={12} color="#9A3020" />;
  return <Clock size={12} color="#5C5248" />;
};

export const Phase2Tracker = ({
  milestones,
  accent,
}: {
  milestones: Phase2Milestone[];
  accent: string;
}) => {
  const done = milestones.filter((m) => m.status === "Done").length;
  const inProg = milestones.filter((m) => m.status === "In progress").length;

  return (
    <section style={{ marginBottom: 28, fontFamily: FONT_BODY }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4, flexWrap: "wrap", gap: 8 }}>
        <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: 20, fontWeight: 600, margin: 0, color: "#1A1614" }}>
          Phase 2 tracker · 18 villages
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
          {done} done · {inProg} in progress · {milestones.length - done - inProg} upcoming
        </span>
      </div>
      <p style={{ fontSize: 12, color: "#5C5248", margin: "0 0 14px", maxWidth: 720, lineHeight: 1.6 }}>
        Path to Ministry approval and GIZ financial close, with expected dates. Sunlite carries first-refusal build
        rights and a 55% revenue share on the new sites.
      </p>

      <div
        style={{
          border: "1px solid rgba(26,22,14,0.10)",
          borderRadius: 6,
          background: "#FDFAF4",
          padding: "8px 0",
        }}
      >
        <ol style={{ listStyle: "none", margin: 0, padding: 0 }}>
          {milestones.map((m, i) => {
            const color = STATUS_COLOR[m.status];
            return (
              <li
                key={m.label}
                style={{
                  display: "grid",
                  gridTemplateColumns: "28px minmax(0,1fr) auto",
                  gap: 12,
                  padding: "10px 16px",
                  borderTop: i === 0 ? "none" : "1px solid rgba(26,22,14,0.06)",
                  alignItems: "start",
                }}
              >
                <div
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: "50%",
                    background: `${color}14`,
                    border: `1px solid ${color}40`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    marginTop: 1,
                  }}
                >
                  <StatusIcon status={m.status} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#1A1614" }}>{m.label}</div>
                  <div style={{ fontSize: 12, color: "#5C5248", marginTop: 2, lineHeight: 1.55 }}>{m.detail}</div>
                  <div style={{ fontFamily: FONT_MONO, fontSize: 9, color: "#9A8F84", marginTop: 4 }}>
                    Owner: {m.owner}
                  </div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <span
                    style={{
                      fontFamily: FONT_MONO,
                      fontSize: 10,
                      color,
                      background: `${color}14`,
                      border: `1px solid ${color}33`,
                      padding: "2px 6px",
                      borderRadius: 3,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {m.status}
                  </span>
                  <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: "#5C5248", marginTop: 4, whiteSpace: "nowrap" }}>
                    {m.expected}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
};