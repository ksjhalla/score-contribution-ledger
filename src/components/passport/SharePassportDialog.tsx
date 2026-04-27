import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { PassportView, PassportData } from "./PassportView";

type Privacy = {
  passport_visible: boolean;
  show_amounts: boolean;
  show_counterparties: boolean;
  show_contracts: boolean;
};

type ShareMode = "public" | "report" | "selective";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  contributorId: string;
  userId: string;
  initialPrivacy: Privacy;
  onPrivacyChange: (p: Privacy) => void;
};

type ContractOption = { id: string; name: string };

export const SharePassportDialog = ({
  open, onOpenChange, contributorId, userId, initialPrivacy, onPrivacyChange,
}: Props) => {
  const [privacy, setPrivacy] = useState<Privacy>(initialPrivacy);
  const [preview, setPreview] = useState<PassportData | null>(null);
  const [saving, setSaving] = useState(false);
  const [mode, setMode] = useState<ShareMode>("public");
  const [contracts, setContracts] = useState<ContractOption[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState(false);

  const baseUrl = useMemo(
    () => `${window.location.origin}/passport/${contributorId}`,
    [contributorId],
  );

  const selectedIds = useMemo(
    () => Object.entries(selected).filter(([, v]) => v).map(([k]) => k),
    [selected],
  );

  const shareUrl = useMemo(() => {
    if (mode === "selective" && selectedIds.length > 0) {
      return `${baseUrl}?contracts=${selectedIds.join(",")}`;
    }
    return baseUrl;
  }, [baseUrl, mode, selectedIds]);

  useEffect(() => { if (open) setPrivacy(initialPrivacy); }, [open, initialPrivacy]);

  // Load contract list (for selective share)
  useEffect(() => {
    if (!open) return;
    (async () => {
      const { data } = await supabase
        .from("contracts")
        .select("id, name")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      setContracts((data ?? []) as ContractOption[]);
    })();
  }, [open, userId]);

  // Refresh live preview when dialog opens or privacy changes.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      // Persist first so the public RPC reflects current toggles.
      setSaving(true);
      const { error } = await supabase
        .from("profiles")
        .update(privacy)
        .eq("id", userId);
      if (!error) onPrivacyChange(privacy);
      const { data } = await supabase.rpc("get_public_passport", { p_contributor_id: contributorId });
      if (!cancelled) {
        setPreview((data as PassportData) ?? null);
        setSaving(false);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, privacy.passport_visible, privacy.show_amounts, privacy.show_counterparties, privacy.show_contracts]);

  const copyUrl = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success("Passport URL copied.");
    setTimeout(() => setCopied(false), 2000);
  };

  const printPassport = () => {
    document.body.classList.add("printing-passport");
    const cleanup = () => {
      document.body.classList.remove("printing-passport");
      window.removeEventListener("afterprint", cleanup);
    };
    window.addEventListener("afterprint", cleanup);
    setTimeout(() => window.print(), 50);
  };

  const modeCard = (key: ShareMode, icon: string, title: string, desc: string) => {
    const active = mode === key;
    return (
      <button
        key={key}
        type="button"
        onClick={() => setMode(key)}
        style={{
          textAlign: "left",
          border: `1px solid ${active ? "#C4892A" : "rgba(26,22,14,0.10)"}`,
          background: active ? "rgba(196,137,42,0.05)" : "#FDFAF4",
          borderRadius: 5, padding: "12px 14px", cursor: "pointer",
          display: "flex", gap: 10, alignItems: "flex-start",
        }}
      >
        <span style={{ fontSize: 18, lineHeight: 1 }}>{icon}</span>
        <span style={{ minWidth: 0 }}>
          <span style={{ display: "block", fontFamily: "'DM Sans',system-ui,sans-serif", fontSize: 13, fontWeight: 600, color: "#1A1614" }}>
            {title}
          </span>
          <span style={{ display: "block", fontFamily: "'DM Sans',system-ui,sans-serif", fontSize: 12, color: "#5C5248", marginTop: 3, lineHeight: 1.5 }}>
            {desc}
          </span>
        </span>
      </button>
    );
  };

  const privacyRow = (
    label: string,
    description: string,
    checked: boolean,
    onChange: (v: boolean) => void,
  ) => (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "10px 0", borderBottom: "1px solid rgba(26,22,14,0.07)" }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontFamily: "'DM Sans',system-ui,sans-serif", fontSize: 12, fontWeight: 600, color: "#1A1614" }}>{label}</div>
        <div style={{ fontFamily: "'DM Mono',ui-monospace,monospace", fontSize: 9, color: "#9A8F84", marginTop: 2 }}>{description}</div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontFamily: "'DM Mono',ui-monospace,monospace", fontSize: 9, color: checked ? "#2A6A45" : "#9A8F84", textTransform: "uppercase", letterSpacing: "0.06em" }}>
          {checked ? "Visible" : "Hidden"}
        </span>
        <Switch checked={checked} onCheckedChange={onChange} />
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Share passport</DialogTitle>
          <DialogDescription>
            Your passport is portable — its URL stays the same regardless of where you work.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Mode cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {modeCard("public", "🌐", "Public profile page", "A permanent URL anyone can view. Control what's visible — amounts can be hidden.")}
            {modeCard("report", "📄", "Investor report", "A signed PDF with full execution history, contract references, and SHA-256 fingerprints.")}
            {modeCard("selective", "🔒", "Selective share", "Share only specific contracts or executions. Useful for sending evidence to a counterparty or patent attorney.")}
          </div>

          {/* Privacy controls */}
          {(mode === "public" || mode === "selective") && (
            <div style={{ borderTop: "1px solid rgba(26,22,14,0.07)" }}>
              {privacyRow("Passport publicly visible", "Required for the public URL to load. Off = takes the URL offline.", privacy.passport_visible, (v) => setPrivacy((p) => ({ ...p, passport_visible: v })))}
              {privacyRow("Attribution records", "Contribution names, types, and verified authorship", privacy.show_contracts, (v) => setPrivacy((p) => ({ ...p, show_contracts: v })))}
              {privacyRow("Contract counterparties", "Which organisations you have agreements with", privacy.show_counterparties, (v) => setPrivacy((p) => ({ ...p, show_counterparties: v })))}
              {privacyRow("Financial amounts", "Received and pending payment figures", privacy.show_amounts, (v) => setPrivacy((p) => ({ ...p, show_amounts: v })))}
            </div>
          )}

          {/* Live preview */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <div style={{ fontFamily: "'DM Mono',ui-monospace,monospace", fontSize: 9, color: "#9A8F84", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Live preview {saving && "· saving…"}
              </div>
            </div>
            <div style={{ border: "1px solid rgba(26,22,14,0.10)", borderRadius: 6, background: "#FFFFFF", overflow: "hidden", maxHeight: 360, overflowY: "auto" }}>
              {preview ? (
                <PassportView data={preview} />
              ) : (
                <div style={{ padding: 24, textAlign: "center", fontFamily: "'DM Sans',system-ui,sans-serif", fontSize: 13, color: "#5C5248" }}>
                  Passport is currently hidden — turn on "Passport publicly visible" to preview.
                </div>
              )}
            </div>
          </div>

          {/* Selective share contract picker */}
          {mode === "selective" && (
            <div>
              <div style={{ fontFamily: "'DM Mono',ui-monospace,monospace", fontSize: 9, color: "#9A8F84", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
                Select what to share
              </div>
              {contracts.length === 0 ? (
                <div style={{ fontFamily: "'DM Sans',system-ui,sans-serif", fontSize: 12, color: "#9A8F84" }}>No contracts to share yet.</div>
              ) : (
                <ul style={{ listStyle: "none", padding: 0, margin: 0, border: "1px solid rgba(26,22,14,0.10)", borderRadius: 5, background: "#FDFAF4" }}>
                  {contracts.map((c) => (
                    <li key={c.id} style={{ padding: "8px 12px", borderBottom: "1px solid rgba(26,22,14,0.06)", display: "flex", alignItems: "center", gap: 8 }}>
                      <input
                        type="checkbox"
                        id={`sel-${c.id}`}
                        checked={!!selected[c.id]}
                        onChange={(e) => setSelected((s) => ({ ...s, [c.id]: e.target.checked }))}
                      />
                      <label htmlFor={`sel-${c.id}`} style={{ fontFamily: "'DM Sans',system-ui,sans-serif", fontSize: 13, color: "#1A1614", cursor: "pointer" }}>
                        {c.name}
                      </label>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Output section */}
          {mode === "report" ? (
            <div>
              <div style={{ fontFamily: "'DM Mono',ui-monospace,monospace", fontSize: 9, color: "#9A8F84", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
                Investor report
              </div>
              <p style={{ fontFamily: "'DM Sans',system-ui,sans-serif", fontSize: 12, color: "#5C5248", margin: "0 0 10px" }}>
                Signed PDF · full execution history · SHA-256 verified
              </p>
              <button
                type="button"
                onClick={printPassport}
                disabled={!preview}
                style={{
                  background: "#1A1614", color: "#F5F1E8", border: "none",
                  borderRadius: 4, padding: "9px 16px", cursor: "pointer",
                  fontFamily: "'DM Sans',system-ui,sans-serif", fontSize: 13, fontWeight: 500,
                  opacity: preview ? 1 : 0.5,
                }}
              >
                Generate PDF
              </button>
            </div>
          ) : (
            <div>
              <div style={{ fontFamily: "'DM Mono',ui-monospace,monospace", fontSize: 9, color: "#9A8F84", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
                Your passport URL
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "stretch" }}>
                <div style={{
                  flex: 1, background: "#FFFFFF", border: "1px solid rgba(26,22,14,0.10)", borderRadius: 4,
                  padding: "8px 12px", fontFamily: "'DM Mono',ui-monospace,monospace", fontSize: 11, color: "#2A5C8A",
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>
                  {shareUrl}
                </div>
                <button
                  type="button"
                  onClick={copyUrl}
                  style={{
                    background: "rgba(196,137,42,0.10)", color: "#C4892A", border: "none",
                    borderRadius: 4, padding: "7px 12px", cursor: "pointer",
                    fontFamily: "'DM Mono',ui-monospace,monospace", fontSize: 10, fontWeight: 600,
                    whiteSpace: "nowrap",
                  }}
                >
                  {copied ? "Copied ✓" : "Copy link"}
                </button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};