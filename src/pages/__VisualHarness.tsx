import { AccountBlock } from "@/components/shared/AccountBlock";
import { SwitcherCard } from "@/components/shared/SwitcherCard";
import { CARDS } from "@/components/demo/DemoProfileCards";

const FONT_BODY = "'DM Sans',system-ui,sans-serif";
const FONT_MONO = "'DM Mono',ui-monospace,monospace";
const c = CARDS[0];
const NANDI_THEME = { accent: "#5C7A3A", accentSoft: "rgba(92,122,58,.10)", accentBorder: "rgba(92,122,58,.25)", accentBg: "rgba(92,122,58,.04)", avatarBg: "rgba(92,122,58,.12)", avatarBorder: "rgba(92,122,58,.3)" };
const NANDI_CSS = `
.nandi{--paper:#FDFAF4;--ink:#1A1614;--muted:#5C5248;--faint:#9A8F84;--accent:#5C7A3A;--accent-soft:rgba(92,122,58,.10);--accent-border:rgba(92,122,58,.25);--line:rgba(26,22,14,.12);--display:'Playfair Display',Georgia,serif;--body:'DM Sans',system-ui,sans-serif;--mono:'DM Mono',ui-monospace,monospace;font-family:var(--body);color:var(--ink)}
.nandi .nside-list{width:260px;padding:12px;display:flex;flex-direction:column;gap:8px;background:#fff}
.nandi .ncard{display:block;text-decoration:none;opacity:.9}
.nandi .ncard[data-active="true"]{opacity:1}
.nandi .sc-card[data-active="true"]{background:var(--accent-soft)}
.nandi .sc-badge{display:none}
.nandi .sc-sub{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.nandi .ncard.meta .sc-card{border-style:dashed;border-color:var(--line);background:transparent}
.nandi .ncard.meta .sc-av{background:transparent;border-style:dashed}
.nandi .ncard.meta .sc-title{font-family:var(--display);font-weight:600;color:var(--muted)}
.nandi .ncard.meta .sc-card[data-active="true"]{border-style:solid;border-color:var(--ink);background:rgba(26,22,14,.04)}
.nandi .ncard.meta .sc-card[data-active="true"] .sc-title{color:var(--ink)}
.nandi .nacct{width:260px;flex-shrink:0;border-top:1px solid var(--line);padding:14px 20px;background:#fff}
.nandi .nacct .sa-av{font-size:12px}
.nandi .nacct .sa-primary{font-size:12px;font-weight:400}
.nandi .sa-secondary{color:var(--faint)}
.nandi .sa-signout{color:var(--faint)}
.nandi .sa-acct.sa-compact{border-color:var(--line);color:var(--muted)}
/* legacy (BEFORE) rules */
.nandi .oldcard{display:block;text-decoration:none;border:1px solid var(--accent-border);border-left:3px solid var(--accent);border-radius:5px;background:rgba(92,122,58,.04);padding:10px 12px;opacity:.9}
.nandi .oldcard[data-active="true"]{border-color:var(--accent);opacity:1;background:var(--accent-soft)}
.nandi .oldcard .nrow{display:flex;align-items:center;gap:10px}
.nandi .oldcard .nav-av{width:32px;height:32px;border-radius:50%;background:rgba(92,122,58,.12);border:1px solid rgba(92,122,58,.3);color:var(--accent);font-family:var(--mono);font-size:11px;font-weight:600;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.nandi .oldcard .nm{font-size:12px;font-weight:600;color:var(--ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.nandi .oldcard .rl{font-family:var(--mono);font-size:9px;color:var(--faint);margin-top:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.nandi .oldcard .nstats{margin-top:8px;display:grid;grid-template-columns:1fr 1fr;gap:6px}
.nandi .oldcard .nstats .sv{font-family:var(--mono);font-size:11px}
.nandi .oldcard .nstats .sl{font-family:var(--mono);font-size:8px;color:var(--faint)}
.nandi .oldcard.meta{border-style:dashed;border-color:var(--line);background:transparent}
.nandi .oldcard.meta .nm{font-family:var(--display);font-weight:600;color:var(--muted)}
.nandi .oldcard.meta[data-active="true"]{border-style:solid;border-color:var(--ink);background:rgba(26,22,14,.04)}
.nandi .oldacct{width:260px;flex-shrink:0;border-top:1px solid var(--line);padding:14px 20px;background:#fff;display:flex;align-items:center;gap:10px}
.nandi .oldacct .em{font-size:12px;color:var(--ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.nandi .oldacct .subl{font-family:var(--mono);font-size:9px;color:var(--faint)}
.nandi .signout{font-family:var(--mono);font-size:9px;color:var(--faint);background:none;border:none;padding:0;cursor:pointer}
.nandi .oldacct-mobile{display:flex;align-items:center;justify-content:space-between;gap:10px;border:1px solid var(--line);border-radius:6px;background:#fff;padding:8px 10px;margin-bottom:12px;font-family:var(--mono);font-size:10px;color:var(--muted)}
.nandi .oldacct-mobile .em{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.app-shell-signout { font-family:'DM Mono',ui-monospace,monospace; font-size:9px; color:#9A8F84; background:none; border:none; padding:0; cursor:pointer; }
`;

