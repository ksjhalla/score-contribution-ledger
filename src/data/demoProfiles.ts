export type DemoKey = "pharma" | "ncaa" | "supplyChain";

export type DemoExecution = {
  title: string;
  status: "Settled" | "Pending" | "Attributed" | "Intent logged";
  amount: number | null;
  currency: string;
  date: string;
  proof: string | null;
  resolver_description?: string;
  expected_resolution?: string;
  confidence?: "High" | "Medium" | "Low";
};

export type DemoContract = {
  name: string;
  counterparty: string;
  stake_type: string;
  entitlement: string;
  trigger: string;
  status: string;
};

export type DemoProfile = {
  key: DemoKey;
  accent: string;
  contributor: { name: string; role: string; org: string; id: string; sector: string };
  stats: { settled: number; pending: number; future?: number; esg?: number; currency: string; contracts: number; executions: number };
  contracts: DemoContract[];
  executions: DemoExecution[];
  whatChanged: DemoValueEvent[];
  banner: { text: string; mobileText?: string; bg: string; border: string };
  valueMix: { settled: number; pending: number; future: number; esg?: number; currency: string; label: string };
  bars: Array<{ label: string; value: number; status: "settled" | "pending" | "watching" | "attributed"; evidence_count?: number; color?: string }>;
  quickRead: Array<{ question: string; answer: string; value: string; valueColor: "green" | "amber" | "blue" | "default" }>;
  milestones: Array<{ status: "ok" | "info" | "watch"; title: string; meta: string; amount?: string | null; amountColor?: "green" | "amber" | "blue" }>;
  bio?: string;
  badges?: string[];
  valueStreams?: Array<{ icon: "droplets" | "leaf" | "network"; iconColor: string; name: string; description: string; value: string }>;
};

export type DemoValueEvent = {
  amount: number | null;
  currency: string;
  headline: string;
  subheadline: string;
  status: "Resolved" | "Under review" | "Watching" | "Pending";
  confidence: "High" | "Medium" | "Low" | null;
  trigger?: string;
  resolver?: string;
  expected_resolution?: string;
  evidence_count?: number;
};

export type DemoNotification = {
  id: string;
  type: "trigger_met" | "settlement_due" | "attestation_confirmed" | "attestation_declined" | "evidence_required" | "system";
  message: string;
  read: boolean;
  created_at: string;
};

const hoursAgo = (h: number) => new Date(Date.now() - h * 60 * 60 * 1000).toISOString();
const daysAgo = (d: number) => new Date(Date.now() - d * 24 * 60 * 60 * 1000).toISOString();

export const pharmaNotifications: DemoNotification[] = [
  {
    id: "demo-n1",
    type: "settlement_due",
    message: "Payment due on GLP-1 TTA Extension. Mark as settled when Novo Nordisk signature confirmed.",
    read: false,
    created_at: hoursAgo(2),
  },
  {
    id: "demo-n2",
    type: "trigger_met",
    message: "Batch volume threshold reached. 8.2M vials confirmed. Log an execution against the Aspen Process Agreement.",
    read: true,
    created_at: daysAgo(3),
  },
];

export const ncaaNotifications: DemoNotification[] = [
  {
    id: "demo-n3",
    type: "settlement_due",
    message: "Payment due on OSU Revenue-Sharing Agreement. Spring 2026 distribution trigger fired. Mark as settled when ACH confirms.",
    read: false,
    created_at: hoursAgo(1),
  },
  {
    id: "demo-n4",
    type: "trigger_met",
    message: "Seasonal distribution trigger fired for Spring 2026. Log an execution to record the pending payment.",
    read: true,
    created_at: daysAgo(5),
  },
];

