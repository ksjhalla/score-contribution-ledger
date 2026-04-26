import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SEO } from "@/components/SEO";
import { Check, Loader2 } from "lucide-react";

const FONT_DISPLAY = "'Playfair Display', Georgia, serif";
const FONT_BODY = "'DM Sans', system-ui, sans-serif";
const FONT_MONO = "'DM Mono', ui-monospace, monospace";

const SR_ONLY: React.CSSProperties = {
  position: "absolute",
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: "hidden",
  clip: "rect(0,0,0,0)",
  whiteSpace: "nowrap",
  border: 0,
};

const SECTORS = [
  "Software",
  "Pharma & Biotech",
  "Agriculture",
  "Manufacturing",
  "Music & Publishing",
  "Film & Television",
  "AI & Data",
  "College Athletics",
  "Other",
] as const;
type Sector = typeof SECTORS[number];

const normalizeCode = (raw: string): string =>
  raw.toUpperCase().trim().replace(/[^A-Z0-9-]/g, "");

const INVITE_CODE_RE = /^SCORE-[A-Z0-9]+-[A-Z0-9]+$/;

const computeInitials = (name: string): string => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "XX";
  const first = parts[0][0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] ?? "" : "";
  return `${first}${last}`.toUpperCase() || "XX";
};

