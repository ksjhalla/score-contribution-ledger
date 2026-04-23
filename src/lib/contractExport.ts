import { supabase } from "@/integrations/supabase/client";

export async function exportContractRecord(contractId: string, contributorId: string | null) {
  const [contractRes, evidenceRes, executionsRes, triggersRes, attestorsRes, attestationsRes] = await Promise.all([
    supabase.from("contracts").select("*").eq("id", contractId).maybeSingle(),
    supabase.from("evidence").select("id, title, evidence_type, fingerprint, timestamp_created, source_url, description, notes, created_at").eq("contract_id", contractId),
    supabase.from("executions").select("*").eq("contract_id", contractId),
    supabase.from("triggers").select("*").eq("contract_id", contractId),
    supabase.from("contract_attestors").select("*").eq("contract_id", contractId),
    supabase.from("execution_attestations").select("*").eq("contract_id", contractId),
  ]);

  const triggerIds = (triggersRes.data ?? []).map((t) => t.id);
  let triggerEvents: any[] = [];
  if (triggerIds.length > 0) {
    const { data } = await supabase.from("trigger_events").select("*").in("trigger_id", triggerIds);
    triggerEvents = data ?? [];
  }

  const payload = {
    schema: "score.contract.v1",
    generated_at: new Date().toISOString(),
    contributor_id: contributorId,
    contract: contractRes.data,
    evidence: evidenceRes.data ?? [],
    executions: executionsRes.data ?? [],
    triggers: triggersRes.data ?? [],
    trigger_events: triggerEvents,
    contract_attestors: attestorsRes.data ?? [],
    execution_attestations: attestationsRes.data ?? [],
  };

  const date = new Date().toISOString().slice(0, 10);
  const filename = `SCORE-${contributorId ?? "anon"}-${contractId}-${date}.json`;
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}