const stats = [{ value: "KSh186K", label: "received", color: "#2A6A45" }, { value: "3", label: "Contracts", color: "#5C7A3A" }];

const OldDemoCard = ({ isActive }: { isActive: boolean }) => (
  <button type="button" style={{ position: "relative", textAlign: "left", border: `1px solid ${isActive ? c.accent : c.accentBorder}`, borderLeft: `3px solid ${c.accent}`, borderRadius: 5, background: c.accentBg, padding: "10px 12px", cursor: "pointer", opacity: 1, width: "100%", fontFamily: FONT_BODY }}>
    {isActive && <span style={{ position: "absolute", top: 6, right: 8, fontFamily: FONT_MONO, fontSize: 8, color: c.accent }}>● Active</span>}
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{ width: 32, height: 32, borderRadius: "50%", background: c.avatarBg, border: `1px solid ${c.avatarBorder}`, color: c.accent, fontFamily: FONT_MONO, fontSize: 11, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{c.initials}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: FONT_BODY, fontSize: 12, fontWeight: 600, color: "#1A1614", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.name}</div>
        <div style={{ fontFamily: FONT_MONO, fontSize: 9, color: "#9A8F84", marginTop: 1 }}>{c.role}</div>
      </div>
      {!isActive && <span style={{ background: c.accentSoft, color: c.accent, fontFamily: FONT_MONO, fontSize: 8, borderRadius: 3, padding: "2px 6px", flexShrink: 0 }}>{c.tag}</span>}
    </div>
    <div style={{ marginTop: 8, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
      {c.stats.map((s) => (<div key={s.label}><div style={{ fontFamily: FONT_MONO, fontSize: 11, color: s.settled ? "#2A6A45" : "#C4892A" }}>{s.value}</div><div style={{ fontFamily: FONT_MONO, fontSize: 8, color: "#9A8F84" }}>{s.label}</div></div>))}
    </div>
  </button>
);

const NewDemoCard = ({ isActive }: { isActive: boolean }) => (
  <button type="button" style={{ display: "block", border: "none", background: "none", padding: 0, textAlign: "left", cursor: "pointer", opacity: 1, width: "100%", fontFamily: FONT_BODY }}>
    <SwitcherCard initials={c.initials} title={c.name} subtitle={c.role} tag={c.tag} stats={c.stats.map((s) => ({ value: s.value, label: s.label, color: s.settled ? "#2A6A45" : "#C4892A" }))} isActive={isActive} theme={{ accent: c.accent, accentSoft: c.accentSoft, accentBorder: c.accentBorder, accentBg: c.accentBg, avatarBg: c.avatarBg, avatarBorder: c.avatarBorder }} />
  </button>
);

const Col = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div style={{ width: 300 }}><div style={{ fontFamily: FONT_MONO, fontSize: 10, marginBottom: 8 }}>{title}</div>{children}</div>
);

export default function VisualHarness() {
  return (
    <div style={{ background: "#F5F1E8", padding: 20, minHeight: "100vh" }}>
      <style>{NANDI_CSS}</style>
      <div style={{ display: "flex", gap: 24 }}>
        <Col title="BEFORE demo cards">
          <div style={{ display: "flex", flexDirection: "column", gap: 8, width: 236 }}>
            <OldDemoCard isActive={false} /><OldDemoCard isActive />
          </div>
        </Col>
        <Col title="AFTER demo cards">
          <div style={{ display: "flex", flexDirection: "column", gap: 8, width: 236 }}>
            <NewDemoCard isActive={false} /><NewDemoCard isActive />
          </div>
        </Col>
        <div className="nandi"><Col title="BEFORE nandi">
          <div className="nside-list">
            <a className="oldcard" data-active={false}><div className="nrow"><div className="nav-av">FA</div><div style={{ flex: 1, minWidth: 0 }}><div className="nm">Farmer</div><div className="rl">Aisha Ng'etich · Kaptumo</div></div></div><div className="nstats">{stats.map((s) => (<div key={s.label}><div className="sv" style={{ color: s.color }}>{s.value}</div><div className="sl">{s.label}</div></div>))}</div></a>
            <a className="oldcard" data-active={true}><div className="nrow"><div className="nav-av">CO</div><div style={{ flex: 1, minWidth: 0 }}><div className="nm">Cooperative</div><div className="rl">Kaptumo FCS</div></div></div><div className="nstats">{stats.map((s) => (<div key={s.label}><div className="sv" style={{ color: s.color }}>{s.value}</div><div className="sl">{s.label}</div></div>))}</div></a>
            <a className="oldcard meta"><div className="nrow"><div className="nav-av" style={{ background: "transparent", borderStyle: "dashed" }}>M</div><div style={{ flex: 1, minWidth: 0 }}><div className="nm">Methodology</div><div className="rl">About this sandbox</div></div></div></a>
          </div>
          <div className="oldacct"><div className="nav-av" style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(92,122,58,.12)", border: "1px solid rgba(92,122,58,.3)", color: "#5C7A3A", fontFamily: FONT_MONO, fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>AI</div><div style={{ flex: 1, minWidth: 0 }}><div className="em">aisha@example.com</div><div className="subl">Nandi invite access</div></div><button className="signout">Sign out</button></div>
          <div style={{ marginTop: 12 }}><div className="oldacct-mobile"><span className="em">aisha@example.com</span><button className="signout">Sign out</button></div></div>
        </Col></div>
        <div className="nandi"><Col title="AFTER nandi">
          <div className="nside-list">
            <a className="ncard" data-active={false}><SwitcherCard initials="FA" title="Farmer" subtitle="Aisha Ng'etich · Kaptumo" stats={stats} isActive={false} theme={NANDI_THEME} /></a>
            <a className="ncard" data-active={true}><SwitcherCard initials="CO" title="Cooperative" subtitle="Kaptumo FCS" stats={stats} isActive theme={NANDI_THEME} /></a>
            <a className="ncard meta"><SwitcherCard initials="M" title="Methodology" subtitle="About this sandbox" isActive={false} theme={NANDI_THEME} /></a>
          </div>
          <div className="nacct"><AccountBlock avatarInitials="AI" primaryLabel="aisha@example.com" secondaryLabel="Nandi invite access" onSignOut={() => {}} accent="#5C7A3A" /></div>
          <div style={{ marginTop: 12 }}><AccountBlock avatarInitials="AI" primaryLabel="aisha@example.com" secondaryLabel="Nandi invite access" onSignOut={() => {}} accent="#5C7A3A" compact /></div>
        </Col></div>
        <Col title="BEFORE appshell acct">
          <div style={{ width: 260, background: "#FDFAF4", borderTop: "1px solid rgba(26,22,14,0.08)", padding: "14px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(196,137,42,0.12)", border: "1px solid rgba(196,137,42,0.3)", color: "#C4892A", fontFamily: FONT_MONO, fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>TM</div>
              <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontFamily: FONT_BODY, fontSize: 13, fontWeight: 500, color: "#1A1614", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Thandi Mokoena</div><div style={{ fontFamily: FONT_MONO, fontSize: 9, color: "#9A8F84" }}>SC-0001</div></div>
              <button className="app-shell-signout">Sign out</button>
            </div>
          </div>
        </Col>
        <Col title="AFTER appshell acct">
          <div style={{ width: 260, background: "#FDFAF4", borderTop: "1px solid rgba(26,22,14,0.08)", padding: "14px 20px" }}>
            <AccountBlock avatarInitials="TM" primaryLabel="Thandi Mokoena" secondaryLabel="SC-0001" onSignOut={() => {}} accent="#C4892A" />
          </div>
        </Col>
      </div>
    </div>
  );
}
