import { createClient } from "https://esm.sh/@supabase/supabase-js@2.74.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

/**
 * Daily cron — finds executions that are:
 *   - status = 'Pending'
 *   - trigger_met = true
 *   - execution_date older than 30 days
 *   - have NOT received a 'settlement_due' notification in the last 7 days
 * For each match, inserts a settlement_due reminder notification.
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const cutoff30d = new Date(Date.now() - 30 * 86400_000).toISOString().slice(0, 10);
  const cutoff7d = new Date(Date.now() - 7 * 86400_000).toISOString();

  // 1. Pull overdue Pending executions.
  const { data: execs, error: exErr } = await supabase
    .from("executions")
    .select("id, contract_id, user_id, settled_amount, currency, execution_date")
    .eq("status", "Pending")
    .eq("trigger_met", true)
    .lt("execution_date", cutoff30d);

  if (exErr) return json({ error: exErr.message }, 500);
  if (!execs || execs.length === 0) return json({ ok: true, processed: 0 });

  let inserted = 0;
  const skipped: string[] = [];

  for (const ex of execs) {
    // 2. Skip if a settlement_due notification was created in the last 7 days.
    const { data: recent } = await supabase
      .from("notifications")
      .select("id")
      .eq("execution_id", ex.id)
      .eq("type", "settlement_due")
      .gte("created_at", cutoff7d)
      .limit(1);
    if (recent && recent.length > 0) { skipped.push(ex.id); continue; }

    // 3. Look up contract name.
    const { data: c } = await supabase
      .from("contracts")
      .select("name")
      .eq("id", ex.contract_id)
      .maybeSingle();
    const name = c?.name ?? "Contract";

    const message = `${name} — settlement overdue. Mark as settled or update status.`;

    const { error: insErr } = await supabase.from("notifications").insert({
      user_id: ex.user_id,
      type: "settlement_due",
      contract_id: ex.contract_id,
      execution_id: ex.id,
      message,
      read: false,
      email_sent: false,
    });
    if (!insErr) inserted++;
  }

  return json({ ok: true, processed: execs.length, inserted, skipped: skipped.length });
});
