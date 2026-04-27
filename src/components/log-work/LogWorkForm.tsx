import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Copy } from "lucide-react";
import { Link } from "react-router-dom";

type Contract = {
  id: string;
  name: string;
  counterparty_name: string;
  stake_type: "Financial" | "Attribution" | "Governance" | "Mixed";
  trigger_description: string;
};

type WorkType = "Process" | "Code" | "Research" | "Documentation" | "Training" | "Other";
const WORK_TYPES: WorkType[] = ["Process", "Code", "Research", "Documentation", "Training", "Other"];

type EvidenceChip = "Document" | "Photo" | "Dataset" | "Code" | "Reading" | "Other";
const EVIDENCE_CHIPS: EvidenceChip[] = ["Document", "Photo", "Dataset", "Code", "Reading", "Other"];

type SettlementChannel = "Not applicable" | "Bank transfer" | "Stripe" | "Coinbase" | "USDC" | "Other";
const CHANNELS: SettlementChannel[] = ["Not applicable", "Bank transfer", "Stripe", "Coinbase", "USDC", "Other"];

const stakeStyles: Record<Contract["stake_type"], { bg: string; fg: string }> = {
  Financial: { bg: "rgba(196,137,42,0.10)", fg: "#8B5E1A" },
  Attribution: { bg: "rgba(42,92,138,0.10)", fg: "#2A5C8A" },
  Governance: { bg: "rgba(42,106,69,0.10)", fg: "#2A6A45" },
  Mixed: { bg: "rgba(154,143,132,0.18)", fg: "#5C5248" },
};

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated?: () => void;
  initialContractId?: string;
};

const sha256Hex = async (input: string) => {
  const buf = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
};

const todayISO = () => new Date().toISOString().slice(0, 10);

