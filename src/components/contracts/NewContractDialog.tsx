import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, ShieldCheck } from "lucide-react";

const COUNTERPARTY_TYPES = ["Company", "Cooperative", "University", "Platform", "Individual", "Government"] as const;
const STAKE_TYPES = ["Financial", "Attribution", "Governance", "Mixed"] as const;
const CONTRACT_TYPES = ["Off-chain", "On-chain reference"] as const;

type CounterpartyType = typeof COUNTERPARTY_TYPES[number];
type StakeType = typeof STAKE_TYPES[number];
type ContractType = typeof CONTRACT_TYPES[number];

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
};

const initial = {
  name: "",
  counterparty_name: "",
  counterparty_type: "" as CounterpartyType | "",
  stake_type: "" as StakeType | "",
  entitlement_description: "",
  trigger_description: "",
  contract_type: "Off-chain" as ContractType,
  reference: "",
  attestation_required: false,
};

export const NewContractDialog = ({ open, onOpenChange, onCreated }: Props) => {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [data, setData] = useState(initial);
  const [busy, setBusy] = useState(false);

  const reset = () => {
    setStep(1);
    setData(initial);
  };

  const close = (v: boolean) => {
    if (!v) reset();
    onOpenChange(v);
  };

  const canNext = () => {
    switch (step) {
      case 1: return data.name.trim() && data.counterparty_name.trim() && data.counterparty_type;
      case 2: return data.stake_type && data.entitlement_description.trim();
      case 3: return data.trigger_description.trim();
      case 4: return true;
      default: return true;
    }
  };

  const submit = async () => {
    if (!user) return;
    setBusy(true);
    const { error } = await supabase.from("contracts").insert({
      user_id: user.id,
      name: data.name.trim(),
      counterparty_name: data.counterparty_name.trim(),
      counterparty_type: data.counterparty_type as CounterpartyType,
      stake_type: data.stake_type as StakeType,
      contract_type: data.contract_type,
      reference: data.reference.trim() || null,
      entitlement_description: data.entitlement_description.trim(),
      trigger_description: data.trigger_description.trim(),
      attestation_required: data.attestation_required,
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Contract recorded");
    onCreated();
    close(false);
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>New Contract — Step {step} of 5</DialogTitle>
          <DialogDescription>
            {step === 1 && "Identify the contract and the other party."}
            {step === 2 && "Describe what you are owed."}
            {step === 3 && "Describe what triggers the entitlement."}
            {step === 4 && "Where does the contract live?"}
            {step === 5 && "Review and confirm."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {step === 1 && (
            <>
              <div className="space-y-2">
                <Label htmlFor="name">Contract name</Label>
                <Input id="name" value={data.name} onChange={(e) => setData({ ...data, name: e.target.value })} placeholder="e.g. Acme Licensing Agreement" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cp">Counterparty name</Label>
                <Input id="cp" value={data.counterparty_name} onChange={(e) => setData({ ...data, counterparty_name: e.target.value })} placeholder="e.g. Acme Inc." />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cpt">Counterparty type</Label>
                <Select value={data.counterparty_type} onValueChange={(v) => setData({ ...data, counterparty_type: v as CounterpartyType })}>
                  <SelectTrigger id="cpt"><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    {COUNTERPARTY_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="space-y-2">
                <Label htmlFor="st">Stake type</Label>
                <Select value={data.stake_type} onValueChange={(v) => setData({ ...data, stake_type: v as StakeType })}>
                  <SelectTrigger id="st"><SelectValue placeholder="Select stake type" /></SelectTrigger>
                  <SelectContent>
                    {STAKE_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ent">Entitlement</Label>
                <Textarea id="ent" rows={4}
                  value={data.entitlement_description}
                  onChange={(e) => setData({ ...data, entitlement_description: e.target.value })}
                  placeholder='e.g. "40% of contributor pool" or "Co-author credit on all derivatives"' />
                <p className="text-xs text-muted-foreground">Describe what you are owed in plain language.</p>
              </div>
            </>
          )}

          {step === 3 && (
            <div className="space-y-2">
              <Label htmlFor="trg">Trigger</Label>
              <Textarea id="trg" rows={5}
                value={data.trigger_description}
                onChange={(e) => setData({ ...data, trigger_description: e.target.value })}
                placeholder='e.g. "API usage exceeds 10,000 calls per month OR licence is executed"' />
              <p className="text-xs text-muted-foreground">What condition must be met for the entitlement to activate?</p>
              <div className="flex items-center gap-2 pt-3">
                <Checkbox id="att" checked={data.attestation_required}
                  onCheckedChange={(v) => setData({ ...data, attestation_required: v === true })} />
                <Label htmlFor="att" className="font-normal cursor-pointer">Attestation required to confirm the trigger</Label>
              </div>
            </div>
          )}

          {step === 4 && (
            <>
              <div className="rounded-md border bg-muted/40 p-3 flex gap-2 text-xs text-muted-foreground">
                <ShieldCheck className="h-4 w-4 mt-0.5 shrink-0" />
                <p>
                  SCORE does not hold or replicate the legal contract. It records that one exists,
                  what it says you are owed, and what must happen for that entitlement to activate.
                  Only a reference is stored here.
                </p>
              </div>
              <div className="space-y-2">
                <Label>Contract type</Label>
                <RadioGroup value={data.contract_type} onValueChange={(v) => setData({ ...data, contract_type: v as ContractType })}>
                  {CONTRACT_TYPES.map((t) => (
                    <div key={t} className="flex items-center space-x-2">
                      <RadioGroupItem value={t} id={`ct-${t}`} />
                      <Label htmlFor={`ct-${t}`} className="font-normal cursor-pointer">{t}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ref">Reference</Label>
                <Input id="ref" value={data.reference} onChange={(e) => setData({ ...data, reference: e.target.value })}
                  placeholder={data.contract_type === "On-chain reference"
                    ? "0x… contract address"
                    : "URL, document hash, or clause reference"} />
                <p className="text-xs text-muted-foreground">
                  {data.contract_type === "On-chain reference"
                    ? "Paste the on-chain contract address."
                    : "Paste a URL, document hash, or clause reference."}
                </p>
              </div>
            </>
          )}

          {step === 5 && (
            <div className="space-y-3 text-sm">
              <Row label="Name" value={data.name} />
              <Row label="Counterparty" value={`${data.counterparty_name} (${data.counterparty_type})`} />
              <Row label="Stake type" value={data.stake_type} />
              <Row label="Entitlement" value={data.entitlement_description} />
              <Row label="Trigger" value={data.trigger_description} />
              <Row label="Attestation required" value={data.attestation_required ? "Yes" : "No"} />
              <Row label="Contract type" value={data.contract_type} />
              <Row label="Reference" value={data.reference || "—"} />
            </div>
          )}
        </div>

        <div className="flex justify-between pt-2">
          <Button variant="ghost" onClick={() => setStep((s) => Math.max(1, s - 1))} disabled={step === 1 || busy}>
            <ChevronLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          {step < 5 ? (
            <Button onClick={() => setStep((s) => s + 1)} disabled={!canNext()}>
              Next <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={submit} disabled={busy}>
              {busy ? "Saving…" : "Confirm & Save"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

const Row = ({ label, value }: { label: string; value: string }) => (
  <div className="grid grid-cols-3 gap-2 border-b pb-2 last:border-0">
    <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
    <div className="col-span-2 break-words">{value}</div>
  </div>
);