import { useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

const FLAG = "nandi_sandbox_unlocked";

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=DM+Sans:wght@400;500;700&family=Playfair+Display:wght@600;700&display=swap');
.nandi-gate{--paper:#FDFAF4;--ink:#1A1614;--muted:#5C5248;--faint:#9A8F84;--accent:#5C7A3A;--accent-soft:rgba(92,122,58,.10);--accent-border:rgba(92,122,58,.25);--red:#8A2A20;--line:rgba(26,22,14,.12);
background:var(--paper);color:var(--ink);font-family:'DM Sans',system-ui,sans-serif;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;-webkit-font-smoothing:antialiased}
.nandi-gate *{box-sizing:border-box}
.nandi-gate .box{width:100%;max-width:420px;background:#fff;border:1px solid var(--line);border-radius:10px;padding:26px 24px;box-shadow:0 8px 24px -16px rgba(26,22,14,.35)}
.nandi-gate .kicker{font-family:'DM Mono',ui-monospace,monospace;font-size:9px;letter-spacing:.10em;text-transform:uppercase;color:var(--faint)}
.nandi-gate h1{font-family:'Playfair Display',Georgia,serif;font-size:26px;line-height:1.2;margin:6px 0 8px}
.nandi-gate p{margin:0 0 16px;color:var(--muted);font-size:14px;line-height:1.55}
.nandi-gate label{font-family:'DM Mono',ui-monospace,monospace;font-size:9px;letter-spacing:.08em;text-transform:uppercase;color:var(--faint);display:block;margin-bottom:6px}
.nandi-gate input{width:100%;font-family:'DM Mono',ui-monospace,monospace;font-size:14px;color:var(--ink);background:var(--paper);border:1px solid var(--line);border-radius:6px;padding:10px 12px;outline:none}
.nandi-gate input:focus{border-color:var(--accent-border);background:#fff}
.nandi-gate button{margin-top:12px;width:100%;font-family:'DM Sans',system-ui,sans-serif;font-size:14px;font-weight:700;color:#fff;background:var(--accent);border:none;border-radius:6px;padding:11px 14px;cursor:pointer}
.nandi-gate button:disabled{opacity:.6;cursor:default}
.nandi-gate .err{margin-top:10px;font-size:13px;color:var(--red)}
.nandi-gate .foot{margin-top:16px;font-family:'DM Mono',ui-monospace,monospace;font-size:10px;color:var(--faint)}
`;

export function NandiAccessGate({ children }: { children: ReactNode }) {
  const [unlocked, setUnlocked] = useState(
    () => typeof window !== "undefined" && sessionStorage.getItem(FLAG) === "true",
  );
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (unlocked) return <>{children}</>;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || busy) return;
    setBusy(true);
    setError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke("nandi-access-check", {
        body: { code: code.trim() },
      });
      if (fnError) throw fnError;
      if (data?.valid) {
        sessionStorage.setItem(FLAG, "true");
        setUnlocked(true);
        return;
      }
      setError("That code isn't recognised. Check it and try again.");
    } catch {
      setError("Couldn't check the code just now. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="nandi-gate">
      <style>{CSS}</style>
      <div className="box">
        <div className="kicker">SCORE · Nandi sandbox</div>
        <h1>Access code required</h1>
        <p>
          This sandbox is shared privately for pilot and partner conversations. Enter the access
          code you were given to continue. No account needed.
        </p>
        <form onSubmit={submit}>
          <label htmlFor="nandi-code">Access code</label>
          <input
            id="nandi-code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            autoFocus
            autoComplete="off"
            placeholder="Enter code"
          />
          <button type="submit" disabled={busy || !code.trim()}>
            {busy ? "Checking…" : "Enter sandbox"}
          </button>
        </form>
        {error && <div className="err">{error}</div>}
        <div className="foot">Access lasts for this browser session only.</div>
      </div>
    </div>
  );
}

export default NandiAccessGate;