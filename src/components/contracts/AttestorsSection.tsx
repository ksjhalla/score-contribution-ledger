import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Users } from "lucide-react";
import { toast } from "sonner";

type Attestor = { id: string; attestor_email: string; attestor_name: string; attestor_role: string | null };

export const AttestorsSection = ({ contractId }: { contractId: string }) => {
  const { user } = useAuth();
  const [list, setList] = useState<Attestor[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase.from("contract_attestors")
      .select("id, attestor_email, attestor_name, attestor_role")
      .eq("contract_id", contractId).order("added_at", { ascending: true });
    setList((data ?? []) as Attestor[]);
  }, [contractId]);

  useEffect(() => { load(); }, [load]);

  const add = async () => {
    if (!user || !name.trim() || !email.trim()) return;
    setBusy(true);
    const { error } = await supabase.from("contract_attestors").insert({
      contract_id: contractId, user_id: user.id,
      attestor_email: email.trim().toLowerCase(),
      attestor_name: name.trim(),
      attestor_role: role.trim() || null,
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    setName(""); setEmail(""); setRole("");
    load();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("contract_attestors").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    load();
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Users className="h-3.5 w-3.5" />
        Attestors required to confirm executions on this contract.
      </div>
      {list.length === 0 ? (
        <div className="rounded-md border border-dashed p-3 text-center text-xs text-muted-foreground">
          No attestors yet.
        </div>
      ) : (
        <ul className="space-y-2">
          {list.map((a) => (
            <li key={a.id} className="flex items-center justify-between rounded-md border p-2.5">
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">{a.attestor_name}</div>
                <div className="text-[11px] text-muted-foreground truncate">
                  {a.attestor_email}{a.attestor_role ? ` · ${a.attestor_role}` : ""}
                </div>
              </div>
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => remove(a.id)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <div className="rounded-md border p-3 space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label htmlFor="att-name" className="text-xs">Name</Label>
            <Input id="att-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="att-email" className="text-xs">Email</Label>
            <Input id="att-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jane@org.com" />
          </div>
        </div>
        <div className="space-y-1">
          <Label htmlFor="att-role" className="text-xs">Role (optional)</Label>
          <Input id="att-role" value={role} onChange={(e) => setRole(e.target.value)} placeholder="Project lead" />
        </div>
        <div className="flex justify-end">
          <Button size="sm" onClick={add} disabled={busy || !name.trim() || !email.trim()}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Add attestor
          </Button>
        </div>
      </div>
      <Badge variant="outline" className="text-[10px]">All attestors must confirm for status → Attested</Badge>
    </div>
  );
};