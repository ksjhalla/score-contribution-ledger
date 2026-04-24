export type DemoBadge = { label: string; tone?: "neutral" | "amber" | "scarlet" | "blue" | "green" };

export type DemoTimelineItem = {
  icon: "check" | "info" | "warn";
  tone: "green" | "blue" | "amber";
  title: string;
  meta: string;
  date: string;
  amount?: string;
};

export type DemoEvidenceItem = {
  badge: string;
  badgeTone: "blue" | "amber" | "scarlet" | "green" | "neutral";
  title: string;
  hash: string;
  footer: string;
};

export type DemoContractRow = {
  name: string;
  meta: string;
  status: string;
  value: string;
};

export type DemoFmvRow = {
  marker: string;
  factor: string;
  detail: string;
  result: string;
  resultTone?: "green" | "amber" | "blue" | "neutral";
};

export type DemoRecentEvent = {
  amount: string;
  amountTone: "green" | "amber" | "blue";
  title: string;
  meta: string;
};

export type DemoInnerStat = { label: string; value: string };

export type DemoProfile = {
  id: string;
  avatar: string;
  avatarColor: string;
  name: string;
  role: string;
  tag: string;
  sidebarStats: DemoInnerStat[];
  eyebrow: string;
  title: string;
  subtitle: string;
  heroTotal: string;
  breakdown: { label: string; value: string; meta: string; tone: "green" | "amber" | "blue" }[];
  recentEvents: DemoRecentEvent[];
  contracts: DemoContractRow[];
  timeline: DemoTimelineItem[];
  innerStats: DemoInnerStat[];
  badges: DemoBadge[];
  notice: string;
  fmvTable?: DemoFmvRow[];
  evidenceFeed: DemoEvidenceItem[];
  rightNotice: string;
  contextNote: string;
};

