// Generic decay/vesting schedule module. Originally built for "agri" (Aisha
// Ng'etich) as agriSchedule.ts — generalized so any DemoKey can register a
// schedule and get the same timeline/table/totals machinery for free.
// Profiles with no registered schedule simply don't render this UI at all;
// nothing about DecayTimeline or DecayContractsView assumes agri specifically.

import type { DemoKey } from "@/data/demoProfiles";

export type SeriesKey = string;
export type PointStatus = "Received" | "Pending" | "Projected";

export type DecayPoint = {
  year: number;
  status: PointStatus;
  amount?: number; // in the schedule's currency; undefined for projected — derived at read time
  note?: string;
};

export type DecaySeries = {
  key: SeriesKey;
  label: string;
  shortLabel: string;
  kind: "primary" | "derivative";
  color: string;
  dashed?: boolean;
  startYear: number;
  startRate: number; // %
  decayPerYr: number; // fraction, e.g. 0.15 = -15%/yr linear
  floor: number;
  perSeasonCap?: number;
  points: DecayPoint[];
  // Optional per-year display text (season label, proof string) — was
  // KAPTUMO_META in the agri-only component; now lives with the series data
  // it actually describes.
  pointMeta?: Record<number, { label: string; proof?: string }>;
  // Derivative-only linkage metadata for the origin → licence diagram.
  fingerprint?: string;
  executedDate?: string;
};

export type DecaySchedule = {
  profileKey: DemoKey;
  currency: string; // "KES" | "ZAR" | "USD" | ...
  years: readonly number[];
  yAxisMax: number; // chart Y-axis ceiling, in % — set above the highest startRate
  floorAnnotation?: { seriesKey: SeriesKey; label: string }; // which floor line (if any) to call out on the chart
  // Shared origin-asset context for the linkage diagram, if this schedule has derivatives.
  originAsset?: { name: string; fingerprint: string; anchoredNote: string };
  // Which entries in this profile's demoProfiles.contracts[] the primary/derivative
  // series correspond to. Defaults to 0/1 (agri's original layout) — set
  // explicitly whenever a profile's decaying contracts aren't the first two
  // in its contracts array (e.g. Thandi's Novo Nordisk derivative is
  // contracts[2], Mateo's primary is contracts[1]).
  primaryContractIndex?: number;
  derivativeContractIndex?: number;
  series: DecaySeries[];
};

