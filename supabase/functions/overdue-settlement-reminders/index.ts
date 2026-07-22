import { createClient } from "https://esm.sh/@supabase/supabase-js@2.74.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-cron-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

// Constant-time string comparison so a mismatched secret can't be inferred
// from response timing.
const timingSafeEqual = (a: string, b: string) => {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
};

/**
 * Daily cron — finds executions that are:
 *   - status = 'Pending'
 *   - trigger_met = true
 *   - execution_date older than 30 days
 *   - have NOT received a 'settlement_due' notification in the last 7 days
 * For each match, inserts a settlement_due reminder notification.
 *
 * This runs with the service-role key (bypasses RLS by design, since it has
 * to scan across every user's executions). That means it must never be
 * reachable without proof the caller is the legitimate scheduler -- hence
 * the shared-secret check below, not just "this is only meant to be called
 * by cron." Store CRON_SECRET as an edge function secret (not a client-side
 * env var) and have your scheduler (pg_cron via pg_net, or an external
 * scheduler) send it as the `x-cron-secret` header.
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const expectedSecret = Deno.env.get("CRON_SECRET");
  if (!expectedSecret) {
    // Fail closed: if the secret isn't configured, refuse to run rather than
    // silently operating with no gate at all.
    return json({ error: "server_misconfigured", message: "CRON_SECRET is not set." }, 500);
  }

  const providedSecret = req.headers.get("x-cron-secret") ?? "";
  if (!providedSecret || !timingSafeEqual(providedSecret, expectedSecret)) {
    return json({ error: "unauthorized" }, 401);
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const cutoff30d = new Date(Date.now() - 30 * 86400_000).toISOString().slice(0, 10);
  const cutoff7d = new Date(Date.now() - 7 * 86400_000).toISOString();

  // Unique id for this run so all audit entries can be correlated together.
  const runId = crypto.randomUUID();

  // 1. Pull overdue Pending executions.
  const { data: execs, error: exErr } = await supabase
    .from("executions")
    .select("id, contract_id, user_id, settled_amount, currency, execution_date")
    .eq("status", "Pending")
    .eq("trigger_met", true)
    .lt("execution_date", cutoff30d);

  if (exErr) return json({ error: exErr.message }, 500);
  if (!execs || execs.length === 0) return json({ ok: true, run_id: runId, processed: 0 });

  let inserted = 0;
  const skipped: string[] = [];
  let errored = 0;

  const auditRows: Array<Record<string, unknown>> = [];
  const pushAudit = (row: Record<string, unknown>) =>
    auditRows.push({ run_id: runId, reminder_type: "settlement_due", ...row });

  for (const ex of execs) {
    // 2. Skip if a settlement_due notification was created in the last 7 days.
    const { data: recent } = await supabase
      .from("notifications")
      .select("id")
      .eq("execution_id", ex.id)
      .eq("type", "settlement_due")
      .gte("created_at", cutoff7d)
      .limit(1);
    if (recent && recent.length > 0) {
      skipped.push(ex.id);
      pushAudit({
        execution_id: ex.id,
        contract_id: ex.contract_id,
        user_id: ex.user_id,
        execution_date: ex.execution_date,
        settled_amount: ex.settled_amount,
        currency: ex.currency,
        outcome: "skipped_dedupe",
        reason: "settlement_due notification within last 7 days",
      });
      continue;
    }

    // 3. Look up contract name.
    const { data: c } = await supabase
      .from("contracts")
      .select("name")
      .eq("id", ex.contract_id)
      .maybeSingle();
    const name = c?.name ?? "Contract";

    const message = `${name} — settlement overdue. Mark as settled or update status.`;

    const { data: notif, error: insErr } = await supabase
      .from("notifications")
      .insert({
        user_id: ex.user_id,
        type: "settlement_due",
        contract_id: ex.contract_id,
        execution_id: ex.id,
        message,
        read: false,
        email_sent: false,
      })
      .select("id")
      .maybeSingle();
    if (!insErr) {
      inserted++;
      pushAudit({
        execution_id: ex.id,
        contract_id: ex.contract_id,
        user_id: ex.user_id,
        execution_date: ex.execution_date,
        settled_amount: ex.settled_amount,
        currency: ex.currency,
        outcome: "sent",
        notification_id: notif?.id ?? null,
      });
    } else {
      errored++;
      pushAudit({
        execution_id: ex.id,
        contract_id: ex.contract_id,
        user_id: ex.user_id,
        execution_date: ex.execution_date,
        settled_amount: ex.settled_amount,
        currency: ex.currency,
        outcome: "error",
        reason: insErr.message,
      });
    }
  }

  // Persist audit trail in a single batched insert. Failures here are logged
  // but never break the reminder run itself.
  if (auditRows.length > 0) {
    const { error: auditErr } = await supabase.from("reminder_audit_log").insert(auditRows);
    if (auditErr) console.error("[reminder-audit] insert failed:", auditErr.message);
  }

  return json({
    ok: true,
    run_id: runId,
    processed: execs.length,
    inserted,
    skipped: skipped.length,
    errored,
  });
});
