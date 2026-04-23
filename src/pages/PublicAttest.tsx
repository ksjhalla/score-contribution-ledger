import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CheckCircle2, XCircle, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

type AttData = {
  id: string;
  status: "Pending" | "Confirmed" | "Declined";
  attestor_name: string;
  attestor_email: string;
  requested_at: string;
  responded_at: string | null;
  notes: string | null;
  execution: { id: string; title: string; work_description: string; execution_date: string; status: string };
  contract: { id: string; name: string; counterparty_name: string; stake_type: string };
  contributor: { full_name: string | null; professional_role: string | null };
  evidence: Array<{ id: string; title: string; evidence_type: string }>;
};

const PublicAttest = () => {
  const { token } = useParams();
  const [data, setData] = useState<AttData | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [notes, setNotes] = useState("");
  const [done, setDone] = useState<"Confirmed" | "Declined" | null>(null);

  useEffect(() => {
    (async () => {
      if (!token) return;
      const { data: res, error } = await supabase.rpc("get_attestation_by_token", { p_token: token });
      if (error) toast.error(error.message);
      setData((res as unknown as AttData) ?? null);
      setLoading(false);
    })();
  }, [token]);

  const respond = async (decision: "Confirmed" | "Declined") => {
    if (!token) return;
    setBusy(true);
    const { error } = await supabase.rpc("submit_attestation", {
      p_token: token, p_decision: decision, p_notes: notes.trim() || null,
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    setDone(decision);
    toast.success(`Marked ${decision}`);
  };

  if (loading) {
    return <div className="min-h-screen grid place-items-center text-sm text-muted-foreground">Loading…</div>;
  }

  if (!data) {
    return (
      <div className="min-h-screen grid place-items-center p-6">
        <Card className="max-w-md w-full">
          <CardHeader><CardTitle>Attestation link invalid</CardTitle></CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            This link could not be found. It may have expired or been revoked.
          </CardContent>
        </Card>
      </div>
    );
  }

  const alreadyResponded = data.status !== "Pending" || done;
  const finalStatus = done ?? (data.status !== "Pending" ? data.status : null);

  return (
    <div className="min-h-screen bg-muted/30 py-10 px-4">
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <ShieldCheck className="h-4 w-4" />
          SCORE attestation request
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle className="text-lg">{data.contract.name}</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {data.contributor.full_name ?? "A contributor"}
                  {data.contributor.professional_role ? ` · ${data.contributor.professional_role}` : ""}
                  {" "}is requesting your confirmation.
                </p>
              </div>
              <Badge variant="outline">{data.contract.stake_type}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Counterparty</div>
              <div className="text-sm">{data.contract.counterparty_name}</div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Execution</div>
              <div className="text-sm font-medium">{data.execution.title}</div>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap mt-1">{data.execution.work_description}</p>
              <p className="text-xs text-muted-foreground mt-2">
                Date: {new Date(data.execution.execution_date).toLocaleDateString()}
              </p>
            </div>
            {data.evidence.length > 0 && (
              <div>
                <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Evidence linked</div>
                <ul className="space-y-1">
                  {data.evidence.map((e) => (
                    <li key={e.id} className="flex items-center justify-between rounded-md border px-2.5 py-1.5">
                      <span className="text-sm truncate">{e.title}</span>
                      <Badge variant="secondary" className="text-[10px]">{e.evidence_type}</Badge>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5 space-y-4">
            {alreadyResponded ? (
              <div className="flex items-center gap-2 text-sm">
                {finalStatus === "Confirmed" ? (
                  <><CheckCircle2 className="h-4 w-4 text-green-600" /> You confirmed this execution.</>
                ) : (
                  <><XCircle className="h-4 w-4 text-destructive" /> You declined this execution.</>
                )}
              </div>
            ) : (
              <>
                <p className="text-sm">
                  Hi {data.attestor_name}, please confirm or decline that the work described above was completed.
                </p>
                <div className="space-y-2">
                  <Label htmlFor="att-notes">Notes (optional)</Label>
                  <Textarea id="att-notes" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)}
                    placeholder="Optional context for the contributor" />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" disabled={busy} onClick={() => respond("Declined")}>
                    <XCircle className="h-4 w-4 mr-1" /> Decline
                  </Button>
                  <Button disabled={busy} onClick={() => respond("Confirmed")}>
                    <CheckCircle2 className="h-4 w-4 mr-1" /> Confirm
                  </Button>
                </div>
              </>
            )}
            <p className="text-[11px] text-muted-foreground border-t pt-3">
              Your response is recorded against this execution and shared with the contributor only.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PublicAttest;