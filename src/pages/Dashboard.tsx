import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useDemo } from "@/contexts/DemoContext";
import { DemoPassportView } from "@/components/demo/DemoPassportView";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { SharePassportDialog } from "@/components/passport/SharePassportDialog";

type Stats = {
  contracts: number;
  executions: number;
  settledTotal: number;
  pendingTotal: number;
};

type Profile = {
  contributor_id: string | null;
  passport_visible: boolean;
  show_amounts: boolean;
  show_counterparties: boolean;
  show_contracts: boolean;
};

const Stat = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-md border p-3">
    <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
    <div className="text-lg font-semibold mt-1">{value}</div>
  </div>
);

const Dashboard = () => {
  const { profile } = useDemo();
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [me, setMe] = useState<Profile | null>(null);
  const [shareOpen, setShareOpen] = useState(false);

  useEffect(() => {
    if (!user || profile) return;
    (async () => {
      const { data } = await supabase
        .from("executions")
        .select("contract_id, status, trigger_met, settled_amount")
        .eq("user_id", user.id);
      const rows = data ?? [];
      const contractIds = new Set<string>();
      let settledTotal = 0, pendingTotal = 0;
      for (const r of rows) {
        contractIds.add(r.contract_id);
        if (r.status === "Settled") settledTotal += Number(r.settled_amount ?? 0);
        else if (r.status === "Pending" && r.trigger_met) pendingTotal += Number(r.settled_amount ?? 0);
      }
      setStats({
        contracts: contractIds.size,
        executions: rows.length,
        settledTotal,
        pendingTotal,
      });
    })();
  }, [user, profile]);

  useEffect(() => {
    if (!user || profile) return;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("contributor_id, passport_visible, show_amounts, show_counterparties, show_contracts")
        .eq("id", user.id)
        .maybeSingle();
      if (data) setMe(data as Profile);
    })();
  }, [user, profile]);

  if (profile) return <DemoPassportView profile={profile} />;

  return (
    <div style={{ padding: "32px 24px", maxWidth: 920, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, marginBottom: 12 }}>
        <h2 style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: 28, fontWeight: 600, margin: 0 }}>
          Your Passport
        </h2>
        {me?.contributor_id && (
          <button
            type="button"
            onClick={() => setShareOpen(true)}
            style={{
              border: "1px solid rgba(26,22,14,0.15)", background: "#FDFAF4", color: "#C4892A",
              fontFamily: "'DM Mono',ui-monospace,monospace", fontSize: 10, fontWeight: 600,
              borderRadius: 4, padding: "7px 14px", cursor: "pointer", whiteSpace: "nowrap",
            }}
          >
            Share Passport →
          </button>
        )}
      </div>
      <p style={{ fontFamily: "'DM Sans',system-ui,sans-serif", fontSize: 14, color: "#5C5248", lineHeight: 1.7, margin: "0 0 20px", maxWidth: 560 }}>
        Totals roll up from your executions. <Link to="/log-work" style={{ color: "#C4892A", textDecoration: "underline" }}>Log work</Link> to add to them.
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat label="Contracts" value={String(stats?.contracts ?? 0)} />
        <Stat label="Executions" value={String(stats?.executions ?? 0)} />
        <Stat label="Settled" value={stats?.settledTotal ? stats.settledTotal.toLocaleString() : "—"} />
        <Stat label="Pending" value={stats?.pendingTotal ? stats.pendingTotal.toLocaleString() : "—"} />
      </div>

      {me?.contributor_id && user && (
        <SharePassportDialog
          open={shareOpen}
          onOpenChange={setShareOpen}
          contributorId={me.contributor_id}
          userId={user.id}
          initialPrivacy={{
            passport_visible: me.passport_visible,
            show_amounts: me.show_amounts,
            show_counterparties: me.show_counterparties,
            show_contracts: me.show_contracts,
          }}
          onPrivacyChange={(p) => setMe((prev) => (prev ? { ...prev, ...p } : prev))}
        />
      )}
    </div>
  );
};

export default Dashboard;
