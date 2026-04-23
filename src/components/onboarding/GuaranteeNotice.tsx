import { ShieldCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "score.guarantee.dismissed";

export const GuaranteeNotice = () => {
  const dismissed = typeof window !== "undefined" && localStorage.getItem(STORAGE_KEY) === "1";
  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, "1");
    // Force re-render by reloading the small component via key on parent — simplest: just hide via state:
    window.dispatchEvent(new Event("score:guarantee-dismissed"));
  };

  if (dismissed) return null;

  return (
    <div className="rounded-md border bg-primary/5 p-3 flex items-start gap-3">
      <ShieldCheck className="h-4 w-4 text-primary mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium">Contribution Guarantee</div>
        <p className="text-xs text-muted-foreground mt-0.5">
          Your stakes are permanent. They are bound to your Contributor ID — not your employer, your organisation, or this platform.
        </p>
      </div>
      <Button variant="ghost" size="sm" className="h-6 w-6 p-0 shrink-0" onClick={handleDismiss} aria-label="Dismiss">
        <X className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
};