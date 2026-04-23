import { useCallback, useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { Plus, ShieldCheck, FileSearch } from "lucide-react";
import { AttachEvidenceDialog } from "./AttachEvidenceDialog";

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
};

export const ContractCard = ({ contract }: { contract: ContractRow }) => {
  const [evidence, setEvidence] = useState<EvidenceRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [attachOpen, setAttachOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("evidence")
      .select("id, title, evidence_type, fingerprint, timestamp_created")
      .eq("contract_id", contract.id)
      .order("timestamp_created", { ascending: false });
    setEvidence((data ?? []) as EvidenceRow[]);
    setLoading(false);
  }, [contract.id]);

  useEffect(() => { load(); }, [load]);

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
        </div>

        <Tabs defaultValue="details" className="pt-1">
          <TabsList className="grid grid-cols-2 h-8">
            <TabsTrigger value="details" className="text-xs">Details</TabsTrigger>
            <TabsTrigger value="evidence" className="text-xs">
              Evidence{evidence.length > 0 ? ` (${evidence.length})` : ""}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="pt-3 text-xs text-muted-foreground">
            <p>Stake type: {contract.stake_type}. Contract type: {contract.contract_type}.</p>
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
                      <span className="inline-flex items-center gap-1 text-green-700 dark:text-green-400">
                        <ShieldCheck className="h-3 w-3" /> Verified
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>

      <AttachEvidenceDialog
        open={attachOpen}
        onOpenChange={setAttachOpen}
        contractId={contract.id}
        onCreated={load}
      />
    </Card>
  );
};