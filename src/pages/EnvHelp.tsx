import { Helmet } from "react-helmet-async";

type Row = {
  name: string;
  scope: "Build" | "Runtime" | "Auto";
  required: boolean;
  purpose: string;
  where: string;
};

const ROWS: Row[] = [
  {
    name: "VITE_SUPABASE_URL",
    scope: "Auto",
    required: true,
    purpose: "Backend (Lovable Cloud) URL used by the Supabase client.",
    where: "Auto-managed by Lovable Cloud — do not edit .env by hand.",
  },
  {
    name: "VITE_SUPABASE_PUBLISHABLE_KEY",
    scope: "Auto",
    required: true,
    purpose: "Public anon key for the Supabase client. Safe to expose.",
    where: "Auto-managed by Lovable Cloud.",
  },
  {
    name: "VITE_SUPABASE_PROJECT_ID",
    scope: "Auto",
    required: true,
    purpose: "Project reference used by tooling.",
    where: "Auto-managed by Lovable Cloud.",
  },
  {
    name: "VITE_ADMIN_EMAILS",
    scope: "Build",
    required: false,
    purpose:
      "Comma-separated list of admin emails that bypass invite redemption. A hardcoded fallback (ksjhalla@gmail.com) is also honoured on Lovable when this is unavailable.",
    where:
      "Workspace Settings → Build Secrets. Must be added by a workspace admin. Re-publish after changes.",
  },
  {
    name: "RESEND_API_KEY",
    scope: "Runtime",
    required: false,
    purpose: "Used by edge functions that send transactional email (attestations, reminders).",
    where: "Cloud → Secrets (runtime secret). Available to edge functions only.",
  },
];

const card: React.CSSProperties = {
  background: "#FDFAF4",
  border: "1px solid rgba(26,22,14,0.08)",
  borderRadius: 8,
  padding: 20,
};

const mono: React.CSSProperties = {
  fontFamily: "'DM Mono',ui-monospace,monospace",
  fontSize: 12,
};

export default function EnvHelp() {
  return (
    <div style={{ maxWidth: 880, margin: "0 auto", padding: "32px 24px" }}>
      <Helmet>
        <title>Environment & Setup Help — SCORE</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <h2
        style={{
          fontFamily: "'Playfair Display',Georgia,serif",
          fontSize: 24,
          margin: "0 0 8px",
          color: "#1A1614",
        }}
      >
        Environment & Setup
      </h2>
      <p style={{ color: "#5C5248", marginBottom: 24, fontSize: 14 }}>
        Reference for the environment variables and secrets this app uses, and where to configure
        each one.
      </p>

      <div style={{ ...card, marginBottom: 16 }}>
        <h3 style={{ margin: "0 0 12px", fontSize: 14, color: "#1A1614" }}>Where to configure</h3>
        <ul style={{ margin: 0, paddingLeft: 18, color: "#5C5248", fontSize: 13, lineHeight: 1.7 }}>
          <li>
            <strong>Auto</strong> — Managed automatically by Lovable Cloud in <span style={mono}>.env</span>.
            Never edit by hand.
          </li>
          <li>
            <strong>Build secret</strong> — Workspace Settings → <em>Build Secrets</em>. Injected at
            install/build time. Must be added by a workspace admin; re-publish after changes.
          </li>
          <li>
            <strong>Runtime secret</strong> — Cloud → <em>Secrets</em>. Available to edge functions
            at runtime only.
          </li>
        </ul>
      </div>

      <div style={card}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ textAlign: "left", color: "#9A8F84" }}>
              <th style={{ padding: "8px 8px", borderBottom: "1px solid rgba(26,22,14,0.08)" }}>Name</th>
              <th style={{ padding: "8px 8px", borderBottom: "1px solid rgba(26,22,14,0.08)" }}>Scope</th>
              <th style={{ padding: "8px 8px", borderBottom: "1px solid rgba(26,22,14,0.08)" }}>Required</th>
              <th style={{ padding: "8px 8px", borderBottom: "1px solid rgba(26,22,14,0.08)" }}>Purpose / Where</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((r) => (
              <tr key={r.name} style={{ verticalAlign: "top" }}>
                <td style={{ padding: "10px 8px", borderBottom: "1px solid rgba(26,22,14,0.05)", ...mono }}>
                  {r.name}
                </td>
                <td style={{ padding: "10px 8px", borderBottom: "1px solid rgba(26,22,14,0.05)", color: "#5C5248" }}>
                  {r.scope}
                </td>
                <td style={{ padding: "10px 8px", borderBottom: "1px solid rgba(26,22,14,0.05)", color: r.required ? "#C4892A" : "#9A8F84" }}>
                  {r.required ? "Yes" : "Optional"}
                </td>
                <td style={{ padding: "10px 8px", borderBottom: "1px solid rgba(26,22,14,0.05)", color: "#1A1614" }}>
                  <div style={{ marginBottom: 4 }}>{r.purpose}</div>
                  <div style={{ color: "#9A8F84", fontSize: 12 }}>{r.where}</div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p style={{ color: "#9A8F84", fontSize: 12, marginTop: 16 }}>
        Tip: runtime secrets are not visible in the browser. Build-time variables prefixed with{" "}
        <span style={mono}>VITE_</span> are bundled into the client and visible to anyone using the app.
      </p>
    </div>
  );
}