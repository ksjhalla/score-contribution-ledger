import { createClient } from "https://esm.sh/@supabase/supabase-js@2.74.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-score-secret, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const sha256Hex = async (input: string) => {
  const data = new TextEncoder().encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
};

const MAX_VALUE = 1_000_000_000;
const RATE_LIMIT_PER_HOUR = 60;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  // Path: /functions/v1/trigger-webhook/<trigger_id>
  const url = new URL(req.url);
  const parts = url.pathname.split("/").filter(Boolean);
  const triggerId = parts[parts.length - 1];
  const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!triggerId || !uuidRe.test(triggerId)) {
    return json({ error: "Invalid trigger id" }, 400);
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const sourceIp =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    null;

  // ── AUTH: require X-SCORE-Secret ─────────────────────────────────────────
  const providedSecret = req.headers.get("x-score-secret");
  if (!providedSecret) {
    return json({ error: "Missing X-SCORE-Secret header" }, 401);
  }

  // Look up the trigger. We deliberately return 401 (not 404) for any failure
  // here so unauthenticated callers can't probe trigger existence.
  const { data: trigger } = await supabase
    .from("triggers")
    .select("id, user_id, source_type, contract_id, current_value, threshold_value, direction, webhook_secret, label")
    .eq("id", triggerId)
    .maybeSingle();

  if (!trigger || trigger.source_type !== "Webhook" || !trigger.webhook_secret) {
    return json({ error: "Unauthorized" }, 401);
  }

  const providedHash = await sha256Hex(providedSecret);
  if (providedHash !== trigger.webhook_secret) {
    // Audit: record the failed attempt against this trigger.
    await supabase.from("trigger_events").insert({
      trigger_id: triggerId,
      value: null,
      source_ip: sourceIp,
      auth_failed: true,
    });
    return json({ error: "Unauthorized" }, 401);
  }

  // ── VALIDATION: parse body ───────────────────────────────────────────────
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }
  const raw = (body as { value?: unknown })?.value;
  if (typeof raw !== "number" || !Number.isFinite(raw)) {
    return json({ error: "value must be a finite number" }, 400);
  }
  if (raw < 0) {
    return json({ error: "value must be non-negative" }, 400);
  }
  if (raw > MAX_VALUE) {
    return json({ error: `value must not exceed ${MAX_VALUE}` }, 400);
  }
  const value = raw;

  // ── RATE LIMIT: 60 successful events per trigger per hour ────────────────
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count } = await supabase
    .from("trigger_events")
    .select("id", { count: "exact", head: true })
    .eq("trigger_id", triggerId)
    .eq("auth_failed", false)
    .gte("received_at", oneHourAgo);
  if ((count ?? 0) >= RATE_LIMIT_PER_HOUR) {
    return json(
      { error: `Rate limit exceeded. Max ${RATE_LIMIT_PER_HOUR} requests per hour.` },
      429,
    );
  }

  const now = new Date().toISOString();
  const oldValue = Number(trigger.current_value ?? 0);

  // ── UPDATE trigger ───────────────────────────────────────────────────────
  // Note: a DB trigger (notify_trigger_threshold_crossed) inserts the
  // `trigger_met` notification automatically when current_value crosses the
  // threshold, so we don't insert one manually here.
  const { error: uErr } = await supabase
    .from("triggers")
    .update({ current_value: value, last_updated: now })
    .eq("id", triggerId);
  if (uErr) return json({ error: "Update failed" }, 500);

  // ── LOG event ────────────────────────────────────────────────────────────
  await supabase.from("trigger_events").insert({
    trigger_id: triggerId,
    value,
    source_ip: sourceIp,
    auth_failed: false,
  });

  const wasBelow = trigger.direction === "Above"
    ? oldValue < trigger.threshold_value
    : oldValue > trigger.threshold_value;
  const nowCrossed = trigger.direction === "Above"
    ? value >= trigger.threshold_value
    : value <= trigger.threshold_value;

  return json({
    received: true,
    trigger_id: triggerId,
    new_value: value,
    threshold_crossed: wasBelow && nowCrossed,
    received_at: now,
  });
});