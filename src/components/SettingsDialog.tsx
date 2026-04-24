import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Download, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

export const SettingsDialog = ({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) => {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { toast.error("Sign in required"); return; }
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/export-user-data`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${session.access_token}`, apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY } });
      if (res.status === 408) { toast.error("Export took too long. Please try again."); return; }
      if (!res.ok) { toast.error("Export failed"); return; }
      const blob = await res.blob();
      const cd = res.headers.get("Content-Disposition") ?? "";
      const match = cd.match(/filename="([^"]+)"/);
      const filename = match?.[1] ?? `SCORE-export-${new Date().toISOString().slice(0,10)}.json`;
      const dlUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = dlUrl; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(dlUrl);
      toast.success("Export downloaded.");
    } finally { setExporting(false); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    const { error } = await supabase.rpc("soft_delete_account");
    setDeleting(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Account anonymised.");
    await signOut();
    navigate("/auth", { replace: true });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>Manage your data and account.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="rounded-md border p-3">
            <div className="text-sm font-medium">Export your data</div>
            <p className="text-xs text-muted-foreground mt-1">
              Download all your personal data as JSON (GDPR/POPIA). Includes profile, contracts, executions, evidence fingerprints, triggers and attestations.
            </p>
            <Button size="sm" className="mt-3" onClick={handleExport} disabled={exporting}>
              {exporting ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Download className="h-3.5 w-3.5 mr-1" />}
              {exporting ? "Preparing…" : "Download JSON"}
            </Button>
          </div>

          <div className="rounded-md border border-destructive/30 p-3">
            <div className="text-sm font-medium text-destructive">Delete account</div>
            <p className="text-xs text-muted-foreground mt-1">
              Anonymises your profile. Your Contributor ID is retired permanently and never reissued. Evidence fingerprints and execution records are retained for integrity, attributed to "Contributor SCR-[ID]".
            </p>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm" variant="destructive" className="mt-3">
                  <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete my account
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete account?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This anonymises your profile immediately and retires your Contributor ID forever. Evidence and execution records are retained.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    {deleting ? "Deleting…" : "Delete"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};