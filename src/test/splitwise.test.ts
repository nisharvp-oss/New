import { describe, expect, it } from "vitest";
import { computeSplits, netBalances, simplifyDebts, type Expense } from "@/lib/splitwise";

const exp = (paidBy: string, amount: number, ids: string[]): Expense => ({
  id: "x", groupId: "g", paidBy, amount, description: "", splitType: "equal",
  splits: computeSplits(amount, ids, "equal"), createdAt: "",
});

describe("splitwise", () => {
  it("equal split sums exactly to the total", () => {
    const s = computeSplits(100, ["a", "b", "c"], "equal");
    expect(s.reduce((t, x) => t + x.amount, 0)).toBeCloseTo(100, 2);
  });
  it("percent split follows percentages", () => {
    const s = computeSplits(200, ["a", "b"], "percent", { a: 25, b: 75 });
    expect(s.map((x) => x.amount)).toEqual([50, 150]);
  });
  it("simplifies a chain into direct transfers", () => {
    const t = simplifyDebts(netBalances([exp("a", 90, ["a", "b", "c"])]));
    expect(t).toEqual([
      { from: "b", to: "a", amount: 30 },
      { from: "c", to: "a", amount: 30 },
    ]);
  });
  it("settlement clears the debt", () => {
    const b = netBalances([exp("a", 60, ["a", "b"])], [{ id: "s", groupId: "g", from: "b", to: "a", amount: 30 }]);
    expect(simplifyDebts(b)).toEqual([]);
  });
});
