import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronRight, ShieldCheck, FileSignature, Activity, X } from "lucide-react";

type Props = {
  open: boolean;
  sector: string | null;
  onDismiss: () => void;
  onAddContract: () => void;
  onLogContribution: () => void;
};

const sectorLine = (sector: string | null) => {
  switch (sector) {
    case "Software": return "Every commit, every contribution, every line of impact.";
    case "Pharma & Biotech": return "Every patent, every batch, every named-inventor record.";
    case "Agriculture": return "Every season, every yield, every cooperative share.";
    case "Manufacturing": return "Every process, every patent, every improvement.";
    case "Music & Publishing": return "Every session, every split, every release.";
    case "Film & Television": return "Every credit, every residual, every reuse.";
    case "AI & Data": return "Every dataset, every training run, every model.";
    case "College Athletics": return "Every season, every NIL deal, every share.";
    default: return "Every contract, every contribution, every share.";
  }
};

export const OnboardingDialog = ({ open, sector, onDismiss, onAddContract, onLogContribution }: Props) => {
  const [step, setStep] = useState(1);

  const close = () => { setStep(1); onDismiss(); };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && close()}>
      <DialogContent className="max-w-md p-0 overflow-hidden">
        <button onClick={close} className="absolute right-3 top-3 text-muted-foreground hover:text-foreground z-10" aria-label="Skip">
          <X className="h-4 w-4" />
        </button>

        <div className="px-6 pt-8 pb-6">
          {/* Step indicator */}
          <div className="flex justify-center gap-1.5 mb-6">
            {[1, 2, 3].map((i) => (
              <span key={i} className={`h-1 w-8 rounded-full ${i === step ? "bg-primary" : "bg-muted"}`} />
            ))}
          </div>

          {step === 1 && (
            <div className="space-y-5 text-center">
              <div className="mx-auto h-32 w-32 relative">
                {/* CSS-only illustration: stacked layers representing portable record */}
                <div className="absolute inset-0 rounded-2xl border-2 border-primary/20 rotate-6" />
                <div className="absolute inset-0 rounded-2xl border-2 border-primary/40 -rotate-3" />
                <div className="absolute inset-0 rounded-2xl border-2 border-primary bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                  <ShieldCheck className="h-12 w-12 text-primary" strokeWidth={1.5} />
                </div>
              </div>
              <div className="space-y-1">
                <h2 className="text-lg font-semibold tracking-tight">Your contributions outlast your job.</h2>
                <p className="text-sm text-muted-foreground">SCORE gives you a portable record.</p>
                <p className="text-xs text-muted-foreground pt-2 italic">{sectorLine(sector)}</p>
              </div>
              <Button className="w-full" onClick={() => setStep(2)}>
                Get started <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5 text-center">
              <div className="mx-auto h-32 w-32 relative">
                <div className="absolute inset-2 rounded-lg border-2 border-primary/30" />
                <div className="absolute inset-4 rounded-lg border-2 border-primary/60 bg-primary/5 flex items-center justify-center">
                  <FileSignature className="h-10 w-10 text-primary" strokeWidth={1.5} />
                </div>
                <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-semibold">1</div>
              </div>
              <div className="space-y-1">
                <h2 className="text-lg font-semibold tracking-tight">Add your first contract</h2>
                <p className="text-sm text-muted-foreground">The agreement that says what you're owed.</p>
              </div>
              <div className="flex flex-col gap-2">
                <Button className="w-full" onClick={() => { close(); onAddContract(); }}>
                  Add contract <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setStep(3)}>Skip for now</Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5 text-center">
              <div className="mx-auto h-32 w-32 relative">
                <div className="absolute inset-0 rounded-full border-2 border-primary/20" />
                <div className="absolute inset-3 rounded-full border-2 border-primary/40" />
                <div className="absolute inset-6 rounded-full bg-primary/10 flex items-center justify-center">
                  <Activity className="h-10 w-10 text-primary" strokeWidth={1.5} />
                </div>
              </div>
              <div className="space-y-1">
                <h2 className="text-lg font-semibold tracking-tight">Log your first contribution</h2>
                <p className="text-sm text-muted-foreground">The work you did and the evidence it happened.</p>
              </div>
              <div className="flex flex-col gap-2">
                <Button className="w-full" onClick={() => { close(); onLogContribution(); }}>
                  Show me how <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
                <Button variant="ghost" size="sm" onClick={close}>Done</Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};