const Invite = () => {
  const navigate = useNavigate();

  // Form state — visible immediately, no gating, no pre-render loading.
  const [code, setCode] = useState("");
  // Admin users (has_role(uid,'admin') in user_roles) skip invite code entirely.
  const [skipInviteCode, setSkipInviteCode] = useState(false);
  // Whether we've finished checking admin status for the current session.
  // Default true (no session = no admin check needed = render field
  // immediately). Set to false only while we're awaiting the has_role RPC
  // for a signed-in user, to prevent a flash of the field for admins.
  const [adminResolved, setAdminResolved] = useState(true);
  const [codeValid, setCodeValid] = useState<boolean | null>(null);
  const [codeChecking, setCodeChecking] = useState(false);
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("");
  const [organisation, setOrganisation] = useState("");
  const [sector, setSector] = useState<Sector | "">("");
  const [touched, setTouched] = useState<{
    code?: boolean; fullName?: boolean; role?: boolean; sector?: boolean;
  }>({});
  const [busy, setBusy] = useState(false);
  const [codeErr, setCodeErr] = useState<string | null>(null);
  const [formErr, setFormErr] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  // aria-live announcements for screen readers (invisible to sighted users).
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const submittingRef = useRef(false);

  // One-shot session check on mount. No realtime, no auth subscriptions,
  // no pre-render loading state.
  // If signed in AND profile is complete → /dashboard.
  // If signed in AND admin email → skip invite code (or go to /dashboard if profile exists).
  // If signed in (any state) → pre-fill name + email from OAuth metadata.
  // If signed out → render form as-is (user came from OAuth without profile,
  // or arrived directly).
  useEffect(() => {
    let cancelled = false;
    // If the user landed here with a leftover OAuth fragment in the URL
    // (e.g. a redirect chain that didn't strip it), scrub it synchronously
    // before Supabase's hashchange listener fires a second
    // _getSessionFromURL pass. Without this, repeated parses trigger
    // history.replaceState in a tight loop and Chromium throttles
    // navigation. We use replaceState (not navigate) so React Router
    // doesn't re-render.
    if (typeof window !== "undefined" && window.location.hash.includes("access_token")) {
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
    }
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (cancelled || !session?.user) return;
      // We have a session — must resolve admin status before showing the
      // invite-code field, to avoid a flash for admin users.
      setAdminResolved(false);
      const email = session.user.email ?? "";
      setUserEmail(email);
      const meta = session.user.user_metadata as Record<string, unknown> | undefined;
      const oauthName =
        (typeof meta?.full_name === "string" && meta.full_name) ||
        (typeof meta?.name === "string" && meta.name) ||
        "";
      if (oauthName) setFullName((prev) => prev || (oauthName as string));

      const { data: prof } = await supabase
        .from("profiles")
        .select("profile_completed")
        .eq("id", session.user.id)
        .maybeSingle();
      if (cancelled) return;
      if (prof?.profile_completed) {
        navigate("/dashboard", { replace: true });
        return;
      }

      // Admin bypass: server-side check against user_roles via has_role RPC.
      // No frontend secret, no env drift — secure by RLS.
      const { data: isAdmin } = await supabase.rpc("has_role", {
        _user_id: session.user.id,
        _role: "admin",
      });
      if (cancelled) return;
      if (isAdmin === true) setSkipInviteCode(true);
      setAdminResolved(true);
    })();
    return () => { cancelled = true; };
  }, [navigate]);

  const contributorPreview = useMemo(() => {
    return `SCR-${computeInitials(fullName)}-${new Date().getFullYear()}-001`;
  }, [fullName]);

  const fieldErrors = useMemo(() => {
    const e: { code?: string; fullName?: string; role?: string; sector?: string } = {};
    if (!skipInviteCode && !code.trim()) e.code = "Please enter your invite code.";
    const name = fullName.trim();
    if (!name) e.fullName = "Full name is required.";
    else if (!/\s/.test(name)) e.fullName = "Please enter your first and last name.";
    if (!role.trim()) e.role = "Professional role is required.";
    if (!sector) e.sector = "Please select a sector.";
    return e;
  }, [code, fullName, role, sector]);

  const handleCodeBlur = async () => {
    setTouched((t) => ({ ...t, code: true }));
    const normalized = normalizeCode(code);
    if (!normalized) {
      setCodeValid(null);
      setCodeErr(null);
      return;
    }
    if (!INVITE_CODE_RE.test(normalized)) {
      setCodeValid(false);
      setCodeErr("This code is invalid, expired, or not for this email.");
      return;
    }
    setCodeChecking(true);
    setCodeErr(null);
    const { data: valid, error } = await supabase.rpc("validate_invite_code", {
      p_code: normalized,
      p_email: userEmail ?? "",
    });
    setCodeChecking(false);
    if (error || !valid) {
      setCodeValid(false);
      setCodeErr("This code is invalid, expired, or not for this email.");
    } else {
      setCodeValid(true);
      setCodeErr(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Synchronous re-entry guard — blocks double-submits before any await.
    if (submittingRef.current) return;
    submittingRef.current = true;

    setFormErr(null);
    setErrorMessage("");
    setStatusMessage("");
    setTouched({ code: true, fullName: true, role: true, sector: true });

    if (Object.keys(fieldErrors).length > 0) {
      setErrorMessage("Error: Please fill in all required fields.");
      submittingRef.current = false;
      return;
    }
    if (!sector) { submittingRef.current = false; return; }

    const normalizedCode = normalizeCode(code);
    if (!INVITE_CODE_RE.test(normalizedCode)) {
      setCodeValid(false);
      setCodeErr("This code is invalid, expired, or not for this email.");
      setErrorMessage("Error: This invite code is invalid, expired, or not for this email address.");
      submittingRef.current = false;
      return;
    }

    setBusy(true);
    setStatusMessage("Verifying invite code…");

    try {
      // Fresh session check (no subscription).
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) {
        setStatusMessage("");
        navigate("/auth", { replace: true });
        return;
      }

      // 1. Validate the code (async).
      const { data: valid, error: vErr } = await supabase.rpc("validate_invite_code", {
        p_code: normalizedCode,
        p_email: user.email ?? "",
      });
      if (vErr || !valid) {
        setCodeValid(false);
        setCodeErr("This code is invalid, expired, or not for this email.");
        setStatusMessage("");
        setErrorMessage("Error: This invite code is invalid, expired, or not for this email address.");
        return;
      }

      setStatusMessage("Invite code accepted. Creating your account…");

      // 2. Create the profile (generates a permanent contributor_id).
      const { error: pErr } = await supabase.rpc("complete_profile_with_contributor_id", {
        p_full_name: fullName.trim(),
        p_professional_role: role.trim(),
        p_organisation: organisation.trim() || null,
        p_sector: sector,
      });
      if (pErr) {
        // Profile already exists (duplicate submit race) — treat as success.
        if ((pErr as { code?: string }).code === "23505") {
          navigate("/dashboard", { replace: true });
          return;
        }
        setFormErr("Something went wrong. Try again.");
        setStatusMessage("");
        setErrorMessage("Error: Something went wrong. Please try again.");
        return;
      }

      // 3. Redeem the code.
      const { error: rErr } = await supabase.rpc("redeem_invite_code", {
        p_code: normalizedCode,
        p_user_id: user.id,
      });
      if (rErr) {
        setFormErr("Could not redeem this code. Please try again.");
        setStatusMessage("");
        setErrorMessage("Error: Something went wrong. Please try again.");
        return;
      }

      // 4. Preload profile so contributor ID is visible on first dashboard render.
      await supabase.from("profiles").select("contributor_id").eq("id", user.id).maybeSingle();

      setStatusMessage("");
      setErrorMessage("");
      navigate("/dashboard", { replace: true });
    } finally {
      setBusy(false);
      submittingRef.current = false;
    }
  };

  const errorBorder = "1px solid rgba(154,48,32,0.4)";

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">
      <SEO title="Invite required — SCORE" description="Enter your SCORE invite code to complete setup." noindex />
      <Card className="w-full max-w-md my-8">
        <CardContent className="pt-8 pb-6 px-6">
          {/* Screen reader announcements — visually hidden. */}
          <div role="status" aria-live="polite" aria-atomic="true" style={SR_ONLY}>
            {statusMessage}
          </div>
          <div role="alert" aria-live="assertive" aria-atomic="true" style={SR_ONLY}>
            {errorMessage}
          </div>
          <div style={{ fontFamily: FONT_MONO, fontSize: 9, color: "#9A8F84", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
            Invite required
          </div>
          <h1 style={{ fontFamily: FONT_DISPLAY, fontWeight: 600, fontSize: 20, color: "#1A1614", margin: "0 0 12px" }}>
            You need an invite.
          </h1>
          <p style={{ fontFamily: FONT_BODY, fontSize: 13, color: "#5C5248", lineHeight: 1.7, margin: "0 0 20px" }}>
            SCORE is currently invite-only. Enter your invite code and complete your profile to finish setup.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Section 1 — Invite code (hidden for admin users) */}
            {adminResolved && !skipInviteCode && (
            <div className="space-y-2">
              <Label htmlFor="invite-code" style={{ fontFamily: FONT_MONO, fontSize: 10, color: "#9A8F84", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Invite code
              </Label>
              <div className="relative">
                <Input
                  id="invite-code"
                  type="text"
                  autoComplete="off"
                  placeholder="SCORE-XXXX-XXXX"
                  value={code}
                  onChange={(e) => {
                    setCode(normalizeCode(e.target.value));
                    if (codeErr) setCodeErr(null);
                    if (codeValid !== null) setCodeValid(null);
                  }}
                  onBlur={handleCodeBlur}
                  aria-invalid={!!(touched.code && codeErr)}
                  style={{
                    fontFamily: FONT_MONO,
                    fontSize: 13,
                    color: "#1A1614",
                    letterSpacing: "0.04em",
                    paddingRight: 32,
                    border: touched.code && codeErr ? errorBorder : undefined,
                  }}
                />
                {codeChecking && (
                  <Loader2 className="h-4 w-4 animate-spin absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                )}
                {!codeChecking && codeValid === true && (
                  <Check className="h-4 w-4 absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "#2F7A3D" }} aria-label="Valid code" />
                )}
              </div>
              {touched.code && codeErr && (
                <p role="alert" style={{ fontFamily: FONT_BODY, fontSize: 11, color: "#9A3020" }}>
                  {codeErr}
                </p>
              )}
              {touched.code && !codeErr && fieldErrors.code && (
                <p style={{ fontFamily: FONT_BODY, fontSize: 11, color: "#9A3020" }}>{fieldErrors.code}</p>
              )}
            </div>
            )}

            {/* Section 2 — Profile */}
            <div className="space-y-2">
              <Label htmlFor="full-name" style={{ fontFamily: FONT_MONO, fontSize: 10, color: "#9A8F84", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Full name
              </Label>
              <Input
                id="full-name"
                autoComplete="name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, fullName: true }))}
                aria-invalid={!!(touched.fullName && fieldErrors.fullName)}
                style={{ border: touched.fullName && fieldErrors.fullName ? errorBorder : undefined }}
              />
              <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: "#9A8F84", marginTop: 4 }}>
                Your ID: {contributorPreview}
              </div>
              <div style={{ fontFamily: FONT_MONO, fontSize: 9, color: "#9A8F84" }}>
                Permanent once created
              </div>
              {touched.fullName && fieldErrors.fullName && (
                <p style={{ fontFamily: FONT_BODY, fontSize: 11, color: "#9A3020" }}>{fieldErrors.fullName}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="role" style={{ fontFamily: FONT_MONO, fontSize: 10, color: "#9A8F84", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Role
              </Label>
              <Input
                id="role"
                autoComplete="organization-title"
                placeholder="Protocol architect · Process engineer · PhD researcher"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, role: true }))}
                aria-invalid={!!(touched.role && fieldErrors.role)}
                style={{ border: touched.role && fieldErrors.role ? errorBorder : undefined }}
              />
              {touched.role && fieldErrors.role && (
                <p style={{ fontFamily: FONT_BODY, fontSize: 11, color: "#9A3020" }}>{fieldErrors.role}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="org" style={{ fontFamily: FONT_MONO, fontSize: 10, color: "#9A8F84", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Organisation <span style={{ textTransform: "none", color: "#9A8F84" }}>(optional)</span>
              </Label>
              <Input
                id="org"
                autoComplete="organization"
                placeholder="Company, university, cooperative, or individual"
                value={organisation}
                onChange={(e) => setOrganisation(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sector" style={{ fontFamily: FONT_MONO, fontSize: 10, color: "#9A8F84", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Sector
              </Label>
              <Select
                value={sector || undefined}
                onValueChange={(v) => {
                  setSector(v as Sector);
                  setTouched((t) => ({ ...t, sector: true }));
                }}
              >
                <SelectTrigger
                  id="sector"
                  aria-invalid={!!(touched.sector && fieldErrors.sector)}
                  style={{ border: touched.sector && fieldErrors.sector ? errorBorder : undefined }}
                >
                  <SelectValue placeholder="Select a sector" />
                </SelectTrigger>
                <SelectContent>
                  {SECTORS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
              {touched.sector && fieldErrors.sector && (
                <p style={{ fontFamily: FONT_BODY, fontSize: 11, color: "#9A3020" }}>{fieldErrors.sector}</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={busy}
              style={{
                width: "100%",
                background: "#1A1614",
                color: "#F5F1E8",
                fontFamily: FONT_BODY,
                fontSize: 14,
                fontWeight: 500,
                borderRadius: 4,
                padding: "11px",
                marginTop: 4,
              }}
            >
              {busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {busy ? "Verifying…" : "Complete setup →"}
            </Button>

            {formErr && (
              <p role="alert" style={{ fontFamily: FONT_BODY, fontSize: 12, color: "#9A3020", textAlign: "center" }}>
                {formErr}
              </p>
            )}
          </form>

          <div style={{ marginTop: 24, paddingTop: 16, borderTop: "1px solid rgba(26,22,14,0.08)", textAlign: "center" }}>
            <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: "#5C5248" }}>Don't have a code?</div>
            <a href="/#cta" style={{ fontFamily: FONT_MONO, fontSize: 10, color: "#C4892A", textDecoration: "none" }}>
              Request access →
            </a>
          </div>

          <div style={{ marginTop: 20, textAlign: "center" }}>
            <button
              type="button"
              onClick={async () => { await supabase.auth.signOut(); navigate("/auth", { replace: true }); }}
              style={{ background: "none", border: "none", fontFamily: FONT_MONO, fontSize: 9, color: "#9A8F84", cursor: "pointer", textDecoration: "underline" }}
            >
              Sign out
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Invite;