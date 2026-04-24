import { ReactNode, useEffect, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { FileText, PenLine, FileStack, User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { NotificationBell } from "@/components/NotificationBell";
import { DemoProfileCards } from "@/components/demo/DemoProfileCards";
import { useDemo } from "@/contexts/DemoContext";
import { Helmet } from "react-helmet-async";

const NAV = [
  { to: "/dashboard", label: "Passport", icon: FileText },
  { to: "/log-work", label: "Log Work", icon: PenLine },
  { to: "/contracts", label: "Contracts", icon: FileStack },
  { to: "/account", label: "Account", icon: User },
];

const titleFor = (path: string) => {
  const m = NAV.find((n) => path === n.to || path.startsWith(n.to + "/"));
  return m?.label ?? "SCORE";
};

const initialsFrom = (name?: string | null) => {
  if (!name) return "??";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

type Profile = { full_name: string | null; contributor_id: string | null };

export const AppShell = ({ children }: { children: ReactNode }) => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [profile, setProfile] = useState<Profile | null>(null);
  const { activeDemo, profile: demoProfile, setActiveDemo } = useDemo();
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia("(max-width: 767px)").matches : false
  );

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate("/auth", { replace: true });
      return;
    }
    // Soft invite gate: signed-in users without a redeemed code go to /invite.
    (async () => {
      const { data } = await supabase.rpc("current_user_has_redeemed_invite");
      if (data === false) {
        navigate("/invite", { replace: true });
      }
    })();
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("full_name, contributor_id")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => setProfile((data as Profile) ?? null));
  }, [user]);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const onChange = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth", { replace: true });
  };

  const pageTitle = titleFor(location.pathname);
  const initials = initialsFrom(profile?.full_name);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#F5F1E8",
        fontFamily: "'DM Sans', system-ui, sans-serif",
        color: "#1A1614",
      }}
    >
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <style>{`
        .app-shell-link { display:flex; align-items:center; padding:10px 20px; font-family:'DM Sans',system-ui,sans-serif; font-size:13px; font-weight:500; text-decoration:none; color:#5C5248; border-left:2px solid transparent; transition:background-color .12s ease; }
        .app-shell-link:hover { background: rgba(26,22,14,0.03); }
        .app-shell-link.active { border-left-color:#C4892A; background: rgba(196,137,42,0.06); color:#1A1614; }
        .app-shell-signout { font-family:'DM Mono',ui-monospace,monospace; font-size:9px; color:#9A8F84; background:none; border:none; padding:0; cursor:pointer; }
        .app-shell-signout:hover { text-decoration: underline; }
        .app-shell-bottom-link { flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:3px; text-decoration:none; color:#9A8F84; }
        .app-shell-bottom-link.active { color:#C4892A; }
        .app-shell-bottom-label { font-family:'DM Mono',ui-monospace,monospace; font-size:9px; }
      `}</style>

      {!isMobile && (
        <aside
          style={{
            position: "fixed", top: 0, left: 0, bottom: 0,
            width: 260, background: "#FDFAF4",
            borderRight: "1px solid rgba(26,22,14,0.08)",
            display: "flex", flexDirection: "column",
            zIndex: 40,
          }}
        >
          <div style={{ padding: "18px 20px", borderBottom: "1px solid rgba(26,22,14,0.08)" }}>
            <div style={{ fontFamily: "'DM Mono',ui-monospace,monospace", fontSize: 15, color: "#C4892A" }}>SCORE</div>
            <div style={{ fontFamily: "'DM Mono',ui-monospace,monospace", fontSize: 9, color: "#9A8F84", marginTop: 2 }}>
              Contribution Ledger
            </div>
          </div>
          <nav style={{ display: "flex", flexDirection: "column", paddingTop: 8 }}>
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.to === "/dashboard"}
                className={({ isActive }) => `app-shell-link${isActive ? " active" : ""}`}
              >
                {n.label}
              </NavLink>
            ))}
          </nav>
          <div style={{ marginTop: 4 }}>
            <DemoProfileCards />
          </div>
          <div style={{ marginTop: "auto", borderTop: "1px solid rgba(26,22,14,0.08)", padding: "14px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 32, height: 32, borderRadius: "50%",
                  background: "rgba(196,137,42,0.12)",
                  border: "1px solid rgba(196,137,42,0.3)",
                  color: "#C4892A",
                  fontFamily: "'DM Mono',ui-monospace,monospace",
                  fontSize: 13, fontWeight: 600,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                {initials}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontFamily: "'DM Sans',system-ui,sans-serif",
                    fontSize: 13, fontWeight: 500, color: "#1A1614",
                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                  }}
                >
                  {profile?.full_name ?? "—"}
                </div>
                <div
                  style={{
                    fontFamily: "'DM Mono',ui-monospace,monospace",
                    fontSize: 9, color: "#9A8F84",
                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                  }}
                >
                  {profile?.contributor_id ?? "Pending"}
                </div>
              </div>
              <button onClick={handleSignOut} className="app-shell-signout">Sign out</button>
            </div>
          </div>
        </aside>
      )}

      <div
        style={{
          marginLeft: isMobile ? 0 : 260,
          minHeight: "100vh",
          display: "flex", flexDirection: "column",
          paddingBottom: isMobile ? 72 : 0,
        }}
      >
        <header
          style={{
            position: "sticky", top: 0, zIndex: 30,
            height: 52,
            background: "rgba(253,250,244,0.95)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            borderBottom: "1px solid rgba(26,22,14,0.08)",
            padding: "0 24px",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}
        >
          <h1
            style={{
              fontFamily: "'Playfair Display',Georgia,serif",
              fontSize: 18, fontWeight: 600, color: "#1A1614", margin: 0,
            }}
          >
            {pageTitle}
          </h1>
          {user && <NotificationBell userId={user.id} />}
        </header>

        {demoProfile && (
          <div
            style={{
              background: demoProfile.banner.bg,
              borderBottom: `1px solid ${demoProfile.banner.border}`,
              padding: "7px 24px",
              fontFamily: "'DM Mono',ui-monospace,monospace",
              fontSize: 10,
              color: demoProfile.accent,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
            }}
          >
            <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {isMobile && demoProfile.banner.mobileText
                ? demoProfile.banner.mobileText
                : demoProfile.banner.text}
            </span>
            <button
              type="button"
              onClick={() => setActiveDemo("none")}
              style={{
                background: "none",
                border: "none",
                padding: 0,
                cursor: "pointer",
                color: demoProfile.accent,
                fontFamily: "'DM Mono',ui-monospace,monospace",
                fontSize: 10,
              }}
            >
              Exit demo →
            </button>
          </div>
        )}

        <main style={{ flex: 1, minWidth: 0 }}>{children}</main>
      </div>

      {isMobile && (
        <nav
          style={{
            position: "fixed", bottom: 0, left: 0, right: 0,
            height: 56,
            background: "#FDFAF4",
            borderTop: "1px solid rgba(26,22,14,0.10)",
            display: "flex", alignItems: "stretch",
            zIndex: 40,
          }}
        >
          {NAV.map((n) => {
            const Icon = n.icon;
            return (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.to === "/dashboard"}
                className={({ isActive }) => `app-shell-bottom-link${isActive ? " active" : ""}`}
              >
                <Icon size={20} />
                <span className="app-shell-bottom-label">{n.label}</span>
              </NavLink>
            );
          })}
        </nav>
      )}
    </div>
  );
};
