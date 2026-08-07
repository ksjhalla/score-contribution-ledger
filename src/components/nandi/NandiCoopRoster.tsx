import { useMemo, useState } from "react";

export type CoopFarmer = {
  id: string;
  name: string;
  initials: string;
  note: string | null;
  sort_order: number;
};

export type CoopContribution = {
  id: string;
  label: string;
  occurred_on: string;
  amount_ksh: number;
  status: string;
  proof_note: string | null;
  farmer_id: string | null;
};

const ksh = (n: number) => `KSh ${Math.round(n).toLocaleString("en-KE")}`;

const typeOf = (label: string) =>
  label.split("·")[0].trim() || "Other";

const btn = (activeState: boolean): React.CSSProperties => ({
  fontFamily: "'DM Mono',ui-monospace,monospace",
  fontSize: 10,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  padding: "6px 10px",
  borderRadius: 5,
  cursor: "pointer",
  border: `1px solid ${activeState ? "rgba(92,122,58,.5)" : "rgba(26,22,14,.12)"}`,
  background: activeState ? "rgba(92,122,58,.10)" : "#fff",
  color: activeState ? "#5C7A3A" : "#9A8F84",
});

const ContribRows = ({ rows }: { rows: CoopContribution[] }) => (
  <div className="scroll">
    <table>
      <thead>
        <tr><th>Contribution</th><th>Date</th><th>Amount</th><th>Status</th><th>Proof</th></tr>
      </thead>
      <tbody>
        {rows.map((c) => (
          <tr key={c.id}>
            <td>{c.label}</td>
            <td className="mono">{c.occurred_on}</td>
            <td className={`mono ${c.status === "Received" ? "green" : "amber"}`}>{ksh(Number(c.amount_ksh))}</td>
            <td>{c.status}</td>
            <td>{c.proof_note}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export const NandiCoopRoster = ({
  farmers,
  contributions,
}: {
  farmers: CoopFarmer[];
  contributions: CoopContribution[];
}) => {
  const [mode, setMode] = useState<"farmer" | "transactions">("farmer");
  const [grouping, setGrouping] = useState<"chronological" | "type">("chronological");
  const [openFarmer, setOpenFarmer] = useState<string | null>(null);

  const byFarmer = useMemo(() => {
    const rows = farmers.map((f) => {
      const mine = contributions.filter((c) => c.farmer_id === f.id);
      const sum = (s: string) =>
        mine.filter((c) => c.status === s).reduce((a, c) => a + Number(c.amount_ksh), 0);
      const latest = mine.map((c) => c.occurred_on).sort().slice(-1)[0] ?? null;
      return { farmer: f, entries: mine, received: sum("Received"), pending: sum("Pending"), latest };
    });
    return rows.sort((a, b) => b.received - a.received);
  }, [farmers, contributions]);

  const chronological = useMemo(
    () => [...contributions].sort((a, b) => (a.occurred_on < b.occurred_on ? 1 : -1)),
    [contributions],
  );

  const grouped = useMemo(() => {
    const map = new Map<string, CoopContribution[]>();
    for (const c of chronological) {
      const k = typeOf(c.label);
      map.set(k, [...(map.get(k) ?? []), c]);
    }
    return [...map.entries()].map(([type, rows]) => ({
      type,
      rows,
      subtotal: rows.reduce((a, c) => a + Number(c.amount_ksh), 0),
    }));
  }, [chronological]);

  const nameOf = (id: string | null) => farmers.find((f) => f.id === id)?.name ?? "—";

  return (
    <div>
      <h4 className="sub">Membership roster · {farmers.length} farmers tracked</h4>
      <p className="body">
        Every contribution recorded against the individual member who made it. Aggregates below are computed from the
        tracked records, not extrapolated.
      </p>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "10px 0 14px" }}>
        <button type="button" style={btn(mode === "farmer")} onClick={() => setMode("farmer")}>
          By farmer
        </button>
        <button type="button" style={btn(mode === "transactions")} onClick={() => setMode("transactions")}>
          All transactions
        </button>
        {mode === "transactions" && (
          <>
            <div style={{ width: 1, background: "rgba(26,22,14,.12)", margin: "2px 4px" }} />
            <button
              type="button"
              style={btn(grouping === "chronological")}
              onClick={() => setGrouping("chronological")}
            >
              Newest first
            </button>
            <button type="button" style={btn(grouping === "type")} onClick={() => setGrouping("type")}>
              By type
            </button>
          </>
        )}
      </div>

      {mode === "farmer" && (
        <div className="scroll">
          <table>
            <thead>
              <tr><th>Farmer</th><th>Received</th><th>Pending</th><th>Most recent delivery</th><th>Entries</th></tr>
            </thead>
            <tbody>
              {byFarmer.map(({ farmer, entries, received, pending, latest }) => {
                const open = openFarmer === farmer.id;
                return [
                  <tr
                    key={farmer.id}
                    onClick={() => setOpenFarmer(open ? null : farmer.id)}
                    style={{ cursor: "pointer", background: open ? "rgba(92,122,58,.05)" : undefined }}
                  >
                    <td>
                      <span className="mono" style={{ color: "#5C7A3A", marginRight: 8 }}>{open ? "▾" : "▸"}</span>
                      <strong style={{ color: "#1A1614" }}>{farmer.name}</strong>
                      {farmer.note && (
                        <div className="mono" style={{ fontSize: 9, color: "#9A8F84", marginTop: 2 }}>{farmer.note}</div>
                      )}
                    </td>
                    <td className="mono green">{ksh(received)}</td>
                    <td className="mono amber">{ksh(pending)}</td>
                    <td className="mono">{latest ?? "—"}</td>
                    <td className="mono">{entries.length}</td>
                  </tr>,
                  open ? (
                    <tr key={`${farmer.id}-detail`}>
                      <td colSpan={5} style={{ padding: "6px 10px 14px", background: "rgba(92,122,58,.03)" }}>
                        <ContribRows rows={[...entries].sort((a, b) => (a.occurred_on < b.occurred_on ? 1 : -1))} />
                      </td>
                    </tr>
                  ) : null,
                ];
              })}
            </tbody>
          </table>
        </div>
      )}

      {mode === "transactions" && grouping === "chronological" && (
        <div className="scroll">
          <table>
            <thead>
              <tr><th>Date</th><th>Farmer</th><th>Contribution</th><th>Amount</th><th>Status</th></tr>
            </thead>
            <tbody>
              {chronological.map((c) => (
                <tr key={c.id}>
                  <td className="mono">{c.occurred_on}</td>
                  <td>{nameOf(c.farmer_id)}</td>
                  <td>{c.label}</td>
                  <td className={`mono ${c.status === "Received" ? "green" : "amber"}`}>{ksh(Number(c.amount_ksh))}</td>
                  <td>{c.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {mode === "transactions" && grouping === "type" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {grouped.map((g) => (
            <div key={g.type}>
              <div
                style={{
                  display: "flex", justifyContent: "space-between", gap: 12,
                  fontFamily: "'DM Mono',ui-monospace,monospace", fontSize: 10,
                  textTransform: "uppercase", letterSpacing: "0.07em",
                  color: "#5C7A3A", padding: "0 2px 6px",
                }}
              >
                <span>{g.type} · {g.rows.length} entries</span>
                <span>{ksh(g.subtotal)}</span>
              </div>
              <div className="scroll">
                <table>
                  <thead>
                    <tr><th>Date</th><th>Farmer</th><th>Contribution</th><th>Amount</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                    {g.rows.map((c) => (
                      <tr key={c.id}>
                        <td className="mono">{c.occurred_on}</td>
                        <td>{nameOf(c.farmer_id)}</td>
                        <td>{c.label}</td>
                        <td className={`mono ${c.status === "Received" ? "green" : "amber"}`}>{ksh(Number(c.amount_ksh))}</td>
                        <td>{c.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="note">
        Aisha Ng'etich's record is the pilot's working example. The other four members shown here are illustrative
        demonstration data, not measured farmer records.
      </div>
    </div>
  );
};