// Registry — add an entry here to light up the decay timeline / schedule
// table / contract selector for that profile. Profiles not listed here don't
// get this UI at all; DecayContractsView falls back to nothing (the caller
// decides what to render instead, e.g. the plain existing Contracts page).
export const SCHEDULES: Partial<Record<DemoKey, DecaySchedule>> = {
  agri: {
    profileKey: "agri",
    currency: "KES",
    years: [2022, 2023, 2024, 2025, 2026, 2027],
    yAxisMax: 8,
    floorAnnotation: { seriesKey: "kaptumo", label: "Kaptumo floor 3%" },
    originAsset: {
      name: "Anaerobic fermentation technique",
      fingerprint: "sha256: 9b4e2a1c…",
      anchoredNote: "anchored 2022",
    },
    series: [
      {
        key: "kaptumo",
        label: "Kaptumo premium pool",
        shortLabel: "Kaptumo",
        kind: "primary",
        color: "#5C7A3A",
        startYear: 2022,
        startRate: 8,
        decayPerYr: 0.15,
        floor: 3,
        pointMeta: {
          2022: { label: "Season 2022 · Lot KMT-2022-011", proof: "M-PESA · sha256: 2c8b5f…" },
          2023: { label: "Season 2023 · Lot KMT-2023-019", proof: "M-PESA · sha256: 7d1e4a…" },
          2024: { label: "Season 2024 · Lot KMT-2024-007", proof: "NCE Week 18 · awaiting M-PESA" },
          2025: { label: "Season 2025 (projected)" },
          2026: { label: "Season 2026 (projected)" },
          2027: { label: "Season 2027 (projected · at floor)" },
        },
        points: [
          { year: 2022, status: "Received", amount: 58000 },
          { year: 2023, status: "Received", amount: 68000 },
          { year: 2024, status: "Pending", amount: 62000 },
          { year: 2025, status: "Projected" },
          { year: 2026, status: "Projected" },
          { year: 2027, status: "Projected" },
        ],
      },
      {
        key: "kabitet",
        label: "Kabitet derivative licence",
        shortLabel: "Kabitet",
        kind: "derivative",
        color: "#C4892A",
        dashed: true,
        startYear: 2023,
        startRate: 3,
        decayPerYr: 0.2,
        floor: 0,
        perSeasonCap: 5000,
        fingerprint: "sha256: 4f7a1c… → 9b4e2a1c…",
        executedDate: "14 Apr 2023",
        points: [
          { year: 2023, status: "Received", amount: 14200, note: "M-PESA settled" },
          { year: 2024, status: "Pending", amount: 11400, note: "awaiting Kabitet NCE settlement" },
          { year: 2025, status: "Projected" },
        ],
      },
      {
        key: "cheptebo",
        label: "Cheptebo derivative licence",
        shortLabel: "Cheptebo",
        kind: "derivative",
        color: "#2A5C8A",
        dashed: true,
        startYear: 2024,
        startRate: 3,
        decayPerYr: 0.2,
        floor: 0,
        perSeasonCap: 5000,
        fingerprint: "sha256: 8c2e5b… → 9b4e2a1c…",
        executedDate: "22 Feb 2024",
        points: [
          { year: 2024, status: "Pending", amount: 13800, note: "awaiting Cheptebo NCE settlement" },
          { year: 2025, status: "Projected" },
          { year: 2026, status: "Projected" },
        ],
      },
    ],
  },
  pharma: {
    profileKey: "pharma",
    currency: "ZAR",
    years: [2024, 2025, 2026, 2027],
    yAxisMax: 3,
    floorAnnotation: { seriesKey: "aspenProcess", label: "Aspen floor 1.0%" },
    // contracts[0] = Aspen Process Innovation Agreement (primary, correct default).
    // contracts[1] = SA Patent 2024/08441 (attribution-only, not part of this schedule).
    // contracts[2] = GLP-1 TTA Extension · Novo Nordisk (the actual derivative).
    derivativeContractIndex: 2,
    // Reuses Thandi's real, already-filed patent as the origin asset —
    // SA Patent 2024/08441 already exists in her contracts array. No new
    // hash invented for something that was never anchored on-chain.
    originAsset: {
      name: "Sterile fill-and-finish process innovation",
      fingerprint: "SA Patent 2024/08441",
      anchoredNote: "filed Aug 2024",
    },
    series: [
      {
        key: "aspenProcess",
        label: "Aspen Process Innovation Agreement",
        shortLabel: "Aspen",
        kind: "primary",
        color: "#2A5C8A",
        startYear: 2024,
        // 2.4% is Thandi's real, already-stated contract rate (not invented).
        // Decay rate/floor are new — a process royalty step-down as newer
        // manufacturing techniques get adopted is a standard real-world
        // pattern, applied only to the forward-looking part of the stake.
        startRate: 2.4,
        decayPerYr: 0.08,
        floor: 1.0,
        pointMeta: {
          2024: {
            label: "WHO PQ granted + batch volume confirmed",
            proof: "WHO/PQ/2024-ZA-0312 · GMP batch register",
          },
          2025: { label: "2025 (projected)" },
          2026: { label: "2026 (projected)" },
          2027: { label: "2027 (projected)" },
        },
        points: [
          // 420,000 (WHO PQ) + 180,000 (batch volume) = 600,000 — matches
          // Thandi's existing stats.settled exactly. Not a new number.
          { year: 2024, status: "Received", amount: 600000 },
          { year: 2025, status: "Projected" },
          { year: 2026, status: "Projected" },
          { year: 2027, status: "Projected" },
        ],
      },
      {
        key: "novoNordisk",
        label: "Novo Nordisk GLP-1 sublicence",
        shortLabel: "Novo Nordisk",
        kind: "derivative",
        color: "#C4892A",
        dashed: true,
        startYear: 2025,
        // Sublicence starts below the origin rate, same pattern as agri's
        // derivatives (3% vs Aisha's 8% origin) — a second company licensing
        // the same underlying process for a different product line.
        startRate: 1.2,
        decayPerYr: 0.15,
        floor: 0,
        // No fingerprint/executedDate: this licence hasn't been executed yet
        // (TTA signature is still pending in Thandi's existing data), so
        // there's no real hash to show. Fabricating one would misrepresent
        // something that hasn't actually happened.
        points: [
          // 340,000 matches Thandi's existing "Est. R340K on activation" —
          // not a new number, just placed on the timeline.
          { year: 2025, status: "Pending", amount: 340000, note: "TTA signature pending" },
          { year: 2026, status: "Projected" },
          { year: 2027, status: "Projected" },
        ],
      },
    ],
  },
  ai: {
    profileKey: "ai",
    currency: "USD",
    years: [2025, 2026, 2027, 2028],
    yAxisMax: 5,
    floorAnnotation: { seriesKey: "enterpriseLibrary", label: "Floor 1%" },
    // contracts[0] = Dataset Attribution Record (attribution only, no revenue figure).
    // contracts[1] = Library Integration Royalty · Enterprise — the actual primary series.
    // contracts[2] = Ecosystem Reuse Stake — deliberately excluded, see note below.
    primaryContractIndex: 1,
    // Deliberately single-series, no derivative/origin-linkage diagram.
    // Mateo's "Dataset Attribution Record" carries no revenue figure to
    // build a curve from, and his "Ecosystem Reuse Stake" is explicitly
    // framed in his own bio/quickRead as *growing* long-tail upside, not
    // decaying — forcing either into this shape would misrepresent what's
    // already on his page. Only "Library Integration Royalty · Enterprise"
    // is a real, single negotiated revenue share with a firm number
    // ($200K, pending, dated 2025-02-10) that a decay curve can sit on
    // without contradicting anything already shown.
    series: [
      {
        key: "enterpriseLibrary",
        label: "Library Integration Royalty",
        shortLabel: "Enterprise licence",
        kind: "primary",
        color: "#5B5FBF",
        startYear: 2025,
        // Rate/decay are new (Mateo's contract text states no %) — modeled
        // as a modest single-digit enterprise rev-share that steps down as
        // the vendor's own tooling matures or competing libraries emerge.
        startRate: 4,
        decayPerYr: 0.12,
        floor: 1,
        pointMeta: {
          2025: { label: "Enterprise deployment confirmed", proof: "Attestation + usage telemetry" },
          2026: { label: "2026 (projected)" },
          2027: { label: "2027 (projected)" },
          2028: { label: "2028 (projected · near floor)" },
        },
        points: [
          // 200,000 matches Mateo's existing pending execution amount exactly.
          { year: 2025, status: "Pending", amount: 200000 },
          { year: 2026, status: "Projected" },
          { year: 2027, status: "Projected" },
          { year: 2028, status: "Projected" },
        ],
      },
    ],
  },
  // Note: Mateo's "Ecosystem Reuse Stake · Forks & Dependencies" contract
  // intentionally has no series here — see comment above. If that story
  // ever gets its own visualization, it should be a growth chart, not this
  // decay component reused in reverse.
};