export const demoProfiles: DemoProfile[] = [
  {
    id: "thandi",
    avatar: "TM",
    avatarColor: "#2A5C8A",
    name: "Thandi Mokoena",
    role: "Process engineer · Aspen Pharmacare · Gqeberha",
    tag: "IFC · Pharma",
    sidebarStats: [
      { label: "Patents", value: "3 named" },
      { label: "Settled", value: "R600K" },
      { label: "Pending", value: "R340K" },
      { label: "Stake", value: "2.4%" },
    ],
    eyebrow: "IFC Africa pharma · Aspen Pharmacare · Gqeberha",
    title: "IFC Africa pharma · Aspen Pharmacare · Gqeberha",
    subtitle:
      "One process engineer, three named patents, a 2.4% revenue stake, and R940K attributed across WHO PQ and batch volume triggers.",
    heroTotal: "R940K",
    breakdown: [
      { label: "Settled", value: "R600K", meta: "WHO PQ grant + batch volume trigger", tone: "green" },
      { label: "Pending", value: "R340K", meta: "GLP-1 TTA extension · Dec 2025", tone: "amber" },
      { label: "Stake", value: "2.4%", meta: "Net revenue above R50M threshold", tone: "blue" },
    ],
    recentEvents: [
      {
        amount: "+R420K",
        amountTone: "green",
        title: "WHO Prequalification granted",
        meta: "SHA-256: pq-cert-2024-0312.pdf",
      },
      {
        amount: "+R180K",
        amountTone: "green",
        title: "Annual batch volume · 8.2M vials",
        meta: "GMP batch register evidence",
      },
      {
        amount: "R340K est.",
        amountTone: "amber",
        title: "GLP-1 TTA extension",
        meta: "Novo Nordisk signature outstanding",
      },
    ],
    contracts: [
      {
        name: "Aspen Process Innovation Agreement · 2021",
        meta: "Active · 2.4%",
        status: "Active",
        value: "R600K settled",
      },
      {
        name: "SA Patent 2024/08441 · vial closure method",
        meta: "Named inventor",
        status: "Attribution",
        value: "Attribution",
      },
      {
        name: "GLP-1 TTA extension · Novo Nordisk",
        meta: "Pending signature",
        status: "Pending",
        value: "R340K est.",
      },
      {
        name: "IQ/OQ/PQ documentation · Insulin Line B",
        meta: "847 batches",
        status: "Evidence",
        value: "Evidence",
      },
    ],
    timeline: [
      {
        icon: "check",
        tone: "green",
        title: "WHO Prequalification granted",
        meta: "WHO/PQ/2024-ZA-0312",
        date: "Nov 2024",
        amount: "+R420,000",
      },
      {
        icon: "check",
        tone: "green",
        title: "Annual batch volume 8.2M vials",
        meta: "GMP register SHA-256",
        date: "Jul 2024",
        amount: "+R180,000",
      },
      {
        icon: "info",
        tone: "blue",
        title: "Named inventor · SA Patent 2024/08441",
        meta: "Filed Aug 2024",
        date: "Aug 2024",
      },
      {
        icon: "warn",
        tone: "amber",
        title: "GLP-1 TTA extension pending",
        meta: "Novo Nordisk signature outstanding",
        date: "Dec 2025",
        amount: "R340,000 est. on activation",
      },
    ],
    innerStats: [
      { label: "Settled", value: "R600K" },
      { label: "Pending", value: "R340K" },
      { label: "Patents", value: "3" },
      { label: "Batches", value: "847" },
    ],
    badges: [
      { label: "WHO-GMP" },
      { label: "Novo Nordisk TTA" },
      { label: "3 SA patents" },
      { label: "2.4% revenue stake", tone: "amber" },
    ],
    notice:
      "S.21 of the SA Patents Act gives Aspen ownership of Mokoena's inventions as employer. SCORE records that she did the work — timestamped, SHA-256 fingerprinted, DID-bound. If she leaves Aspen, the record travels with her.",
    evidenceFeed: [
      {
        badge: "WHO-GMP",
        badgeTone: "blue",
        title: "WHO PQ certificate · insulin vial line",
        hash: "SHA-256: pq-cert-2024-0312.pdf · f3a2c1d9…",
        footer: "Trigger fired · R420K settled · Nov 2024",
      },
      {
        badge: "Batch",
        badgeTone: "green",
        title: "GMP batch register · 8.2M vials confirmed",
        hash: "SHA-256: br-2024-vol-sum.json · b4c2d8f1…",
        footer: "Volume trigger · R180K settled · Jul 2024",
      },
      {
        badge: "Patent",
        badgeTone: "neutral",
        title: "SA Patent 2024/08441 · inventor confirmed",
        hash: "Filed 2024-08-12 · named inventor: T. Mokoena",
        footer: "Governance stake · attribution confirmed",
      },
    ],
    rightNotice: "GLP-1 TTA extension. Novo Nordisk signature outstanding. R340K estimated on activation.",
    contextNote:
      "Local insulin production saves ~R820/patient/yr for 4.1M patients. Mokoena's work is the technical provenance of that capability.",
  },
  {
    id: "jeremiah",
    avatar: "JS",
    avatarColor: "#9A3020",
    name: "Jeremiah Smith",
    role: "WR · Ohio State · House Settlement",
    tag: "NCAA · House",
    sidebarStats: [
      { label: "Contracts", value: "2 active" },
      { label: "Received", value: "$124.8K" },
      { label: "Pending", value: "$124.8K" },
      { label: "NIL FMV", value: "$138.2K" },
    ],
    eyebrow: "House v. NCAA · Ohio State · Team Marketing Rights · Case 4:20-cv-03919",
    title: "House v. NCAA · Ohio State · Team Marketing Rights",
    subtitle:
      "One athlete, 710 snaps, $249K in distributions, and an independent NIL FMV record for the Deloitte NIL Go review.",
    heroTotal: "$249K",
    breakdown: [
      { label: "Received", value: "$124.8K", meta: "Fall 2025–26 distribution", tone: "green" },
      { label: "Pending", value: "$124.8K", meta: "Spring 2026 distribution", tone: "amber" },
      { label: "NIL FMV", value: "$138.2K", meta: "SCORE estimate vs $124.8K allocated", tone: "blue" },
    ],
    recentEvents: [
      {
        amount: "+$124,800",
        amountTone: "green",
        title: "Fall 2025–26 distribution settled",
        meta: "OSU Athletics ACH transfer",
      },
      {
        amount: "All 3 ✓",
        amountTone: "blue",
        title: "NIL Go FMV review · Deloitte",
        meta: "SCORE record submitted",
      },
      {
        amount: "$124,800",
        amountTone: "amber",
        title: "Spring 2026 distribution trigger",
        meta: "Jan 2026 · awaiting settlement",
      },
    ],
    contracts: [
      {
        name: "Revenue-sharing agreement · OSU 2025",
        meta: "House Settlement",
        status: "Active",
        value: "$124.8K settled",
      },
      {
        name: "Team Marketing Rights licence",
        meta: "OSU · Fox/ESPN/B1G",
        status: "Active",
        value: "$124.8K pending",
      },
    ],
    timeline: [
      {
        icon: "check",
        tone: "green",
        title: "Revenue-sharing agreement signed · OSU",
        meta: "SHA-256: osu-rsa-smith-2025.pdf",
        date: "Aug 2025",
      },
      {
        icon: "check",
        tone: "green",
        title: "Fall 2025–26 distribution settled",
        meta: "ACH-OSU-SMITH-2026-01",
        date: "Jan 2026",
        amount: "+$124,800",
      },
      {
        icon: "info",
        tone: "blue",
        title: "Broadcast evidence log · Season 2025",
        meta: "710 snaps · ~440 broadcast mins · SHA-256 fingerprinted",
        date: "Season 2025",
      },
      {
        icon: "warn",
        tone: "amber",
        title: "Spring 2026 distribution pending",
        meta: "Jan 2026",
        date: "Jan 2026",
        amount: "$124,800",
      },
    ],
    innerStats: [
      { label: "Received", value: "$124.8K" },
      { label: "Pending", value: "$124.8K" },
      { label: "NIL FMV", value: "$138.2K" },
      { label: "Gap", value: "+$13.4K" },
    ],
    badges: [
      { label: "710 career snaps" },
      { label: "~440 broadcast mins" },
      { label: "NIL Go: all stages cleared", tone: "green" },
      { label: "+$13.4K FMV gap", tone: "amber" },
    ],
    notice:
      "OSU decides how to split the $15.375M football pool — unilaterally, per the settlement. Smith's SCORE record is the only independent FMV basis for the NIL Go review. If he transfers, the record travels with his DID. OSU cannot retain it.",
    fmvTable: [
      {
        marker: "①",
        factor: "Payor association",
        detail: "OSU Athletic Dept. · not a booster",
        result: "Cleared ✓",
        resultTone: "green",
      },
      {
        marker: "②",
        factor: "Valid business purpose",
        detail: "NIL used in 440 broadcast mins · Fox/ESPN/B1G",
        result: "Confirmed ✓",
        resultTone: "green",
      },
      {
        marker: "③",
        factor: "Fair market value (12-pt)",
        detail: "5-star WR · Soph · Star · 710 snaps · OSU $111.6M football revenue",
        result: "Supported ✓",
        resultTone: "green",
      },
      {
        marker: "—",
        factor: "SCORE NIL FMV estimate",
        detail: "Snap share × broadcast pct × recruit rating",
        result: "$138,200",
        resultTone: "blue",
      },
      {
        marker: "—",
        factor: "School allocation",
        detail: "OSU unilateral decision · settlement formula ref.",
        result: "$124,800",
        resultTone: "amber",
      },
    ],
    evidenceFeed: [
      {
        badge: "NCAA",
        badgeTone: "scarlet",
        title: "Revenue-sharing agreement signed · OSU",
        hash: "SHA-256: osu-rsa-smith-2025.pdf · e4c2a1f8…",
        footer: "Team Marketing Rights · RFC 3161: 2025-08-01",
      },
      {
        badge: "Snap log",
        badgeTone: "blue",
        title: "710 snaps · Season 2025 · auto-logged",
        hash: "SHA-256: snap-log-smith-2025.json · f3a2c1d9…",
        footer: "Big Ten stats feed webhook · 440 broadcast mins",
      },
      {
        badge: "Settlement",
        badgeTone: "green",
        title: "Fall distribution settled · ACH",
        hash: "ACH-OSU-SMITH-2026-01 · settled Jan 2026",
        footer: "+$124,800 · Team Marketing Rights licence",
      },
    ],
    rightNotice:
      "Spring distribution pending. $124,800 seasonal trigger fired Jan 2026. Mark as settled when ACH confirms. NIL Go FMV record ready — all 3 stages cleared.",
    contextNote:
      "$15.375M football pool (75% of $20.5M). OSU football revenue: $111.6M FY24. Pool allocation is OSU's unilateral decision under House Settlement Art. 3 §2. Smith's SCORE record is the only independent FMV basis for the NIL Go review — or a dispute.",
  },
];