export const LogWorkForm = ({ open, onOpenChange, onCreated, initialContractId }: Props) => {
  const { user } = useAuth();
  const isMobile = useIsMobile();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [contractId, setContractId] = useState<string | null>(initialContractId ?? null);
  const [adHoc, setAdHoc] = useState(false);
  const [adHocRef, setAdHocRef] = useState("");

  const [title, setTitle] = useState("");
  const [workType, setWorkType] = useState<WorkType | null>(null);
  const [description, setDescription] = useState("");
  const [triggerMet, setTriggerMet] = useState(true);

  const [proofRef, setProofRef] = useState("");
  const [proofHash, setProofHash] = useState("");
  const [evidenceTypes, setEvidenceTypes] = useState<EvidenceChip[]>([]);
  const [skipProof, setSkipProof] = useState(false);
  const [channel, setChannel] = useState<SettlementChannel>("Not applicable");

  const [busy, setBusy] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const reset = () => {
    setStep(1);
    setContractId(initialContractId ?? null);
    setAdHoc(false); setAdHocRef("");
    setTitle(""); setWorkType(null); setDescription(""); setTriggerMet(true);
    setProofRef(""); setProofHash(""); setEvidenceTypes([]); setSkipProof(false);
    setChannel("Not applicable"); setBusy(false); setSubmitError(null);
  };

  const close = (v: boolean) => { if (!v) reset(); onOpenChange(v); };

  useEffect(() => {
    if (!open || !user) return;
    (async () => {
      const { data } = await supabase
        .from("contracts")
        .select("id, name, counterparty_name, stake_type, trigger_description")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setContracts((data ?? []) as Contract[]);
    })();
  }, [open, user]);

  useEffect(() => {
    if (!proofRef.trim()) { setProofHash(""); return; }
    let alive = true;
    sha256Hex(proofRef.trim()).then((h) => { if (alive) setProofHash(h); });
    return () => { alive = false; };
  }, [proofRef]);

  const selectedContract = useMemo(
    () => contracts.find((c) => c.id === contractId) ?? null,
    [contracts, contractId],
  );

  const canNext = useMemo(() => {
    if (step === 1) {
      if (adHoc) return adHocRef.trim().length > 0;
      return !!contractId;
    }
    if (step === 2) return title.trim().length > 0 && workType !== null;
    return true;
  }, [step, adHoc, adHocRef, contractId, title, workType]);

  const submit = async () => {
    if (!user) return;
    setBusy(true); setSubmitError(null);

    let useContractId = contractId;
    if (adHoc) {
      const { data: created, error } = await supabase
        .from("contracts")
        .insert({
          user_id: user.id,
          name: "Ad-hoc reference",
          counterparty_name: "Self-reported",
          counterparty_type: "Individual",
          contract_type: "Off-chain",
          stake_type: "Financial",
          entitlement_description: "Ad-hoc — needs review",
          trigger_description: "Ad-hoc — needs review",
          reference: adHocRef.trim(),
        })
        .select("id")
        .maybeSingle();
      if (error || !created) {
        setBusy(false);
        setSubmitError("Something went wrong — your data was not saved. Try again.");
        return;
      }
      useContractId = created.id;
    }

    if (!useContractId) {
      setBusy(false);
      setSubmitError("Please choose a contract first.");
      return;
    }

    const status: "Pending" | "Intent logged" = triggerMet ? "Pending" : "Intent logged";

    const { error } = await supabase.from("executions").insert({
      contract_id: useContractId,
      user_id: user.id,
      title: title.trim(),
      work_description: description.trim() || workType || title.trim(),
      trigger_met: triggerMet,
      status,
      evidence_ids: [],
      settlement_channel: triggerMet && channel !== "Not applicable" ? channel : null,
      settlement_reference: null,
      settled_amount: null,
      currency: "USD",
      execution_date: todayISO(),
      notes: [
        workType ? `Type: ${workType}` : null,
        proofRef.trim() && !skipProof ? `Proof ref: ${proofRef.trim()} (sha256:${proofHash.slice(0, 16)}…)` : null,
        evidenceTypes.length ? `Evidence: ${evidenceTypes.join(", ")}` : null,
        skipProof ? "Logged without proof" : null,
      ].filter(Boolean).join("\n") || null,
    });

    setBusy(false);
    if (error) {
      setSubmitError("Something went wrong — your data was not saved. Try again.");
      return;
    }
    toast.success("Contribution logged.");
    onCreated?.();
    close(false);
  };

  const stepDot = (n: 1 | 2 | 3, label: string) => (
    <span style={{
      fontFamily: "'DM Mono',ui-monospace,monospace", fontSize: 10,
      color: step === n ? "#C4892A" : "#9A8F84",
      fontWeight: step === n ? 600 : 400,
    }}>
      {n} · {label}
    </span>
  );

  const body = (
    <div className="flex flex-col" style={{ maxHeight: isMobile ? "82vh" : "85vh" }}>
      {/* Step indicator */}
      <div style={{
        display: "flex", gap: 12, alignItems: "center",
        padding: "16px 20px",
        borderBottom: "1px solid rgba(26,22,14,0.08)",
      }}>
        {stepDot(1, "Contract")}
        <span style={{ color: "#9A8F84" }}>→</span>
        {stepDot(2, "Work")}
        <span style={{ color: "#9A8F84" }}>→</span>
        {stepDot(3, "Proof")}
      </div>

      {/* Scrollable content */}
      <div style={{ overflowY: "auto", flex: 1, padding: "20px" }}>
        {step === 1 && (
          <div className="space-y-4">
            <h3 style={{ fontFamily: "'Playfair Display',Georgia,serif", fontWeight: 600, fontSize: 18, color: "#1A1614", margin: 0 }}>
              Which contract does this work fall under?
            </h3>

            {contracts.length === 0 && !adHoc ? (
              <div style={{ background: "#FDFAF4", border: "1px solid rgba(26,22,14,0.10)", borderRadius: 5, padding: "16px" }}>
                <p style={{ fontFamily: "'DM Sans',system-ui,sans-serif", fontSize: 13, color: "#5C5248", margin: 0 }}>
                  You haven't added a contract yet.
                </p>
                <Link to="/contracts" onClick={() => close(false)} style={{ display: "inline-block", marginTop: 8, color: "#C4892A", textDecoration: "underline", fontFamily: "'DM Sans',system-ui,sans-serif", fontSize: 13 }}>
                  Add one first →
                </Link>
              </div>
            ) : (
              <ul className="space-y-2">
                {contracts.map((c) => {
                  const selected = !adHoc && contractId === c.id;
                  const sty = stakeStyles[c.stake_type];
                  return (
                    <li key={c.id}>
                      <button
                        type="button"
                        onClick={() => { setAdHoc(false); setContractId(c.id); }}
                        style={{
                          width: "100%", textAlign: "left",
                          border: `1px solid ${selected ? "#C4892A" : "rgba(26,22,14,0.10)"}`,
                          background: selected ? "rgba(196,137,42,0.05)" : "#FDFAF4",
                          borderRadius: 5, padding: "12px 14px", cursor: "pointer",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontFamily: "'DM Sans',system-ui,sans-serif", fontSize: 13, fontWeight: 600, color: "#1A1614" }}>
                              {c.name}
                            </div>
                            <div style={{ fontFamily: "'DM Mono',ui-monospace,monospace", fontSize: 10, color: "#9A8F84", marginTop: 2 }}>
                              {c.counterparty_name}
                            </div>
                          </div>
                          <span style={{
                            background: sty.bg, color: sty.fg,
                            fontFamily: "'DM Mono',ui-monospace,monospace", fontSize: 9,
                            padding: "3px 7px", borderRadius: 3, whiteSpace: "nowrap",
                          }}>
                            {c.stake_type}
                          </span>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}

            {!adHoc ? (
              <button
                type="button"
                onClick={() => { setAdHoc(true); setContractId(null); }}
                style={{ background: "transparent", border: "none", padding: 0, color: "#C4892A", textDecoration: "underline", fontFamily: "'DM Sans',system-ui,sans-serif", fontSize: 13, cursor: "pointer" }}
              >
                + Reference a different contract
              </button>
            ) : (
              <div className="space-y-2">
                <label style={{ fontFamily: "'DM Mono',ui-monospace,monospace", fontSize: 10, color: "#9A8F84", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Reference
                </label>
                <Input
                  value={adHocRef}
                  onChange={(e) => setAdHocRef(e.target.value)}
                  placeholder="Paste a URL, doc hash, clause ref, or contract address"
                />
                <button type="button" onClick={() => setAdHoc(false)} style={{ background: "transparent", border: "none", padding: 0, color: "#9A8F84", fontFamily: "'DM Mono',ui-monospace,monospace", fontSize: 10, cursor: "pointer", textDecoration: "underline" }}>
                  ← back to contract list
                </button>
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h3 style={{ fontFamily: "'Playfair Display',Georgia,serif", fontWeight: 600, fontSize: 18, color: "#1A1614", margin: 0 }}>
              What did you do?
            </h3>

            {selectedContract && (
              <div style={{ background: "#EDE8DC", borderRadius: 5, padding: "10px 14px" }}>
                <div style={{ fontFamily: "'DM Mono',ui-monospace,monospace", fontSize: 9, color: "#9A8F84", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Contract terms · read only
                </div>
                <div style={{ fontFamily: "'DM Sans',system-ui,sans-serif", fontSize: 13, fontWeight: 600, color: "#1A1614", marginTop: 4 }}>
                  {selectedContract.name}
                </div>
                <div style={{ fontFamily: "'DM Sans',system-ui,sans-serif", fontSize: 12, color: "#5C5248", marginTop: 4 }}>
                  Trigger: {selectedContract.trigger_description}
                </div>
                <div style={{ fontFamily: "'DM Mono',ui-monospace,monospace", fontSize: 9, color: "#9A8F84", fontStyle: "italic", marginTop: 6 }}>
                  These terms come from the contract. You are executing against them, not setting them.
                </div>
              </div>
            )}
            {adHoc && (
              <div style={{ background: "#EDE8DC", borderRadius: 5, padding: "10px 14px" }}>
                <div style={{ fontFamily: "'DM Mono',ui-monospace,monospace", fontSize: 9, color: "#9A8F84", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Ad-hoc reference
                </div>
                <div style={{ fontFamily: "'DM Sans',system-ui,sans-serif", fontSize: 12, color: "#5C5248", marginTop: 4 }}>
                  {adHocRef}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label style={{ fontFamily: "'DM Mono',ui-monospace,monospace", fontSize: 10, color: "#9A8F84", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Name this contribution
              </label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Q4 API integration · Batch validation completed · Season 2025 snap log"
                style={{ fontFamily: "'DM Sans',system-ui,sans-serif", fontSize: 14 }}
              />
            </div>

            <div className="space-y-2">
              <label style={{ fontFamily: "'DM Mono',ui-monospace,monospace", fontSize: 10, color: "#9A8F84", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Type of work
              </label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {WORK_TYPES.map((t) => {
                  const active = workType === t;
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setWorkType(t)}
                      style={{
                        background: active ? "#1A1614" : "transparent",
                        color: active ? "#F5F1E8" : "#5C5248",
                        border: active ? "1px solid #1A1614" : "1px solid rgba(26,22,14,0.15)",
                        borderRadius: 4, padding: "6px 12px",
                        fontFamily: "'DM Sans',system-ui,sans-serif", fontSize: 12, fontWeight: 500,
                        cursor: "pointer",
                      }}
                    >
                      {t}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <label style={{ fontFamily: "'DM Mono',ui-monospace,monospace", fontSize: 10, color: "#9A8F84", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                What was delivered?
              </label>
              <Textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What did you produce? What measurable outcome?"
              />
            </div>

            <div className="space-y-2">
              <label style={{ fontFamily: "'DM Mono',ui-monospace,monospace", fontSize: 10, color: "#9A8F84", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Trigger status
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  { key: true, label: "Yes — condition met", sub: "Claiming execution. Proof required next." },
                  { key: false, label: "Not yet — logging intent", sub: "Records the work. No payout triggered yet." },
                ].map((opt) => {
                  const active = triggerMet === opt.key;
                  return (
                    <button
                      key={String(opt.key)}
                      type="button"
                      onClick={() => setTriggerMet(opt.key)}
                      style={{
                        textAlign: "left",
                        border: `1px solid ${active ? "#C4892A" : "rgba(26,22,14,0.10)"}`,
                        background: active ? "rgba(196,137,42,0.05)" : "#FDFAF4",
                        borderRadius: 5, padding: "10px 12px", cursor: "pointer",
                      }}
                    >
                      <div style={{ fontFamily: "'DM Sans',system-ui,sans-serif", fontSize: 13, fontWeight: 600, color: "#1A1614" }}>
                        {opt.label}
                      </div>
                      <div style={{ fontFamily: "'DM Mono',ui-monospace,monospace", fontSize: 10, color: "#9A8F84", marginTop: 4 }}>
                        {opt.sub}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h3 style={{ fontFamily: "'Playfair Display',Georgia,serif", fontWeight: 600, fontSize: 18, color: "#1A1614", margin: 0 }}>
              Prove it happened.
            </h3>

            {(selectedContract || adHoc) && (
              <div style={{ background: "rgba(42,92,138,0.06)", border: "1px solid rgba(42,92,138,0.15)", borderRadius: 5, padding: "10px 14px" }}>
                <div style={{ fontFamily: "'DM Mono',ui-monospace,monospace", fontSize: 9, color: "#2A5C8A", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Proof required
                </div>
                <div style={{ fontFamily: "'DM Sans',system-ui,sans-serif", fontSize: 12, color: "#1A1614", marginTop: 4 }}>
                  {selectedContract?.trigger_description ?? "Self-reported reference. Attach what you can."}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label style={{ fontFamily: "'DM Mono',ui-monospace,monospace", fontSize: 10, color: "#9A8F84", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                URL or reference
              </label>
              <Input
                value={proofRef}
                onChange={(e) => { setProofRef(e.target.value); setSkipProof(false); }}
                placeholder="github.com/… · batch-record.pdf · delivery confirmation"
              />
              {proofHash && !skipProof && (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontFamily: "'DM Mono',ui-monospace,monospace", fontSize: 9, color: "#9A8F84" }}>
                    SHA-256: {proofHash.slice(0, 16)}…
                  </span>
                  <button
                    type="button"
                    onClick={() => { navigator.clipboard?.writeText(proofHash); toast.success("Hash copied."); }}
                    style={{ background: "transparent", border: "none", padding: 0, cursor: "pointer", color: "#9A8F84" }}
                    aria-label="Copy hash"
                  >
                    <Copy className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label style={{ fontFamily: "'DM Mono',ui-monospace,monospace", fontSize: 10, color: "#9A8F84", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Evidence type
              </label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {EVIDENCE_CHIPS.map((c) => {
                  const active = evidenceTypes.includes(c);
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setEvidenceTypes((prev) => active ? prev.filter((x) => x !== c) : [...prev, c])}
                      style={{
                        background: active ? "rgba(42,106,69,0.10)" : "transparent",
                        color: active ? "#2A6A45" : "#5C5248",
                        border: `1px solid ${active ? "rgba(42,106,69,0.3)" : "rgba(26,22,14,0.15)"}`,
                        borderRadius: 3, padding: "4px 10px",
                        fontFamily: "'DM Mono',ui-monospace,monospace", fontSize: 9,
                        cursor: "pointer", textTransform: "uppercase", letterSpacing: "0.04em",
                      }}
                    >
                      {c}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <button
                type="button"
                onClick={() => { setSkipProof((s) => !s); if (!skipProof) { setProofRef(""); setProofHash(""); } }}
                style={{ background: "transparent", border: "none", padding: 0, color: "#9A8F84", fontFamily: "'DM Mono',ui-monospace,monospace", fontSize: 9, cursor: "pointer", textDecoration: "underline" }}
              >
                {skipProof ? "Add proof instead" : "Skip — log without proof"}
              </button>
              {skipProof && (
                <div style={{ marginTop: 6, fontFamily: "'DM Sans',system-ui,sans-serif", fontSize: 12, color: "#C4892A" }}>
                  Without proof this execution is unverifiable.
                </div>
              )}
            </div>

            {triggerMet && (
              <div className="space-y-2">
                <label style={{ fontFamily: "'DM Mono',ui-monospace,monospace", fontSize: 10, color: "#9A8F84", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  How will payment be received?
                </label>
                <Select value={channel} onValueChange={(v) => setChannel(v as SettlementChannel)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CHANNELS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
                <div style={{ fontFamily: "'DM Mono',ui-monospace,monospace", fontSize: 9, color: "#9A8F84" }}>
                  SCORE records the trigger and notifies you. Payment is handled by your chosen channel — SCORE only confirms when it arrives.
                </div>
              </div>
            )}

            <div style={{ borderTop: "1px solid rgba(26,22,14,0.08)", paddingTop: 14, marginTop: 6 }}>
              <div style={{ fontFamily: "'DM Mono',ui-monospace,monospace", fontSize: 10, color: "#9A8F84", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
                Review
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <tbody>
                  {[
                    ["Contract", adHoc ? `Ad-hoc · ${adHocRef.slice(0, 40)}` : (selectedContract?.name ?? "—")],
                    ["Contribution", title || "—"],
                    ["Status", triggerMet ? "Pending" : "Intent logged"],
                    ["Proof", skipProof || !proofHash ? "None" : `${proofHash.slice(0, 16)}…`],
                    ["Payment channel", triggerMet ? channel : "N/A"],
                  ].map(([k, v]) => (
                    <tr key={k}>
                      <td style={{ padding: "4px 10px 4px 0", fontFamily: "'DM Mono',ui-monospace,monospace", fontSize: 10, color: "#9A8F84", verticalAlign: "top", width: "35%" }}>{k}</td>
                      <td style={{ padding: "4px 0", fontFamily: "'DM Sans',system-ui,sans-serif", fontSize: 12, color: "#1A1614", wordBreak: "break-word" }}>{v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {submitError && (
              <div style={{ fontFamily: "'DM Sans',system-ui,sans-serif", fontSize: 12, color: "#9A3020" }}>
                {submitError}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{
        borderTop: "1px solid rgba(26,22,14,0.08)",
        padding: "14px 20px",
        display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12,
        background: "#FDFAF4",
      }}>
        {step > 1 ? (
          <button
            type="button"
            onClick={() => setStep((s) => (s - 1) as 1 | 2 | 3)}
            disabled={busy}
            style={{ background: "transparent", border: "none", padding: 0, color: "#5C5248", fontFamily: "'DM Sans',system-ui,sans-serif", fontSize: 13, cursor: "pointer" }}
          >
            ← Back
          </button>
        ) : <span />}
        {step < 3 ? (
          <button
            type="button"
            onClick={() => setStep((s) => (s + 1) as 1 | 2 | 3)}
            disabled={!canNext}
            style={{
              background: canNext ? "#1A1614" : "rgba(26,22,14,0.3)",
              color: "#F5F1E8", border: "none", borderRadius: 4,
              padding: "11px 24px",
              fontFamily: "'DM Sans',system-ui,sans-serif", fontSize: 14, fontWeight: 500,
              cursor: canNext ? "pointer" : "not-allowed",
            }}
          >
            Next →
          </button>
        ) : (
          <button
            type="button"
            onClick={submit}
            disabled={busy}
            style={{
              background: "#1A1614", color: "#F5F1E8", border: "none", borderRadius: 4,
              padding: "11px 24px",
              fontFamily: "'DM Sans',system-ui,sans-serif", fontSize: 14, fontWeight: 500,
              cursor: busy ? "wait" : "pointer",
            }}
          >
            {busy ? "Saving…" : "Submit contribution →"}
          </button>
        )}
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={close}>
        <SheetContent
          side="bottom"
          className="p-0 rounded-t-[12px] max-h-[90vh] overflow-hidden"
          style={{ background: "#FDFAF4" }}
        >
          {body}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent
        className="p-0 max-w-[560px] overflow-hidden"
        style={{ background: "#FDFAF4", border: "1px solid rgba(26,22,14,0.12)", borderRadius: 8 }}
      >
        {body}
      </DialogContent>
    </Dialog>
  );
};