import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ledgerEvents } from "@/lib/ledgerEvents";

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
    const { error } = await supabase
      .from("executions")
      .update({
        status: "Settled",
        settlement_channel: channel,
        settlement_reference: reference.trim(),
        settled_amount: Number(amount),
        currency: currency || "USD",
      })
      .eq("id", executionId);
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Marked as settled");
    onSettled();
    ledgerEvents.emit();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Mark as settled</DialogTitle>
          <DialogDescription>Confirm the settlement reference and amount.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Settlement channel</Label>
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
          <Button onClick={submit} disabled={busy}>{busy ? "Saving…" : "Confirm settlement"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};