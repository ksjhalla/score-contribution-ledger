/**
 * Shared account block used by the main AppShell sidebar and the Nandi sandbox.
 *
 * Styling lives in a scoped <style> block using class names (rather than inline
 * styles) so host surfaces can keep their existing local overrides — e.g. the
 * Nandi sandbox scopes a few font/colour tweaks under `.nandi`.
 */

const CSS = `
.sa-acct{display:flex;align-items:center;gap:10px}
.sa-av{width:32px;height:32px;border-radius:50%;background:var(--sa-avatar-bg);border:1px solid var(--sa-avatar-border);color:var(--sa-accent);font-family:'DM Mono',ui-monospace,monospace;font-size:13px;font-weight:600;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.sa-body{flex:1;min-width:0}
.sa-primary{font-family:'DM Sans',system-ui,sans-serif;font-size:13px;font-weight:500;color:#1A1614;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sa-secondary{font-family:'DM Mono',ui-monospace,monospace;font-size:9px;color:#9A8F84;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sa-signout{font-family:'DM Mono',ui-monospace,monospace;font-size:9px;color:#9A8F84;background:none;border:none;padding:0;cursor:pointer}
.sa-signout:hover{text-decoration:underline}
.sa-acct.sa-compact{justify-content:space-between;border:1px solid rgba(26,22,14,.12);border-radius:6px;background:#fff;padding:8px 10px;margin-bottom:12px;font-family:'DM Mono',ui-monospace,monospace;font-size:10px;color:#5C5248}
.sa-acct.sa-compact .sa-compact-label{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
`;

type AccountBlockProps = {
  avatarInitials: string;
  primaryLabel: string;
  secondaryLabel: string;
  onSignOut: () => void | Promise<void>;
  accent: string;
  compact?: boolean;
};

const withAlpha = (hex: string, alpha: number) => {
  const m = /^#([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return hex;
  const int = parseInt(m[1], 16);
  return `rgba(${(int >> 16) & 255},${(int >> 8) & 255},${int & 255},${alpha})`;
};

export const AccountBlock = ({
  avatarInitials,
  primaryLabel,
  secondaryLabel,
  onSignOut,
  accent,
  compact = false,
}: AccountBlockProps) => {
  const vars = {
    "--sa-accent": accent,
    "--sa-avatar-bg": withAlpha(accent, 0.12),
    "--sa-avatar-border": withAlpha(accent, 0.3),
  } as React.CSSProperties;

  if (compact) {
    return (
      <div className="sa-acct sa-compact" style={vars}>
        <style>{CSS}</style>
        <span className="sa-compact-label em">{primaryLabel}</span>
        <button type="button" className="sa-signout signout" onClick={() => void onSignOut()}>
          Sign out
        </button>
      </div>
    );
  }

  return (
    <div className="sa-acct" style={vars}>
      <style>{CSS}</style>
      <div className="sa-av">{avatarInitials}</div>
      <div className="sa-body">
        <div className="sa-primary em">{primaryLabel}</div>
        <div className="sa-secondary subl">{secondaryLabel}</div>
      </div>
      <button type="button" className="sa-signout signout" onClick={() => void onSignOut()}>
        Sign out
      </button>
    </div>
  );
};