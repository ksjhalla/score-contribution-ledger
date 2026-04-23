import { useCallback, useEffect, useMemo, useState } from "react";
import { Bell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet";
import { notificationEvents, type NotificationRow, type NotificationType } from "@/lib/notifications";
import { ledgerEvents } from "@/lib/ledgerEvents";

const typeLabel: Record<NotificationType, string> = {
  trigger_met: "Trigger met",
  execution_pending: "Execution pending",
  settlement_due: "Settlement due",
  attestation_requested: "Attestation requested",
  system: "System",
};

const formatRelative = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
};

type Props = { userId: string };

export const NotificationBell = ({ userId }: Props) => {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationRow[]>([]);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("notifications")
      .select("id, user_id, type, contract_id, execution_id, message, read, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);
    setItems((data ?? []) as NotificationRow[]);
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  // Refetch on any sendNotification() call.
  useEffect(() => {
    const off = notificationEvents.on(load);
    return () => { off(); };
  }, [load]);

  // Realtime: new notifications inserted by edge functions / other tabs.
  useEffect(() => {
    const ch = supabase
      .channel(`notifications:${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        () => load(),
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [userId, load]);

  const unread = useMemo(() => items.filter((i) => !i.read).length, [items]);

  const markRead = async (id: string) => {
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, read: true } : i));
    await supabase.from("notifications").update({ read: true }).eq("id", id);
  };

  const markAllRead = async () => {
    setItems((prev) => prev.map((i) => ({ ...i, read: true })));
    await supabase.from("notifications").update({ read: true }).eq("user_id", userId).eq("read", false);
  };

  const handleAction = async (n: NotificationRow) => {
    await markRead(n.id);
    // Triggers a global refresh; the relevant card/dialog will show the new state.
    ledgerEvents.emit();
    setOpen(false);
  };

  const actionLabel = (t: NotificationType): string | null => {
    switch (t) {
      case "trigger_met": return "Log execution";
      case "settlement_due": return "Mark settled";
      case "execution_pending":
      case "attestation_requested": return "View contract";
      default: return null;
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <Badge
              className="absolute -top-1 -right-1 h-4 min-w-4 px-1 rounded-full text-[10px] leading-none flex items-center justify-center"
            >
              {unread > 9 ? "9+" : unread}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[380px] sm:w-[420px] flex flex-col gap-0 p-0">
        <SheetHeader className="px-5 pt-5 pb-3 border-b">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-base">Notifications</SheetTitle>
            {unread > 0 && (
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={markAllRead}>
                Mark all read
              </Button>
            )}
          </div>
          <SheetDescription className="text-xs">
            {unread === 0 ? "You're all caught up." : `${unread} unread`}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <div className="px-5 py-12 text-center text-xs text-muted-foreground">
              No notifications yet.
            </div>
          ) : (
            <ul className="divide-y">
              {items.map((n) => {
                const label = actionLabel(n.type);
                return (
                  <li key={n.id} className={`px-5 py-3 ${n.read ? "" : "bg-muted/40"}`}>
                    <div className="flex items-start gap-2">
                      {!n.read && (
                        <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" aria-hidden />
                      )}
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <Badge variant="secondary" className="text-[10px]">{typeLabel[n.type]}</Badge>
                          <span className="text-[10px] text-muted-foreground">{formatRelative(n.created_at)}</span>
                        </div>
                        <p className="text-sm leading-snug">{n.message}</p>
                        <div className="flex items-center justify-between pt-1">
                          {label ? (
                            <Button size="sm" variant="outline" className="h-7 text-xs"
                              onClick={() => handleAction(n)}>
                              {label}
                            </Button>
                          ) : <span />}
                          {!n.read && (
                            <Button size="sm" variant="ghost" className="h-7 text-xs"
                              onClick={() => markRead(n.id)}>
                              Dismiss
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
