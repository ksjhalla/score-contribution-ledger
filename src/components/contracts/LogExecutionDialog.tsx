import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { ledgerEvents } from "@/lib/ledgerEvents";
import { AttachEvidenceDialog } from "./AttachEvidenceDialog";
import { sendNotification, notificationEvents } from "@/lib/notifications";

const CHANNELS = ["Bank transfer","Stripe","Coinbase","USDC","Other","Not applicable"] as const;
type Channel = typeof CHANNELS[number];

type EvidenceOption = { id: string; title: string; evidence_type: string };

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contractId: string;
  contractStakeType: "Financial" | "Attribution" | "Governance" | "Mixed";
  onCreated: () => void;
};

export const LogExecutionDialog = ({ open, onOpenChange, contractId, contractStakeType, onCreated }: Props) => {
  const { user } = useAuth();
  const isGovernance = contractStakeType === "Governance";
  const totalSteps = isGovernance ? 2 : 3;

  const [step, setStep] = useState(1);
  const [title, setTitle] = useState("");
  const [workDescription, setWorkDescription] = useState("");
  const [executionDate, setExecutionDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [triggerMet, setTriggerMet] = useState(true);
  const [selectedEvidence, setSelectedEvidence] = useState<Set<string>>(new Set());
  const [evidenceList, setEvidenceList] = useState<EvidenceOption[]>([]);
  const [channel, setChannel] = useState<Channel | "">("");
  const [reference, setReference] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [attachOpen, setAttachOpen] = useState(false);

  const reset = () => {
    setStep(1); setTitle(""); setWorkDescription("");
    setExecutionDate(new Date().toISOString().slice(0, 10));
    setTriggerMet(true); setSelectedEvidence(new Set()); setChannel("");
    setReference(""); setAmount(""); setCurrency("USD"); setNotes(""); setBusy(false);
  };

  const close = (v: boolean) => { if (!v) reset(); onOpenChange(v); };

  const loadEvidence = async () => {
    const { data } = await supabase
      .from("evidence")
      .select("id, title, evidence_type")
      .eq("contract_id", contractId)
      .order("timestamp_created", { ascending: false });
    setEvidenceList((data ?? []) as EvidenceOption[]);
  };

  useEffect(() => { if (open) loadEvidence(); /* eslint-disable-next-line */ }, [open, contractId]);

  const canNext = useMemo(() => {
    if (step === 1) return title.trim() && workDescription.trim() && executionDate;
    return true;
  }, [step, title, workDescription, executionDate]);

  const toggleEvidence = (id: string) => {
    setSelectedEvidence((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const submit = async () => {
    if (!user) return;
    setBusy(true);
    let status: "Pending" | "Settled" | "Intent logged" = "Pending";
    if (!triggerMet) status = "Intent logged";
    else if (!isGovernance && channel && channel !== "Not applicable" && reference.trim() && amount) status = "Settled";

    const settledAmount = amount ? Number(amount) : null;
    const { data: created, error } = await supabase.from("executions").insert({
      contract_id: contractId,
      user_id: user.id,
      title: title.trim(),
      work_description: workDescription.trim(),
      trigger_met: triggerMet,
      status,
      evidence_ids: Array.from(selectedEvidence),
      settlement_channel: isGovernance ? "Not applicable" : (channel || null),
      settlement_reference: reference.trim() || null,
      settled_amount: settledAmount,
      currency: currency || "USD",
      execution_date: executionDate,
      notes: notes.trim() || null,
    }).select("id").maybeSingle();
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Execution recorded.");

    // If contract requires attestation, create per-attestor rows for this execution.
    if (created?.id) {
      const { data: contractRow } = await supabase
        .from("contracts").select("attestation_required").eq("id", contractId).maybeSingle();
      if (contractRow?.attestation_required) {
        const { data: attestors } = await supabase
          .from("contract_attestors")
          .select("attestor_email, attestor_name")
          .eq("contract_id", contractId);
        if (attestors && attestors.length > 0) {
          await supabase.from("execution_attestations").insert(
            attestors.map((a) => ({
              execution_id: created.id,
              contract_id: contractId,
              user_id: user.id,
              attestor_email: a.attestor_email,
              attestor_name: a.attestor_name,
            }))
          );
          toast.info(`${attestors.length} attestation link${attestors.length > 1 ? "s" : ""} ready to share`);
        }
      }
    }

    // The DB trigger `executions_settlement_due_notif` creates the settlement_due
    // notification automatically when status='Pending' and trigger_met=true.
    // We just nudge the bell to refetch so it shows immediately.
    if (triggerMet && status === "Pending" && created?.id) {
      notificationEvents.emit();
    }

    onCreated();
    ledgerEvents.emit();
    close(false);
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Log execution — Step {step} of {totalSteps}</DialogTitle>
          <DialogDescription>
            {step === 1 && "Describe the work and whether it met the trigger."}
            {step === 2 && "Link evidence that supports this execution."}
            {step === 3 && "Settlement details (optional)."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {step === 1 && (
            <>
              <div className="space-y-2">
                <Label htmlFor="ex-title">Title</Label>
                <Input id="ex-title" value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ex-desc">Work description</Label>
                <Textarea id="ex-desc" rows={3} value={workDescription} onChange={(e) => setWorkDescription(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ex-date">Execution date</Label>
                <Input id="ex-date" type="date" value={executionDate} onChange={(e) => setExecutionDate(e.target.value)} />
              </div>
              <div className="flex items-center justify-between rounded-md border p-3">
                <div>
                  <div className="text-sm font-medium">Trigger condition met?</div>
                  <div className="text-xs text-muted-foreground">If no, status will be "Intent logged".</div>
                </div>
                <Switch checked={triggerMet} onCheckedChange={setTriggerMet} />
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">Select evidence linked to this execution.</p>
                <Button size="sm" variant="outline" onClick={() => setAttachOpen(true)}>
                  <Plus className="h-3.5 w-3.5 mr-1" /> New evidence
                </Button>
              </div>
              {evidenceList.length === 0 ? (
                <div className="rounded-md border border-dashed p-4 text-center text-xs text-muted-foreground">
                  No evidence on this contract yet.
                </div>
              ) : (
                <ul className="space-y-2 max-h-60 overflow-auto">
                  {evidenceList.map((e) => (
                    <li key={e.id} className="flex items-center gap-3 rounded-md border p-2.5">
                      <Checkbox
                        id={`ev-${e.id}`}
                        checked={selectedEvidence.has(e.id)}
                        onCheckedChange={() => toggleEvidence(e.id)}
                      />
                      <Label htmlFor={`ev-${e.id}`} className="flex-1 flex items-center justify-between cursor-pointer font-normal">
                        <span className="text-sm truncate">{e.title}</span>
                        <Badge variant="secondary" className="text-[10px]">{e.evidence_type}</Badge>
                      </Label>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}

          {step === 3 && !isGovernance && (
            <>
              {!triggerMet && (
                <div className="rounded-md border bg-muted/40 p-3 text-xs text-muted-foreground">
                  Trigger was not met — settlement is not applicable. You can still add notes.
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="ex-ch">Settlement channel</Label>
                <Select value={channel} onValueChange={(v) => setChannel(v as Channel)} disabled={!triggerMet}>
                  <SelectTrigger id="ex-ch"><SelectValue placeholder="Select channel" /></SelectTrigger>
                  <SelectContent>
                    {CHANNELS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ex-ref">Settlement reference</Label>
                <Input id="ex-ref" value={reference} onChange={(e) => setReference(e.target.value)}
                  placeholder="Stripe payment ID, txn hash, bank ref" disabled={!triggerMet} />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="ex-amt">Amount</Label>
                  <Input id="ex-amt" type="number" step="0.01" value={amount}
                    onChange={(e) => setAmount(e.target.value)} disabled={!triggerMet} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ex-cur">Currency</Label>
                  <Input id="ex-cur" value={currency} onChange={(e) => setCurrency(e.target.value.toUpperCase())} disabled={!triggerMet} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ex-notes">Notes</Label>
                <Textarea id="ex-notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>
            </>
          )}
        </div>

        <div className="flex justify-between pt-2">
          <Button variant="ghost" onClick={() => setStep((s) => Math.max(1, s - 1))} disabled={step === 1 || busy}>
            <ChevronLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          {step < totalSteps ? (
            <Button onClick={() => setStep((s) => s + 1)} disabled={!canNext}>
              Next <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={submit} disabled={busy}>
              {busy ? "Saving…" : "Save execution"}
            </Button>
          )}
        </div>

        <AttachEvidenceDialog
          open={attachOpen}
          onOpenChange={setAttachOpen}
          contractId={contractId}
          onCreated={() => { loadEvidence(); ledgerEvents.emit(); }}
        />
      </DialogContent>
    </Dialog>
  );
};