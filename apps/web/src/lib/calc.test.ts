import { describe, expect, it } from "vitest";
import {
  budgetProgress,
  daysUntil,
  MAINTENANCE_FREQUENCY_DAYS,
  nextMaintenanceDate,
  titheGoalProgress,
} from "./calc";

describe("budgetProgress", () => {
  it("returns percent of limit used, capped at 100", () => {
    expect(budgetProgress(500, 1000)).toEqual({ pct: 50, over: false });
    expect(budgetProgress(1000, 1000)).toEqual({ pct: 100, over: false });
    expect(budgetProgress(1200, 1000)).toEqual({ pct: 100, over: true });
  });

  it("handles zero or empty limit", () => {
    expect(budgetProgress(50, 0)).toEqual({ pct: 0, over: true });
    expect(budgetProgress(0, 800)).toEqual({ pct: 0, over: false });
  });

  it("rounds to nearest integer", () => {
    expect(budgetProgress(1, 3).pct).toBe(33);
  });
});

describe("titheGoalProgress", () => {
  it("uses 10% of income as the goal", () => {
    expect(titheGoalProgress(980, 9800)).toEqual({ target: 980, pct: 100 });
    expect(titheGoalProgress(490, 9800)).toEqual({ target: 980, pct: 50 });
  });

  it("caps at 100% when above the goal", () => {
    expect(titheGoalProgress(1500, 9800).pct).toBe(100);
  });

  it("returns 0% when income is zero", () => {
    expect(titheGoalProgress(100, 0)).toEqual({ target: 0, pct: 0 });
  });
});

describe("daysUntil", () => {
  const now = new Date(2026, 7, 30); // 30 Aug 2026

  it("returns positive days for future dates", () => {
    expect(daysUntil(new Date(2026, 8, 3), now)).toBe(4);
  });

  it("returns 0 for the same calendar day", () => {
    expect(daysUntil(new Date(2026, 7, 30, 23, 59), now)).toBe(0);
  });

  it("returns negative days when overdue", () => {
    expect(daysUntil(new Date(2026, 7, 25), now)).toBe(-5);
  });
});

describe("nextMaintenanceDate", () => {
  const from = new Date(2026, 0, 15); // 15 Jan 2026

  it("maps each frequency to the documented day offsets", () => {
    expect(MAINTENANCE_FREQUENCY_DAYS).toEqual({
      MONTHLY: 30,
      QUARTERLY: 90,
      SEMIANNUAL: 180,
      ANNUAL: 365,
    });
  });

  it("advances by the frequency day count", () => {
    expect(nextMaintenanceDate(from, "MONTHLY")).toEqual(new Date(2026, 1, 14));
    expect(nextMaintenanceDate(from, "QUARTERLY")).toEqual(new Date(2026, 3, 15));
    expect(nextMaintenanceDate(from, "SEMIANNUAL")).toEqual(new Date(2026, 6, 14));
    expect(nextMaintenanceDate(from, "ANNUAL")).toEqual(new Date(2027, 0, 15));
  });
});
