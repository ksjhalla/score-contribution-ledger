import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

type Attestor = { id: string; attestor_name: string; attestor_email: string };

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  executionId: string;
  contractId: string;
  executionTitle: string;
  userId: string;
};

export const RequestAttestationDialog = ({
  open, onOpenChange, executionId, contractId, executionTitle, userId,
}: Props) => {
  const [attestors, setAttestors] = useState<Attestor[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("contract_attestors")
      .select("id, attestor_name, attestor_email")
      .eq("contract_id", contractId)
      .order("added_at", { ascending: true });
    const list = (data ?? []) as Attestor[];
    setAttestors(list);
    setSelected(new Set(list.map((a) => a.id)));
    setLoading(false);
  }, [contractId]);

  useEffect(() => {
    if (open) load();
  }, [open, load]);

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const submit = async () => {
    const targets = attestors.filter((a) => selected.has(a.id));
    if (!targets.length) {
      toast.error("Select at least one attestor.");
      return;
    }
    setBusy(true);
    const rows = targets.map((a) => ({
      execution_id: executionId,
      contract_id: contractId,
      user_id: userId,
      attestor_name: a.attestor_name,
      attestor_email: a.attestor_email,
    }));
    const { data, error } = await supabase
      .from("execution_attestations")
      .upsert(rows, { onConflict: "execution_id,attestor_email", ignoreDuplicates: true })
      .select("token, attestor_name");

    setBusy(false);
    if (error) { toast.error(error.message); return; }

    // Copy the first link so the user can paste it immediately.
    const inserted = data ?? [];
    if (inserted.length > 0) {
      const url = `${window.location.origin}/attest/${inserted[0].token}`;
      try { await navigator.clipboard.writeText(url); } catch { /* clipboard denied */ }
      toast.success(
        inserted.length === 1
          ? `Attestation requested for ${inserted[0].attestor_name}. Link copied.`
          : `Attestation requested for ${inserted.length} attestors. First link copied.`,
      );
    } else {
      toast.info("Attestations already exist for the selected attestors.");
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Request confirmation</DialogTitle>
          <DialogDescription>
            Select attestors to request confirmation for <strong>{executionTitle}</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-2">
          {loading ? (
            <p className="text-xs text-muted-foreground">Loading attestors…</p>
          ) : attestors.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              No attestors registered on this contract.{" "}
              <span className="font-medium">
                Go to Contracts → Attestors tab to add them.
              </span>
            </p>
          ) : (
            <ul className="space-y-2">
              {attestors.map((a) => (
                <li key={a.id}>
                  <label className="flex items-center gap-3 cursor-pointer rounded-md border p-2.5 hover:bg-muted/30">
                    <input
                      type="checkbox"
                      checked={selected.has(a.id)}
                      onChange={() => toggle(a.id)}
                      className="h-4 w-4 accent-amber-600"
                    />
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{a.attestor_name}</div>
                      <div className="text-[11px] text-muted-foreground truncate">{a.attestor_email}</div>
                    </div>
                  </label>
                </li>
              ))}
            </ul>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={busy || attestors.length === 0 || selected.size === 0}>
            {busy ? "Requesting…" : "Request confirmation"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
