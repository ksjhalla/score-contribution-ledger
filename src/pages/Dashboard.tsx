import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDemo } from "@/contexts/DemoContext";
import { DemoPassportView } from "@/components/demo/DemoPassportView";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { SharePassportDialog } from "@/components/passport/SharePassportDialog";
import { ValueEventCard, type ValueEventCardProps } from "@/components/value-events/ValueEventCard";
import { AttachEvidenceDialog } from "@/components/contracts/AttachEvidenceDialog";
import { ValueMixDonut } from "@/components/charts/ValueMixDonut";
import { ContractSparkBars, type SparkContract } from "@/components/charts/ContractSparkBars";
import { toast } from "sonner";

type Stats = {
  contracts: number;
  executions: number;
  settledTotal: number;
  pendingTotal: number;
};

type ChartData = {
  settled: number;
  pending: number;
  currency: string;
  bars: SparkContract[];
  hasExecutions: boolean;
};

type Profile = {
  contributor_id: string | null;
  passport_visible: boolean;
  show_amounts: boolean;
  show_counterparties: boolean;
  show_contracts: boolean;
};

type RecentExecution = {
  id: string;
  contract_id: string;
  title: string;
  status: "Pending" | "Settled" | "Intent logged" | "Attested" | "Declined";
  trigger_met: boolean;
  settled_amount: number | null;
  currency: string;
  updated_at: string;
  confidence: "High" | "Medium" | "Low" | null;
  resolver_description: string | null;
  expected_resolution: string | null;
  evidence_ids: string[];
  contract_name: string | null;
  trigger_description: string | null;
  attestation_required: boolean;
};

const currencySymbol = (c: string) => (c === "ZAR" ? "R" : c === "USD" ? "$" : c === "EUR" ? "€" : c === "GBP" ? "£" : "");
const formatMoney = (n: number, currency: string) => `${currencySymbol(currency)}${Math.round(n).toLocaleString()}`;

const Stat = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-md border p-3">
    <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
    <div className="text-lg font-semibold mt-1">{value}</div>
  </div>
);

const StatSkeleton = () => (
  <div className="rounded-md border p-3">
    <span className="skeleton" style={{ width: 56, height: 8 }} />
    <span className="skeleton" style={{ width: 44, height: 16, marginTop: 8 }} />
  </div>
);

