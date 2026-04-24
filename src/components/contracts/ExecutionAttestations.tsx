import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

type Row = {
  id: string;
  attestor_name: string;
  attestor_email: string;
  status: "Pending" | "Confirmed" | "Declined";
  token: string;
  notes: string | null;
  last_nudged_at: string | null;
};

export const ExecutionAttestations = ({ executionId }: { executionId: string }) => {
  const [rows, setRows] = useState<Row[]>([]);
  const [copied, setCopied] = useState<string | null>(null);
  const [nudging, setNudging] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data } = await supabase.from("execution_attestations")
      .select("id, attestor_name, attestor_email, status, token, notes, last_nudged_at")
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

  const NUDGE_COOLDOWN_MS = 48 * 60 * 60 * 1000;
  const nudgeWindow = (last: string | null): { active: boolean; tooltip?: string } => {
    if (!last) return { active: true };
    const elapsed = Date.now() - new Date(last).getTime();
    if (elapsed >= NUDGE_COOLDOWN_MS) return { active: true };
    const remainingMs = NUDGE_COOLDOWN_MS - elapsed;
    const hours = Math.floor(remainingMs / (60 * 60 * 1000));
    const tooltip = hours >= 1
      ? `Next nudge available in ${hours} hour${hours === 1 ? "" : "s"}`
      : `Next nudge available in ${Math.max(1, Math.floor(remainingMs / 60000))} minutes`;
    return { active: false, tooltip };
  };

  const nudge = async (r: Row) => {
    if (nudging) return;
    setNudging(r.id);
    try {
    await copy(r.token);
    const { error } = await supabase
      .from("execution_attestations")
      .update({ last_nudged_at: new Date().toISOString() })
      .eq("id", r.id);
    if (error) { toast.error(error.message); return; }
    load();
    } finally {
      setNudging((cur) => (cur === r.id ? null : cur));
    }
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
            {r.status === "Pending" && (() => {
              const w = nudgeWindow(r.last_nudged_at);
              if (w.active) {
                return (
                  <button
                    onClick={() => nudge(r)}
                    disabled={nudging === r.id}
                    title={`Send this link to ${r.attestor_name}`}
                    className="font-mono text-[10px] px-2 py-1 rounded disabled:opacity-60 disabled:cursor-not-allowed"
                    style={{ color: "#C4892A", background: "transparent", border: "none", cursor: nudging === r.id ? "not-allowed" : "pointer" }}
                  >
                    {nudging === r.id ? "Sending…" : copied === r.token ? "Copied ✓" : "Nudge →"}
                  </button>
                );
              }
              return (
                <span
                  title={w.tooltip}
                  className="font-mono text-[10px] px-2 py-1"
                  style={{ color: "#9A8F84", cursor: "help" }}
                >
                  Nudge sent
                </span>
              );
            })()}
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