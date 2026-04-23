import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Printer, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

type Profile = { contributor_id: string | null; full_name: string | null; professional_role: string | null; sector: string | null };
type Contract = { id: string; name: string; counterparty_name: string; stake_type: string; created_at: string };
type Execution = { id: string; contract_id: string; title: string; work_description: string; execution_date: string; status: string; settled_amount: number | null; currency: string; evidence_ids: string[] };
type Evidence = { id: string; contract_id: string; title: string; evidence_type: string; fingerprint: string; timestamp_created: string };

const PassportReport = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) { navigate("/auth", { replace: true }); return; }
    (async () => {
      const [p, c, e, ev] = await Promise.all([
        supabase.from("profiles").select("contributor_id, full_name, professional_role, sector").eq("id", user.id).maybeSingle(),
        supabase.from("contracts").select("id, name, counterparty_name, stake_type, created_at").eq("user_id", user.id).order("created_at"),
        supabase.from("executions").select("id, contract_id, title, work_description, execution_date, status, settled_amount, currency, evidence_ids").eq("user_id", user.id).order("execution_date"),
        supabase.from("evidence").select("id, contract_id, title, evidence_type, fingerprint, timestamp_created").eq("user_id", user.id),
      ]);
      setProfile(p.data as Profile);
      setContracts((c.data ?? []) as Contract[]);
      setExecutions((e.data ?? []) as Execution[]);
      setEvidence((ev.data ?? []) as Evidence[]);
      setReady(true);
    })();
  }, [user, loading, navigate]);

  if (!ready || !profile) return <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">Loading…</div>;

  const today = new Date().toLocaleDateString();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b print:hidden">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <Button size="sm" onClick={() => window.print()}>
            <Printer className="h-4 w-4 mr-1" /> Print / Save as PDF
          </Button>
        </div>
      </header>

      <main id="report-printable" className="max-w-3xl mx-auto px-6 py-10 space-y-10">
        {/* Cover */}
        <section className="report-page text-center pt-32">
          <div className="text-xs uppercase tracking-widest text-muted-foreground">SCORE Contribution Report</div>
          <h1 className="text-4xl font-semibold mt-6">{profile.full_name ?? "Anonymised"}</h1>
          <div className="text-sm text-muted-foreground mt-2">{[profile.professional_role, profile.sector].filter(Boolean).join(" · ")}</div>
          <div className="font-mono text-xs mt-8">{profile.contributor_id}</div>
          <div className="text-xs text-muted-foreground mt-1">Generated {today}</div>
        </section>

        {contracts.map((c) => {
          const exs = executions.filter((e) => e.contract_id === c.id);
          const evs = evidence.filter((e) => e.contract_id === c.id);
          return (
            <section key={c.id} className="report-page space-y-4">
              <header className="border-b pb-2">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{c.stake_type} · {new Date(c.created_at).toLocaleDateString()}</div>
                <h2 className="text-xl font-semibold">{c.name}</h2>
                <div className="text-sm text-muted-foreground">Counterparty: {c.counterparty_name}</div>
              </header>

              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Execution timeline</h3>
                {exs.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No executions logged.</p>
                ) : (
                  <ol className="space-y-2">
                    {exs.map((e) => (
                      <li key={e.id} className="border rounded-md p-2.5">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">{e.title}</span>
                          <span className="text-xs">{new Date(e.execution_date).toLocaleDateString()} · {e.status}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{e.work_description}</p>
                        {e.settled_amount != null && (
                          <div className="text-xs mt-1 font-medium">{e.settled_amount.toLocaleString()} {e.currency}</div>
                        )}
                      </li>
                    ))}
                  </ol>
                )}
              </div>

              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Evidence</h3>
                {evs.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No evidence attached.</p>
                ) : (
                  <ul className="space-y-1.5">
                    {evs.map((e) => (
                      <li key={e.id} className="text-xs flex justify-between gap-2 border-b pb-1">
                        <span className="truncate">{e.title} <span className="text-muted-foreground">({e.evidence_type})</span></span>
                        <code className="font-mono text-[10px] text-muted-foreground">{e.fingerprint.slice(0, 16)}…</code>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
          );
        })}
      </main>
    </div>
  );
};

export default PassportReport;