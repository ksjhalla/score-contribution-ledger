import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Copy, Printer } from "lucide-react";
import { PassportView, PassportData } from "./PassportView";

type Privacy = {
  passport_visible: boolean;
  show_amounts: boolean;
  show_counterparties: boolean;
  show_contracts: boolean;
};

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  contributorId: string;
  userId: string;
  initialPrivacy: Privacy;
  onPrivacyChange: (p: Privacy) => void;
};

export const SharePassportDialog = ({
  open, onOpenChange, contributorId, userId, initialPrivacy, onPrivacyChange,
}: Props) => {
  const [privacy, setPrivacy] = useState<Privacy>(initialPrivacy);
  const [preview, setPreview] = useState<PassportData | null>(null);
  const [saving, setSaving] = useState(false);

  const publicUrl = useMemo(
    () => `${window.location.origin}/passport/${contributorId}`,
    [contributorId],
  );

  useEffect(() => { if (open) setPrivacy(initialPrivacy); }, [open, initialPrivacy]);

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
    await navigator.clipboard.writeText(publicUrl);
    toast.success("Passport URL copied");
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
          <div className="space-y-2">
            <Label>Public URL</Label>
            <div className="flex gap-2">
              <Input readOnly value={publicUrl} className="font-mono text-xs" />
              <Button variant="outline" size="icon" onClick={copyUrl}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-3 rounded-md border p-3">
            <Toggle
              label="Passport is publicly visible"
              description="Disable to take the public URL offline."
              checked={privacy.passport_visible}
              onChange={(v) => setPrivacy((p) => ({ ...p, passport_visible: v }))}
            />
            <Toggle
              label="Show financial amounts"
              description="Hidden by default."
              checked={privacy.show_amounts}
              onChange={(v) => setPrivacy((p) => ({ ...p, show_amounts: v }))}
            />
            <Toggle
              label="Show counterparty names"
              checked={privacy.show_counterparties}
              onChange={(v) => setPrivacy((p) => ({ ...p, show_counterparties: v }))}
            />
            <Toggle
              label="Show contract names"
              checked={privacy.show_contracts}
              onChange={(v) => setPrivacy((p) => ({ ...p, show_contracts: v }))}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">
              {saving ? "Saving…" : "Live preview"}
            </Label>
            <Button variant="outline" size="sm" onClick={printPassport} disabled={!preview}>
              <Printer className="h-4 w-4 mr-1" /> Generate PDF
            </Button>
          </div>

          <div className="rounded-md border bg-background overflow-hidden">
            {preview ? (
              <PassportView data={preview} />
            ) : (
              <div className="p-6 text-center text-sm text-muted-foreground">
                Passport is currently hidden — turn on "Passport is publicly visible" to preview.
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const Toggle = ({
  label, description, checked, onChange,
}: { label: string; description?: string; checked: boolean; onChange: (v: boolean) => void }) => (
  <div className="flex items-center justify-between gap-3">
    <div>
      <div className="text-sm">{label}</div>
      {description && <div className="text-[11px] text-muted-foreground">{description}</div>}
    </div>
    <Switch checked={checked} onCheckedChange={onChange} />
  </div>
);