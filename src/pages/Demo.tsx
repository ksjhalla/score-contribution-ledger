import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { demoProfiles, type DemoProfile } from "@/data/demoData";

const palette = {
  bg: "#F5F1E8",
  surface: "#EDE8DC",
  card: "#FDFAF4",
  text: "#1A1614",
  muted: "#5C5248",
  faint: "#9A8F84",
  border: "rgba(26,22,14,0.07)",
  borderEm: "rgba(26,22,14,0.13)",
  amber: "#C4892A",
  green: "#2A6A45",
  blue: "#2A5C8A",
  scarlet: "#9A3020",
  amberSoftBg: "rgba(196,137,42,0.1)",
  amberActive: "rgba(196,137,42,0.06)",
};

const fontDisplay = "'Playfair Display', serif";
const fontBody = "'DM Sans', sans-serif";
const fontMono = "'DM Mono', monospace";

const toneColor = (tone: string) => {
  switch (tone) {
    case "green":
      return palette.green;
    case "amber":
      return palette.amber;
    case "blue":
      return palette.blue;
    case "scarlet":
      return palette.scarlet;
    default:
      return palette.text;
  }
};

function Badge({ label, tone }: { label: string; tone?: string }) {
  const color = tone ? toneColor(tone) : palette.muted;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "4px 10px",
        borderRadius: 4,
        border: `1px solid ${palette.borderEm}`,
        background: tone ? `${color}14` : "transparent",
        color,
        fontFamily: fontMono,
        fontSize: 10,
        letterSpacing: 0.4,
        textTransform: "uppercase",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </span>
  );
}

function ProfileCard({
  profile,
  active,
  onClick,
}: {
  profile: DemoProfile;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        textAlign: "left",
        width: "100%",
        padding: "14px 16px",
        background: active ? palette.amberActive : palette.card,
        border: `1px solid ${palette.border}`,
        borderLeft: active ? `2px solid ${palette.amber}` : `1px solid ${palette.border}`,
        borderRadius: 4,
        cursor: "pointer",
        marginBottom: 10,
        fontFamily: fontBody,
        color: palette.text,
      }}
    >
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 10 }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 4,
            background: profile.avatarColor,
            color: "#fff",
            fontFamily: fontMono,
            fontWeight: 500,
            fontSize: 13,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {profile.avatar}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 500, fontSize: 13, lineHeight: 1.2 }}>{profile.name}</div>
          <div style={{ fontSize: 11, color: palette.muted, marginTop: 2 }}>{profile.role}</div>
        </div>
      </div>
      <div style={{ fontFamily: fontMono, fontSize: 9, color: palette.faint, letterSpacing: 0.4, marginBottom: 8, textTransform: "uppercase" }}>
        {profile.tag}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
        {profile.sidebarStats.map((s) => (
          <div key={s.label} style={{ borderTop: `1px solid ${palette.border}`, paddingTop: 6 }}>
            <div style={{ fontFamily: fontMono, fontSize: 9, color: palette.faint, textTransform: "uppercase", letterSpacing: 0.4 }}>
              {s.label}
            </div>
            <div style={{ fontFamily: fontMono, fontSize: 12, color: palette.text, marginTop: 2 }}>{s.value}</div>
          </div>
        ))}
      </div>
    </button>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontFamily: fontMono,
        fontSize: 10,
        textTransform: "uppercase",
        letterSpacing: 0.6,
        color: palette.faint,
        marginBottom: 10,
      }}
    >
      {children}
    </div>
  );
}

function Card({ children, padding = 24 }: { children: React.ReactNode; padding?: number }) {
  return (
    <div
      style={{
        background: palette.card,
        border: `1px solid ${palette.border}`,
        borderRadius: 4,
        padding,
      }}
    >
      {children}
    </div>
  );
}

function TimelineIcon({ icon, tone }: { icon: "check" | "info" | "warn"; tone: "green" | "blue" | "amber" }) {
  const color = toneColor(tone);
  const sym = icon === "check" ? "✓" : icon === "info" ? "i" : "!";
  return (
    <div
      style={{
        width: 24,
        height: 24,
        borderRadius: 4,
        background: `${color}1a`,
        color,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: fontMono,
        fontSize: 12,
        fontWeight: 500,
        flexShrink: 0,
      }}
    >
      {sym}
    </div>
  );
}

