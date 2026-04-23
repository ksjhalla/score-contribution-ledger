import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogOut, FileText, Plus, FileSignature, Share2 } from "lucide-react";
import { NewContractDialog } from "@/components/contracts/NewContractDialog";
import { ContractCard, ContractRow } from "@/components/contracts/ContractCard";
import { ledgerEvents } from "@/lib/ledgerEvents";
import { SharePassportDialog } from "@/components/passport/SharePassportDialog";

type Profile = {
  full_name: string | null;
  professional_role: string | null;
  contributor_id: string | null;
  profile_completed: boolean;
  passport_visible: boolean;
  show_amounts: boolean;
  show_counterparties: boolean;
  show_contracts: boolean;
};

const StatCard = ({ label, value }: { label: string; value: string }) => (
  <Card>
    <CardHeader className="pb-2">
      <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {label}
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-semibold">{value}</div>
    </CardContent>
  </Card>
);

const Index = () => {
  const navigate = useNavigate();
  const { user, loading, signOut } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [contracts, setContracts] = useState<ContractRow[]>([]);
  const [newOpen, setNewOpen] = useState(false);
  const [stats, setStats] = useState({ total: 0, settled: 0, pending: 0, currency: "USD" });
  const [shareOpen, setShareOpen] = useState(false);

  const loadContracts = useCallback(async (uid: string) => {
    const { data } = await supabase
      .from("contracts")
      .select("id, name, counterparty_name, counterparty_type, stake_type, contract_type, attestation_required")
      .eq("user_id", uid)
      .order("created_at", { ascending: false });
    setContracts((data ?? []) as ContractRow[]);
  }, []);

  const loadStats = useCallback(async (uid: string) => {
    const { data } = await supabase
      .from("executions")
      .select("status, trigger_met, settled_amount, currency")
      .eq("user_id", uid);
    const rows = data ?? [];
    let total = 0, settled = 0, pending = 0;
    let currency = "USD";
    for (const r of rows) {
      const amt = Number(r.settled_amount ?? 0);
      if (r.currency) currency = r.currency;
      if (r.trigger_met) total += amt;
      if (r.status === "Settled") settled += amt;
      if (r.status === "Pending" && r.trigger_met) pending += amt;
    }
    setStats({ total, settled, pending, currency });
  }, []);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate("/auth", { replace: true });
      return;
    }
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("full_name, professional_role, contributor_id, profile_completed, passport_visible, show_amounts, show_counterparties, show_contracts")
        .eq("id", user.id)
        .maybeSingle();
      if (!data || !data.profile_completed) {
        navigate("/complete-profile", { replace: true });
        return;
      }
      setProfile(data as Profile);
      await Promise.all([loadContracts(user.id), loadStats(user.id)]);
      setProfileLoading(false);
    })();
  }, [user, loading, navigate, loadContracts, loadStats]);

  // Refetch stats whenever any ledger entity changes (executions/evidence).
  useEffect(() => {
    if (!user) return;
    const off = ledgerEvents.on(() => {
      loadStats(user.id);
      loadContracts(user.id);
    });
    return () => { off(); };
  }, [user, loadStats, loadContracts]);

  if (loading || profileLoading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground text-sm">Loading…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold tracking-tight">SCORE</h1>
            <p className="text-xs text-muted-foreground">Contribution Ledger</p>
          </div>
          <Button variant="ghost" size="sm" onClick={signOut}>
            <LogOut className="h-4 w-4 mr-2" /> Sign out
          </Button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        <Tabs defaultValue="passport" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="passport">Passport</TabsTrigger>
            <TabsTrigger value="log">Log Work</TabsTrigger>
          </TabsList>

          <TabsContent value="passport" className="space-y-6 mt-6">
            <Card>
              <CardContent className="pt-6 space-y-1">
                <div className="text-xl font-semibold">{profile.full_name}</div>
                <div className="text-sm text-muted-foreground">{profile.professional_role}</div>
                <div className="pt-2 flex items-center justify-between gap-2">
                  <div className="text-xs font-mono text-muted-foreground">{profile.contributor_id}</div>
                  <Button size="sm" variant="outline" onClick={() => setShareOpen(true)}>
                    <Share2 className="h-3.5 w-3.5 mr-1" /> Share Passport
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-2 gap-3">
              <StatCard label="Total attributed value" value={`${stats.total.toLocaleString()} ${stats.currency}`} />
              <StatCard label="Settled" value={`${stats.settled.toLocaleString()} ${stats.currency}`} />
              <StatCard label="Pending" value={`${stats.pending.toLocaleString()} ${stats.currency}`} />
              <StatCard label="Contracts" value={String(contracts.length)} />
            </div>

            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold tracking-tight">Contracts</h2>
                <Button size="sm" onClick={() => setNewOpen(true)}>
                  <Plus className="h-4 w-4 mr-1" /> New Contract
                </Button>
              </div>

              {contracts.length === 0 ? (
                <Card>
                  <CardContent className="pt-8 pb-8 flex flex-col items-center text-center space-y-2">
                    <div className="rounded-full bg-muted p-3">
                      <FileSignature className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="text-sm font-medium">No contracts recorded</div>
                    <p className="text-xs text-muted-foreground max-w-xs">
                      Record an agreement to start tracking what you are owed and what triggers it.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {contracts.map((c) => <ContractCard key={c.id} contract={c} />)}
                </div>
              )}
            </section>
          </TabsContent>

          <TabsContent value="log" className="mt-6">
            <Card>
              <CardContent className="pt-10 pb-10 flex flex-col items-center text-center space-y-3">
                <div className="rounded-full bg-muted p-3">
                  <FileText className="h-6 w-6 text-muted-foreground" />
                </div>
                <div className="text-sm font-medium">No work logged yet</div>
                <p className="text-xs text-muted-foreground max-w-xs">
                  Logging contributions will be available soon.
                </p>
                <Button disabled size="sm">Log a contribution</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {user && (
        <NewContractDialog
          open={newOpen}
          onOpenChange={setNewOpen}
          onCreated={() => loadContracts(user.id)}
        />
      )}

      {user && profile.contributor_id && (
        <SharePassportDialog
          open={shareOpen}
          onOpenChange={setShareOpen}
          contributorId={profile.contributor_id}
          userId={user.id}
          initialPrivacy={{
            passport_visible: profile.passport_visible,
            show_amounts: profile.show_amounts,
            show_counterparties: profile.show_counterparties,
            show_contracts: profile.show_contracts,
          }}
          onPrivacyChange={(p) => setProfile((prev) => prev ? { ...prev, ...p } : prev)}
        />
      )}
    </div>
  );
};

export default Index;
