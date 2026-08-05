import { useEffect, useState, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const ADMIN_CONTACT = "hello@smarterfrontiers.com";

export function NandiInviteGate({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [state, setState] = useState<"checking" | "allowed" | "denied">("checking");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (cancelled) return;
      if (!session?.user) {
        const next = location.pathname + location.search;
        navigate(`/auth?next=${encodeURIComponent(next)}`, { replace: true });
        return;
      }
      const { data, error } = await supabase.rpc("has_nandi_access", { _user_id: session.user.id });
      if (cancelled) return;
      setState(!error && data === true ? "allowed" : "denied");
    })();
    return () => { cancelled = true; };
  }, [navigate, location.pathname, location.search]);

  if (state === "checking") {
    return <div style={{ minHeight: "100vh", background: "#FDFAF4" }} />;
  }

  if (state === "denied") {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#FDFAF4",
          color: "#1A1614",
          fontFamily: "'DM Sans', system-ui, sans-serif",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
        }}
      >
        <div style={{ maxWidth: 460 }}>
          <div
            style={{
              fontFamily: "'DM Mono', ui-monospace, monospace",
              fontSize: 9,
              letterSpacing: "0.10em",
              textTransform: "uppercase",
              color: "#9A8F84",
            }}
          >
            SCORE · Nandi sandbox
          </div>
          <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 24, margin: "8px 0 10px" }}>
            Access not enabled
          </h1>
          <p style={{ color: "#5C5248", fontSize: 14, lineHeight: 1.55, margin: 0 }}>
            This account isn't on the Nandi sandbox access list. Contact {ADMIN_CONTACT} to request access.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export default NandiInviteGate;