function MainPanel({ profile }: { profile: DemoProfile }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Header */}
      <div>
        <div style={{ fontFamily: fontMono, fontSize: 10, color: palette.faint, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 10 }}>
          {profile.eyebrow}
        </div>
        <h1 style={{ fontFamily: fontDisplay, fontWeight: 600, fontSize: 30, lineHeight: 1.15, color: palette.text, margin: 0 }}>
          {profile.title}
        </h1>
        <p style={{ fontFamily: fontBody, fontSize: 14, color: palette.muted, marginTop: 12, maxWidth: 720, lineHeight: 1.55 }}>
          {profile.subtitle}
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 14 }}>
          {profile.badges.map((b) => (
            <Badge key={b.label} label={b.label} tone={b.tone} />
          ))}
        </div>
      </div>

      {/* Hero card */}
      <Card>
        <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: 32 }}>
          <div>
            <SectionTitle>Total attributed</SectionTitle>
            <div style={{ fontFamily: fontDisplay, fontSize: 56, fontWeight: 600, color: palette.amber, lineHeight: 1 }}>
              {profile.heroTotal}
            </div>
            <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 14 }}>
              {profile.breakdown.map((b) => (
                <div key={b.label} style={{ display: "grid", gridTemplateColumns: "90px 110px 1fr", gap: 12, alignItems: "baseline" }}>
                  <div style={{ fontFamily: fontMono, fontSize: 10, textTransform: "uppercase", letterSpacing: 0.5, color: palette.faint }}>
                    {b.label}
                  </div>
                  <div style={{ fontFamily: fontMono, fontSize: 16, color: toneColor(b.tone) }}>{b.value}</div>
                  <div style={{ fontFamily: fontBody, fontSize: 12, color: palette.muted }}>{b.meta}</div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <SectionTitle>Recent events</SectionTitle>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {profile.recentEvents.map((e, i) => (
                <div key={i} style={{ borderTop: `1px solid ${palette.border}`, paddingTop: 12 }}>
                  <div style={{ fontFamily: fontMono, fontSize: 13, color: toneColor(e.amountTone), marginBottom: 4 }}>
                    {e.amount}
                  </div>
                  <div style={{ fontFamily: fontBody, fontSize: 13, color: palette.text }}>{e.title}</div>
                  <div style={{ fontFamily: fontMono, fontSize: 10, color: palette.faint, marginTop: 2 }}>{e.meta}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Inner stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        {profile.innerStats.map((s) => (
          <Card key={s.label} padding={16}>
            <div style={{ fontFamily: fontMono, fontSize: 9, color: palette.faint, textTransform: "uppercase", letterSpacing: 0.5 }}>
              {s.label}
            </div>
            <div style={{ fontFamily: fontMono, fontSize: 18, color: palette.text, marginTop: 6 }}>{s.value}</div>
          </Card>
        ))}
      </div>

      {/* Contracts table */}
      <Card padding={0}>
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${palette.border}`, background: palette.surface }}>
          <div style={{ fontFamily: fontMono, fontSize: 10, textTransform: "uppercase", letterSpacing: 0.6, color: palette.muted }}>
            Contracts
          </div>
        </div>
        <div>
          {profile.contracts.map((c, i) => (
            <div
              key={i}
              style={{
                display: "grid",
                gridTemplateColumns: "1.6fr 0.9fr 0.9fr",
                gap: 16,
                padding: "14px 20px",
                borderTop: i === 0 ? "none" : `1px solid ${palette.border}`,
                alignItems: "center",
              }}
            >
              <div style={{ fontFamily: fontBody, fontSize: 13, color: palette.text }}>{c.name}</div>
              <div style={{ fontFamily: fontMono, fontSize: 11, color: palette.muted }}>{c.meta}</div>
              <div style={{ fontFamily: fontMono, fontSize: 12, color: palette.amber, textAlign: "right" }}>{c.value}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* FMV Table */}
      {profile.fmvTable && (
        <Card padding={0}>
          <div style={{ padding: "16px 20px", borderBottom: `1px solid ${palette.border}`, background: palette.surface }}>
            <div style={{ fontFamily: fontMono, fontSize: 10, textTransform: "uppercase", letterSpacing: 0.6, color: palette.muted }}>
              NIL Go FMV review
            </div>
          </div>
          {profile.fmvTable.map((row, i) => (
            <div
              key={i}
              style={{
                display: "grid",
                gridTemplateColumns: "32px 1.2fr 2fr 1fr",
                gap: 16,
                padding: "12px 20px",
                borderTop: i === 0 ? "none" : `1px solid ${palette.border}`,
                alignItems: "center",
              }}
            >
              <div style={{ fontFamily: fontMono, fontSize: 14, color: palette.amber }}>{row.marker}</div>
              <div style={{ fontFamily: fontBody, fontSize: 13, color: palette.text }}>{row.factor}</div>
              <div style={{ fontFamily: fontBody, fontSize: 12, color: palette.muted }}>{row.detail}</div>
              <div style={{ fontFamily: fontMono, fontSize: 12, color: toneColor(row.resultTone || "neutral"), textAlign: "right" }}>
                {row.result}
              </div>
            </div>
          ))}
        </Card>
      )}

      {/* Timeline */}
      <Card>
        <SectionTitle>Execution timeline</SectionTitle>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {profile.timeline.map((t, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "32px 1fr auto", gap: 14, alignItems: "flex-start" }}>
              <TimelineIcon icon={t.icon} tone={t.tone} />
              <div>
                <div style={{ fontFamily: fontBody, fontSize: 13, color: palette.text }}>{t.title}</div>
                <div style={{ fontFamily: fontMono, fontSize: 10, color: palette.faint, marginTop: 3 }}>
                  {t.meta} · {t.date}
                </div>
              </div>
              {t.amount && (
                <div style={{ fontFamily: fontMono, fontSize: 12, color: toneColor(t.tone), whiteSpace: "nowrap" }}>{t.amount}</div>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Notice */}
      <div
        style={{
          background: palette.amberSoftBg,
          border: `1px solid ${palette.amber}55`,
          borderRadius: 4,
          padding: 16,
          fontFamily: fontBody,
          fontSize: 13,
          color: palette.text,
          lineHeight: 1.55,
        }}
      >
        {profile.notice}
      </div>
    </div>
  );
}

function RightPanel({ profile }: { profile: DemoProfile }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <SectionTitle>Evidence feed</SectionTitle>
      {profile.evidenceFeed.map((e, i) => (
        <div
          key={i}
          style={{
            background: palette.card,
            border: `1px solid ${palette.border}`,
            borderRadius: 4,
            padding: 14,
          }}
        >
          <div style={{ marginBottom: 8 }}>
            <Badge label={e.badge} tone={e.badgeTone} />
          </div>
          <div style={{ fontFamily: fontBody, fontSize: 13, color: palette.text, marginBottom: 6 }}>{e.title}</div>
          <div style={{ fontFamily: fontMono, fontSize: 10, color: palette.faint, lineHeight: 1.5, marginBottom: 8, wordBreak: "break-all" }}>
            {e.hash}
          </div>
          <div style={{ fontFamily: fontMono, fontSize: 10, color: palette.muted, paddingTop: 8, borderTop: `1px solid ${palette.border}` }}>
            {e.footer}
          </div>
        </div>
      ))}
      <div
        style={{
          background: palette.amberSoftBg,
          border: `1px solid ${palette.amber}55`,
          borderRadius: 4,
          padding: 14,
          fontFamily: fontBody,
          fontSize: 12,
          color: palette.text,
          lineHeight: 1.55,
        }}
      >
        {profile.rightNotice}
      </div>
      <div
        style={{
          padding: "14px 0",
          borderTop: `1px solid ${palette.border}`,
          fontFamily: fontBody,
          fontSize: 12,
          color: palette.muted,
          lineHeight: 1.6,
        }}
      >
        {profile.contextNote}
      </div>
    </div>
  );
}

export default function Demo() {
  const [activeId, setActiveId] = useState(demoProfiles[0].id);
  const active = useMemo(() => demoProfiles.find((p) => p.id === activeId)!, [activeId]);

  return (
    <div style={{ minHeight: "100vh", background: palette.bg, color: palette.text, fontFamily: fontBody }}>
      {/* Demo banner */}
      <div
        style={{
          background: palette.amberSoftBg,
          borderBottom: `1px solid ${palette.amber}55`,
          color: palette.text,
          fontFamily: fontMono,
          fontSize: 10,
          textAlign: "center",
          padding: 8,
          letterSpacing: 0.4,
        }}
      >
        Demo mode — read only · These are real use cases with illustrative figures.
      </div>

      {/* Topbar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 28px",
          borderBottom: `1px solid ${palette.border}`,
          background: palette.bg,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ fontFamily: fontDisplay, fontWeight: 600, fontSize: 20, color: palette.amber }}>SCORE</div>
          <Link
            to="/"
            style={{
              fontFamily: fontMono,
              fontSize: 11,
              color: palette.muted,
              textDecoration: "none",
              letterSpacing: 0.3,
            }}
          >
            ← Back to product
          </Link>
        </div>
        <a
          href="mailto:hello@score.app?subject=Demo%20request"
          style={{
            background: palette.amber,
            color: "#fff",
            fontFamily: fontMono,
            fontSize: 11,
            padding: "8px 14px",
            borderRadius: 4,
            textDecoration: "none",
            letterSpacing: 0.4,
            textTransform: "uppercase",
          }}
        >
          Request a demo
        </a>
      </div>

      {/* Layout */}
      <div style={{ display: "grid", gridTemplateColumns: "280px 1fr 320px", minHeight: "calc(100vh - 100px)" }}>
        {/* Sidebar */}
        <aside
          style={{
            background: palette.surface,
            borderRight: `1px solid ${palette.border}`,
            padding: 20,
          }}
        >
          <SectionTitle>Demo profiles</SectionTitle>
          {demoProfiles.map((p) => (
            <ProfileCard key={p.id} profile={p} active={p.id === activeId} onClick={() => setActiveId(p.id)} />
          ))}
        </aside>

        {/* Main */}
        <main style={{ padding: "28px 32px", maxWidth: 980 }}>
          <MainPanel profile={active} />
        </main>

        {/* Right panel */}
        <aside
          style={{
            background: palette.surface,
            borderLeft: `1px solid ${palette.border}`,
            padding: 20,
          }}
        >
          <RightPanel profile={active} />
        </aside>
      </div>
    </div>
  );
}