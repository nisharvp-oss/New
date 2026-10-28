import { describe, expect, it } from "vitest";
import { buildPricingTiers, money, type PlanRow } from "@/lib/pricing";

const terms = { freeTravelers: 10, unlockPrice: 20, unlockMaxTravelers: 100, currency: "USD", salesEmail: "sales@example.com" };
const plan = (over: Partial<PlanRow>): PlanRow => ({
  id: "p", name: "Plan", description: null, price: 0, billing_interval: "month", max_trips: null,
  max_organisers: null, max_travelers_per_trip: null, features: [], ...over,
});

describe("buildPricingTiers", () => {
  const tiers = buildPricingTiers([
    plan({ id: "org", name: "Organiser", price: 35, max_trips: 15, max_travelers_per_trip: 100 }),
    plan({ id: "biz", name: "Business", price: 50, max_trips: 25, max_travelers_per_trip: 100, features: ["Ad-free"], ad_free: true }),
    plan({ id: "ent", name: "Enterprise", contact_sales: true, features: ["Volume pricing"] }),
  ], terms);

  it("lists Free Zone and Pay as you go first, then plans, then contact-sales plans", () => {
    expect(tiers.map((t) => t.name)).toEqual(["Free Zone", "Pay as you go", "Organiser", "Business", "Enterprise"]);
  });

  it("builds the free tiers from the personal-trip settings", () => {
    expect(tiers[0]).toMatchObject({ price: "$0", per: "forever" });
    expect(tiers[0]!.points[0]).toBe("Trips of up to 10 people");
    expect(tiers[1]).toMatchObject({ price: "$20", per: "per trip" });
    expect(tiers[1]!.points[0]).toBe("Up to 100 travelers on that trip");
  });

  it("badges ad-free plans", () => {
    expect(tiers.find((t) => t.name === "Business")!.badge).toBe("Ad-free");
  });

  it("describes plan limits per year and per trip, then the plan's own features", () => {
    expect(tiers[3]!.points).toEqual(["Up to 25 trips a year", "Up to 100 people per trip", "Ad-free"]);
    expect(tiers[2]!.cta).toEqual({ kind: "signup", plan: "org" });
  });

  it("highlights the last paid plan and sends contact-sales plans to email without a price", () => {
    expect(tiers.filter((t) => t.highlight).map((t) => t.name)).toEqual(["Business"]);
    expect(tiers.find((t) => t.name === "Organiser")!.badge).toBeNull();
    expect(tiers[4]).toMatchObject({ price: null, cta: { kind: "contact", email: "sales@example.com" } });
  });
});

describe("money", () => {
  it("drops cents for whole amounts and keeps them otherwise", () => {
    expect(money(35, "USD")).toBe("$35");
    expect(money(19.5, "USD")).toBe("$19.50");
  });
});
