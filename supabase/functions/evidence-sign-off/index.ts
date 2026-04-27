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
  notes?: string;
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

  // Server-side authorisation is enforced by the RLS policy on
  // public.evidence_sign_offs. The policy reads profiles.signer_role for the
  // caller and only allows the insert if it matches the requested role.
  // A viewer (or anonymous user, or a missing profile) is rejected by
  // PostgREST regardless of what the UI sends.
  const dbRole = role === "Reviewer" ? "reviewer" : "approver";

  const { data: inserted, error: insertError } = await supabase
    .from("evidence_sign_offs")
    .insert({
      mapping_id: body.mappingId,
      signer_user_id: userId,
      signer_role: dbRole,
      notes: body.notes ?? null,
    })
    .select("id, signed_at, signer_role")
    .single();

  if (insertError) {
    // 23505 = unique_violation (already signed for this role on this mapping)
    if (insertError.code === "23505") {
      return json(409, {
        error: "already_signed",
        message: `This mapping already has a ${dbRole} signature.`,
      });
    }
    // 42501 = RLS / insufficient privilege — the role check failed server-side.
    if (insertError.code === "42501" || /row-level security/i.test(insertError.message)) {
      return json(403, {
        error: "forbidden",
        message:
          role === "Approver"
            ? "Server denied: your profile is not approver, or a Reviewer signature is missing for this mapping."
            : "Server denied: your profile signer_role is not reviewer or approver. The UI role switcher cannot grant permissions.",
      });
    }
    return json(500, { error: "Insert failed", detail: insertError.message });
  }

  return json(200, {
    ok: true,
    role,
    mappingId: body.mappingId,
    actorId: userId,
    signedAt: inserted.signed_at,
    signOffId: inserted.id,
    nextStatus: role === "Reviewer" ? "Awaiting sign-off" : "Reconciled",
  });
});