import { createClient } from "https://esm.sh/@supabase/supabase-js@2.74.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

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

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Body must be JSON" }, 400);
  }
  const value = (body as { value?: unknown })?.value;
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return json({ error: "Body must contain numeric `value`" }, 400);
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Trigger must exist, be webhook-sourced, and belong to a real user.
  const { data: trigger, error: tErr } = await supabase
    .from("triggers")
    .select("id, user_id, source_type")
    .eq("id", triggerId)
    .maybeSingle();

  if (tErr) return json({ error: tErr.message }, 500);
  if (!trigger) return json({ error: "Trigger not found" }, 404);
  if (trigger.source_type !== "Webhook") {
    return json({ error: "Trigger does not accept webhooks" }, 403);
  }

  const sourceIp =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    null;

  const now = new Date().toISOString();

  const { error: uErr } = await supabase
    .from("triggers")
    .update({ current_value: value, last_updated: now })
    .eq("id", triggerId);
  if (uErr) return json({ error: uErr.message }, 500);

  const { error: eErr } = await supabase
    .from("trigger_events")
    .insert({ trigger_id: triggerId, value, source_ip: sourceIp });
  if (eErr) return json({ error: eErr.message }, 500);

  return json({ ok: true, trigger_id: triggerId, value, received_at: now });
});