import { Helmet } from "react-helmet-async";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

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

type CheckStatus = "ok" | "warn" | "error" | "unknown" | "checking";
type Check = { name: string; status: CheckStatus; detail: string };

const ADMIN_FALLBACK = "ksjhalla@gmail.com";

function buildClientChecks(): Check[] {
  const env = import.meta.env as Record<string, string | undefined>;
  const url = env.VITE_SUPABASE_URL;
  const key = env.VITE_SUPABASE_PUBLISHABLE_KEY;
  const pid = env.VITE_SUPABASE_PROJECT_ID;
  const admins = env.VITE_ADMIN_EMAILS;

  const checks: Check[] = [];

  checks.push(
    !url
      ? { name: "VITE_SUPABASE_URL", status: "error", detail: "Missing." }
      : /^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(url)
        ? { name: "VITE_SUPABASE_URL", status: "ok", detail: url }
        : { name: "VITE_SUPABASE_URL", status: "warn", detail: `Unexpected format: ${url}` },
  );

  checks.push(
    !key
      ? { name: "VITE_SUPABASE_PUBLISHABLE_KEY", status: "error", detail: "Missing." }
      : key.split(".").length === 3
        ? { name: "VITE_SUPABASE_PUBLISHABLE_KEY", status: "ok", detail: `Present (${key.length} chars, JWT-shaped).` }
        : { name: "VITE_SUPABASE_PUBLISHABLE_KEY", status: "warn", detail: "Present but not JWT-shaped." },
  );

  checks.push(
    !pid
      ? { name: "VITE_SUPABASE_PROJECT_ID", status: "error", detail: "Missing." }
      : { name: "VITE_SUPABASE_PROJECT_ID", status: "ok", detail: pid },
  );

  if (admins && admins.trim()) {
    const list = admins.split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
    checks.push({
      name: "VITE_ADMIN_EMAILS",
      status: "ok",
      detail: `${list.length} email(s) configured.`,
    });
  } else {
    checks.push({
      name: "VITE_ADMIN_EMAILS",
      status: "warn",
      detail: `Not set in this build. Hardcoded fallback active: ${ADMIN_FALLBACK}.`,
    });
  }

  return checks;
}

const STATUS_META: Record<CheckStatus, { label: string; color: string; bg: string }> = {
  ok:       { label: "OK",       color: "#1F7A3A", bg: "rgba(31,122,58,0.10)" },
  warn:     { label: "Warning",  color: "#B8741A", bg: "rgba(196,137,42,0.12)" },
  error:    { label: "Missing",  color: "#A8321B", bg: "rgba(168,50,27,0.10)" },
  unknown:  { label: "Unknown",  color: "#5C5248", bg: "rgba(26,22,14,0.06)" },
  checking: { label: "Checking", color: "#5C5248", bg: "rgba(26,22,14,0.06)" },
};

function StatusPill({ status }: { status: CheckStatus }) {
  const m = STATUS_META[status];
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 8px",
        borderRadius: 999,
        fontFamily: "'DM Mono',ui-monospace,monospace",
        fontSize: 10,
        color: m.color,
        background: m.bg,
      }}
    >
      {m.label}
    </span>
  );
}

export default function EnvHelp() {
  const [checks, setChecks] = useState<Check[]>(() => buildClientChecks());
  const [backend, setBackend] = useState<Check>({
    name: "Backend connectivity",
    status: "checking",
    detail: "Pinging Lovable Cloud…",
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { error } = await supabase
          .from("profiles")
          .select("id", { head: true, count: "exact" })
          .limit(1);
        if (cancelled) return;
        if (error) {
          setBackend({
            name: "Backend connectivity",
            status: "warn",
            detail: `Reachable but query failed: ${error.message}`,
          });
        } else {
          setBackend({
            name: "Backend connectivity",
            status: "ok",
            detail: "Lovable Cloud reachable and responding.",
          });
        }
      } catch (e: any) {
        if (cancelled) return;
        setBackend({
          name: "Backend connectivity",
          status: "error",
          detail: `Could not reach backend: ${e?.message ?? "network error"}`,
        });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const allChecks = [...checks, backend];
  const hasError = allChecks.some((c) => c.status === "error");
  const hasWarn = allChecks.some((c) => c.status === "warn");
  const overall: CheckStatus = hasError ? "error" : hasWarn ? "warn" : "ok";
  const overallText =
    overall === "ok"
      ? "All required variables look correctly configured."
      : overall === "warn"
        ? "Configured, but some optional or fallback values need attention."
        : "One or more required variables are missing.";

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
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <h3 style={{ margin: 0, fontSize: 14, color: "#1A1614" }}>Status check</h3>
          <StatusPill status={overall} />
        </div>
        <p style={{ margin: "0 0 12px", color: "#5C5248", fontSize: 13 }}>{overallText}</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {allChecks.map((c) => (
            <div
              key={c.name}
              style={{
                display: "flex",
                gap: 12,
                alignItems: "flex-start",
                padding: "8px 10px",
                borderRadius: 6,
                background: "rgba(26,22,14,0.02)",
              }}
            >
              <div style={{ minWidth: 80 }}>
                <StatusPill status={c.status} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ ...mono, color: "#1A1614" }}>{c.name}</div>
                <div style={{ fontSize: 12, color: "#5C5248", wordBreak: "break-word" }}>
                  {c.detail}
                </div>
              </div>
            </div>
          ))}
        </div>
        <p style={{ color: "#9A8F84", fontSize: 11, marginTop: 12, marginBottom: 0 }}>
          Note: runtime secrets (e.g. <span style={mono}>RESEND_API_KEY</span>) cannot be checked
          from the browser. Verify those in Cloud → Secrets and from edge function logs.
        </p>
      </div>

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