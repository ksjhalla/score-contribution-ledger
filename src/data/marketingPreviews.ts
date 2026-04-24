// Sample data for marketing homepage feature card previews.
// Edit values here — the JSX in src/pages/Index.tsx will reflect changes
// without any layout edits.

export type EarningsStat = { label: string; value: string; tone: "settled" | "pending" | "neutral" };
export type EarningsRow = { name: string; value: string; tone: "settled" | "attribution" };

export type EarningsPreview = {
  stats: EarningsStat[];
  rows: EarningsRow[];
};

export type ProofPreview = {
  title: string;
  subtitle: string;
  fingerprint: string;
  amount: string;
};

export type PassportPreview = {
  initials: string;
  name: string;
  role: string;
  contributorId: string;
  trustScore: string;
  stats: { value: string; label: string }[];
  contractName: string;
  contractStake: string;
  url: string;
};

export const earningsPreview: EarningsPreview = {
  stats: [
    { label: "SETTLED", value: "$52,600", tone: "settled" },
    { label: "PENDING", value: "$14,000", tone: "pending" },
    { label: "CONTRACTS", value: "3", tone: "neutral" },
    { label: "EXECUTIONS", value: "7", tone: "neutral" },
  ],
  rows: [
    { name: "SCORE Protocol Founding Agreement", value: "$52,600", tone: "settled" },
    { name: "Sahel Agri Cooperative MSA", value: "Attribution", tone: "attribution" },
  ],
};

export const proofPreview: ProofPreview = {
  title: "API integration · license execution",
  subtitle: "License trigger · Nov 2024",
  fingerprint: "sha256: e3b0c44298fc1c14… · RFC 3161: 2024-11-14",
  amount: "+$12,400",
};

export const passportPreview: PassportPreview = {
  initials: "KJ",
  name: "Kaushal Jhaveri",
  role: "Protocol Architect · Independent",
  contributorId: "SCR-KJ-2024-001",
  trustScore: "Trust 94/100",
  stats: [
    { value: "$52.6K", label: "Attributed" },
    { value: "3", label: "Contracts" },
    { value: "7", label: "Executions" },
  ],
  contractName: "SCORE Protocol Founding Agreement",
  contractStake: "Financial",
  url: "score.xyz/kj · verified contributor",
};
