// Back-compat shim. The generic schedule module now lives in
// @/data/decaySchedule. This file only re-exports so existing imports of
// AGRI_SCHEDULE / AGRI_SERIES / computeAgriTotals / hasSchedule / scheduleFor
// keep working until every call site is migrated.
export * from "@/data/decaySchedule";
