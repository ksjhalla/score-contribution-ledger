import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { SEO } from "@/components/SEO";
import { Loader2 } from "lucide-react";

const FONT_DISPLAY = "'Playfair Display', Georgia, serif";
const FONT_BODY = "'DM Sans', system-ui, sans-serif";
const FONT_MONO = "'DM Mono', ui-monospace, monospace";

const Invite = () => {
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // One-shot session check on mount. No realtime, no auth subscriptions.
  // If the user is already signed in AND their profile is complete,
  // bounce them to the dashboard. Otherwise render the form immediately.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (cancelled || !session?.user) return;
      const { data: prof } = await supabase
        .from("profiles")
        .select("profile_completed")
        .eq("id", session.user.id)
        .maybeSingle();
      if (!cancelled && prof?.profile_completed) {
        navigate("/dashboard", { replace: true });
      }
    })();
    return () => { cancelled = true; };
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    const trimmed = code.trim();
    if (!trimmed) {
      setErr("Please enter your invite code.");
      return;
    }

    setBusy(true);
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) {
      setBusy(false);
      navigate("/auth", { replace: true });
      return;
    }

    const { data: valid, error: vErr } = await supabase.rpc("validate_invite_code", {
      p_code: trimmed,
      p_email: user.email ?? "",
    });
    if (vErr || !valid) {
      setBusy(false);
      setErr("This invite code is invalid, expired, or not for this email.");
      return;
    }
    const { error: rErr } = await supabase.rpc("redeem_invite_code", {
      p_code: trimmed,
      p_user_id: user.id,
    });
    setBusy(false);
    if (rErr) {
      setErr("Could not redeem this code. Please try again.");
      return;
    }
    navigate("/complete-profile", { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">
      <SEO title="Invite required — SCORE" description="Enter your SCORE invite code to complete setup." noindex />
      <Card className="w-full max-w-md">
        <CardContent className="pt-8 pb-6 px-6">
          <div style={{ fontFamily: FONT_MONO, fontSize: 9, color: "#9A8F84", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
            Invite required
          </div>
          <h1 style={{ fontFamily: FONT_DISPLAY, fontWeight: 600, fontSize: 20, color: "#1A1614", margin: "0 0 12px" }}>
            You need an invite.
          </h1>
          <p style={{ fontFamily: FONT_BODY, fontSize: 13, color: "#5C5248", lineHeight: 1.7, margin: "0 0 20px" }}>
            SCORE is currently invite-only. Enter your invite code to complete setup, or request access below.
          </p>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-2">
              <Label
                htmlFor="invite-code"
                style={{ fontFamily: FONT_MONO, fontSize: 10, color: "#9A8F84", textTransform: "uppercase", letterSpacing: "0.05em" }}
              >
                Invite code
              </Label>
              <Input
                id="invite-code"
                type="text"
                autoComplete="off"
                placeholder="SCORE-XXXX-XXXX"
                value={code}
                onChange={(e) => { setCode(e.target.value.toUpperCase()); if (err) setErr(null); }}
                style={{ fontFamily: FONT_MONO, fontSize: 13, color: "#1A1614", letterSpacing: "0.04em" }}
              />
              {err && (
                <p role="alert" style={{ fontFamily: FONT_BODY, fontSize: 11, color: "#9A3020", marginTop: 4 }}>
                  {err}
                </p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={busy}>
              {busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {busy ? "Checking…" : "Continue →"}
            </Button>
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