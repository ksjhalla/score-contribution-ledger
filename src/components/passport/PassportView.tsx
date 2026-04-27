import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";

export type PassportData = {
  contributor_id: string;
  full_name: string | null;
  professional_role: string | null;
  sector: string | null;
  show_amounts: boolean;
  show_counterparties: boolean;
  show_contracts: boolean;
  first_shared_at: string | null;
  summary: {
    contracts: number;
    executions: number;
    attributed_value: number | null;
    currency: string;
    work_entries?: number;
    work_pending?: number;
    work_settled?: number;
    work_settled_value?: number | null;
  };
  contracts: Array<{
    id: string;
    name: string | null;
    stake_type: "Financial" | "Attribution" | "Governance" | "Mixed";
    counterparty_name: string | null;
    execution_count: number;
    settled_count: number;
    pending_count: number;
  }>;
};

const stakeStyles: Record<PassportData["contracts"][number]["stake_type"], string> = {
  Financial: "bg-amber-100 text-amber-900 border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30",
  Attribution: "bg-blue-100 text-blue-900 border-blue-200 dark:bg-blue-500/15 dark:text-blue-300 dark:border-blue-500/30",
  Governance: "bg-green-100 text-green-900 border-green-200 dark:bg-green-500/15 dark:text-green-300 dark:border-green-500/30",
  Mixed: "bg-gray-100 text-gray-900 border-gray-200 dark:bg-gray-500/15 dark:text-gray-300 dark:border-gray-500/30",
};

const Stat = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-md border p-3">
    <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
    <div className="text-lg font-semibold mt-1">{value}</div>
  </div>
);

const statusOf = (c: PassportData["contracts"][number]) => {
  if (c.settled_count > 0) return "Received";
  if (c.pending_count > 0) return "Pending";
  if (c.execution_count > 0) return "Logged";
  return "Recorded";
};

export const PassportView = ({ data }: { data: PassportData }) => {
  const value =
    data.summary.attributed_value == null
      ? "—"
      : `${Number(data.summary.attributed_value).toLocaleString()} ${data.summary.currency}`;
  const workSettledValue =
    data.summary.work_settled_value == null
      ? "—"
      : `${Number(data.summary.work_settled_value).toLocaleString()} ${data.summary.currency}`;
  const hasWorkEntries = (data.summary.work_entries ?? 0) > 0;
  const isPassportEmpty =
    data.summary.contracts === 0 &&
    data.summary.executions === 0 &&
    (data.summary.attributed_value == null || Number(data.summary.attributed_value) === 0) &&
    !hasWorkEntries;

  return (
    <article id="passport-printable" className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">SCORE</h1>
          <p className="text-xs text-muted-foreground">Contribution Passport</p>
        </div>
        <Badge variant="outline" className="font-mono text-xs">
          {data.contributor_id}
        </Badge>
      </header>

      <Card>
        <CardContent className="pt-6 space-y-1">
          <div className="text-2xl font-semibold tracking-tight">{data.full_name}</div>
          <div className="text-sm text-muted-foreground">
            {[data.professional_role, data.sector].filter(Boolean).join(" · ")}
          </div>
        </CardContent>
      </Card>

      <section className="grid grid-cols-3 gap-3">
        <Stat label="Contracts" value={String(data.summary.contracts)} />
        <Stat label="Executions" value={String(data.summary.executions)} />
        <Stat label="Attributed value" value={value} />
      </section>

      {isPassportEmpty && (
        <div
          style={{
            border: "1px solid rgba(26,22,14,0.10)",
            borderRadius: 6,
            padding: "16px 20px",
            background: "#FDFAF4",
          }}
        >
          <p
            style={{
              fontFamily: "'DM Sans', system-ui, sans-serif",
              fontSize: 13,
              color: "#5C5248",
              lineHeight: 1.7,
              margin: 0,
            }}
          >
            Your attributed total updates automatically when you confirm a payment received. Start by adding a contract, logging your first contribution, and confirming the trigger was met.
          </p>
          <div
            className="mt-3 flex flex-wrap gap-x-5 gap-y-2"
            style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: 13 }}
          >
            <Link to="/" style={{ color: "#C4892A", textDecoration: "underline" }}>
              Add a contract →
            </Link>
            <Link to="/log-work" style={{ color: "#C4892A", textDecoration: "underline" }}>
              Log an execution →
            </Link>
            <a href="/#cta" style={{ color: "#C4892A", textDecoration: "underline" }}>
              Request a demo →
            </a>
          </div>
        </div>
      )}

      {hasWorkEntries && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold tracking-tight">Logged work</h2>
          <div className="grid grid-cols-3 gap-3">
            <Stat label="Pending" value={String(data.summary.work_pending ?? 0)} />
            <Stat label="Received" value={String(data.summary.work_settled ?? 0)} />
            <Stat label="Received value" value={workSettledValue} />
          </div>
        </section>
      )}

      <section className="space-y-2">
        <h2 className="text-sm font-semibold tracking-tight">Contracts</h2>
        {data.contracts.length === 0 ? (
          <Card>
            <CardContent className="pt-6 pb-6 text-center text-xs text-muted-foreground">
              No contracts on this passport yet.
            </CardContent>
          </Card>
        ) : (
          <ul className="space-y-2">
            {data.contracts.map((c) => (
              <li key={c.id} className="rounded-md border p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">
                      {c.name ?? <span className="text-muted-foreground italic">Confidential</span>}
                    </div>
                    <div className="text-[11px] text-muted-foreground truncate">
                      {c.counterparty_name ?? "—"}
                    </div>
                  </div>
                  <Badge variant="outline" className={stakeStyles[c.stake_type]}>
                    {c.stake_type}
                  </Badge>
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>{c.execution_count} execution{c.execution_count === 1 ? "" : "s"}</span>
                  <span>{statusOf(c)}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <footer className="pt-4 border-t space-y-1.5 text-xs text-muted-foreground">
        <div className="inline-flex items-center gap-1.5 text-foreground">
          <ShieldCheck className="h-3.5 w-3.5 text-primary" />
          <span className="font-medium">Verified by SCORE</span>
          <span className="font-mono ml-1">{data.contributor_id}</span>
        </div>
        {data.first_shared_at && (
          <div>Passport first created {new Date(data.first_shared_at).toLocaleDateString()}.</div>
        )}
        <p className="pt-1">
          This record is bound to your Contributor ID. It is independent of any employer, organisation, or platform.
        </p>
      </footer>
    </article>
  );
};