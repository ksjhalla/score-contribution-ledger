import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import { toast } from "sonner";

type Row = {
  id: string;
  attestor_name: string;
  attestor_email: string;
  status: "Pending" | "Confirmed" | "Declined";
  token: string;
  notes: string | null;
};

export const ExecutionAttestations = ({ executionId }: { executionId: string }) => {
  const [rows, setRows] = useState<Row[]>([]);
  const [copied, setCopied] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data } = await supabase.from("execution_attestations")
      .select("id, attestor_name, attestor_email, status, token, notes")
      .eq("execution_id", executionId)
      .order("requested_at", { ascending: true });
    setRows((data ?? []) as Row[]);
  }, [executionId]);

  useEffect(() => {
    load();
    const ch = supabase
      .channel(`att-${executionId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "execution_attestations", filter: `execution_id=eq.${executionId}` }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [executionId, load]);

  if (rows.length === 0) return null;

  const total = rows.length;
  const confirmed = rows.filter(r => r.status === "Confirmed").length;
  const declined = rows.filter(r => r.status === "Declined").length;
  const pending = rows.filter(r => r.status === "Pending").length;

  const copy = async (token: string) => {
    const url = `${window.location.origin}/attest/${token}`;
    await navigator.clipboard.writeText(url);
    setCopied(token);
    toast.success("Attestation link copied.");
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="rounded-md border bg-muted/20 p-2.5 space-y-2">
      <div className="flex items-center justify-between text-[11px]">
        <span className="font-medium">Attestation status</span>
        <span className="text-muted-foreground">
          {confirmed} of {total} confirmed · {pending} pending · {declined} declined
        </span>
      </div>
      <ul className="space-y-1.5">
        {rows.map((r) => (
          <li key={r.id} className="flex items-center justify-between gap-2 text-[11px]">
            <div className="min-w-0 flex-1">
              <div className="truncate">
                <span className="font-medium">{r.attestor_name}</span>
                <span className="text-muted-foreground"> · {r.attestor_email}</span>
              </div>
              {r.notes && <div className="text-muted-foreground italic truncate">"{r.notes}"</div>}
            </div>
            <Badge variant={r.status === "Confirmed" ? "default" : r.status === "Declined" ? "destructive" : "secondary"} className="text-[10px]">
              {r.status}
            </Badge>
            {r.status === "Pending" && (
              <Button size="sm" variant="ghost" className="h-6 px-2"
                onClick={() => copy(r.token)} title={`Send this link to ${r.attestor_name}`}>
                {copied === r.token ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                <span className="ml-1">Link</span>
              </Button>
            )}
          </li>
        ))}
      </ul>
      {pending > 0 && (
        <p className="text-[10px] text-muted-foreground">
          Send the link to each pending attestor. The execution becomes Attested when all confirm.
        </p>
      )}
    </div>
  );
};