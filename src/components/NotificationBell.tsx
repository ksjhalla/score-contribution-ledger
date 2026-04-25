import { useCallback, useEffect, useMemo, useState } from "react";
import { Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { notificationEvents, type NotificationRow, type NotificationType } from "@/lib/notifications";
import { ledgerEvents } from "@/lib/ledgerEvents";
import { useDemo } from "@/contexts/DemoContext";
import { demoNotificationsFor, type DemoNotification } from "@/data/demoProfiles";
import { isPublicRoute } from "@/lib/routeGuard";

type BadgeStyle = { bg: string; color: string; label: string };

const TYPE_STYLES: Record<NotificationType, BadgeStyle> = {
  trigger_met:           { bg: "rgba(42,106,69,0.10)",  color: "#2A6A45", label: "Trigger" },
  settlement_due:        { bg: "rgba(196,137,42,0.10)", color: "#C4892A", label: "Payment due" },
  attestation_confirmed: { bg: "rgba(42,92,138,0.10)",  color: "#2A5C8A", label: "Confirmed" },
  attestation_declined:  { bg: "rgba(154,48,32,0.10)",  color: "#9A3020", label: "Declined" },
  attestation_requested: { bg: "rgba(42,92,138,0.10)",  color: "#2A5C8A", label: "Attestation" },
  evidence_required:     { bg: "rgba(92,82,72,0.10)",   color: "#5C5248", label: "Evidence" },
  execution_pending:     { bg: "rgba(196,137,42,0.10)", color: "#C4892A", label: "Pending" },
  system:                { bg: "rgba(26,22,14,0.06)",   color: "#9A8F84", label: "System" },
};

const formatRelative = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

const FONT_DISPLAY = "'Playfair Display',Georgia,serif";
const FONT_BODY = "'DM Sans',system-ui,sans-serif";
const FONT_MONO = "'DM Mono',ui-monospace,monospace";

type PanelRow = {
  id: string;
  type: NotificationType;
  message: string;
  read: boolean;
  created_at: string;
  contract_id?: string | null;
};

type Props = { userId: string };

export const NotificationBell = ({ userId }: Props) => {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationRow[] | null>(null);
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < 768 : false,
  );
  const [demoReadIds, setDemoReadIds] = useState<Set<string>>(new Set());
  const { activeDemo } = useDemo();
  const navigate = useNavigate();

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("notifications")
      .select("id, user_id, type, contract_id, execution_id, message, read, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);
    setItems((data ?? []) as NotificationRow[]);
  }, [userId]);

  useEffect(() => { if (activeDemo === "none") load(); }, [load, activeDemo]);

  useEffect(() => {
    if (activeDemo !== "none") return;
    const off = notificationEvents.on(load);
    return () => { off(); };
  }, [load, activeDemo]);

  useEffect(() => {
    if (activeDemo !== "none") return;
    // Defensive: never open a realtime channel on public routes.
    if (typeof window !== "undefined" && isPublicRoute(window.location.pathname)) return;
    const ch = supabase
      .channel(`notifications:${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        () => load(),
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [userId, load, activeDemo]);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Reset demo read state when switching demos.
  useEffect(() => { setDemoReadIds(new Set()); }, [activeDemo]);

  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const demoRows: PanelRow[] = useMemo(() => {
    if (activeDemo === "none") return [];
    return demoNotificationsFor(activeDemo).map((n: DemoNotification) => ({
      ...n,
      read: n.read || demoReadIds.has(n.id),
    }));
  }, [activeDemo, demoReadIds]);

  const realRows: PanelRow[] = useMemo(
    () => (items ?? []).map((i) => ({ id: i.id, type: i.type, message: i.message, read: i.read, created_at: i.created_at, contract_id: i.contract_id })),
    [items],
  );

  const rows = activeDemo === "none" ? realRows : demoRows;
  const unread = useMemo(() => rows.filter((r) => !r.read).length, [rows]);
  const isLoadingRealRows = activeDemo === "none" && items === null;

  const markRead = async (id: string) => {
    if (activeDemo !== "none") {
      setDemoReadIds((prev) => new Set(prev).add(id));
      return;
    }
    setItems((prev) => (prev ?? []).map((i) => i.id === id ? { ...i, read: true } : i));
    await supabase.from("notifications").update({ read: true }).eq("id", id);
  };

  const markAllRead = async () => {
    if (activeDemo !== "none") {
      setDemoReadIds(new Set(rows.map((r) => r.id)));
      return;
    }
    setItems((prev) => (prev ?? []).map((i) => ({ ...i, read: true })));
    await supabase.from("notifications").update({ read: true }).eq("user_id", userId).eq("read", false);
  };

  const handleViewContract = async (n: PanelRow) => {
    await markRead(n.id);
    ledgerEvents.emit();
    setOpen(false);
    if (n.contract_id) {
      navigate(`/contracts?expand=${n.contract_id}`);
    } else {
      navigate("/contracts");
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Notifications"
        style={{
          position: "relative",
          background: "none", border: "none", padding: 6, cursor: "pointer",
          color: "#1A1614",
        }}
      >
        <Bell size={18} />
        {unread > 0 && (
          <span
            aria-hidden
            style={{
              position: "absolute", top: -2, right: -2,
              minWidth: 18, height: 18, padding: "0 5px",
              borderRadius: 9, background: "#9A3020", color: "#fff",
              fontFamily: FONT_MONO, fontSize: 10, lineHeight: "18px",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div
            onClick={() => setOpen(false)}
            style={{
              position: "fixed", inset: 0, background: "rgba(26,22,14,0.25)",
              zIndex: 49, animation: "fadeIn .12s ease",
            }}
          />
          <aside
            role="dialog"
            aria-label="Notifications"
            style={
              isMobile
                ? {
                    position: "fixed", left: 0, right: 0, bottom: 0,
                    maxHeight: "80vh", background: "#FDFAF4",
                    borderRadius: "12px 12px 0 0",
                    boxShadow: "0 -8px 32px rgba(26,22,14,0.18)",
                    zIndex: 50, display: "flex", flexDirection: "column",
                  }
                : {
                    position: "fixed", top: 52, right: 0,
                    width: 320, height: "calc(100vh - 52px)",
                    background: "#FDFAF4",
                    borderLeft: "1px solid rgba(26,22,14,0.12)",
                    boxShadow: "-4px 0 20px rgba(26,22,14,0.08)",
                    zIndex: 50, display: "flex", flexDirection: "column",
                  }
            }
          >
            <header
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "16px 20px", borderBottom: "1px solid rgba(26,22,14,0.08)",
                gap: 12, flexShrink: 0, background: "#FDFAF4",
              }}
            >
              <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: 18, fontWeight: 600, color: "#1A1614", margin: 0 }}>
                Notifications
              </h3>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                {unread > 0 && (
                  <button
                    type="button" onClick={markAllRead}
                    style={{
                      background: "none", border: "none", padding: 0, cursor: "pointer",
                      fontFamily: FONT_MONO, fontSize: 9, color: "#C4892A",
                    }}
                  >
                    Mark all read
                  </button>
                )}
                <button
                  type="button" onClick={() => setOpen(false)} aria-label="Close"
                  style={{
                    background: "none", border: "none", padding: 0, cursor: "pointer",
                    fontFamily: FONT_MONO, fontSize: 14, color: "#9A8F84", lineHeight: 1,
                  }}
                >
                  ×
                </button>
              </div>
            </header>

            <div style={{ flex: 1, overflowY: "auto" }}>
              {isLoadingRealRows ? (
                <div>
                  {[0, 1].map((i) => (
                    <div key={i} style={{ padding: "14px 20px", borderBottom: "1px solid rgba(26,22,14,0.07)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                        <span className="skeleton" style={{ width: 64, height: 12 }} />
                        <span className="skeleton" style={{ width: 36, height: 9 }} />
                      </div>
                      <span className="skeleton" style={{ width: "85%", height: 10, marginTop: 8 }} />
                      <span className="skeleton" style={{ width: "55%", height: 10, marginTop: 6 }} />
                    </div>
                  ))}
                </div>
              ) : rows.length === 0 ? (
                <div style={{ paddingTop: 40, paddingBottom: 32, paddingLeft: 24, paddingRight: 24, textAlign: "center" }}>
                  <div style={{ fontFamily: FONT_BODY, fontSize: 13, fontWeight: 500, color: "#5C5248" }}>
                    Nothing yet.
                  </div>
                  <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: "#9A8F84", marginTop: 4, lineHeight: 1.5 }}>
                    Notifications appear when triggers fire, payments are due, or attestations resolve.
                  </div>
                </div>
              ) : (
                rows.map((n) => {
                  const style = TYPE_STYLES[n.type] ?? TYPE_STYLES.system;
                  const showAction = !!n.contract_id;
                  return (
                    <div
                      key={n.id}
                      onClick={() => !n.read && markRead(n.id)}
                      style={{
                        padding: "14px 20px",
                        borderBottom: "1px solid rgba(26,22,14,0.07)",
                        background: n.read ? "#FDFAF4" : "#fff",
                        borderLeft: n.read ? "4px solid transparent" : "4px solid #C4892A",
                        cursor: n.read ? "default" : "pointer",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                        <span
                          style={{
                            fontFamily: FONT_MONO, fontSize: 8,
                            background: style.bg, color: style.color,
                            borderRadius: 3, padding: "2px 6px",
                            textTransform: "uppercase", letterSpacing: "0.04em",
                          }}
                        >
                          {style.label}
                        </span>
                        <span style={{ fontFamily: FONT_MONO, fontSize: 9, color: "#9A8F84" }}>
                          {formatRelative(n.created_at)}
                        </span>
                      </div>
                      <p style={{ fontFamily: FONT_BODY, fontSize: 12, color: "#1A1614", lineHeight: 1.55, margin: "4px 0 0" }}>
                        {n.message}
                      </p>
                      {showAction && (
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleViewContract(n); }}
                          style={{
                            marginTop: 6, background: "none", border: "none", padding: 0, cursor: "pointer",
                            fontFamily: FONT_MONO, fontSize: 9, color: "#C4892A",
                          }}
                        >
                          View contract →
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </aside>
        </>
      )}
    </>
  );
};
