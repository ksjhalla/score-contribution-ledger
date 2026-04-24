import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Plus, Webhook, Copy, Bell, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { AddTriggerDialog } from "./AddTriggerDialog";
import { sendNotification, notificationEvents } from "@/lib/notifications";
import { useAuth } from "@/hooks/useAuth";
import { generateWebhookSecret, sha256Hex } from "@/lib/webhookSecret";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

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
  const [failedCounts, setFailedCounts] = useState<Record<string, number>>({});
  const [rotateTarget, setRotateTarget] = useState<TriggerRow | null>(null);
  const [rotatedSecret, setRotatedSecret] = useState<{ id: string; secret: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("triggers")
      .select("id, label, current_value, threshold_value, unit, direction, source_type, webhook_url, last_updated")
      .eq("contract_id", contractId)
      .order("created_at", { ascending: false });
    const rows = (data ?? []) as TriggerRow[];
    setTriggers(rows);

    // Per-trigger failed-auth counts in the last 24h.
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const counts: Record<string, number> = {};
    await Promise.all(rows.map(async (t) => {
      const { count } = await supabase
        .from("trigger_events")
        .select("id", { count: "exact", head: true })
        .eq("trigger_id", t.id)
        .eq("auth_failed", true)
        .gte("received_at", since);
      counts[t.id] = count ?? 0;
    }));
    setFailedCounts(counts);
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
    // The DB trigger `triggers_threshold_crossed_notif` creates the trigger_met
    // notification automatically when current_value crosses the threshold.
    const nowMet = t.direction === "Above" ? val >= t.threshold_value : val <= t.threshold_value;
    if (!wasMet && nowMet) notificationEvents.emit();
    setDraftValues((p) => ({ ...p, [t.id]: "" }));
    load();
  };

  const copyUrl = async (url: string) => {
    await navigator.clipboard.writeText(url);
    toast.success("Webhook URL copied.");
  };

  const copyText = async (text: string, msg = "Copied.") => {
    await navigator.clipboard.writeText(text);
    toast.success(msg);
  };

  const confirmRotate = async () => {
    if (!rotateTarget) return;
    const raw = generateWebhookSecret();
    const hash = await sha256Hex(raw);
    const { error } = await supabase
      .from("triggers")
      .update({ webhook_secret: hash })
      .eq("id", rotateTarget.id);
    if (error) { toast.error(error.message); return; }
    setRotatedSecret({ id: rotateTarget.id, secret: raw });
    setRotateTarget(null);
    load();
  };

  const curlExample = (t: TriggerRow) =>
    `curl -X POST \\\n  ${t.webhook_url} \\\n  -H "Content-Type: application/json" \\\n  -H "X-SCORE-Secret: whsec_your_secret" \\\n  -d '{"value": 8847}'`;

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
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 rounded-md border bg-muted/40 p-2">
                      <Webhook className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <code className="flex-1 font-mono text-[10px] truncate">{t.webhook_url}</code>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => copyUrl(t.webhook_url!)}>
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                    </div>

                    <div>
                      <div className="text-[9px] font-mono uppercase tracking-wide text-muted-foreground mb-1">
                        How to send values
                      </div>
                      <div className="relative rounded-md border bg-muted/40 p-3">
                        <pre className="font-mono text-[10px] text-foreground overflow-x-auto whitespace-pre">
{curlExample(t)}
                        </pre>
                        <Button
                          size="icon" variant="ghost"
                          className="absolute top-1 right-1 h-6 w-6"
                          onClick={() => copyText(curlExample(t), "Snippet copied.")}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                      <p className="text-[9px] font-mono text-muted-foreground mt-1">
                        Your webhook secret was shown once at creation. If you lost it, rotate it below.
                      </p>
                    </div>

                    {(failedCounts[t.id] ?? 0) > 0 && (
                      <div
                        className="rounded-md p-2"
                        style={{
                          backgroundColor: "rgba(154,48,32,0.06)",
                          border: "1px solid rgba(154,48,32,0.2)",
                        }}
                      >
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" style={{ color: "#9A3020" }} />
                          <div className="flex-1 min-w-0">
                            <div className="text-xs" style={{ color: "#9A3020" }}>
                              {failedCounts[t.id]} failed authentication attempt{failedCounts[t.id] === 1 ? "" : "s"} on this trigger in the last 24 hours.
                            </div>
                            <div className="text-[9px] font-mono text-muted-foreground mt-1">
                              Someone may have obtained your trigger ID. Consider rotating your webhook secret.
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => setRotateTarget(t)}
                      className="text-[9px] font-mono hover:underline"
                      style={{ color: "#C4892A" }}
                    >
                      Rotate secret →
                    </button>
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

      <AlertDialog open={!!rotateTarget} onOpenChange={(o) => !o && setRotateTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Generate a new webhook secret?</AlertDialogTitle>
            <AlertDialogDescription>
              Your current secret will stop working immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRotate}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!rotatedSecret} onOpenChange={(o) => !o && setRotatedSecret(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Your new webhook secret</DialogTitle>
            <DialogDescription>
              Send this in the <code>X-SCORE-Secret</code> header on every request.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="flex items-center gap-2 rounded-md border bg-muted/40 p-3">
              <code className="flex-1 font-mono text-xs break-all">{rotatedSecret?.secret}</code>
              <Button
                size="icon" variant="ghost" className="h-7 w-7 shrink-0"
                onClick={() => rotatedSecret && copyText(rotatedSecret.secret, "Secret copied.")}
              >
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground">
              This is shown once. Store it securely — SCORE does not store it in recoverable form.
            </p>
          </div>
          <DialogFooter>
            <Button onClick={() => setRotatedSecret(null)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};