export const hasSchedule = (key: DemoKey): boolean => key in SCHEDULES;

export const scheduleFor = (key: DemoKey): DecaySchedule | undefined => SCHEDULES[key];

export const todayYear = (): number =>
  typeof window === "undefined" ? new Date().getUTCFullYear() : new Date().getFullYear();

export const rateAt = (s: DecaySeries, year: number): number | null => {
  if (year < s.startYear) return null;
  const n = year - s.startYear;
  return Math.max(s.startRate * (1 - s.decayPerYr * n), s.floor);
};

export const derivedAmount = (s: DecaySeries, p: DecayPoint): number | null => {
  if (p.amount != null) return p.amount;
  const known = [...s.points]
    .filter((q) => q.amount != null && q.year <= p.year)
    .sort((a, b) => b.year - a.year)[0];
  const r = rateAt(s, p.year);
  if (!known || r == null) return null;
  const kr = rateAt(s, known.year);
  if (!kr) return null;
  const est = Math.round((known.amount as number) * (r / kr));
  return s.perSeasonCap ? Math.min(est, s.perSeasonCap) : est;
};

export const effectiveStatus = (p: DecayPoint, today: number): PointStatus => {
  if (p.year > today) return "Projected";
  return p.status;
};

export type ScheduleTotals = { received: number; pending: number; projected: number };

export const computeTotals = (
  schedule: DecaySchedule,
  seriesKeys?: SeriesKey[],
  today: number = todayYear(),
): ScheduleTotals => {
  const keep = seriesKeys ? new Set(seriesKeys) : null;
  let received = 0;
  let pending = 0;
  let projected = 0;
  for (const s of schedule.series) {
    if (keep && !keep.has(s.key)) continue;
    for (const p of s.points) {
      const st = effectiveStatus(p, today);
      const amt = derivedAmount(s, p) ?? 0;
      if (st === "Received") received += amt;
      else if (st === "Pending") pending += amt;
      else projected += amt;
    }
  }
  return { received, pending, projected };
};

export const getSeries = (schedule: DecaySchedule, key: SeriesKey) =>
  schedule.series.find((s) => s.key === key)!;

export const allSeriesKeys = (schedule: DecaySchedule): SeriesKey[] =>
  schedule.series.map((s) => s.key);

// --- Back-compat aliases for the original agri-only module, so nothing
// currently importing from "@/data/agriSchedule" breaks while call sites
// are migrated over to the generic module. Delete once migration is done.
export const AGRI_SCHEDULE = SCHEDULES.agri!;
export const AGRI_SERIES = AGRI_SCHEDULE.series;
export const AGRI_TODAY_YEAR = todayYear();
export const AGRI_YEARS = AGRI_SCHEDULE.years;
export const ALL_SERIES_KEYS = allSeriesKeys(AGRI_SCHEDULE);
export const computeAgriTotals = (seriesKeys?: SeriesKey[], today?: number) =>
  computeTotals(AGRI_SCHEDULE, seriesKeys, today);
export const getSeriesLegacy = (key: SeriesKey) => getSeries(AGRI_SCHEDULE, key);
