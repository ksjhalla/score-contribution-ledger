import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  let body: { code?: unknown };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const raw = body?.code;
  if (typeof raw !== "string" || raw.trim().length === 0 || raw.length > 200) {
    return json({ error: "code is required" }, 400);
  }
  const code = raw.trim();

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data, error } = await supabase
    .from("nandi_access_codes")
    .select("code")
    .eq("code", code)
    .eq("active", true)
    .maybeSingle();

  const valid = !error && !!data;

  await supabase.from("nandi_access_log").insert({
    code_attempted: code,
    success: valid,
    user_agent: req.headers.get("user-agent"),
  });

  return json({ valid });
});
