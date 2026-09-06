/** Pure calculation helpers — kept free of Prisma/Next so they can be unit-tested. */

export type MaintenanceFrequency = "MONTHLY" | "QUARTERLY" | "SEMIANNUAL" | "ANNUAL";

/** Frequency → days, as noted in PLANO.md (not stored in the schema). */
export const MAINTENANCE_FREQUENCY_DAYS: Record<MaintenanceFrequency, number> = {
  MONTHLY: 30,
  QUARTERLY: 90,
  SEMIANNUAL: 180,
  ANNUAL: 365,
};

export function budgetProgress(spent: number, limit: number) {
  const pct = limit > 0 ? Math.min(100, Math.round((spent / limit) * 100)) : 0;
  return { pct, over: spent > limit };
}

/** Tithe goal is 10% of income for the period. */
export function titheGoalProgress(titheGiven: number, income: number) {
  const target = income * 0.1;
  const pct = target > 0 ? Math.min(100, Math.round((titheGiven / target) * 100)) : 0;
  return { target, pct };
}

/** Calendar-day difference. Negative = overdue. */
export function daysUntil(date: Date, now: Date = new Date()) {
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return Math.round((end.getTime() - start.getTime()) / 86_400_000);
}

export function nextMaintenanceDate(from: Date, frequency: MaintenanceFrequency) {
  const days = MAINTENANCE_FREQUENCY_DAYS[frequency];
  const next = new Date(from.getTime());
  next.setDate(next.getDate() + days);
  return next;
}
