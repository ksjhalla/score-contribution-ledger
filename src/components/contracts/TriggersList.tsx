import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Plus, Webhook, Copy, Bell } from "lucide-react";
import { toast } from "sonner";
import { AddTriggerDialog } from "./AddTriggerDialog";
import { sendNotification, notificationEvents } from "@/lib/notifications";
import { useAuth } from "@/hooks/useAuth";

type TriggerRow = {
  id: string;
  label: string;
  current_value: number;
  threshold_value: number;
  unit: string | null;
  direction: "Above" | "Below";
  source_type: "Manual" | "Webhook" | "File import";
  webhook_url: string | null;
  last_updated: string | null;
};

const isMet = (t: TriggerRow) =>
  t.direction === "Above" ? t.current_value >= t.threshold_value : t.current_value <= t.threshold_value;

const percent = (t: TriggerRow) => {
  if (t.threshold_value === 0) return 100;
  if (t.direction === "Above") {
    return Math.max(0, Math.min(100, (t.current_value / t.threshold_value) * 100));
  }
  // Below: closer to (or under) threshold = closer to 100%
  if (t.current_value <= t.threshold_value) return 100;
  // Distance from current down to threshold, scaled by current
  const ratio = t.threshold_value / t.current_value;
  return Math.max(0, Math.min(100, ratio * 100));
};

type Props = {
  contractId: string;
  onLogExecution: (preset: { triggerMet: true; triggerLabel: string }) => void;
};

export const TriggersList = ({ contractId, onLogExecution }: Props) => {
  const { user } = useAuth();
  const [triggers, setTriggers] = useState<TriggerRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [draftValues, setDraftValues] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("triggers")
      .select("id, label, current_value, threshold_value, unit, direction, source_type, webhook_url, last_updated")
      .eq("contract_id", contractId)
      .order("created_at", { ascending: false });
    setTriggers((data ?? []) as TriggerRow[]);
    setLoading(false);
  }, [contractId]);

  useEffect(() => { load(); }, [load]);

  const updateManual = async (t: TriggerRow) => {
    const raw = draftValues[t.id];
    if (raw === undefined || raw === "") return;
    const val = Number(raw);
    if (!Number.isFinite(val)) { toast.error("Enter a number"); return; }
    const wasMet = isMet(t);
    const { error } = await supabase
      .from("triggers")
      .update({ current_value: val, last_updated: new Date().toISOString() })
      .eq("id", t.id);
    if (error) { toast.error(error.message); return; }
    // Threshold-crossing notification (only fires when crossing from not-met → met).
    const nowMet = t.direction === "Above" ? val >= t.threshold_value : val <= t.threshold_value;
    if (!wasMet && nowMet && user) {
      const { data: c } = await supabase
        .from("contracts").select("name").eq("id", contractId).maybeSingle();
      await sendNotification({
        userId: user.id,
        type: "trigger_met",
        contractId,
        message: `${c?.name ?? "Contract"} — trigger condition met. Log an execution?`,
      });
      notificationEvents.emit();
    }
    setDraftValues((p) => ({ ...p, [t.id]: "" }));
    load();
  };

  const copyUrl = async (url: string) => {
    await navigator.clipboard.writeText(url);
    toast.success("Webhook URL copied");
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button size="sm" variant="outline" onClick={() => setAddOpen(true)}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Add trigger
        </Button>
      </div>

      {loading ? (
        <p className="text-xs text-muted-foreground">Loading…</p>
      ) : triggers.length === 0 ? (
        <div className="rounded-md border border-dashed p-4 text-center text-xs text-muted-foreground">
          No triggers yet.
        </div>
      ) : (
        <ul className="space-y-3">
          {triggers.map((t) => {
            const met = isMet(t);
            const pct = percent(t);
            return (
              <li key={t.id} className="rounded-md border p-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{t.label}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {t.current_value.toLocaleString()} / {t.threshold_value.toLocaleString()}
                      {t.unit ? ` ${t.unit}` : ""} · {t.direction === "Above" ? "≥" : "≤"} threshold
                    </div>
                  </div>
                  {met && <Badge className="shrink-0">Threshold met</Badge>}
                </div>

                <div className="space-y-1">
                  <Progress value={pct} className="h-2" />
                  <div className="text-[11px] text-muted-foreground text-right">{pct.toFixed(0)}%</div>
                </div>

                {met && (
                  <div className="flex items-center justify-between gap-2 rounded-md border bg-muted/40 p-2">
                    <div className="flex items-center gap-2 text-xs">
                      <Bell className="h-3.5 w-3.5 text-primary" />
                      Trigger condition met — log an execution?
                    </div>
                    <Button size="sm" className="h-7 text-xs"
                      onClick={() => onLogExecution({ triggerMet: true, triggerLabel: t.label })}>
                      Log execution
                    </Button>
                  </div>
                )}

                {t.source_type === "Manual" && (
                  <div className="flex items-center gap-2">
                    <Input
                      type="number" step="any" placeholder="Update current value"
                      value={draftValues[t.id] ?? ""}
                      onChange={(e) => setDraftValues((p) => ({ ...p, [t.id]: e.target.value }))}
                      className="h-8 text-xs"
                    />
                    <Button size="sm" variant="outline" className="h-8" onClick={() => updateManual(t)}>
                      Update
                    </Button>
                  </div>
                )}

                {t.source_type === "Webhook" && t.webhook_url && (
                  <div className="flex items-center gap-2 rounded-md border bg-muted/40 p-2">
                    <Webhook className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <code className="flex-1 font-mono text-[10px] truncate">{t.webhook_url}</code>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => copyUrl(t.webhook_url!)}>
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}

                {t.last_updated && (
                  <div className="text-[11px] text-muted-foreground">
                    Updated {new Date(t.last_updated).toLocaleString()}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <AddTriggerDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        contractId={contractId}
        onCreated={load}
      />
    </div>
  );
};