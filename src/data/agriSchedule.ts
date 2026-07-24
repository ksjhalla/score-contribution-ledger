// Shared decay/vesting schedule for the "agri" (Aisha Ng'etich) demo.
// Back-compat shim. The generic schedule module now lives in
// @/data/decaySchedule. This file only re-exports so existing imports of
// AGRI_SCHEDULE / AGRI_SERIES / computeAgriTotals / hasSchedule / scheduleFor
// keep working until every call site is migrated.
export * from "@/data/decaySchedule";
// primary + derivative contracts render one canonical set of numbers.

export type SeriesKey = "kaptumo" | "kabitet" | "cheptebo";
export type PointStatus = "Received" | "Pending" | "Projected";

export type AgriPoint = {
  year: number;
  status: PointStatus;
  amount?: number; // KES; undefined for projected — derived at read time
  note?: string;
};

export type AgriSeries = {
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
  perSeasonCap?: number; // KES
  points: AgriPoint[];
};

export const AGRI_TODAY_YEAR =
  typeof window === "undefined" ? new Date().getUTCFullYear() : new Date().getFullYear();

export const AGRI_YEARS = [2022, 2023, 2024, 2025, 2026, 2027] as const;

export const AGRI_SERIES: AgriSeries[] = [
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
    points: [
      { year: 2024, status: "Pending", amount: 13800, note: "awaiting Cheptebo NCE settlement" },
      { year: 2025, status: "Projected" },
      { year: 2026, status: "Projected" },
    ],
  },
];

export const rateAt = (s: AgriSeries, year: number): number | null => {
  if (year < s.startYear) return null;
  const n = year - s.startYear;
  return Math.max(s.startRate * (1 - s.decayPerYr * n), s.floor);
};

// Derive an amount for projected points by scaling the most recent known
// (Received or Pending) point on the same series by the rate ratio.
export const derivedAmount = (s: AgriSeries, p: AgriPoint): number | null => {
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

// Effective status honours the authored point status but reclassifies any
// still-"Pending" point whose year is strictly before today as Pending
// (unchanged) and any Projected point in the past as Pending. Real-time
// gating: future years are always Projected regardless of authored state.
export const effectiveStatus = (
  p: AgriPoint,
  today: number = AGRI_TODAY_YEAR,
): PointStatus => {
  if (p.year > today) return "Projected";
  return p.status;
};

export type AgriTotals = {
  received: number;
  pending: number;
  projected: number;
};

export const computeAgriTotals = (
  seriesKeys?: SeriesKey[],
  today: number = AGRI_TODAY_YEAR,
): AgriTotals => {
  const keep = seriesKeys ? new Set(seriesKeys) : null;
  let received = 0;
  let pending = 0;
  let projected = 0;
  for (const s of AGRI_SERIES) {
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

export const getSeries = (key: SeriesKey) =>
  AGRI_SERIES.find((s) => s.key === key)!;

export const ALL_SERIES_KEYS: SeriesKey[] = AGRI_SERIES.map((s) => s.key);

// ---- Cross-profile schedule registry ---------------------------------------
// Keeps the door open for future demo profiles to register their own decay
// schedules without the Wallet / other consumers needing to know about agri
// specifically. Today only the agri profile has one.

import type { DemoKey } from "./demoProfiles";

export type DemoSchedule = {
  currency: string;
  totals: (today?: number) => AgriTotals;
};

const SCHEDULES: Partial<Record<DemoKey, DemoSchedule>> = {
  agri: {
    currency: "KES",
    totals: (today) => computeAgriTotals(undefined, today ?? AGRI_TODAY_YEAR),
  },
};

export const scheduleFor = (key: DemoKey): DemoSchedule | undefined => SCHEDULES[key];
export const hasSchedule = (key: DemoKey): boolean => Boolean(SCHEDULES[key]);