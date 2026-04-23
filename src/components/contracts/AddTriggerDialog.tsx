import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";

const SOURCES = ["Manual", "Webhook", "File import"] as const;
type Source = typeof SOURCES[number];
type Direction = "Above" | "Below";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contractId: string;
  onCreated: () => void;
};

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;

export const AddTriggerDialog = ({ open, onOpenChange, contractId, onCreated }: Props) => {
  const { user } = useAuth();
  const [label, setLabel] = useState("");
  const [threshold, setThreshold] = useState("");
  const [unit, setUnit] = useState("");
  const [direction, setDirection] = useState<Direction>("Above");
  const [source, setSource] = useState<Source>("Manual");
  const [initial, setInitial] = useState("");
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  const reset = () => {
    setLabel(""); setThreshold(""); setUnit(""); setDirection("Above");
    setSource("Manual"); setInitial(""); setCsvFile(null); setBusy(false);
  };

  const close = (v: boolean) => { if (!v) reset(); onOpenChange(v); };

  const parseCsvLatest = async (file: File): Promise<{ value: number; ts: string } | null> => {
    const text = await file.text();
    const rows = text.split(/\r?\n/).map((r) => r.trim()).filter(Boolean);
    // Skip header if first row isn't a date or number
    const data = rows.map((r) => r.split(",").map((c) => c.trim()))
      .filter((cols) => cols.length >= 2 && !isNaN(Date.parse(cols[0])) && !isNaN(Number(cols[1])));
    if (data.length === 0) return null;
    data.sort((a, b) => Date.parse(b[0]) - Date.parse(a[0]));
    return { ts: new Date(data[0][0]).toISOString(), value: Number(data[0][1]) };
  };

  const submit = async () => {
    if (!user) return;
    if (!label.trim() || !threshold) {
      toast.error("Label and threshold are required");
      return;
    }
    setBusy(true);

    let currentValue = 0;
    let lastUpdated: string | null = null;

    if (source === "Manual" && initial) currentValue = Number(initial);

    if (source === "File import") {
      if (!csvFile) { setBusy(false); toast.error("Choose a CSV file"); return; }
      const latest = await parseCsvLatest(csvFile);
      if (!latest) { setBusy(false); toast.error("CSV must have rows of: timestamp, value"); return; }
      currentValue = latest.value;
      lastUpdated = latest.ts;
    }

    // Insert first to get the id, then for Webhook source compute and store the URL.
    const { data: inserted, error } = await supabase
      .from("triggers")
      .insert({
        contract_id: contractId,
        user_id: user.id,
        label: label.trim(),
        threshold_value: Number(threshold),
        unit: unit.trim() || null,
        direction,
        source_type: source,
        current_value: currentValue,
        last_updated: lastUpdated,
      })
      .select("id")
      .single();

    if (error || !inserted) {
      setBusy(false);
      toast.error(error?.message ?? "Failed to create trigger");
      return;
    }

    if (source === "Webhook") {
      const webhookUrl = `${SUPABASE_URL}/functions/v1/trigger-webhook/${inserted.id}`;
      await supabase.from("triggers").update({ webhook_url: webhookUrl }).eq("id", inserted.id);
    }

    setBusy(false);
    toast.success("Trigger added");
    onCreated();
    close(false);
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add trigger</DialogTitle>
          <DialogDescription>Track progress toward a contract's trigger condition.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="t-label">Label</Label>
            <Input id="t-label" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. API calls" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <Label htmlFor="t-thr">Threshold</Label>
              <Input id="t-thr" type="number" step="any" value={threshold} onChange={(e) => setThreshold(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="t-unit">Unit</Label>
              <Input id="t-unit" value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="calls, t/ha…" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Direction</Label>
            <RadioGroup value={direction} onValueChange={(v) => setDirection(v as Direction)} className="flex gap-4">
              <div className="flex items-center gap-2">
                <RadioGroupItem value="Above" id="d-above" />
                <Label htmlFor="d-above" className="font-normal cursor-pointer">Fires when ≥ threshold</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="Below" id="d-below" />
                <Label htmlFor="d-below" className="font-normal cursor-pointer">Fires when ≤ threshold</Label>
              </div>
            </RadioGroup>
          </div>
          <div className="space-y-2">
            <Label htmlFor="t-src">Source</Label>
            <Select value={source} onValueChange={(v) => setSource(v as Source)}>
              <SelectTrigger id="t-src"><SelectValue /></SelectTrigger>
              <SelectContent>
                {SOURCES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {source === "Manual" && (
            <div className="space-y-2">
              <Label htmlFor="t-init">Initial value (optional)</Label>
              <Input id="t-init" type="number" step="any" value={initial} onChange={(e) => setInitial(e.target.value)} />
            </div>
          )}

          {source === "Webhook" && (
            <div className="rounded-md border bg-muted/40 p-3 text-xs text-muted-foreground">
              An inbound webhook URL will be generated after save. POST <code>{`{ "value": <number> }`}</code> to it
              to update the current value.
            </div>
          )}

          {source === "File import" && (
            <div className="space-y-2">
              <Label htmlFor="t-csv">CSV file</Label>
              <Input id="t-csv" type="file" accept=".csv,text/csv" onChange={(e) => setCsvFile(e.target.files?.[0] ?? null)} />
              <p className="text-xs text-muted-foreground">Two columns: <code>timestamp,value</code>. The most recent row is used.</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => close(false)} disabled={busy}>Cancel</Button>
          <Button onClick={submit} disabled={busy}>{busy ? "Saving…" : "Add trigger"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};