export const supplyChainNotifications: DemoNotification[] = [
  {
    id: "demo-n5",
    type: "settlement_due",
    message:
      "Payment due on Supplier Network Expansion Agreement. 5-facility adoption confirmed. Mark as settled when transfer received.",
    read: false,
    created_at: hoursAgo(4),
  },
  {
    id: "demo-n6",
    type: "trigger_met",
    message:
      "Tier 1 supplier adoption threshold reached. Log an execution against the Supplier Network Expansion Agreement.",
    read: true,
    created_at: daysAgo(2),
  },
];

export const demoNotificationsFor = (key: DemoKey | "none"): DemoNotification[] => {
  if (key === "pharma") return pharmaNotifications;
  if (key === "ncaa") return ncaaNotifications;
  if (key === "supplyChain") return supplyChainNotifications;
  return [];
};

export const demoProfiles: Record<DemoKey, DemoProfile> = {
  pharma: {
    key: "pharma",
    accent: "#2A5C8A",
    contributor: {
      name: "Thandi Mokoena",
      role: "Senior Process Engineer",
      org: "Aspen Pharmacare",
      id: "SCR-TM-2021-001",
      sector: "Pharma & Biotech",
    },
    stats: { settled: 600000, pending: 340000, currency: "ZAR", contracts: 3, executions: 4 },
    contracts: [
      {
        name: "Aspen Process Innovation Agreement",
        counterparty: "Aspen Pharmacare Holdings Ltd.",
        stake_type: "Financial",
        entitlement: "2.4% of insulin line net revenue above R50M threshold",
        trigger: "WHO PQ granted AND annual batch volume ≥ 8M vials",
        status: "Active",
      },
      {
        name: "SA Patent 2024/08441 · vial closure method",
        counterparty: "Aspen Pharmacare Holdings Ltd.",
        stake_type: "Attribution",
        entitlement: "Named inventor",
        trigger: "Patent filing confirmed",
        status: "Attributed",
      },
      {
        name: "GLP-1 TTA Extension · Novo Nordisk",
        counterparty: "Novo Nordisk A/S",
        stake_type: "Financial",
        entitlement: "Est. R340K on activation",
        trigger: "TTA signature confirmed",
        status: "Pending",
      },
    ],
    executions: [
      {
        title: "WHO Prequalification granted · insulin vial line",
        status: "Settled",
        amount: 420000,
        currency: "ZAR",
        date: "2024-11-01",
        proof: "SHA-256: pq-cert-2024-0312.pdf · f3a2c1d9…",
        resolver_description: "WHO Prequalification authority",
        expected_resolution: "Resolved",
        confidence: "High",
      },
      {
        title: "Annual batch volume · 8.2M vials",
        status: "Settled",
        amount: 180000,
        currency: "ZAR",
        date: "2024-07-01",
        proof: "SHA-256: br-2024-vol-sum.json · b4c2d8f1…",
        resolver_description: "GMP batch register · auto-confirmed",
        expected_resolution: "Resolved",
        confidence: "High",
      },
      {
        title: "Named inventor · SA Patent 2024/08441",
        status: "Attributed",
        amount: null,
        currency: "ZAR",
        date: "2024-08-12",
        proof: "SA Pat 2024/08441 · filed 2024-08-12",
        resolver_description: "SA Patent Office confirmation",
        expected_resolution: "On filing",
        confidence: "High",
      },
      {
        title: "GLP-1 TTA extension · pending signature",
        status: "Pending",
        amount: 340000,
        currency: "ZAR",
        date: "2025-12-01",
        proof: "TTA-ext-2025-GLP1.draft.pdf · pending",
        resolver_description: "Novo Nordisk A/S · TTA signature",
        expected_resolution: "30 days",
        confidence: "High",
      },
    ],
    whatChanged: [
      {
        amount: 420000, currency: "ZAR",
        headline: "on the way",
        subheadline: "PF-04 validation milestone is awaiting final confirmation.",
        status: "Under review", confidence: "High",
        trigger: "Manufacturing validation accepted",
        resolver: "Regional QA authority",
        expected_resolution: "30 days", evidence_count: 1,
      },
      {
        amount: 210000, currency: "ZAR",
        headline: "paid to you",
        subheadline: "PF-01 licensing milestone was confirmed and released.",
        status: "Resolved", confidence: "High",
        trigger: "Regional API licensing milestone",
        resolver: "Aspen Pharmacare Finance",
        expected_resolution: "Resolved", evidence_count: 2,
      },
      {
        amount: 530000, currency: "ZAR",
        headline: "could grow",
        subheadline: "Filed patent has inventor confirmation but no licence yet.",
        status: "Watching", confidence: "Medium",
        trigger: "Commercial licence executed",
        resolver: "Licensing counterparty",
        expected_resolution: "Indeterminate", evidence_count: 0,
      },
    ],
    banner: {
      text: "Demo · Thandi Mokoena · Aspen Pharmacare · Gqeberha",
      mobileText: "Demo · Thandi Mokoena",
      bg: "rgba(42,92,138,0.08)",
      border: "rgba(42,92,138,0.2)",
    },
    valueMix: { settled: 600000, pending: 340000, future: 1200000, currency: "ZAR", label: "Total tracked" },
    bars: [
      { label: "GLP-1", value: 340000, status: "pending", evidence_count: 0 },
      { label: "Insulin", value: 420000, status: "settled", evidence_count: 2 },
      { label: "API", value: 180000, status: "settled", evidence_count: 1 },
    ],
    quickRead: [
      { question: "What is most solid?", answer: "Two settled patent royalties already paid and recorded", value: "R600K", valueColor: "green" },
      { question: "What is closest to moving?", answer: "GLP-1 TTA extension awaiting Novo Nordisk signature", value: "R340K", valueColor: "amber" },
      { question: "Where is the upside?", answer: "Insulin line 2.4% revenue stake above R50M threshold", value: "2.4%", valueColor: "blue" },
    ],
    milestones: [
      { status: "ok", title: "WHO PQ granted · insulin vial line", meta: "WHO/PQ/2024-ZA-0312 · Nov 2024", amount: "+R420,000", amountColor: "green" },
      { status: "ok", title: "Batch volume 8.2M vials confirmed", meta: "GMP batch register · Jul 2024", amount: "+R180,000", amountColor: "green" },
      { status: "info", title: "Named inventor · SA Patent 2024/08441", meta: "Filed Aug 2024 · attribution confirmed", amount: null },
      { status: "watch", title: "GLP-1 TTA extension pending", meta: "Novo Nordisk signature outstanding", amount: "R340,000 est.", amountColor: "amber" },
    ],
  },
  ncaa: {
    key: "ncaa",
    accent: "#9A3020",
    contributor: {
      name: "Jeremiah Smith",
      role: "Wide Receiver · #4",
      org: "Ohio State Buckeyes",
      id: "SCR-JS-2024-001",
      sector: "College Athletics",
    },
    stats: { settled: 124800, pending: 124800, currency: "USD", contracts: 2, executions: 4 },
    contracts: [
      {
        name: "OSU Revenue-Sharing Agreement · 2025–26",
        counterparty: "Ohio State University Athletic Dept.",
        stake_type: "Financial",
        entitlement: "Share of $15.375M football pool · Team Marketing Rights",
        trigger: "Seasonal distribution · Aug and Jan",
        status: "Active",
      },
      {
        name: "NIL Broadcast Evidence Record · Season 2025",
        counterparty: "Big Ten Network / Fox / ESPN",
        stake_type: "Attribution",
        entitlement: "710 snaps · ~440 broadcast minutes documented",
        trigger: "Season completion",
        status: "Attributed",
      },
    ],
    executions: [
      {
        title: "Revenue-sharing agreement signed · OSU",
        status: "Attributed",
        amount: null,
        currency: "USD",
        date: "2025-08-01",
        proof: "SHA-256: osu-rsa-smith-2025.pdf · e4c2a1f8…",
        resolver_description: "OSU Athletic Department · counter-signed",
        expected_resolution: "Resolved",
        confidence: "High",
      },
      {
        title: "Fall 2025–26 distribution settled",
        status: "Settled",
        amount: 124800,
        currency: "USD",
        date: "2026-01-15",
        proof: "ACH-OSU-SMITH-2026-01 · settled Jan 2026",
        resolver_description: "OSU Athletics · ACH transfer",
        expected_resolution: "Resolved",
        confidence: "High",
      },
      {
        title: "Broadcast evidence log · Season 2025",
        status: "Attributed",
        amount: null,
        currency: "USD",
        date: "2025-12-01",
        proof: "SHA-256: snap-log-smith-2025.json · f3a2c1d9…",
        resolver_description: "Big Ten stats feed · auto-logged",
        expected_resolution: "Season end",
        confidence: "High",
      },
      {
        title: "Spring 2026 distribution · pending",
        status: "Pending",
        amount: 124800,
        currency: "USD",
        date: "2026-06-01",
        proof: "Seasonal trigger · Jan 2026 · awaiting confirmation",
        resolver_description: "OSU Athletics · seasonal trigger",
        expected_resolution: "Jan 2026",
        confidence: "High",
      },
    ],
    whatChanged: [
      {
        amount: 124800, currency: "USD",
        headline: "pending",
        subheadline: "Spring 2026 distribution trigger fired. Awaiting OSU settlement.",
        status: "Under review", confidence: "High",
        trigger: "Seasonal distribution · Jan 2026",
        resolver: "OSU Athletics Department",
        expected_resolution: "Jan 2026", evidence_count: 1,
      },
      {
        amount: 124800, currency: "USD",
        headline: "received",
        subheadline: "Fall 2025–26 revenue share payout was recorded and settled.",
        status: "Resolved", confidence: "High",
        trigger: "Seasonal distribution · Aug 2025",
        resolver: "OSU Athletics · ACH",
        expected_resolution: "Resolved", evidence_count: 1,
      },
      {
        amount: 8500000, currency: "USD",
        headline: "could grow",
        subheadline: "Performance incentives may unlock if contract thresholds are met.",
        status: "Watching", confidence: "Medium",
        trigger: "Starts, wins, playtime, team performance",
        resolver: "League stats + contract administrator",
        expected_resolution: "End of season", evidence_count: 0,
      },
    ],
    banner: {
      text: "Demo · Jeremiah Smith · Ohio State · House v. NCAA",
      mobileText: "Demo · Jeremiah Smith",
      bg: "rgba(154,48,32,0.08)",
      border: "rgba(154,48,32,0.2)",
    },
    valueMix: { settled: 124800, pending: 124800, future: 8500000, currency: "USD", label: "Total tracked" },
    bars: [
      { label: "OSU pool", value: 210000, status: "settled", evidence_count: 1 },
      { label: "Pro deal", value: 11290000, status: "watching", evidence_count: 0 },
    ],
    quickRead: [
      { question: "What is already paid?", answer: "Fall 2025 OSU revenue share distribution settled", value: "$124.8K", valueColor: "green" },
      { question: "What is next to move?", answer: "Spring 2026 distribution trigger fired, awaiting settlement", value: "$124.8K", valueColor: "amber" },
      { question: "Where is the FMV gap?", answer: "SCORE NIL estimate above OSU unilateral allocation", value: "+$13.4K", valueColor: "blue" },
    ],
    milestones: [
      { status: "ok", title: "Revenue-sharing agreement signed · OSU", meta: "SHA-256: osu-rsa-smith-2025.pdf · Aug 2025", amount: null },
      { status: "ok", title: "Fall 2025–26 distribution settled", meta: "ACH-OSU-SMITH-2026-01 · Jan 2026", amount: "+$124,800", amountColor: "green" },
      { status: "info", title: "Broadcast evidence logged · 710 snaps", meta: "~440 broadcast mins · SHA-256 fingerprinted", amount: null },
      { status: "watch", title: "Spring 2026 distribution pending", meta: "Seasonal trigger · awaiting settlement", amount: "$124,800", amountColor: "amber" },
    ],
  },
  supplyChain: {
    key: "supplyChain",
    accent: "#4A784A",
    contributor: {
      name: "Ayesha Khan",
      role: "Process Engineer · Sustainability Lead",
      org: "Textile Manufacturing (India → Global)",
      id: "SCR-AK-2022-001",
      sector: "Manufacturing",
    },
    stats: { settled: 420000, pending: 380000, future: 2400000, esg: 600000, currency: "USD", contracts: 3, executions: 5 },
    contracts: [
      {
        name: "Process Innovation Savings Share · 2022",
        counterparty: "Regional Textile Group Ltd.",
        stake_type: "Financial",
        entitlement: "8% of documented water + energy savings above baseline across adopted facilities",
        trigger: "Facility adoption confirmed by plant ops report",
        status: "Active",
      },
      {
        name: "Supplier Network Expansion Agreement · 2024",
        counterparty: "Global Brand Supply Chain Ops",
        stake_type: "Financial",
        entitlement: "4% of savings across Tier 1 supplier facilities",
        trigger: "Adoption confirmed across minimum 5 supplier facilities",
        status: "Pending",
      },
      {
        name: "ESG Attribution Record · Process Origin",
        counterparty: "Third-party ESG Auditor",
        stake_type: "Attribution",
        entitlement: "Named originator of dyeing process in annual ESG disclosure and carbon reporting",
        trigger: "Inclusion in brand ESG report confirmed by auditor",
        status: "Watching",
      },
    ],
    executions: [
      {
        title: "Local adoption · 2 facilities confirmed",
        status: "Settled",
        amount: 220000,
        currency: "USD",
        date: "2023-06-01",
        proof: "Production logs · factory ops report · SHA-256: prod-log-2023-f1f2.json",
        confidence: "High",
        resolver_description: "Plant operations report · Regional Textile Group",
        expected_resolution: "Resolved",
      },
      {
        title: "Phase 2 adoption incentive · early mover",
        status: "Settled",
        amount: 200000,
        currency: "USD",
        date: "2024-01-15",
        proof: "Adoption agreement · SHA-256: adopt-agree-2024.pdf",
        confidence: "High",
        resolver_description: "Regional Textile Group Finance",
        expected_resolution: "Resolved",
      },
      {
        title: "Tier 1 supplier expansion · 5 facilities",
        status: "Pending",
        amount: 380000,
        currency: "USD",
        date: "2025-03-01",
        proof: "Supplier rollout report pending final sign-off",
        confidence: "Medium",
        resolver_description: "Supplier network + global brand ops",
        expected_resolution: "90 days",
      },
      {
        title: "ESG report inclusion · named process originator",
        status: "Intent logged",
        amount: 600000,
        currency: "USD",
        date: "2025-09-01",
        proof: null,
        confidence: "Medium",
        resolver_description: "External ESG auditor · annual disclosure cycle",
        expected_resolution: "Q4 2025 reporting cycle",
      },
      {
        title: "Global standardisation · process adopted network-wide",
        status: "Intent logged",
        amount: 1800000,
        currency: "USD",
        date: "2026-01-01",
        proof: null,
        confidence: "Low",
        resolver_description: "Brand-level supply chain decision · multi-party",
        expected_resolution: "18–36 months",
      },
    ],
    whatChanged: [
      {
        amount: 380000, currency: "USD",
        headline: "on the way",
        subheadline: "Tier 1 supplier expansion confirmed across 5 facilities. Awaiting settlement.",
        status: "Under review", confidence: "Medium",
        trigger: "Adoption across 5 supplier facilities confirmed",
        resolver: "Supplier network + global brand ops",
        expected_resolution: "90 days", evidence_count: 1,
      },
      {
        amount: 220000, currency: "USD",
        headline: "paid",
        subheadline: "Local adoption across 2 facilities confirmed and settled.",
        status: "Resolved", confidence: "High",
        trigger: "Plant ops report confirmed",
        resolver: "Regional Textile Group",
        expected_resolution: "Resolved", evidence_count: 2,
      },
      {
        amount: 600000, currency: "USD",
        headline: "could grow",
        subheadline: "ESG report inclusion would name Ayesha as process originator in brand disclosures.",
        status: "Watching", confidence: "Medium",
        trigger: "Inclusion in annual ESG report confirmed by auditor",
        resolver: "External ESG auditor",
        expected_resolution: "Q4 2025 reporting cycle", evidence_count: 0,
      },
    ],
    banner: {
      text: "Demo · Ayesha Khan · Textile Manufacturing · ESG",
      mobileText: "Demo · Ayesha Khan",
      bg: "rgba(74,120,74,0.08)",
      border: "rgba(74,120,74,0.2)",
    },
    valueMix: { settled: 420000, pending: 380000, esg: 600000, future: 1800000, currency: "USD", label: "Total tracked" },
    bars: [
      { label: "Savings", value: 420000, status: "settled" },
      { label: "Expansion", value: 380000, status: "pending" },
      { label: "ESG", value: 600000, status: "watching", color: "#4A784A" },
      { label: "Global", value: 1800000, status: "watching" },
    ],
    quickRead: [
      { question: "What is already paid?", answer: "Savings share from local adoption across 2 facilities", value: "$420K", valueColor: "green" },
      { question: "What is next to move?", answer: "Tier 1 supplier expansion — 5 facilities, 90-day window", value: "$380K", valueColor: "amber" },
      { question: "Where is the system value?", answer: "ESG attribution + global standardisation — multi-party, long tail", value: "$2.4M", valueColor: "blue" },
    ],
    milestones: [
      { status: "ok", title: "Local adoption · 2 facilities confirmed", meta: "Plant ops report · Jun 2023", amount: "+$220,000", amountColor: "green" },
      { status: "ok", title: "Phase 2 adoption incentive", meta: "Early mover agreement · Jan 2024", amount: "+$200,000", amountColor: "green" },
      { status: "watch", title: "Tier 1 supplier expansion", meta: "5 facilities · sign-off pending", amount: "$380,000 pending", amountColor: "amber" },
      { status: "info", title: "ESG report inclusion · watching", meta: "Q4 2025 auditor cycle", amount: null },
    ],
    bio:
      "Ayesha redesigned a dyeing process to reduce water usage and energy consumption across textile facilities. That process has since been adopted across suppliers in multiple countries and is rolling into global production. The savings, compliance value, and ESG impact continue to grow — but her original contribution had no single place to live. SCORE is that place.",
    badges: ["7 facilities impacted", "2 countries", "ESG-linked value", "Replicable process"],
    valueStreams: [
      {
        icon: "droplets",
        iconColor: "#2A5C8A",
        name: "Cost Efficiency",
        description: "% of savings from reduced water and energy usage across facilities",
        value: "$620K tracked",
      },
      {
        icon: "leaf",
        iconColor: "#4A784A",
        name: "ESG Attribution",
        description: "Carbon reduction credits, water savings reporting, and compliance incentive value",
        value: "$600K potential",
      },
      {
        icon: "network",
        iconColor: "#C4892A",
        name: "Replication Value",
        description: "Process reused across factories and regions — each adoption extends the value tail",
        value: "$1.8M future",
      },
    ],
  },
};

const currencySymbol = (c: string) => (c === "ZAR" ? "R" : c === "USD" ? "$" : "");

export const formatDemoAmount = (amount: number | null, currency: string) => {
  if (amount == null) return "—";
  const sym = currencySymbol(currency);
  if (amount >= 1000) return `${sym}${(amount / 1000).toFixed(amount % 1000 === 0 ? 0 : 1)}K`;
  return `${sym}${amount.toLocaleString()}`;
};
