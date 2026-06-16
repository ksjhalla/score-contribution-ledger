export type DemoKey = "pharma" | "ncaa" | "supplyChain" | "ai" | "ppp";

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
  valueStreams?: Array<{ icon: "droplets" | "leaf" | "network" | "code" | "git-fork" | "brain"; iconColor: string; name: string; description: string; value: string }>;
  evidenceMappings?: EvidenceMapping[];
  phase2Tracker?: Phase2Milestone[];
  siteUptime?: SiteUptime[];
  exampleCards?: ExampleCard[];
  contribution?: string[];
};

export type EvidenceMapping = {
  evidence: {
    type: "kWh audit" | "Mobile-money collection" | "Uptime audit" | "Annual financials" | "Ministry filing";
    title: string;
    source: string;
    period: string;
    fingerprint?: string;
    metric: string;
  };
  ledger: {
    bucket: "Paid" | "Pending" | "Contract";
    entry: string;
    amount: number | null;
    currency: string;
    contract: string;
  };
  rule: string;
  status: "Reconciled" | "Awaiting sign-off" | "Watching";
};

export type Phase2Milestone = {
  label: string;
  detail: string;
  expected: string;
  status: "Done" | "In progress" | "Upcoming" | "At risk";
  owner: string;
};

export type SiteUptime = {
  village: string;
  households: number;
  uptimePct: number;
  saidiHours: number;
  status: "On track" | "Watch" | "Bonus driver";
  note?: string;
};

export type ExampleCard = {
  kind: "kWh sales" | "Mobile-money collection" | "Uptime bonus";
  title: string;
  village: string;
  period: string;
  metricLabel: string;
  metricValue: string;
  amount: number;
  currency: string;
  status: "Settled" | "Pending" | "Watching";
  evidence: string;
  note: string;
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
  confirmations?: DemoConfirmation[];
  proofPack?: DemoProofPack;
};

export type DemoConfirmation = {
  name: string;
  org?: string;
  status: "Confirmed" | "Pending" | "Disputed";
};

export type DemoProofPack = {
  why_recorded: string;
  evidence_items: string[];
  verifier: string;
  source: string;
  confidence_level: "High" | "Medium" | "Low";
  last_verified_date: string;
  status: "Verified" | "Awaiting verification";
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
    message: "Payment expected on GLP-1 TTA Extension. Mark it paid once Novo Nordisk signs.",
    read: false,
    created_at: hoursAgo(2),
  },
  {
    id: "demo-n2",
    type: "trigger_met",
    message: "Batch threshold hit — 8.2M vials. Log it against the Aspen Process Agreement.",
    read: true,
    created_at: daysAgo(3),
  },
];

export const ncaaNotifications: DemoNotification[] = [
  {
    id: "demo-n3",
    type: "settlement_due",
    message: "Payment expected from OSU. Spring 2026 trigger fired — mark it paid when the ACH lands.",
    read: false,
    created_at: hoursAgo(1),
  },
  {
    id: "demo-n4",
    type: "trigger_met",
    message: "Spring 2026 seasonal trigger fired. Log it to track the upcoming payment.",
    read: true,
    created_at: daysAgo(5),
  },
];

export const supplyChainNotifications: DemoNotification[] = [
  {
    id: "demo-n5",
    type: "settlement_due",
    message:
      "Payment expected — 5-facility adoption confirmed. Mark it paid when the transfer arrives.",
    read: false,
    created_at: hoursAgo(4),
  },
  {
    id: "demo-n6",
    type: "trigger_met",
    message:
      "Tier 1 supplier threshold reached. Log it against the Supplier Network Expansion Agreement.",
    read: true,
    created_at: daysAgo(2),
  },
];

export const aiNotifications: DemoNotification[] = [
  {
    id: "demo-n7",
    type: "trigger_met",
    message:
      "Your dataset showed up in a production model release. Log it against the Dataset Attribution Record.",
    read: false,
    created_at: hoursAgo(3),
  },
  {
    id: "demo-n8",
    type: "settlement_due",
    message:
      "Your library is live in an enterprise tool. Mark the Integration Royalty as waiting on payment.",
    read: true,
    created_at: daysAgo(4),
  },
];

export const pppNotifications: DemoNotification[] = [
  {
    id: "demo-n9",
    type: "settlement_due",
    message:
      "Q1 2026 tariff revenue ready to log. Audit report in. Mark it paid when the transfer arrives.",
    read: false,
    created_at: hoursAgo(5),
  },
  {
    id: "demo-n10",
    type: "trigger_met",
    message:
      "Uptime bonus confirmed — 99.2% grid availability in 2025. Log it against the Concession Performance Agreement.",
    read: true,
    created_at: daysAgo(6),
  },
];

