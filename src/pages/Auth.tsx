import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { SEO } from "@/components/SEO";

const Auth = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate("/dashboard", { replace: true });
  }, [user, loading, navigate]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteError(null);

    const code = inviteCode.trim();
    if (!code) {
      setInviteError("An invite code is required to create an account.");
      return;
    }

    setBusy(true);

    // 1) Validate the code against the email BEFORE creating the auth user
    const { data: valid, error: vErr } = await supabase.rpc("validate_invite_code", {
      p_code: code,
      p_email: email,
    });
    if (vErr || !valid) {
      setBusy(false);
      setInviteError("This invite code is invalid, expired, or not for this email.");
      return;
    }

    // 2) Create the account
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/` },
    });
    if (error) {
      setBusy(false);
      toast.error(error.message);
      return;
    }

    // 3) Redeem the code (best-effort — failure here doesn't block the user)
    const {
      data: { user: newUser },
    } = await supabase.auth.getUser();
    if (newUser) {
      await supabase.rpc("redeem_invite_code", { p_code: code, p_user_id: newUser.id });
    }

    setBusy(false);
    toast.success("Account created. You're signed in.");
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) toast.error(error.message);
  };

  const handleGoogle = async () => {
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: `${window.location.origin}/auth/callback`,
    });
    if (result.error) {
      setBusy(false);
      toast.error(result.error.message ?? "Google sign-in failed.");
    }
  };

  const GoogleButton = () => (
    <button
      type="button"
      onClick={handleGoogle}
      disabled={busy}
      className="w-full flex items-center justify-center gap-2 rounded-[4px] bg-white px-4 py-2.5 text-sm font-medium text-[#1A1614] hover:bg-muted/40 transition-colors"
      style={{ border: "1px solid rgba(26,22,14,0.15)", fontFamily: "'DM Sans', system-ui, sans-serif" }}
    >
      <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
        <path
          fill="#FFC107"
          d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
        />
        <path
          fill="#FF3D00"
          d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
        />
        <path
          fill="#4CAF50"
          d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
        />
        <path
          fill="#1976D2"
          d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571.001-.001.002-.001.003-.002l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
        />
      </svg>
      Continue with Google
    </button>
  );

  const Divider = () => (
    <div className="flex items-center gap-3 my-4">
      <div className="flex-1 h-px" style={{ background: "rgba(26,22,14,0.10)" }} />
      <span
        style={{
          fontFamily: "'DM Mono', ui-monospace, monospace",
          fontSize: 10,
          color: "#9A8F84",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        or continue with email
      </span>
      <div className="flex-1 h-px" style={{ background: "rgba(26,22,14,0.10)" }} />
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">
      <SEO title="Sign in — SCORE" description="Sign in to your SCORE contribution ledger." noindex />
      <a
        href="/"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          padding: "12px 24px",
          fontFamily: "'DM Mono', ui-monospace, monospace",
          fontSize: 10,
          color: "#9A8F84",
          textDecoration: "none",
        }}
      >
        ← Back to home
      </a>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl tracking-tight">SCORE</CardTitle>
          <CardDescription>Contribution Ledger</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            <TabsContent value="signin">
              <div className="mt-4">
                <GoogleButton />
                <Divider />
              </div>
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email-in">Email</Label>
                  <Input id="email-in" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pw-in">Password</Label>
                  <Input
                    id="pw-in"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={busy}>
                  Sign In
                </Button>
              </form>
            </TabsContent>
            <TabsContent value="signup">
              <div className="mt-4">
                <GoogleButton />
                <Divider />
              </div>
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email-up">Email</Label>
                  <Input id="email-up" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="invite-up"
                    style={{
                      fontFamily: "'DM Mono', ui-monospace, monospace",
                      fontSize: 10,
                      color: "#9A8F84",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    Invite code
                  </Label>
                  <Input
                    id="invite-up"
                    type="text"
                    required
                    autoComplete="off"
                    placeholder="SCORE-XXXX-XXXX"
                    value={inviteCode}
                    onChange={(e) => {
                      setInviteCode(e.target.value.toUpperCase());
                      if (inviteError) setInviteError(null);
                    }}
                    style={{
                      fontFamily: "'DM Mono', ui-monospace, monospace",
                      fontSize: 13,
                      color: "#1A1614",
                      letterSpacing: "0.04em",
                    }}
                  />
                  {inviteError && (
                    <p
                      role="alert"
                      style={{
                        fontFamily: "'DM Sans', system-ui, sans-serif",
                        fontSize: 11,
                        color: "#9A3020",
                        marginTop: 4,
                      }}
                    >
                      {inviteError}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pw-up">Password</Label>
                  <Input
                    id="pw-up"
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={busy}>
                  Create Account
                </Button>
                <p
                  style={{
                    fontFamily: "'DM Mono', ui-monospace, monospace",
                    fontSize: 9,
                    color: "#9A8F84",
                    textAlign: "center",
                    marginTop: 4,
                  }}
                >
                  Don't have a code?{" "}
                  <a href="/#cta" style={{ color: "#C4892A", textDecoration: "none" }}>
                    Request access →
                  </a>
                </p>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
