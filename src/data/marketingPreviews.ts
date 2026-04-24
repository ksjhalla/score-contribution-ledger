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

export type ConversationCard = {
  icon: string;
  quote: string;
  body: string;
  resolution: string;
};

export const conversationCards: ConversationCard[] = [
  {
    icon: "💬",
    quote: "We'll sort out the split later.",
    body: "Later arrives. The project is generating real money. Nobody remembers what was agreed. A conversation that should take five minutes turns into months of awkwardness.",
    resolution: "With SCORE: the split is agreed and locked before work begins.",
  },
  {
    icon: "📊",
    quote: "Someone needs to calculate everyone's share.",
    body: "You spend a week pulling numbers from spreadsheets, email threads, and memory. The investor shouldn't need to trust your summary. They should be able to verify it themselves.",
    resolution: "With SCORE: it calculates and distributes itself.",
  },
  {
    icon: "🏢",
    quote: "I left that company two years ago.",
    body: "The work you built is still running. Still generating value. But the payments go to the org, not to you. Because no one set it up the right way from the start.",
    resolution: "With SCORE: your stake follows you, not your employer.",
  },
  {
    icon: "❓",
    quote: "Wait — who actually built that part?",
    body: "Three people claim it. No one has proof. A dispute that could have been avoided turns into something expensive and relationship-ending.",
    resolution: "With SCORE: authorship is recorded, credited, and timestamped from day one.",
  },
  {
    icon: "📋",
    quote: "Can you put together a report for our investors?",
    body: "You spend a week pulling numbers from spreadsheets, email threads, and memory. The investor shouldn't need to trust your summary. They should be able to verify it themselves.",
    resolution: "With SCORE: income and audit reports are generated in one click — with a full, verifiable trail behind them.",
  },
  {
    icon: "🔍",
    quote: "Due diligence is asking for the IP ownership docs.",
    body: "You have an NDA, a contract somewhere, and a vague memory of an email. Proving who owns what, when, and under what terms turns into weeks of archaeology before any deal can close.",
    resolution: "With SCORE: every ownership record is timestamped, verified, and exportable. Diligence closes fast.",
  },
];
