import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Copy, ShieldCheck, Loader2 } from "lucide-react";

const EVIDENCE_TYPES = [
  "Document","Dataset","Code","Measurement","Training record",
  "Patent filing","Batch record","Session file","Other",
] as const;
type EvidenceType = typeof EVIDENCE_TYPES[number];

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contractId: string;
  onCreated: () => void;
};

const sha256Hex = async (buf: ArrayBuffer) => {
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
};

export const AttachEvidenceDialog = ({ open, onOpenChange, contractId, onCreated }: Props) => {
  const { user } = useAuth();
  const [mode, setMode] = useState<"url" | "file">("url");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [evidenceType, setEvidenceType] = useState<EvidenceType | "">("");
  const [url, setUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [notes, setNotes] = useState("");
  const [fingerprint, setFingerprint] = useState("");
  const [hashing, setHashing] = useState(false);
  const [busy, setBusy] = useState(false);

  const reset = () => {
    setMode("url"); setTitle(""); setDescription(""); setEvidenceType("");
    setUrl(""); setFile(null); setNotes(""); setFingerprint(""); setBusy(false); setHashing(false);
  };

  const close = (v: boolean) => {
    if (!v) reset();
    onOpenChange(v);
  };

  // Recompute hash whenever input changes
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (mode === "url") {
        if (!url.trim()) { setFingerprint(""); return; }
        setHashing(true);
        const enc = new TextEncoder().encode(url.trim());
        // Copy into a fresh ArrayBuffer to satisfy strict BufferSource typing
        const ab = enc.buffer.slice(enc.byteOffset, enc.byteOffset + enc.byteLength) as ArrayBuffer;
        const fp = await sha256Hex(ab);
        if (!cancelled) { setFingerprint(fp); setHashing(false); }
      } else {
        if (!file) { setFingerprint(""); return; }
        setHashing(true);
        const buf = await file.arrayBuffer();
        const fp = await sha256Hex(buf);
        if (!cancelled) { setFingerprint(fp); setHashing(false); }
      }
    })();
    return () => { cancelled = true; };
  }, [mode, url, file]);

  const canSave = useMemo(
    () => !!title.trim() && !!evidenceType && !!fingerprint && !hashing && !busy,
    [title, evidenceType, fingerprint, hashing, busy]
  );

  const copyFingerprint = async () => {
    await navigator.clipboard.writeText(fingerprint);
    toast.success("Fingerprint copied");
  };

  const submit = async () => {
    if (!user || !canSave) return;
    setBusy(true);
    const { error } = await supabase.from("evidence").insert({
      contract_id: contractId,
      user_id: user.id,
      title: title.trim(),
      description: description.trim() || null,
      evidence_type: evidenceType as EvidenceType,
      source_url: mode === "url" ? url.trim() : null,
      fingerprint,
      notes: notes.trim() || null,
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Evidence recorded");
    onCreated();
    close(false);
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Attach evidence</DialogTitle>
          <DialogDescription>
            Record proof that work happened. The fingerprint and timestamp become permanent on save.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-md border bg-muted/40 p-3 flex gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="h-4 w-4 mt-0.5 shrink-0" />
          <p>
            SCORE never stores the actual file. It stores proof that the file existed at a specific time —
            a SHA-256 fingerprint computed in your browser before anything is sent.
          </p>
        </div>

        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="ev-title">Title</Label>
              <Input id="ev-title" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ev-type">Type</Label>
              <Select value={evidenceType} onValueChange={(v) => setEvidenceType(v as EvidenceType)}>
                <SelectTrigger id="ev-type"><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  {EVIDENCE_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ev-desc">Description</Label>
            <Textarea id="ev-desc" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          <Tabs value={mode} onValueChange={(v) => setMode(v as "url" | "file")}>
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="url">URL / reference</TabsTrigger>
              <TabsTrigger value="file">Upload file</TabsTrigger>
            </TabsList>
            <TabsContent value="url" className="pt-3 space-y-2">
              <Label htmlFor="ev-url">URL or reference</Label>
              <Input id="ev-url" value={url} onChange={(e) => setUrl(e.target.value)}
                placeholder="https://… or DOI / clause ref" />
              <p className="text-xs text-muted-foreground">SCORE hashes the reference string itself.</p>
            </TabsContent>
            <TabsContent value="file" className="pt-3 space-y-2">
              <Label htmlFor="ev-file">File</Label>
              <Input id="ev-file" type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
              <p className="text-xs text-muted-foreground">
                File never leaves your browser. Only the SHA-256 hash is stored.
              </p>
            </TabsContent>
          </Tabs>

          <div className="space-y-2">
            <Label>Fingerprint (SHA-256)</Label>
            <div className="flex gap-2">
              <div className="flex-1 rounded-md border bg-muted/40 px-3 py-2 font-mono text-xs break-all min-h-[2.25rem] flex items-center">
                {hashing ? (
                  <span className="inline-flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" /> Computing…
                  </span>
                ) : fingerprint || <span className="text-muted-foreground">Provide a URL or file</span>}
              </div>
              <Button type="button" variant="outline" size="icon" disabled={!fingerprint} onClick={copyFingerprint}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ev-notes">Notes (optional)</Label>
            <Textarea id="ev-notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={() => close(false)} disabled={busy}>Cancel</Button>
          <Button onClick={submit} disabled={!canSave}>
            {busy ? "Saving…" : "Save evidence"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};