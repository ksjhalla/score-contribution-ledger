import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ContractCard, type ContractRow } from "@/components/contracts/ContractCard";

type ContractWithRef = ContractRow & { reference: string | null };

const isAdHoc = (c: ContractWithRef) =>
  c.name === "Ad-hoc reference" && c.counterparty_name === "Self-reported";

const Contracts = () => {
  const { user } = useAuth();
  const [rows, setRows] = useState<ContractWithRef[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div style={{ padding: "32px 24px", maxWidth: 920, margin: "0 auto" }}>
      <h2 style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: 28, fontWeight: 600, margin: "0 0 12px" }}>
        Contracts
      </h2>
      <p style={{ fontFamily: "'DM Sans',system-ui,sans-serif", fontSize: 14, color: "#5C5248", lineHeight: 1.7, margin: "0 0 20px", maxWidth: 560 }}>
        Each contract you've added or referenced. Ad-hoc references created from Log Work appear with a needs-review tag.
      </p>
      {loading ? (
        <p style={{ fontFamily: "'DM Mono',ui-monospace,monospace", fontSize: 11, color: "#9A8F84" }}>Loading…</p>
      ) : rows.length === 0 ? (
        <div style={{ border: "1px dashed rgba(26,22,14,0.15)", borderRadius: 6, padding: 24, textAlign: "center", fontFamily: "'DM Sans',system-ui,sans-serif", fontSize: 13, color: "#5C5248" }}>
          No contracts yet. Add one or log work with an ad-hoc reference.
        </div>
      ) : (
        <div className="space-y-4">
          {rows.map((c) => {
            const adHoc = isAdHoc(c);
            return (
              <div
                key={c.id}
                style={adHoc ? { borderLeft: "2px solid #9A8F84", paddingLeft: 8 } : undefined}
              >
                {adHoc && (
                  <div style={{
                    fontFamily: "'DM Mono',ui-monospace,monospace", fontSize: 9, color: "#9A8F84",
                    textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6,
                  }}>
                    Ad-hoc · needs review{c.reference ? ` · ${c.reference.slice(0, 60)}` : ""}
                  </div>
                )}
                <ContractCard contract={c} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Contracts;
