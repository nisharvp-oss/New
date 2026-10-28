import { describe, expect, it } from "vitest";
import { isWritable, trialDaysLeft, withinLimit } from "@/lib/subscription";

const now = new Date("2026-10-27T12:00:00Z");

describe("subscription rules", () => {
  it("trial company can edit until trial end", () => {
    expect(isWritable({ status: "trial", trial_ends_at: "2026-11-01T00:00:00Z", paid_until: null }, now)).toBe(true);
  });
  it("expired trial becomes read-only", () => {
    expect(isWritable({ status: "trial", trial_ends_at: "2026-10-26T00:00:00Z", paid_until: null }, now)).toBe(false);
  });
  it("suspended company is read-only", () => {
    expect(isWritable({ status: "suspended", trial_ends_at: null, paid_until: null }, now)).toBe(false);
  });
  it("active company with lapsed paid-until is read-only", () => {
    expect(isWritable({ status: "active", trial_ends_at: null, paid_until: "2026-10-01T00:00:00Z" }, now)).toBe(false);
  });
  it("counts trial days left rounding up", () => {
    expect(trialDaysLeft({ status: "trial", trial_ends_at: "2026-10-29T00:00:00Z", paid_until: null }, now)).toBe(2);
  });
  it("plan limit blocks at the cap and null means unlimited", () => {
    expect(withinLimit(3, 3)).toBe(false);
    expect(withinLimit(2, 3)).toBe(true);
    expect(withinLimit(999, null)).toBe(true);
  });
});
