import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ContractCard, type ContractRow } from "@/components/contracts/ContractCard";
import { NewContractDialog } from "@/components/contracts/NewContractDialog";
import { ChevronDown, ChevronRight, Plus } from "lucide-react";

type ContractWithRef = ContractRow & { reference: string | null };

const isAdHoc = (c: ContractWithRef) =>
  c.name === "Ad-hoc reference" && c.counterparty_name === "Self-reported";

const stakeChip: Record<ContractRow["stake_type"], { bg: string; fg: string }> = {
  Financial: { bg: "rgba(196,137,42,0.10)", fg: "#8B5E1A" },
  Attribution: { bg: "rgba(42,92,138,0.10)", fg: "#2A5C8A" },
  Governance: { bg: "rgba(42,106,69,0.10)", fg: "#2A6A45" },
  Mixed: { bg: "rgba(154,143,132,0.18)", fg: "#5C5248" },
};

const Contracts = () => {
  const { user } = useAuth();
  const [rows, setRows] = useState<ContractWithRef[]>([]);
  const [loading, setLoading] = useState(true);
  const [sector, setSector] = useState<string | null>(null);
  const [newOpen, setNewOpen] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("contracts")
      .select("id, name, counterparty_name, counterparty_type, stake_type, contract_type, attestation_required, reference")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setRows((data ?? []) as ContractWithRef[]);
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("sector").eq("id", user.id).maybeSingle()
      .then(({ data }) => setSector(data?.sector ?? null));
  }, [user]);

  const toggle = (id: string) => setExpanded((p) => ({ ...p, [id]: !p[id] }));

  const handleCreated = async () => {
    await load();
    // expand the newest contract
    const { data } = await supabase
      .from("contracts")
      .select("id")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (data?.id) setExpanded((p) => ({ ...p, [data.id]: true }));
  };

  return (
    <div style={{ padding: "32px 24px", maxWidth: 920, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, marginBottom: 20 }}>
        <div>
          <h2 style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: 28, fontWeight: 600, margin: "0 0 12px" }}>
            Contracts
          </h2>
          <p style={{ fontFamily: "'DM Sans',system-ui,sans-serif", fontSize: 14, color: "#5C5248", lineHeight: 1.7, margin: 0, maxWidth: 560 }}>
            Each contract you've added or referenced. Ad-hoc references created from Log Work appear with a needs-review tag.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setNewOpen(true)}
          style={{
            background: "#1A1614", color: "#F5F1E8",
            fontFamily: "'DM Sans',system-ui,sans-serif", fontSize: 13, fontWeight: 500,
            border: "none", borderRadius: 4, padding: "9px 14px", cursor: "pointer",
            display: "inline-flex", alignItems: "center", gap: 6, whiteSpace: "nowrap",
          }}
        >
          <Plus size={14} /> New contract
        </button>
      </div>
      {loading ? (
        <p style={{ fontFamily: "'DM Mono',ui-monospace,monospace", fontSize: 11, color: "#9A8F84" }}>Loading…</p>
      ) : rows.length === 0 ? (
        <div style={{ border: "1px dashed rgba(26,22,14,0.15)", borderRadius: 6, padding: 24, textAlign: "center", fontFamily: "'DM Sans',system-ui,sans-serif", fontSize: 13, color: "#5C5248" }}>
          No contracts yet. Add one or log work with an ad-hoc reference.
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((c) => {
            const adHoc = isAdHoc(c);
            const isOpen = !!expanded[c.id];
            const chip = stakeChip[c.stake_type];
            return (
              <div
                key={c.id}
                style={{
                  borderLeft: adHoc ? "2px solid #9A8F84" : undefined,
                  paddingLeft: adHoc ? 8 : 0,
                }}
              >
                <div style={{
                  border: "1px solid rgba(26,22,14,0.10)", borderRadius: 6,
                  background: "#FDFAF4", overflow: "hidden",
                }}>
                  <button
                    type="button"
                    onClick={() => toggle(c.id)}
                    style={{
                      width: "100%", textAlign: "left", background: "transparent", border: "none",
                      padding: "14px 16px", cursor: "pointer",
                      display: "flex", alignItems: "center", gap: 12,
                    }}
                  >
                    <span style={{ color: "#9A8F84", display: "inline-flex" }}>
                      {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </span>
                    <span style={{
                      background: chip.bg, color: chip.fg,
                      fontFamily: "'DM Mono',ui-monospace,monospace", fontSize: 9,
                      padding: "2px 7px", borderRadius: 3, whiteSpace: "nowrap",
                    }}>
                      {c.stake_type}
                    </span>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontFamily: "'DM Sans',system-ui,sans-serif", fontSize: 13, fontWeight: 600, color: "#1A1614", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {c.name}
                      </div>
                      <div style={{ fontFamily: "'DM Mono',ui-monospace,monospace", fontSize: 10, color: "#9A8F84", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {c.counterparty_name}
                        {adHoc && <> · <span style={{ textTransform: "uppercase", letterSpacing: "0.06em" }}>Ad-hoc · needs review</span></>}
                      </div>
                    </div>
                  </button>
                  {isOpen && (
                    <div style={{ borderTop: "1px solid rgba(26,22,14,0.08)", padding: "8px 8px 12px" }}>
                      <ContractCard contract={c} />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <NewContractDialog
        open={newOpen}
        onOpenChange={setNewOpen}
        onCreated={handleCreated}
        sector={sector}
      />
    </div>
  );
};

export default Contracts;