export const demoNotificationsFor = (key: DemoKey | "none"): DemoNotification[] => {
  if (key === "pharma") return pharmaNotifications;
  if (key === "ncaa") return ncaaNotifications;
  if (key === "supplyChain") return supplyChainNotifications;
  if (key === "ai") return aiNotifications;
  if (key === "ppp") return pppNotifications;
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
      { question: "What is most solid?", answer: "Two patent royalties received and recorded", value: "R600K", valueColor: "green" },
      { question: "What is closest to moving?", answer: "GLP-1 TTA extension awaiting Novo Nordisk signature", value: "R340K", valueColor: "amber" },
      { question: "Where is the upside?", answer: "Insulin line 2.4% revenue stake above R50M threshold", value: "2.4%", valueColor: "blue" },
    ],
    milestones: [
      { status: "ok", title: "WHO PQ granted · insulin vial line", meta: "WHO/PQ/2024-ZA-0312 · Nov 2024", amount: "+R420,000", amountColor: "green" },
      { status: "ok", title: "Batch volume 8.2M vials confirmed", meta: "GMP batch register · Jul 2024", amount: "+R180,000", amountColor: "green" },
      { status: "info", title: "Named inventor · SA Patent 2024/08441", meta: "Filed Aug 2024 · attribution confirmed", amount: null },
      { status: "watch", title: "GLP-1 TTA extension pending", meta: "Novo Nordisk signature outstanding", amount: "R340,000 est.", amountColor: "amber" },
    ],
    bio:
      "Thandi led the technical adaptation of Novo Nordisk's insulin fill-and-finish process to Aspen's sterile facility in Gqeberha — the first of its kind in sub-Saharan Africa. She authored the IQ/OQ/PQ validation for the insulin vial line and is named inventor on three process patents. The WHO Prequalification certificate that unlocked commercial-scale production exists in part because of her work. IFC has committed €1 billion to Aspen's manufacturing programme. Thandi's contribution record is what sits beneath that investment at the individual level.",
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
        title: "Fall 2025–26 revenue share recorded",
        status: "Settled",
        amount: 124800,
        currency: "USD",
        date: "2026-01-15",
        proof: "ACH-OSU-SMITH-2026-01 · received Jan 2026",
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
        proof: "Seasonal trigger · Jan 2026 · awaiting payment confirmation",
        resolver_description: "OSU Athletics · seasonal trigger",
        expected_resolution: "Jan 2026",
        confidence: "High",
      },
    ],
    whatChanged: [
      {
        amount: 124800, currency: "USD",
        headline: "pending",
        subheadline: "Spring 2026 revenue share trigger fired. Waiting on OSU.",
        status: "Under review", confidence: "High",
        trigger: "Seasonal revenue share · Jan 2026",
        resolver: "OSU Athletics Department",
        expected_resolution: "Jan 2026", evidence_count: 1,
      },
      {
        amount: 124800, currency: "USD",
        headline: "received",
        subheadline: "Fall 2025–26 revenue share — paid.",
        status: "Resolved", confidence: "High",
        trigger: "Seasonal revenue share · Aug 2025",
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
      { question: "What has been received?", answer: "Fall 2025 OSU revenue share recorded", value: "$124.8K", valueColor: "green" },
      { question: "What is next to move?", answer: "Spring 2026 revenue share trigger fired, awaiting payment confirmation", value: "$124.8K", valueColor: "amber" },
      { question: "Where is the FMV gap?", answer: "SCORE NIL estimate above OSU unilateral allocation", value: "+$13.4K", valueColor: "blue" },
    ],
    milestones: [
      { status: "ok", title: "Revenue-sharing agreement signed · OSU", meta: "SHA-256: osu-rsa-smith-2025.pdf · Aug 2025", amount: null },
      { status: "ok", title: "Fall 2025–26 revenue share recorded", meta: "ACH-OSU-SMITH-2026-01 · Jan 2026", amount: "+$124,800", amountColor: "green" },
      { status: "info", title: "Broadcast evidence logged · 710 snaps", meta: "~440 broadcast mins · SHA-256 fingerprinted", amount: null },
      { status: "watch", title: "Spring 2026 revenue share pending", meta: "Seasonal trigger · awaiting payment confirmation", amount: "$124,800", amountColor: "amber" },
    ],
    bio:
      "Jeremiah Smith caught 76 passes for 1,315 yards and 15 touchdowns in his freshman season at Ohio State — one of the most productive debut seasons in programme history. His NIL appeared in approximately 440 minutes of broadcast content on Fox Sports, ESPN, and the Big Ten Network. The House v. NCAA settlement structures school payments as Team Marketing Rights — compensation for the use of athlete NIL in commercial broadcasts. OSU's unilateral allocation decision is the only number that exists without a SCORE record. With one, Jeremiah has an independent NIL fair market value basis — portable to any school he transfers to.",
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
        subheadline: "Tier 1 expansion confirmed across 5 facilities. Waiting on payment.",
        status: "Under review", confidence: "Medium",
        trigger: "Adoption across 5 supplier facilities confirmed",
        resolver: "Supplier network + global brand ops",
        expected_resolution: "90 days", evidence_count: 1,
      },
      {
        amount: 220000, currency: "USD",
        headline: "received",
        subheadline: "Local adoption across 2 facilities — paid.",
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
  ai: {
    key: "ai",
    accent: "#5B5FBF",
    contributor: {
      name: "Mateo Alvarez",
      role: "Open-source contributor · AI dataset curator",
      org: "GitHub · datasets · model ecosystem",
      id: "SCR-MA-2023-001",
      sector: "AI & Data",
    },
    stats: { settled: 120000, pending: 280000, future: 1000000, currency: "USD", contracts: 3, executions: 3 },
    contracts: [
      {
        name: "Dataset Attribution Record · 2023",
        counterparty: "Model providers · multi-party",
        stake_type: "Attribution",
        entitlement: "Named curator of training dataset across downstream model releases",
        trigger: "Dataset referenced in production model card or paper",
        status: "Active",
      },
      {
        name: "Library Integration Royalty · Enterprise",
        counterparty: "Enterprise tooling vendors",
        stake_type: "Financial",
        entitlement: "Negotiated share of revenue from enterprise tools built on the library",
        trigger: "Enterprise deployment confirmed via attestation or usage metrics",
        status: "Pending",
      },
      {
        name: "Ecosystem Reuse Stake · Forks & Dependencies",
        counterparty: "Open-source ecosystem · aggregate",
        stake_type: "Mixed",
        entitlement: "Tracked credit and revenue tail from forks, integrations, and dependency adoption",
        trigger: "Continued reuse across AI systems and downstream platforms",
        status: "Watching",
      },
    ],
    executions: [
      {
        title: "Dataset adopted by production model",
        status: "Settled",
        amount: 80000,
        currency: "USD",
        date: "2024-09-15",
        proof: "Model card disclosure · SHA-256: model-card-2024-09.json",
        confidence: "Medium",
        resolver_description: "Model provider disclosure · usage logs",
        expected_resolution: "Resolved",
      },
      {
        title: "Library integrated into enterprise tool",
        status: "Pending",
        amount: 200000,
        currency: "USD",
        date: "2025-02-10",
        proof: "Enterprise usage signal · attestation pending",
        confidence: "Medium",
        resolver_description: "Company attestation + telemetry metrics",
        expected_resolution: "60 days",
      },
      {
        title: "Ecosystem expansion · downstream reuse",
        status: "Intent logged",
        amount: 1000000,
        currency: "USD",
        date: "2026-01-01",
        proof: null,
        confidence: "Low",
        resolver_description: "Aggregated usage signals across forks, models, and platforms",
        expected_resolution: "12–36 months",
      },
    ],
    whatChanged: [
      {
        amount: 80000, currency: "USD",
        headline: "paid",
        subheadline: "Dataset referenced in a production model release. Bounty + sponsorship recorded.",
        status: "Resolved", confidence: "Medium",
        trigger: "Dataset used in production model",
        resolver: "Model provider disclosure",
        expected_resolution: "Resolved", evidence_count: 1,
      },
      {
        amount: 200000, currency: "USD",
        headline: "on the way",
        subheadline: "Library is live in an enterprise tool. Waiting on attestation and payment.",
        status: "Under review", confidence: "Medium",
        trigger: "Enterprise deployment confirmed",
        resolver: "Company attestation + usage metrics",
        expected_resolution: "60 days", evidence_count: 1,
      },
      {
        amount: 1000000, currency: "USD",
        headline: "could grow",
        subheadline: "Ecosystem reuse continues across forks, models, and platforms — long tail.",
        status: "Watching", confidence: "Low",
        trigger: "Continued reuse across AI systems",
        resolver: "Aggregated usage signals",
        expected_resolution: "Indeterminate", evidence_count: 0,
      },
    ],
    banner: {
      text: "Demo · Mateo Alvarez · Open-source · AI ecosystem",
      mobileText: "Demo · Mateo Alvarez",
      bg: "rgba(91,95,191,0.08)",
      border: "rgba(91,95,191,0.2)",
    },
    valueMix: { settled: 120000, pending: 280000, future: 1000000, currency: "USD", label: "Total tracked" },
    bars: [
      { label: "Grants", value: 120000, status: "settled", evidence_count: 1 },
      { label: "Integration", value: 280000, status: "pending", evidence_count: 1 },
      { label: "Ecosystem", value: 1000000, status: "watching", evidence_count: 0 },
    ],
    quickRead: [
      { question: "What is already paid?", answer: "Grants, bounties, and sponsorships from direct contributions", value: "$120K", valueColor: "green" },
      { question: "What is next to move?", answer: "Enterprise library integration awaiting attestation", value: "$280K", valueColor: "amber" },
      { question: "Where is the upside?", answer: "Downstream model usage and ecosystem growth — long tail reuse", value: "$1.0M", valueColor: "blue" },
    ],
    milestones: [
      { status: "ok", title: "Dataset adopted by production model", meta: "Model card disclosure · Sep 2024", amount: "+$80,000", amountColor: "green" },
      { status: "watch", title: "Library integrated into enterprise tool", meta: "Attestation pending · 60 days", amount: "$200,000 pending", amountColor: "amber" },
      { status: "info", title: "Ecosystem expansion · downstream reuse", meta: "Forks, models, and platforms · long tail", amount: null },
    ],
    bio:
      "Mateo contributed code, datasets, and evaluation frameworks used by multiple AI projects. His work was reused, forked, and integrated across systems — creating real value that has stayed fragmented, indirect, and mostly invisible. SCORE gives that contribution a single place to live, with the trail of reuse, integration, and downstream impact recorded in one record.",
    badges: ["Datasets", "Forks & integrations", "Downstream model usage", "Ecosystem reuse"],
    valueStreams: [
      {
        icon: "code",
        iconColor: "#5B5FBF",
        name: "Direct Contributions",
        description: "Code commits, datasets, and tools created and released into the ecosystem",
        value: "$120K paid",
      },
      {
        icon: "git-fork",
        iconColor: "#C4892A",
        name: "Reuse / Adoption",
        description: "Forks, integrations, and dependencies — work taken up and built on by others",
        value: "$280K pending",
      },
      {
        icon: "brain",
        iconColor: "#2A5C8A",
        name: "Downstream Value",
        description: "Models trained on the dataset, enterprise tools built on the code, platform adoption",
        value: "$1.0M future",
      },
    ],
  },
  ppp: {
    key: "ppp",
    accent: "#7A5C2A",
    contributor: {
      name: "Kwame Asante",
      role: "Project Developer · Sunlite Power",
      org: "Volta Mini-Grid Program · Ghana",
      id: "SCR-KA-2022-007",
      sector: "Other",
    },
    stats: { settled: 2840000, pending: 720000, future: 14500000, currency: "USD", contracts: 3, executions: 5 },
    contracts: [
      {
        name: "Volta Mini-Grid Concession · 2024–2044",
        counterparty: "Energy Commission of Ghana · Government",
        stake_type: "Financial",
        entitlement: "62% of net tariff revenue across the 20-year concession (12 village sites)",
        trigger: "Quarterly kWh sales + collection audited and reconciled",
        status: "Active",
      },
      {
        name: "Service Performance Agreement · Uptime Bonus",
        counterparty: "Energy Commission · Operator (VoltaOps)",
        stake_type: "Financial",
        entitlement: "Performance bonus when annual grid uptime ≥ 99.0% across all sites",
        trigger: "Independent uptime audit confirms SAIDI/SAIFI threshold",
        status: "Pending",
      },
      {
        name: "Phase 2 Expansion Option · 18 additional villages",
        counterparty: "Government · Ministry of Energy + GIZ co-financier",
        stake_type: "Mixed",
        entitlement: "First-refusal on build-out + 55% revenue share on new sites",
        trigger: "Ministry approval of Phase 2 capital + GIZ blended-finance close",
        status: "Watching",
      },
    ],
    executions: [
      {
        title: "Q4 2025 tariff revenue distribution",
        status: "Settled",
        amount: 720000,
        currency: "USD",
        date: "2026-01-20",
        proof: "Audited kWh + collection report Q4-2025 · SHA-256: kwh-q4-2025.pdf · a8c1d4e2…",
        confidence: "High",
        resolver_description: "Independent meter auditor + concession trustee",
        expected_resolution: "Resolved",
      },
      {
        title: "Q3 2025 tariff revenue distribution",
        status: "Settled",
        amount: 680000,
        currency: "USD",
        date: "2025-10-18",
        proof: "Audited kWh + collection report Q3-2025 · SHA-256: kwh-q3-2025.pdf · 7b2f9c10…",
        confidence: "High",
        resolver_description: "Independent meter auditor + concession trustee",
        expected_resolution: "Resolved",
      },
      {
        title: "2024 cumulative concession revenue",
        status: "Settled",
        amount: 1440000,
        currency: "USD",
        date: "2025-02-15",
        proof: "Annual audited financials 2024 · SHA-256: ann-fin-2024.pdf · c3d8b1a4…",
        confidence: "High",
        resolver_description: "External financial auditor (Big Four)",
        expected_resolution: "Resolved",
      },
      {
        title: "Uptime performance bonus · 2025 (99.2%)",
        status: "Pending",
        amount: 720000,
        currency: "USD",
        date: "2026-03-01",
        proof: "Grid availability + SAIDI logs 2025 · uptime audit pending sign-off",
        confidence: "High",
        resolver_description: "Independent technical auditor · uptime SLA review",
        expected_resolution: "45 days",
      },
      {
        title: "Phase 2 expansion · 18 villages approval",
        status: "Intent logged",
        amount: 14500000,
        currency: "USD",
        date: "2027-01-01",
        proof: null,
        confidence: "Medium",
        resolver_description: "Ministry of Energy approval + GIZ blended-finance close",
        expected_resolution: "12–18 months",
      },
    ],
    whatChanged: [
      {
        amount: 720000, currency: "USD",
        headline: "Q4 2025 energy revenue received",
        subheadline: "Your share of last quarter's electricity sales across 12 villages.",
        status: "Resolved", confidence: "High",
        trigger: "Quarterly kWh sales + collection audited",
        resolver: "audited revenue report",
        expected_resolution: "Resolved", evidence_count: 2,
        confirmations: [
          { name: "Sunlite Power", org: "Project sponsor", status: "Confirmed" },
          { name: "SGS Ghana", org: "Independent auditor", status: "Confirmed" },
          { name: "Concession Trustee", org: "Stanbic Bank", status: "Confirmed" },
        ],
        proofPack: {
          why_recorded: "Q4 2025 tariff revenue from electricity sales across 12 villages was audited and distributed.",
          evidence_items: [
            "Audited kWh sales report (SGS Ghana)",
            "Mobile-money collection log (MTN MoMo + Vodafone Cash)",
            "Concession trustee distribution notice",
          ],
          verifier: "SGS Ghana + Stanbic Bank (Concession Trustee)",
          source: "Energy Commission of Ghana",
          confidence_level: "High",
          last_verified_date: "Jan 2026",
          status: "Verified",
        },
      },
      {
        amount: 720000, currency: "USD",
        headline: "Performance bonus on the way",
        subheadline: "Grids ran at 99.2% uptime in 2025 — above the bonus threshold. Waiting on audit sign-off.",
        status: "Under review", confidence: "High",
        trigger: "Annual grid uptime ≥ 99.0%",
        resolver: "independent technical auditor",
        expected_resolution: "45 days", evidence_count: 1,
        confirmations: [
          { name: "VoltaOps", org: "Grid operator", status: "Confirmed" },
          { name: "Infrastructure Fund", org: "Investor", status: "Confirmed" },
          { name: "Ministry of Energy", org: "Government", status: "Pending" },
        ],
        proofPack: {
          why_recorded: "2025 grid uptime hit 99.2% across all 12 sites — above the 99.0% bonus threshold in the Service Performance Agreement.",
          evidence_items: [
            "Grid availability + SAIDI/SAIFI logs (full year 2025)",
            "VoltaOps operator sign-off",
          ],
          verifier: "Independent technical auditor (sign-off in 45 days)",
          source: "Service Performance Agreement",
          confidence_level: "High",
          last_verified_date: "Jun 2026",
          status: "Awaiting verification",
        },
      },
      {
        amount: 14500000, currency: "USD",
        headline: "Phase 2 expansion could grow",
        subheadline: "18 more villages under Ministry review with GIZ co-financing. You hold first-refusal build rights.",
        status: "Watching", confidence: "Medium",
        trigger: "Ministry approves Phase 2 + GIZ finance close",
        resolver: "Ministry of Energy of Ghana",
        expected_resolution: "12–18 months", evidence_count: 0,
        confirmations: [
          { name: "GIZ", org: "Co-financier", status: "Confirmed" },
          { name: "Energy Commission", org: "Ghana", status: "Pending" },
          { name: "Ministry of Energy", org: "Cabinet review", status: "Pending" },
        ],
        proofPack: {
          why_recorded: "Phase 2 expansion (18 villages) is under Ministry review with GIZ co-financing. First-refusal build rights documented in the original concession.",
          evidence_items: [
            "Feasibility study (submitted Aug 2025)",
            "GIZ blended-finance term sheet (in review)",
            "EPA Ghana permits (granted Nov 2025)",
          ],
          verifier: "Ministry of Energy + GIZ",
          source: "Phase 2 Expansion Option · concession amendment",
          confidence_level: "Medium",
          last_verified_date: "May 2026",
          status: "Awaiting verification",
        },
      },
    ],
    banner: {
      text: "Demo · Kwame Asante · Sunlite Power Ghana · Volta Mini-Grid PPP",
      mobileText: "Demo · Kwame Asante",
      bg: "rgba(122,92,42,0.08)",
      border: "rgba(122,92,42,0.2)",
    },
    valueMix: { settled: 2840000, pending: 720000, future: 14500000, currency: "USD", label: "Total tracked" },
    bars: [
      { label: "2024 tariff", value: 1440000, status: "settled", evidence_count: 1 },
      { label: "Q3 2025", value: 680000, status: "settled", evidence_count: 1 },
      { label: "Q4 2025", value: 720000, status: "settled", evidence_count: 2 },
      { label: "Uptime bonus", value: 720000, status: "pending", evidence_count: 1 },
      { label: "Phase 2", value: 14500000, status: "watching", evidence_count: 0 },
    ],
    quickRead: [
      { question: "What has been received?", answer: "Three audited quarterly tariff payments plus 2024 annual reconciliation", value: "$2.84M", valueColor: "green" },
      { question: "What is next to move?", answer: "2025 uptime bonus confirmed — 99.2% grid availability, audit sign-off in 45 days", value: "$720K", valueColor: "amber" },
      { question: "Where is the upside?", answer: "Phase 2 — 18 additional villages — under Ministry review with GIZ co-finance", value: "$14.5M", valueColor: "blue" },
    ],
    milestones: [
      { status: "ok", title: "Q4 2025 tariff revenue recorded", meta: "Audited kWh + collection report · Jan 2026", amount: "+$720,000", amountColor: "green" },
      { status: "ok", title: "Q3 2025 tariff revenue recorded", meta: "Audited kWh + collection report · Oct 2025", amount: "+$680,000", amountColor: "green" },
      { status: "ok", title: "2024 annual concession reconciliation", meta: "External auditor · Feb 2025", amount: "+$1,440,000", amountColor: "green" },
      { status: "watch", title: "Uptime bonus confirmed · awaiting audit sign-off", meta: "Technical audit · 45 days · 99.2% achieved", amount: "$720,000 pending", amountColor: "amber" },
      { status: "info", title: "Phase 2 expansion under Ministry review", meta: "18 villages · GIZ co-finance · first-refusal rights", amount: null },
    ],
    bio:
      "Kwame led Sunlite's role in a 12-village solar mini-grid program in Ghana's Volta Region — financing, building, and rolling out electricity for ~3,300 households on a 20-year concession with the government.",
    badges: ["12 villages connected", "20-year concession", "Uptime-linked bonus", "Phase 2 with GIZ"],
    contribution: [
      "Financed and built 12 solar mini-grids across the Volta Region",
      "Connected ~3,300 households and small businesses to electricity",
      "Managed the 20-year concession with the Energy Commission of Ghana",
      "Ran rollout with local operator and smart-metering partner",
    ],
    valueStreams: [
      {
        icon: "network",
        iconColor: "#7A5C2A",
        name: "Energy revenue share",
        description: "Your share of electricity sales across the 12 villages, paid quarterly.",
        value: "$2.84M paid",
      },
      {
        icon: "leaf",
        iconColor: "#4A784A",
        name: "Performance incentives",
        description: "Bonus paid when grid uptime stays above 99% — confirmed by independent audit.",
        value: "$720K pending",
      },
      {
        icon: "git-fork",
        iconColor: "#2A5C8A",
        name: "Expansion equity",
        description: "First-refusal rights on Phase 2 — 18 more villages — and a larger revenue share if it proceeds.",
        value: "$14.5M future",
      },
    ],
    evidenceMappings: [
      {
        evidence: {
          type: "kWh audit",
          title: "Audited kWh sales · Q4 2025",
          source: "Independent meter auditor (SGS Ghana)",
          period: "Oct–Dec 2025 · 12 sites",
          fingerprint: "kwh-q4-2025.pdf · a8c1d4e2…",
          metric: "1,842,000 kWh sold",
        },
        ledger: {
          bucket: "Paid",
          entry: "Q4 2025 tariff revenue distribution",
          amount: 720000,
          currency: "USD",
          contract: "Volta Mini-Grid Concession · 2024–2044",
        },
        rule: "Quarterly kWh × tariff × 62% Sunlite share, after collection-rate adjustment",
        status: "Reconciled",
      },
      {
        evidence: {
          type: "Mobile-money collection",
          title: "MTN MoMo + Vodafone Cash log · Q4 2025",
          source: "Concession trustee · reconciled with telco settlement files",
          period: "Oct–Dec 2025 · 12 sites",
          fingerprint: "momo-q4-2025.csv · 4f9b2a17…",
          metric: "94.6% collection rate · $1.16M gross",
        },
        ledger: {
          bucket: "Paid",
          entry: "Q4 2025 tariff revenue distribution",
          amount: 720000,
          currency: "USD",
          contract: "Volta Mini-Grid Concession · 2024–2044",
        },
        rule: "Collection rate gates kWh-derived entitlement — drops below 90% reduce share pro-rata",
        status: "Reconciled",
      },
      {
        evidence: {
          type: "kWh audit",
          title: "Audited kWh sales · Q1 2026 (in flight)",
          source: "Independent meter auditor (SGS Ghana)",
          period: "Jan–Mar 2026 · 12 sites",
          fingerprint: "kwh-q1-2026.pdf · pending sign-off",
          metric: "1,910,000 kWh sold (provisional)",
        },
        ledger: {
          bucket: "Pending",
          entry: "Q1 2026 tariff revenue distribution",
          amount: 745000,
          currency: "USD",
          contract: "Volta Mini-Grid Concession · 2024–2044",
        },
        rule: "Provisional entry until trustee counter-signs auditor + telco files",
        status: "Awaiting sign-off",
      },
      {
        evidence: {
          type: "Uptime audit",
          title: "Grid availability + SAIDI/SAIFI logs · 2025",
          source: "Independent technical auditor",
          period: "Full year 2025 · 12 sites",
          fingerprint: "uptime-2025.pdf · pending",
          metric: "99.2% availability · SAIDI 7.0h/yr",
        },
        ledger: {
          bucket: "Pending",
          entry: "Uptime performance bonus · 2025",
          amount: 720000,
          currency: "USD",
          contract: "Service Performance Agreement · Uptime Bonus",
        },
        rule: "Bonus released when annual uptime ≥ 99.0% confirmed by independent auditor",
        status: "Awaiting sign-off",
      },
      {
        evidence: {
          type: "Mobile-money collection",
          title: "12-month rolling collection trend",
          source: "Telco settlement files + trustee reconciliation",
          period: "2025 full year",
          metric: "Avg 93.8% collection · trending up",
        },
        ledger: {
          bucket: "Contract",
          entry: "Phase 2 expansion · 18 villages",
          amount: 14500000,
          currency: "USD",
          contract: "Phase 2 Expansion Option · 18 additional villages",
        },
        rule: "Sustained collection ≥ 90% strengthens Ministry case for Phase 2 capital approval",
        status: "Watching",
      },
    ],
    phase2Tracker: [
      {
        label: "Feasibility study submitted",
        detail: "Site survey + load-demand modelling for 18 villages, lodged with Energy Commission",
        expected: "Submitted · Aug 2025",
        status: "Done",
        owner: "Sunlite Power Ghana",
      },
      {
        label: "Environmental & social permits",
        detail: "EPA Ghana review across 4 districts; community consultation logs attached",
        expected: "Done · Nov 2025",
        status: "Done",
        owner: "EPA Ghana + districts",
      },
      {
        label: "Tariff schedule approval",
        detail: "PURC review of life-line + commercial tariff bands for new sites",
        expected: "In progress · Apr 2026",
        status: "In progress",
        owner: "PURC",
      },
      {
        label: "GIZ blended-finance term sheet",
        detail: "EUR 6.2M concessional tranche; co-investor due diligence ongoing",
        expected: "Expected · May 2026",
        status: "In progress",
        owner: "GIZ + Sunlite finance",
      },
      {
        label: "Ministry of Energy capital approval",
        detail: "Cabinet memo with co-finance stack and tariff sign-off",
        expected: "Expected · Jul 2026",
        status: "Upcoming",
        owner: "Ministry of Energy",
      },
      {
        label: "GIZ financial close",
        detail: "Disbursement conditions met; first tranche to project SPV",
        expected: "Expected · Sep 2026",
        status: "Upcoming",
        owner: "GIZ + project SPV",
      },
      {
        label: "Concession amendment signed",
        detail: "20-year concession extended to cover 18 additional sites",
        expected: "Expected · Oct 2026",
        status: "Upcoming",
        owner: "Energy Commission",
      },
      {
        label: "Phase 2 construction start",
        detail: "First 6 villages energised within 9 months of close",
        expected: "Target · Q1 2027",
        status: "Upcoming",
        owner: "Sunlite + EPC partner",
      },
    ],
    siteUptime: [
      { village: "Akatsi-Kpoglu", households: 312, uptimePct: 99.6, saidiHours: 3.5, status: "Bonus driver" },
      { village: "Ho-Kpedze", households: 268, uptimePct: 99.5, saidiHours: 4.4, status: "Bonus driver" },
      { village: "Adidome-North", households: 224, uptimePct: 99.4, saidiHours: 5.3, status: "On track" },
      { village: "Sogakope-East", households: 341, uptimePct: 99.3, saidiHours: 6.1, status: "On track" },
      { village: "Keta-Anloga", households: 402, uptimePct: 99.3, saidiHours: 6.2, status: "On track" },
      { village: "Anyako", households: 188, uptimePct: 99.2, saidiHours: 7.0, status: "On track" },
      { village: "Aflao-Border", households: 510, uptimePct: 99.2, saidiHours: 7.0, status: "On track" },
      { village: "Dabala", households: 196, uptimePct: 99.1, saidiHours: 7.9, status: "On track" },
      { village: "Hodzo", households: 174, uptimePct: 99.1, saidiHours: 7.9, status: "On track" },
      { village: "Tsito", households: 230, uptimePct: 98.9, saidiHours: 9.6, status: "Watch", note: "Inverter swap done Feb — recovering" },
      { village: "Kpando-Torkor", households: 281, uptimePct: 98.7, saidiHours: 11.4, status: "Watch", note: "Storm damage Q3 · battery bank repaired" },
      { village: "Vakpo", households: 154, uptimePct: 98.5, saidiHours: 13.1, status: "Watch", note: "Generator stand-in needed for 6 days" },
    ],
    exampleCards: [
      {
        kind: "kWh sales",
        title: "Akatsi-Kpoglu · Q4 2025 kWh sales",
        village: "Akatsi-Kpoglu",
        period: "Oct–Dec 2025",
        metricLabel: "Energy delivered",
        metricValue: "184,200 kWh",
        amount: 72400,
        currency: "USD",
        status: "Settled",
        evidence: "SGS Ghana meter audit · kwh-akatsi-q4-2025.pdf",
        note: "62% Sunlite share of audited tariff revenue, after 95.1% collection.",
      },
      {
        kind: "Mobile-money collection",
        title: "Keta-Anloga · MoMo collection log",
        village: "Keta-Anloga",
        period: "Dec 2025",
        metricLabel: "Collection rate",
        metricValue: "96.2% · $48.1K gross",
        amount: 29800,
        currency: "USD",
        status: "Settled",
        evidence: "MTN MoMo + Vodafone Cash settlement files · trustee reconciled",
        note: "Above 90% threshold — full Sunlite entitlement released.",
      },
      {
        kind: "Uptime bonus",
        title: "Programme uptime bonus · 2025",
        village: "12 villages",
        period: "Full year 2025",
        metricLabel: "Grid availability",
        metricValue: "99.2% · SAIDI 7.0h",
        amount: 720000,
        currency: "USD",
        status: "Pending",
        evidence: "Independent technical auditor · sign-off in 45 days",
        note: "Above 99.0% SLA — performance bonus pending audit release.",
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
