import { createClient } from "https://esm.sh/@supabase/supabase-js@2.74.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return json({ error: "unauthenticated" }, 401);
  }

  // Caller-scoped client: RLS/role checks below run as the actual caller,
  // not as service role. This is the trust boundary — admin status is
  // proven from the caller's own JWT, never assumed from the client.
  const callerClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );

  const { data: claimsData, error: claimsError } = await callerClient.auth.getClaims(
    authHeader.replace("Bearer ", ""),
  );
  if (claimsError || !claimsData?.claims?.sub) {
    return json({ error: "invalid_session" }, 401);
  }
  const userId = claimsData.claims.sub as string;

  // Reuse the existing has_role RPC — same function get_admin_stats() and
  // get_admin_user_list() already trust. No new authorization logic invented.
  const { data: isAdmin, error: roleError } = await callerClient.rpc("has_role", {
    _user_id: userId,
    _role: "admin",
  });
  if (roleError || !isAdmin) {
    return json({ error: "forbidden", message: "Admin role required." }, 403);
  }

  // Only past this point do we touch the cron secret, and only server-side.
  const cronSecret = Deno.env.get("CRON_SECRET");
  if (!cronSecret) {
    return json({ error: "server_misconfigured", message: "CRON_SECRET is not set." }, 500);
  }

  const targetUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/overdue-settlement-reminders`;
  const triggeredAt = new Date().toISOString();

  const upstream = await fetch(targetUrl, {
    method: "POST",
    headers: { "x-cron-secret": cronSecret, "Content-Type": "application/json" },
  });
  const upstreamBody = await upstream.json().catch(() => null);

  return json({
    ok: upstream.ok,
    triggeredBy: userId,
    triggeredAt,
    upstreamStatus: upstream.status,
    result: upstreamBody,
  }, upstream.ok ? 200 : 502);
});