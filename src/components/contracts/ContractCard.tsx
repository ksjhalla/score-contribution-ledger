import { useCallback, useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { Plus, ShieldCheck, FileSearch, Activity } from "lucide-react";
import { AttachEvidenceDialog } from "./AttachEvidenceDialog";
import { LogExecutionDialog } from "./LogExecutionDialog";
import { MarkSettledDialog } from "./MarkSettledDialog";
import { TriggersList } from "./TriggersList";
import { AttestorsSection } from "./AttestorsSection";
import { ExecutionAttestations } from "./ExecutionAttestations";
import { Download, Copy } from "lucide-react";
import { exportContractRecord } from "@/lib/contractExport";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

type StakeType = "Financial" | "Attribution" | "Governance" | "Mixed";

export type ContractRow = {
  id: string;
  name: string;
  counterparty_name: string;
  counterparty_type: string;
  stake_type: StakeType;
  contract_type: string;
  attestation_required: boolean;
};

const stakeStyles: Record<StakeType, string> = {
  Financial: "bg-amber-100 text-amber-900 border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30",
  Attribution: "bg-blue-100 text-blue-900 border-blue-200 dark:bg-blue-500/15 dark:text-blue-300 dark:border-blue-500/30",
  Governance: "bg-green-100 text-green-900 border-green-200 dark:bg-green-500/15 dark:text-green-300 dark:border-green-500/30",
  Mixed: "bg-gray-100 text-gray-900 border-gray-200 dark:bg-gray-500/15 dark:text-gray-300 dark:border-gray-500/30",
};

type EvidenceRow = {
  id: string;
  title: string;
  evidence_type: string;
  fingerprint: string;
  timestamp_created: string;
  execution_id?: string | null;
};

type ExecutionRow = {
  id: string;
  title: string;
  work_description: string;
  trigger_met: boolean;
  status: "Pending" | "Attested" | "Settled" | "Intent logged" | "Declined";
  evidence_ids: string[];
  settlement_channel: string | null;
  settled_amount: number | null;
  currency: string;
  execution_date: string;
};

const statusDot: Record<ExecutionRow["status"], string> = {
  Pending: "bg-amber-500",
  Attested: "bg-blue-500",
  Settled: "bg-green-500",
  "Intent logged": "bg-gray-400",
  Declined: "bg-red-500",
};

export const ContractCard = ({ contract }: { contract: ContractRow }) => {
  const { user } = useAuth();
  const [evidence, setEvidence] = useState<EvidenceRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [attachOpen, setAttachOpen] = useState(false);
  const [attachFor, setAttachFor] = useState<{ id: string; title: string } | null>(null);
  const [executions, setExecutions] = useState<ExecutionRow[]>([]);
  const [exLoading, setExLoading] = useState(false);
  const [logOpen, setLogOpen] = useState(false);
  const [settleFor, setSettleFor] = useState<ExecutionRow | null>(null);
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    if (!user) return;
    setExporting(true);
    try {
      const { data: prof } = await supabase.from("profiles").select("contributor_id").eq("id", user.id).maybeSingle();
      await exportContractRecord(contract.id, prof?.contributor_id ?? null);
      toast.success("Record exported");
    } catch (e) {
      toast.error("Export failed");
    } finally { setExporting(false); }
  };

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("evidence")
      .select("id, title, evidence_type, fingerprint, timestamp_created, execution_id")
      .eq("contract_id", contract.id)
      .order("timestamp_created", { ascending: false });
    setEvidence((data ?? []) as EvidenceRow[]);
    setLoading(false);
  }, [contract.id]);

  const loadExecutions = useCallback(async () => {
    setExLoading(true);
    const { data } = await supabase
      .from("executions")
      .select("id, title, work_description, trigger_met, status, evidence_ids, settlement_channel, settled_amount, currency, execution_date")
      .eq("contract_id", contract.id)
      .order("execution_date", { ascending: false });
    setExecutions((data ?? []) as ExecutionRow[]);
    setExLoading(false);
  }, [contract.id]);

  useEffect(() => { load(); loadExecutions(); }, [load, loadExecutions]);

  return (
    <Card>
      <CardContent className="pt-4 pb-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="font-medium truncate">{contract.name}</div>
            <div className="text-xs text-muted-foreground truncate">
              {contract.counterparty_name} · {contract.counterparty_type}
            </div>
          </div>
          <Badge variant="outline" className={stakeStyles[contract.stake_type]}>
            {contract.stake_type}
          </Badge>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1.5 text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60" />
            Recorded · {contract.contract_type}
          </span>
          {contract.attestation_required && (
            <span className="text-muted-foreground">· Attestation required</span>
          )}
          <Button size="sm" variant="ghost" className="ml-auto h-7 text-xs" onClick={handleExport} disabled={exporting}>
            <Download className="h-3.5 w-3.5 mr-1" /> {exporting ? "Exporting…" : "Export record"}
          </Button>
        </div>

        <Tabs defaultValue="executions" className="pt-1">
          <TabsList className="grid grid-cols-5 h-8">
            <TabsTrigger value="executions" className="text-xs">
              Executions{executions.length > 0 ? ` (${executions.length})` : ""}
            </TabsTrigger>
            <TabsTrigger value="triggers" className="text-xs">Triggers</TabsTrigger>
            <TabsTrigger value="details" className="text-xs">Details</TabsTrigger>
            <TabsTrigger value="evidence" className="text-xs">
              Evidence{evidence.length > 0 ? ` (${evidence.length})` : ""}
            </TabsTrigger>
            <TabsTrigger value="attestors" className="text-xs">Attestors</TabsTrigger>
          </TabsList>

          <TabsContent value="executions" className="pt-3 space-y-3">
            <div className="flex justify-end">
              <Button size="sm" variant="outline" onClick={() => setLogOpen(true)}>
                <Plus className="h-3.5 w-3.5 mr-1" /> Log execution
              </Button>
            </div>
            {exLoading ? (
              <p className="text-xs text-muted-foreground">Loading…</p>
            ) : executions.length === 0 ? (
              <div className="rounded-md border border-dashed p-4 flex flex-col items-center text-center gap-1">
                <Activity className="h-4 w-4 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">No executions logged yet.</p>
              </div>
            ) : (
              <ol className="relative border-l pl-4 ml-1 space-y-3">
                {executions.map((ex) => (
                  <li key={ex.id} className="relative">
                    <span className={`absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full ring-2 ring-background ${statusDot[ex.status]}`} />
                    <div className="rounded-md border p-2.5 space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="text-sm font-medium truncate">{ex.title}</div>
                          <p className="text-[11px] text-muted-foreground line-clamp-2">{ex.work_description}</p>
                        </div>
                        <Badge variant="secondary" className="shrink-0 text-[10px]">{ex.status}</Badge>
                      </div>
                      <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
                        <span>
                          {new Date(ex.execution_date).toLocaleDateString()} ·{" "}
                          {ex.evidence_ids?.length ?? 0} evidence
                        </span>
                        {ex.settled_amount != null && (
                          <span className="font-medium text-foreground">
                            {ex.settled_amount.toLocaleString()} {ex.currency}
                          </span>
                        )}
                      </div>
                      {ex.status === "Pending" && (
                        <div className="pt-1 flex justify-end">
                          <Button size="sm" variant="ghost" className="h-7 text-xs"
                            onClick={() => setSettleFor(ex)}>
                            Confirm settlement
                          </Button>
                        </div>
                      )}
                      {contract.attestation_required && (
                        <ExecutionAttestations executionId={ex.id} />
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </TabsContent>

          <TabsContent value="details" className="pt-3 text-xs text-muted-foreground">
            <p>Stake type: {contract.stake_type}. Contract type: {contract.contract_type}.</p>
          </TabsContent>

          <TabsContent value="triggers" className="pt-3">
            <TriggersList
              contractId={contract.id}
              onLogExecution={() => setLogOpen(true)}
            />
          </TabsContent>

          <TabsContent value="evidence" className="pt-3 space-y-3">
            <div className="flex justify-end">
              <Button size="sm" variant="outline" onClick={() => setAttachOpen(true)}>
                <Plus className="h-3.5 w-3.5 mr-1" /> Attach evidence
              </Button>
            </div>

            {loading ? (
              <p className="text-xs text-muted-foreground">Loading…</p>
            ) : evidence.length === 0 ? (
              <div className="rounded-md border border-dashed p-4 flex flex-col items-center text-center gap-1">
                <FileSearch className="h-4 w-4 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">No evidence attached yet.</p>
              </div>
            ) : (
              <ul className="space-y-2">
                {evidence.map((e) => (
                  <li key={e.id} className="rounded-md border p-2.5 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">{e.title}</div>
                        <div className="text-[11px] text-muted-foreground">
                          {new Date(e.timestamp_created).toLocaleString()}
                        </div>
                      </div>
                      <Badge variant="secondary" className="shrink-0 text-[10px]">{e.evidence_type}</Badge>
                    </div>
                    <div className="flex items-center justify-between gap-2 text-[11px]">
                      <code className="font-mono text-muted-foreground truncate">
                        {e.fingerprint.slice(0, 16)}…
                      </code>
                      <span className="inline-flex items-center gap-1 text-primary">
                        <ShieldCheck className="h-3 w-3" /> Verified
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </TabsContent>

          <TabsContent value="attestors" className="pt-3">
            <AttestorsSection contractId={contract.id} />
          </TabsContent>
        </Tabs>
      </CardContent>

      <AttachEvidenceDialog
        open={attachOpen}
        onOpenChange={setAttachOpen}
        contractId={contract.id}
        onCreated={load}
      />

      <LogExecutionDialog
        open={logOpen}
        onOpenChange={setLogOpen}
        contractId={contract.id}
        contractStakeType={contract.stake_type}
        onCreated={() => { loadExecutions(); load(); }}
      />

      {settleFor && (
        <MarkSettledDialog
          open={!!settleFor}
          onOpenChange={(v) => !v && setSettleFor(null)}
          executionId={settleFor.id}
          defaultAmount={settleFor.settled_amount}
          defaultCurrency={settleFor.currency}
          defaultChannel={settleFor.settlement_channel}
          onSettled={() => { loadExecutions(); setSettleFor(null); }}
        />
      )}
    </Card>
  );
};