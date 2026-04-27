import { useDemo } from "@/contexts/DemoContext";
import type { DemoKey } from "@/data/demoProfiles";

type CardSpec = {
  key: DemoKey;
  initials: string;
  name: string;
  role: string;
  tag: string;
  accent: string;
  accentSoft: string;
  accentBorder: string;
  accentBg: string;
  avatarBg: string;
  avatarBorder: string;
  stats: { value: string; label: string; settled: boolean }[];
};

const CARDS: CardSpec[] = [
  {
    key: "pharma",
    initials: "TM",
    name: "Thandi Mokoena",
    role: "Aspen · Gqeberha",
    tag: "IFC · Pharma",
    accent: "#2A5C8A",
    accentSoft: "rgba(42,92,138,0.10)",
    accentBorder: "rgba(42,92,138,0.25)",
    accentBg: "rgba(42,92,138,0.04)",
    avatarBg: "rgba(42,92,138,0.12)",
    avatarBorder: "rgba(42,92,138,0.3)",
    stats: [
      { value: "R600K", label: "settled", settled: true },
      { value: "R340K", label: "pending", settled: false },
    ],
  },
  {
    key: "ncaa",
    initials: "JS",
    name: "Jeremiah Smith",
    role: "WR · Ohio State",
    tag: "NCAA · House",
    accent: "#9A3020",
    accentSoft: "rgba(154,48,32,0.10)",
    accentBorder: "rgba(154,48,32,0.25)",
    accentBg: "rgba(154,48,32,0.04)",
    avatarBg: "rgba(154,48,32,0.10)",
    avatarBorder: "rgba(154,48,32,0.3)",
    stats: [
      { value: "$124.8K", label: "received", settled: true },
      { value: "$124.8K", label: "pending", settled: false },
    ],
  },
  {
    key: "supplyChain",
    initials: "AK",
    name: "Ayesha Khan",
    role: "Process Engineer · Textile Mfg.",
    tag: "Supply Chain · ESG",
    accent: "#4A784A",
    accentSoft: "rgba(74,120,74,0.10)",
    accentBorder: "rgba(74,120,74,0.25)",
    accentBg: "rgba(74,120,74,0.04)",
    avatarBg: "rgba(74,120,74,0.12)",
    avatarBorder: "rgba(74,120,74,0.3)",
    stats: [
      { value: "$420K", label: "paid", settled: true },
      { value: "$380K", label: "pending", settled: false },
    ],
  },
  {
    key: "ai",
    initials: "MA",
    name: "Mateo Alvarez",
    role: "Open-source · AI datasets",
    tag: "AI · Ecosystem",
    accent: "#5B5FBF",
    accentSoft: "rgba(91,95,191,0.10)",
    accentBorder: "rgba(91,95,191,0.25)",
    accentBg: "rgba(91,95,191,0.04)",
    avatarBg: "rgba(91,95,191,0.12)",
    avatarBorder: "rgba(91,95,191,0.3)",
    stats: [
      { value: "$120K", label: "paid", settled: true },
      { value: "$280K", label: "pending", settled: false },
    ],
  },
  {
    key: "ppp",
    initials: "LD",
    name: "Lerato Dube",
    role: "Acme Infra · N4 Toll Road",
    tag: "PPP · Infra",
    accent: "#7A5C2A",
    accentSoft: "rgba(122,92,42,0.10)",
    accentBorder: "rgba(122,92,42,0.25)",
    accentBg: "rgba(122,92,42,0.04)",
    avatarBg: "rgba(122,92,42,0.12)",
    avatarBorder: "rgba(122,92,42,0.3)",
    stats: [
      { value: "$18.4M", label: "paid", settled: true },
      { value: "$4.6M", label: "pending", settled: false },
    ],
  },
];

const FONT_BODY = "'DM Sans',system-ui,sans-serif";
const FONT_MONO = "'DM Mono',ui-monospace,monospace";

export const DemoProfileCards = ({ fullWidth = false }: { fullWidth?: boolean }) => {
  const { activeDemo, setActiveDemo } = useDemo();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: fullWidth ? 10 : 8 }}>
      <div
        style={{
          fontFamily: FONT_MONO,
          fontSize: 9,
          color: "#9A8F84",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          padding: fullWidth ? "0 0 6px" : "14px 8px 6px",
        }}
      >
        Try a demo profile
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: fullWidth ? 10 : 8,
          margin: fullWidth ? 0 : "0 12px",
        }}
      >
        {CARDS.map((c) => {
          const isActive = activeDemo === c.key;
          return (
            <button
              key={c.key}
              type="button"
              onClick={() => setActiveDemo(isActive ? "none" : c.key)}
              style={{
                position: "relative",
                textAlign: "left",
                border: `1px solid ${isActive ? c.accent : c.accentBorder}`,
                borderLeft: `3px solid ${c.accent}`,
                borderRadius: 5,
                background: c.accentBg,
                padding: "10px 12px",
                cursor: "pointer",
                opacity: activeDemo === "none" || isActive ? 1 : 0.85,
                width: "100%",
                transition: "opacity .15s ease, border-color .15s ease",
                fontFamily: FONT_BODY,
              }}
            >
              {isActive && (
                <span
                  style={{
                    position: "absolute",
                    top: 6,
                    right: 8,
                    fontFamily: FONT_MONO,
                    fontSize: 8,
                    color: c.accent,
                  }}
                >
                  ● Active
                </span>
              )}
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    background: c.avatarBg,
                    border: `1px solid ${c.avatarBorder}`,
                    color: c.accent,
                    fontFamily: FONT_MONO,
                    fontSize: 11,
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  {c.initials}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontFamily: FONT_BODY,
                      fontSize: 12,
                      fontWeight: 600,
                      color: "#1A1614",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {c.name}
                  </div>
                  <div
                    style={{
                      fontFamily: FONT_MONO,
                      fontSize: 9,
                      color: "#9A8F84",
                      marginTop: 1,
                    }}
                  >
                    {c.role}
                  </div>
                </div>
                {!isActive && (
                  <span
                    style={{
                      background: c.accentSoft,
                      color: c.accent,
                      fontFamily: FONT_MONO,
                      fontSize: 8,
                      borderRadius: 3,
                      padding: "2px 6px",
                      flexShrink: 0,
                    }}
                  >
                    {c.tag}
                  </span>
                )}
              </div>
              <div
                style={{
                  marginTop: 8,
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 6,
                }}
              >
                {c.stats.map((s) => (
                  <div key={s.label}>
                    <div
                      style={{
                        fontFamily: FONT_MONO,
                        fontSize: 11,
                        color: s.settled ? "#2A6A45" : "#C4892A",
                      }}
                    >
                      {s.value}
                    </div>
                    <div style={{ fontFamily: FONT_MONO, fontSize: 8, color: "#9A8F84" }}>
                      {s.label}
                    </div>
                  </div>
                ))}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
