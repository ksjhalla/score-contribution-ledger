import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useDemo } from "@/contexts/DemoContext";
import { formatDemoAmount } from "@/data/demoProfiles";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LogWorkForm } from "@/components/log-work/LogWorkForm";
import { MarkSettledDialog } from "@/components/contracts/MarkSettledDialog";
import { AttachEvidenceDialog } from "@/components/contracts/AttachEvidenceDialog";
import { toast } from "sonner";

type ExecStatus = "Pending" | "Settled" | "Intent logged" | "Attested" | "Declined";

type ExecutionRow = {
  id: string;
  title: string;
  execution_date: string;
  status: ExecStatus;
  trigger_met: boolean;
  settled_amount: number | null;
  currency: string;
  settlement_channel: string | null;
  contract_id: string;
  contract_name: string | null;
  evidence_ids: string[];
};

const NOTICE_KEY = "work_entries_notice_dismissed";

const dot: Record<ExecStatus, string> = {
  Settled: "#2A6A45",
  Pending: "#C4892A",
  "Intent logged": "#9A8F84",
  Attested: "#2A5C8A",
  Declined: "#9A3020",
};

const LogWork = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { profile: demoProfile } = useDemo();

  const [executions, setExecutions] = useState<ExecutionRow[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [openForm, setOpenForm] = useState(false);
  const [showLegacyNotice, setShowLegacyNotice] = useState(false);
  const [settleFor, setSettleFor] = useState<ExecutionRow | null>(null);
  const [attachFor, setAttachFor] = useState<ExecutionRow | null>(null);

  useEffect(() => {
    if (!loading && !user) navigate("/auth", { replace: true });
  }, [user, loading, navigate]);

  const fetchExecutions = useCallback(async () => {
    if (!user) return;
    setLoadingList(true);
    const { data, error } = await supabase
      .from("executions")
      .select("id, title, execution_date, status, trigger_met, settled_amount, currency, settlement_channel, contract_id, evidence_ids, contracts:contract_id ( name )")
      .eq("user_id", user.id)
      .order("execution_date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(200);
    setLoadingList(false);
    if (error) { toast.error(error.message); return; }
    const rows = (data ?? []).map((r) => {
      const c = (r as { contracts: { name: string } | null }).contracts;
      return {
        id: r.id,
        title: r.title,
        execution_date: r.execution_date,
        status: r.status as ExecStatus,
        trigger_met: r.trigger_met,
        settled_amount: r.settled_amount,
        currency: r.currency,
        settlement_channel: r.settlement_channel,
        contract_id: r.contract_id,
        contract_name: c?.name ?? null,
        evidence_ids: (r.evidence_ids as string[] | null) ?? [],
      } as ExecutionRow;
    });
    setExecutions(rows);
  }, [user]);

  useEffect(() => {
    if (user && !demoProfile) fetchExecutions();
  }, [user, demoProfile, fetchExecutions]);

  // One-time notice if legacy work_entries exist.
  useEffect(() => {
    if (!user || demoProfile) return;
    if (localStorage.getItem(NOTICE_KEY) === "1") return;
    (async () => {
      const { count } = await supabase
        .from("work_entries")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id);
      if ((count ?? 0) > 0) setShowLegacyNotice(true);
    })();
  }, [user, demoProfile]);

  const dismissNotice = () => {
    localStorage.setItem(NOTICE_KEY, "1");
    setShowLegacyNotice(false);
  };

  const totals = useMemo(() => {
    let pending = 0, settled = 0, settledValue = 0, pendingValue = 0;
    for (const e of executions) {
      if (e.status === "Settled") {
        settled += 1;
        settledValue += Number(e.settled_amount ?? 0);
      } else if (e.status === "Pending" && e.trigger_met) {
        pending += 1;
        pendingValue += Number(e.settled_amount ?? 0);
      }
    }
    return { pending, settled, settledValue, pendingValue };
  }, [executions]);

  if (demoProfile) {
    return (
      <div className="min-h-screen bg-background px-4 py-6 sm:py-10">
        <div className="mx-auto w-full max-w-3xl space-y-6">
          <header className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">Log work</h1>
            <p className="text-sm text-muted-foreground">
              Read-only demo view. Showing executions for {demoProfile.contributor.name}.
            </p>
          </header>
          <Card>
            <CardHeader className="px-5 sm:px-6 pt-5 sm:pt-6">
              <CardTitle>Demo executions</CardTitle>
              <CardDescription>
                {demoProfile.executions.length} {demoProfile.executions.length === 1 ? "entry" : "entries"} · exit demo to log your own work.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-5 sm:px-6 pb-5 sm:pb-6">
              <ul className="divide-y">
                {demoProfile.executions.map((e) => (
                  <li key={e.title} className="py-3 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                        <p className="font-medium text-sm break-words">{e.title}</p>
                        <Badge variant="outline">{e.status}</Badge>
                        <span className="text-xs text-muted-foreground">{e.date}</span>
                      </div>
                      <p className="text-xs text-muted-foreground break-words" style={{ fontFamily: "'DM Mono',ui-monospace,monospace" }}>
                        {e.proof}
                      </p>
                    </div>
                    <div className="text-sm font-medium" style={{ fontFamily: "'DM Mono',ui-monospace,monospace" }}>
                      {formatDemoAmount(e.amount, e.currency)}
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-4 py-6 sm:py-10">
      <div className="mx-auto w-full max-w-3xl space-y-6">
        <header className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">Log work</h1>
            <p className="text-sm text-muted-foreground">
              Each entry is an execution against a contract. Status flows from Intent logged → Pending → Settled.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setOpenForm(true)}
            style={{
              background: "#1A1614", color: "#F5F1E8", border: "none", borderRadius: 4,
              padding: "10px 18px", fontFamily: "'DM Sans',system-ui,sans-serif", fontSize: 14, fontWeight: 500,
              cursor: "pointer", whiteSpace: "nowrap",
            }}
          >
            + Log work
          </button>
        </header>

        {showLegacyNotice && (
          <div style={{
            display: "flex", alignItems: "flex-start", gap: 12,
            border: "1px solid rgba(26,22,14,0.10)", borderRadius: 5,
            padding: "10px 14px", background: "#FDFAF4",
          }}>
            <p style={{
              flex: 1, margin: 0,
              fontFamily: "'DM Mono',ui-monospace,monospace", fontSize: 10, color: "#9A8F84", lineHeight: 1.6,
            }}>
              Some earlier entries were logged in a previous format and are not shown here. Your Passport totals reflect executions only going forward.
            </p>
            <button
              type="button" onClick={dismissNotice} aria-label="Dismiss"
              style={{ background: "transparent", border: "none", padding: "0 4px", color: "#9A8F84", cursor: "pointer", fontSize: 14 }}
            >
              ×
            </button>
          </div>
        )}

        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-md border p-3">
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Pending</div>
            <div className="text-lg font-semibold mt-1">{totals.pending}</div>
          </div>
          <div className="rounded-md border p-3">
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Settled</div>
            <div className="text-lg font-semibold mt-1">{totals.settled}</div>
          </div>
          <div className="rounded-md border p-3">
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Settled value</div>
            <div className="text-lg font-semibold mt-1">
              {totals.settledValue ? totals.settledValue.toLocaleString() : "—"}
            </div>
          </div>
        </div>

        <Card>
          <CardHeader className="px-5 sm:px-6 pt-5 sm:pt-6">
            <CardTitle>Executions</CardTitle>
            <CardDescription>{executions.length} total</CardDescription>
          </CardHeader>
          <CardContent className="px-5 sm:px-6 pb-5 sm:pb-6">
            {loadingList ? (
              <ul className="divide-y">
                {[0, 1, 2].map((i) => (
                  <li key={i} className="py-3 flex items-start gap-3">
                    <span className="skeleton" style={{ width: 10, height: 10, borderRadius: "50%", marginTop: 6 }} />
                    <div style={{ flex: 1 }}>
                      <span className="skeleton" style={{ width: "55%", height: 12 }} />
                      <span className="skeleton" style={{ width: "35%", height: 9, marginTop: 6 }} />
                    </div>
                    <span className="skeleton" style={{ width: 64, height: 12 }} />
                  </li>
                ))}
              </ul>
            ) : executions.length === 0 ? (
              <div style={{ paddingTop: 40, paddingBottom: 24, textAlign: "center" }}>
                <div style={{ fontFamily: "'DM Sans',system-ui,sans-serif", fontSize: 13, fontWeight: 500, color: "#5C5248" }}>
                  No executions yet.
                </div>
                <p style={{ fontFamily: "'DM Sans',system-ui,sans-serif", fontSize: 12, color: "#9A8F84", margin: "4px 0 12px" }}>
                  Log your first contribution to start the trail.
                </p>
                <button
                  type="button" onClick={() => setOpenForm(true)}
                  style={{ background: "transparent", border: "none", padding: 0, cursor: "pointer",
                    fontFamily: "'DM Mono',ui-monospace,monospace", fontSize: 10, color: "#C4892A" }}
                >
                  + Log work →
                </button>
              </div>
            ) : (
              <ul className="divide-y">
                {executions.map((e) => (
                  <li key={e.id} className="py-3 flex items-start gap-3">
                    <span
                      aria-hidden
                      style={{
                        width: 10, height: 10, borderRadius: "50%", background: dot[e.status],
                        marginTop: 6, flex: "0 0 auto",
                      }}
                    />
                    <div className="min-w-0 flex-1">
                      <div style={{ fontFamily: "'DM Sans',system-ui,sans-serif", fontSize: 13, fontWeight: 600, color: "#1A1614" }}>
                        {e.title}
                      </div>
                      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 2 }}>
                        <span style={{ fontFamily: "'DM Mono',ui-monospace,monospace", fontSize: 10, color: "#9A8F84" }}>
                          {e.contract_name ?? "—"}
                        </span>
                        <span style={{ fontFamily: "'DM Mono',ui-monospace,monospace", fontSize: 10, color: "#9A8F84" }}>
                          {new Date(e.execution_date).toLocaleDateString()}
                        </span>
                        {e.evidence_ids.length === 0 ? (
                          <button
                            type="button"
                            onClick={() => setAttachFor(e)}
                            style={{ background: "transparent", border: "none", padding: 0, cursor: "pointer",
                              fontFamily: "'DM Mono',ui-monospace,monospace", fontSize: 9, color: "#9A8F84" }}
                          >
                            Attach evidence →
                          </button>
                        ) : (
                          <span style={{ background: "rgba(42,106,69,0.08)", color: "#2A6A45",
                            fontFamily: "'DM Mono',ui-monospace,monospace", fontSize: 9,
                            padding: "2px 6px", borderRadius: 3 }}>
                            {e.evidence_ids.length} evidence
                          </span>
                        )}
                      </div>
                    </div>
                    <div style={{ textAlign: "right", flex: "0 0 auto" }}>
                      {e.status === "Settled" && e.settled_amount != null && (
                        <div style={{ fontFamily: "'DM Mono',ui-monospace,monospace", fontSize: 11, color: "#2A6A45" }}>
                          {Number(e.settled_amount).toLocaleString()} {e.currency}
                        </div>
                      )}
                      {e.status === "Pending" && (
                        <>
                          {e.settled_amount != null && (
                            <div style={{ fontFamily: "'DM Mono',ui-monospace,monospace", fontSize: 11, color: "#C4892A" }}>
                              {Number(e.settled_amount).toLocaleString()} {e.currency}
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={() => setSettleFor(e)}
                            style={{ background: "transparent", border: "none", padding: 0, color: "#C4892A", textDecoration: "underline", cursor: "pointer", fontFamily: "'DM Sans',system-ui,sans-serif", fontSize: 12, marginTop: 2 }}
                          >
                            Mark as settled
                          </button>
                        </>
                      )}
                      {e.status === "Intent logged" && (
                        <span style={{ fontFamily: "'DM Mono',ui-monospace,monospace", fontSize: 9, color: "#9A8F84", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                          Intent logged
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <LogWorkForm
        open={openForm}
        onOpenChange={setOpenForm}
        onCreated={fetchExecutions}
      />

      {settleFor && (
        <MarkSettledDialog
          open={!!settleFor}
          onOpenChange={(v) => !v && setSettleFor(null)}
          executionId={settleFor.id}
          defaultAmount={settleFor.settled_amount}
          defaultCurrency={settleFor.currency}
          defaultChannel={settleFor.settlement_channel}
          onSettled={() => { setSettleFor(null); fetchExecutions(); }}
        />
      )}

      {attachFor && (
        <AttachEvidenceDialog
          open={!!attachFor}
          onOpenChange={(v) => !v && setAttachFor(null)}
          contractId={attachFor.contract_id}
          executionId={attachFor.id}
          executionTitle={attachFor.title}
          onCreated={() => { setAttachFor(null); fetchExecutions(); }}
        />
      )}
    </div>
  );
};

export default LogWork;