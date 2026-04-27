import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

type SignRole = "Reviewer" | "Approver";

interface Body {
  role?: SignRole;
  mappingId?: string;
  currentStatus?: "Watching" | "Awaiting sign-off" | "Reconciled";
  hasReviewerSignature?: boolean;
}

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return json(405, { error: "Method not allowed" });
  }

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return json(400, { error: "Invalid JSON body" });
  }

  const role = body.role;
  if (role !== "Reviewer" && role !== "Approver") {
    return json(400, { error: "role must be 'Reviewer' or 'Approver'" });
  }
  if (!body.mappingId || typeof body.mappingId !== "string") {
    return json(400, { error: "mappingId is required" });
  }

  // Approver action requires an existing reviewer signature on the mapping.
  if (role === "Approver" && !body.hasReviewerSignature) {
    return json(409, {
      error: "needs_reviewer",
      message: "Approver counter-sign requires a Reviewer signature first.",
    });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return json(401, {
      error: "unauthenticated",
      message:
        "Sign-off requires an authenticated user with the matching role. Sign in to act as Reviewer or Approver.",
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );

  const token = authHeader.replace("Bearer ", "");
  const { data: claimsData, error: claimsError } =
    await supabase.auth.getClaims(token);
  if (claimsError || !claimsData?.claims?.sub) {
    return json(401, { error: "Invalid session token" });
  }
  const userId = claimsData.claims.sub as string;

  // Server-side role check — UI role switcher cannot bypass this.
  const requiredRole =
    role === "Reviewer" ? "evidence_reviewer" : "evidence_approver";

  const { data: roleRows, error: roleError } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .in("role", [requiredRole, "admin"]);

  if (roleError) {
    return json(500, { error: "Role lookup failed", detail: roleError.message });
  }

  if (!roleRows || roleRows.length === 0) {
    return json(403, {
      error: "forbidden",
      message: `This action requires the '${requiredRole}' role. A Viewer cannot sign off, regardless of the UI role switcher.`,
      requiredRole,
    });
  }

  const now = new Date().toISOString();
  return json(200, {
    ok: true,
    role,
    mappingId: body.mappingId,
    actorId: userId,
    signedAt: now,
    nextStatus: role === "Reviewer" ? "Awaiting sign-off" : "Reconciled",
  });
});