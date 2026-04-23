import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type StakeType = "Financial" | "Attribution" | "Governance" | "Mixed";

export type ContractRow = {
  id: string;
  name: string;
  counterparty_name: string;
  counterparty_type: string;
  stake_type: StakeType;
  contract_type: string;
  attestation_required: boolean;
};

const stakeStyles: Record<StakeType, string> = {
  Financial: "bg-amber-100 text-amber-900 border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30",
  Attribution: "bg-blue-100 text-blue-900 border-blue-200 dark:bg-blue-500/15 dark:text-blue-300 dark:border-blue-500/30",
  Governance: "bg-green-100 text-green-900 border-green-200 dark:bg-green-500/15 dark:text-green-300 dark:border-green-500/30",
  Mixed: "bg-gray-100 text-gray-900 border-gray-200 dark:bg-gray-500/15 dark:text-gray-300 dark:border-gray-500/30",
};

export const ContractCard = ({ contract }: { contract: ContractRow }) => {
  return (
    <Card>
      <CardContent className="pt-4 pb-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="font-medium truncate">{contract.name}</div>
            <div className="text-xs text-muted-foreground truncate">
              {contract.counterparty_name} · {contract.counterparty_type}
            </div>
          </div>
          <Badge variant="outline" className={stakeStyles[contract.stake_type]}>
            {contract.stake_type}
          </Badge>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1.5 text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60" />
            Recorded · {contract.contract_type}
          </span>
          {contract.attestation_required && (
            <span className="text-muted-foreground">· Attestation required</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
};