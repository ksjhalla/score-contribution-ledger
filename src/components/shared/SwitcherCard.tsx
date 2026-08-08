/**
 * Shared, presentational-only switcher card.
 *
 * Renders the visual anatomy common to the "Try a demo profile" cards and the
 * Nandi sandbox sidebar cards. It owns no click/navigation behaviour — callers
 * wrap it in their own <button> or <Link>.
 *
 * Styling is class-based (scoped <style>) so host surfaces can keep their
 * existing local overrides.
 */

const CSS = `
.sc-card{position:relative;text-align:left;border:1px solid var(--sc-accent-border);border-left:3px solid var(--sc-accent);border-radius:5px;background:var(--sc-accent-bg);padding:10px 12px;font-family:'DM Sans',system-ui,sans-serif}
.sc-card[data-active="true"]{border-color:var(--sc-accent)}
.sc-badge{position:absolute;top:6px;right:8px;font-family:'DM Mono',ui-monospace,monospace;font-size:8px;color:var(--sc-accent)}
.sc-row{display:flex;align-items:center;gap:10px}
.sc-av{width:32px;height:32px;border-radius:50%;background:var(--sc-avatar-bg);border:1px solid var(--sc-avatar-border);color:var(--sc-accent);font-family:'DM Mono',ui-monospace,monospace;font-size:11px;font-weight:600;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.sc-body{flex:1;min-width:0}
.sc-title{font-family:'DM Sans',system-ui,sans-serif;font-size:12px;font-weight:600;color:#1A1614;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sc-sub{font-family:'DM Mono',ui-monospace,monospace;font-size:9px;color:#9A8F84;margin-top:1px}
.sc-tag{background:var(--sc-accent-soft);color:var(--sc-accent);font-family:'DM Mono',ui-monospace,monospace;font-size:8px;border-radius:3px;padding:2px 6px;flex-shrink:0}
.sc-stats{margin-top:8px;display:grid;grid-template-columns:1fr 1fr;gap:6px}
.sc-sv{font-family:'DM Mono',ui-monospace,monospace;font-size:11px;color:#1A1614}
.sc-sl{font-family:'DM Mono',ui-monospace,monospace;font-size:8px;color:#9A8F84}
`;

export type SwitcherCardTheme = {
  accent: string;
  accentSoft: string;
  accentBorder: string;
  accentBg: string;
  avatarBg: string;
  avatarBorder: string;
};

type SwitcherCardProps = {
  initials: string;
  title: string;
  subtitle: string;
  tag?: string;
  stats?: { value: string; label: string; color?: string }[];
  isActive: boolean;
  theme: SwitcherCardTheme;
};

export const SwitcherCard = ({
  initials,
  title,
  subtitle,
  tag,
  stats,
  isActive,
  theme,
}: SwitcherCardProps) => {
  const vars = {
    "--sc-accent": theme.accent,
    "--sc-accent-soft": theme.accentSoft,
    "--sc-accent-border": theme.accentBorder,
    "--sc-accent-bg": theme.accentBg,
    "--sc-avatar-bg": theme.avatarBg,
    "--sc-avatar-border": theme.avatarBorder,
  } as React.CSSProperties;

  return (
    <div className="sc-card" data-active={isActive} style={vars}>
      <style>{CSS}</style>
      {isActive && <span className="sc-badge">● Active</span>}
      <div className="sc-row nrow">
        <div className="sc-av nav-av">{initials}</div>
        <div className="sc-body">
          <div className="sc-title nm">{title}</div>
          <div className="sc-sub rl">{subtitle}</div>
        </div>
        {!isActive && tag && <span className="sc-tag">{tag}</span>}
      </div>
      {stats && stats.length > 0 && (
        <div className="sc-stats nstats">
          {stats.map((s) => (
            <div key={s.label}>
              <div className="sc-sv sv" style={s.color ? { color: s.color } : undefined}>
                {s.value}
              </div>
              <div className="sc-sl sl">{s.label}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};