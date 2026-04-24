import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useDemo } from "@/contexts/DemoContext";
import { DemoPassportView } from "@/components/demo/DemoPassportView";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

type Stats = {
  contracts: number;
  executions: number;
  settledTotal: number;
  pendingTotal: number;
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

  if (profile) return <DemoPassportView profile={profile} />;

  return (
    <div style={{ padding: "32px 24px", maxWidth: 920, margin: "0 auto" }}>
      <h2 style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: 28, fontWeight: 600, margin: "0 0 12px" }}>
        Your Passport
      </h2>
      <p style={{ fontFamily: "'DM Sans',system-ui,sans-serif", fontSize: 14, color: "#5C5248", lineHeight: 1.7, margin: "0 0 20px", maxWidth: 560 }}>
        Totals roll up from your executions. <Link to="/log-work" style={{ color: "#C4892A", textDecoration: "underline" }}>Log work</Link> to add to them.
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat label="Contracts" value={String(stats?.contracts ?? 0)} />
        <Stat label="Executions" value={String(stats?.executions ?? 0)} />
        <Stat label="Settled" value={stats?.settledTotal ? stats.settledTotal.toLocaleString() : "—"} />
        <Stat label="Pending" value={stats?.pendingTotal ? stats.pendingTotal.toLocaleString() : "—"} />
      </div>
    </div>
  );
};

export default Dashboard;