const Dashboard = () => {
  const { profile } = useDemo();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats | null>(null);
  const [me, setMe] = useState<Profile | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [recent, setRecent] = useState<RecentExecution[]>([]);
  const [attachFor, setAttachFor] = useState<RecentExecution | null>(null);
  const [chart, setChart] = useState<ChartData | null>(null);

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
      const { data: execs } = await supabase
        .from("executions")
        .select("contract_id, status, trigger_met, settled_amount, currency")
        .eq("user_id", user.id);
      const rows = execs ?? [];
      if (!rows.length) {
        setChart({ settled: 0, pending: 0, currency: "USD", bars: [], hasExecutions: false });
        return;
      }
      const { data: contractRows } = await supabase
        .from("contracts")
        .select("id, name")
        .eq("user_id", user.id);
      const contractMap = new Map((contractRows ?? []).map((c) => [c.id, c.name]));

      const { data: evRows } = await supabase
        .from("evidence")
        .select("contract_id")
        .eq("user_id", user.id);
      const evidenceCount = new Map<string, number>();
      for (const e of evRows ?? []) {
        evidenceCount.set(e.contract_id, (evidenceCount.get(e.contract_id) ?? 0) + 1);
      }

      let settled = 0, pending = 0;
      const currencyTally = new Map<string, number>();
      const byContract = new Map<string, { value: number; settled: boolean; pending: boolean }>();
      for (const r of rows) {
        const amt = Number(r.settled_amount ?? 0);
        currencyTally.set(r.currency, (currencyTally.get(r.currency) ?? 0) + 1);
        if (r.status === "Settled") settled += amt;
        else if (r.status === "Pending" && r.trigger_met) pending += amt;
        const e = byContract.get(r.contract_id) ?? { value: 0, settled: false, pending: false };
        e.value += amt;
        if (r.status === "Settled") e.settled = true;
        else if (r.status === "Pending") e.pending = true;
        byContract.set(r.contract_id, e);
      }
      const currency = [...currencyTally.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "USD";
      const bars: SparkContract[] = [...byContract.entries()].map(([cid, v]) => {
        const name = contractMap.get(cid) ?? "Contract";
        const label = name.length > 8 ? `${name.slice(0, 8)}…` : name;
        const status: SparkContract["status"] = v.settled ? "settled" : v.pending ? "pending" : "attributed";
        return { label, value: v.value, status, evidence_count: evidenceCount.get(cid) ?? 0 };
      });
      setChart({ settled, pending, currency, bars, hasExecutions: true });
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

  useEffect(() => {
    if (!user || profile) return;
    (async () => {
      const { data } = await supabase
        .from("executions")
        .select("id, contract_id, title, status, trigger_met, settled_amount, currency, updated_at, confidence, resolver_description, expected_resolution, evidence_ids, contracts:contract_id ( name, trigger_description, attestation_required )")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(5);
      const rows = (data ?? []).map((r) => {
        const c = (r as { contracts: { name: string; trigger_description: string | null; attestation_required: boolean } | null }).contracts;
        return {
          id: r.id,
          contract_id: r.contract_id,
          title: r.title,
          status: r.status as RecentExecution["status"],
          trigger_met: r.trigger_met,
          settled_amount: r.settled_amount,
          currency: r.currency,
          updated_at: r.updated_at,
          confidence: (r.confidence as RecentExecution["confidence"]) ?? null,
          resolver_description: r.resolver_description ?? null,
          expected_resolution: r.expected_resolution ?? null,
          evidence_ids: (r.evidence_ids as string[] | null) ?? [],
          contract_name: c?.name ?? null,
          trigger_description: c?.trigger_description ?? null,
          attestation_required: c?.attestation_required ?? false,
        } as RecentExecution;
      });
      setRecent(rows);
    })();
  }, [user, profile]);

  const cards: (ValueEventCardProps & { key: string; contractId: string; executionId: string; row: RecentExecution })[] = useMemo(() => {
    return recent.slice(0, 3).map((e) => {
      const amount = e.settled_amount != null ? Number(e.settled_amount) : null;
      let status: ValueEventCardProps["status"];
      let headline = "";
      let subheadline = "";
      const cName = e.contract_name ?? "this contract";
      if (e.status === "Settled") {
        status = "Resolved";
        headline = amount != null ? `${formatMoney(amount, e.currency)} received` : "received";
        subheadline = `${cName} payout was recorded and settled.`;
      } else if (e.status === "Pending" && e.trigger_met) {
        status = "Under review";
        headline = amount != null ? `${formatMoney(amount, e.currency)} on the way` : "on the way";
        subheadline = `${cName} trigger confirmed. Awaiting settlement.`;
      } else if (e.status === "Intent logged") {
        status = "Watching";
        headline = amount != null ? `${formatMoney(amount, e.currency)} possible` : "possible";
        subheadline = `Work logged for ${cName}. Trigger not yet met.`;
      } else {
        status = "Pending";
        headline = e.title;
        subheadline = `${cName}.`;
      }
      return {
        key: e.id,
        contractId: e.contract_id,
        executionId: e.id,
        row: e,
        amount,
        currency: e.currency,
        headline,
        subheadline,
        status,
        confidence: e.confidence,
        trigger: e.trigger_description ?? undefined,
        resolver: e.resolver_description ?? undefined,
        evidence_count: e.evidence_ids.length,
        expected_resolution: e.expected_resolution ?? undefined,
        attestationEnabled: e.attestation_required,
      };
    });
  }, [recent]);

  if (profile) return <DemoPassportView profile={profile} />;

  return (
    <div className="px-4 sm:px-6 py-6 sm:py-8" style={{ maxWidth: 920, margin: "0 auto" }}>
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
        {stats === null ? (
          <>
            <StatSkeleton /><StatSkeleton /><StatSkeleton /><StatSkeleton />
          </>
        ) : (
          <>
            <Stat label="Contracts" value={String(stats.contracts)} />
            <Stat label="Executions" value={String(stats.executions)} />
            <Stat label="Settled" value={stats.settledTotal ? stats.settledTotal.toLocaleString() : "—"} />
            <Stat label="Pending" value={stats.pendingTotal ? stats.pendingTotal.toLocaleString() : "—"} />
          </>
        )}
      </div>

      {chart?.hasExecutions && (
        <div
          className="grid grid-cols-1 md:grid-cols-2 gap-3.5"
          style={{ marginTop: 24 }}
        >
          <div style={{ border: "1px solid rgba(26,22,14,0.10)", borderRadius: 6, background: "#FDFAF4", padding: "14px 16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <span style={{ fontFamily: "'DM Mono',ui-monospace,monospace", fontSize: 9, color: "#9A8F84", textTransform: "uppercase", letterSpacing: "0.06em" }}>Value mix</span>
            </div>
            <ValueMixDonut settled={chart.settled} pending={chart.pending} future={0} currency={chart.currency} label="Attributed value" />
          </div>
          {chart.bars.length > 0 && (
            <div style={{ border: "1px solid rgba(26,22,14,0.10)", borderRadius: 6, background: "#FDFAF4", padding: "14px 16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <span style={{ fontFamily: "'DM Mono',ui-monospace,monospace", fontSize: 9, color: "#9A8F84", textTransform: "uppercase", letterSpacing: "0.06em" }}>By contract</span>
                <span style={{ fontFamily: "'DM Mono',ui-monospace,monospace", fontSize: 9, color: "#2A6A45", background: "rgba(42,106,69,0.08)", padding: "2px 6px", borderRadius: 3 }}>{chart.bars.length} tracked</span>
              </div>
              <ContractSparkBars contracts={chart.bars} currency={chart.currency} />
            </div>
          )}
        </div>
      )}

      <section style={{ marginTop: 28 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
          <h3 style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: 20, fontWeight: 600, margin: 0, color: "#1A1614" }}>
            What changed
          </h3>
          <Link to="/log-work" style={{ fontFamily: "'DM Mono',ui-monospace,monospace", fontSize: 9, color: "#C4892A", textDecoration: "none" }}>
            View all →
          </Link>
        </div>
        {cards.length === 0 ? (
          <div style={{ border: "1px dashed rgba(26,22,14,0.15)", borderRadius: 6, padding: "40px 24px 24px", textAlign: "center" }}>
            <div style={{ fontFamily: "'DM Sans',system-ui,sans-serif", fontSize: 13, fontWeight: 500, color: "#5C5248" }}>
              Nothing to show yet.
            </div>
            <p style={{ fontFamily: "'DM Sans',system-ui,sans-serif", fontSize: 12, color: "#9A8F84", margin: "4px 0 12px" }}>
              Log your first contribution to see what changed here.
            </p>
            <Link
              to="/log-work"
              style={{ fontFamily: "'DM Mono',ui-monospace,monospace", fontSize: 10, color: "#C4892A", textDecoration: "none" }}
            >
              Log work →
            </Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {cards.map((c) => (
              <ValueEventCard
                key={c.key}
                amount={c.amount}
                currency={c.currency}
                headline={c.headline}
                subheadline={c.subheadline}
                status={c.status}
                confidence={c.confidence}
                trigger={c.trigger}
                resolver={c.resolver}
                evidence_count={c.evidence_count}
                expected_resolution={c.expected_resolution}
                attestationEnabled={c.attestationEnabled}
                onViewDetails={() => navigate("/contracts")}
                onAddEvidence={() => setAttachFor(c.row)}
                onRequestConfirmation={
                  c.attestationEnabled
                    ? () => toast.info("Open this execution in Contracts to request confirmation.")
                    : undefined
                }
              />
            ))}
          </div>
        )}
      </section>

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

      {attachFor && (
        <AttachEvidenceDialog
          open={!!attachFor}
          onOpenChange={(v) => !v && setAttachFor(null)}
          contractId={attachFor.contract_id}
          executionId={attachFor.id}
          executionTitle={attachFor.title}
          onCreated={() => setAttachFor(null)}
        />
      )}
    </div>
  );
};

export default Dashboard;
