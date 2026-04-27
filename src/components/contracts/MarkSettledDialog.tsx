import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ledgerEvents } from "@/lib/ledgerEvents";
import { sendNotification, sha256Hex, notificationEvents } from "@/lib/notifications";

const CHANNELS = ["Bank transfer","Stripe","Coinbase","USDC","Other"] as const;
type Channel = typeof CHANNELS[number];

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  executionId: string;
  defaultAmount?: number | null;
  defaultCurrency?: string;
  defaultChannel?: string | null;
  onSettled: () => void;
};

export const MarkSettledDialog = ({
  open, onOpenChange, executionId,
  defaultAmount, defaultCurrency = "USD", defaultChannel, onSettled,
}: Props) => {
  const [channel, setChannel] = useState<Channel | "">(
    (CHANNELS as readonly string[]).includes(defaultChannel ?? "") ? (defaultChannel as Channel) : ""
  );
  const [reference, setReference] = useState("");
  const [amount, setAmount] = useState(defaultAmount != null ? String(defaultAmount) : "");
  const [currency, setCurrency] = useState(defaultCurrency);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!channel || !reference.trim() || !amount) {
      toast.error("Channel, reference and amount are required");
      return;
    }
    setBusy(true);
    const settledAt = new Date().toISOString();
    const ref = reference.trim();
    const amt = Number(amount);
    const cur = (currency || "USD").toUpperCase();

    // 1. Update the execution row.
    const { data: updated, error } = await supabase
      .from("executions")
      .update({
        status: "Settled",
        settlement_channel: channel,
        settlement_reference: ref,
        settled_amount: amt,
        currency: cur,
      })
      .eq("id", executionId)
      .select("id, contract_id, user_id, evidence_ids")
      .maybeSingle();

    if (error || !updated) {
      setBusy(false);
      toast.error(error?.message ?? "Failed to update execution");
      return;
    }

    // 2. Look up contract name for the evidence title + notification message.
    const { data: contract } = await supabase
      .from("contracts")
      .select("name")
      .eq("id", updated.contract_id)
      .maybeSingle();
    const contractName = contract?.name ?? "Contract";

    // 3. Auto-create immutable evidence record proving the settlement happened.
    const fingerprint = await sha256Hex(`${ref}${amt}${cur}${settledAt}`);
    const { data: ev, error: evErr } = await supabase
      .from("evidence")
      .insert({
        contract_id: updated.contract_id,
        user_id: updated.user_id,
        title: `Payment received — ${contractName}`,
        evidence_type: "Document",
        fingerprint,
        timestamp_created: settledAt,
        notes: `Auto-generated when payment was confirmed. Reference: ${ref}`,
      })
      .select("id")
      .maybeSingle();

    // 4. Append the new evidence id to the execution's evidence_ids array.
    if (ev?.id) {
      const nextIds = [...(updated.evidence_ids ?? []), ev.id];
      await supabase.from("executions").update({ evidence_ids: nextIds }).eq("id", executionId);
    } else if (evErr) {
      console.warn("[MarkSettled] auto-evidence failed:", evErr.message);
    }

    // 5. Notify the user (in-app).
    await sendNotification({
      userId: updated.user_id,
      type: "system",
      contractId: updated.contract_id,
      executionId: updated.id,
      message: `${contractName} — ${amt.toLocaleString()} ${cur} payment confirmed and recorded.`,
    });

    setBusy(false);
    toast.success("Payment recorded.");
    onSettled();
    ledgerEvents.emit();
    notificationEvents.emit();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Confirm payment received</DialogTitle>
          <DialogDescription>Record the payment reference and amount you received.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Payment channel</Label>
            <Select value={channel} onValueChange={(v) => setChannel(v as Channel)}>
              <SelectTrigger><SelectValue placeholder="Select channel" /></SelectTrigger>
              <SelectContent>
                {CHANNELS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="set-ref">Reference</Label>
            <Input id="set-ref" value={reference} onChange={(e) => setReference(e.target.value)} />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-2 col-span-2">
              <Label htmlFor="set-amt">Amount</Label>
              <Input id="set-amt" type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="set-cur">Currency</Label>
              <Input id="set-cur" value={currency} onChange={(e) => setCurrency(e.target.value.toUpperCase())} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={busy}>Cancel</Button>
          <Button onClick={submit} disabled={busy}>{busy ? "Saving…" : "Confirm payment received"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};