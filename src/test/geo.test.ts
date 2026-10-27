import { describe, expect, it } from "vitest";
import { distanceKm, freeTripCap, sortSponsors } from "@/lib/geo";

const base = { created_at: "2026-01-01" };

describe("sponsors", () => {
  it("measures distance between Dubai Mall and Burj Al Arab (~15 km)", () => {
    const d = distanceKm({ lat: 25.1972, lng: 55.2796 }, { lat: 25.1412, lng: 55.1853 });
    expect(d).toBeGreaterThan(10);
    expect(d).toBeLessThan(13);
  });

  it("lists premium sponsors first even when farther away", () => {
    const list = [
      { ...base, id: "near", is_premium: false, lat: 25.2, lng: 55.28 },
      { ...base, id: "far-premium", is_premium: true, lat: 25.0, lng: 55.0 },
    ];
    expect(sortSponsors(list, { lat: 25.2, lng: 55.28 }).map((s) => s.id)).toEqual(["far-premium", "near"]);
  });

  it("orders non-premium sponsors by distance", () => {
    const list = [
      { ...base, id: "far", is_premium: false, lat: 25.0, lng: 55.0 },
      { ...base, id: "near", is_premium: false, lat: 25.2, lng: 55.28 },
    ];
    expect(sortSponsors(list, { lat: 25.2, lng: 55.28 }).map((s) => s.id)).toEqual(["near", "far"]);
  });
});

describe("free trips", () => {
  it("caps personal trips at the free limit until unlocked", () => {
    expect(freeTripCap("personal", false, 10)).toBe(10);
    expect(freeTripCap("personal", true, 10)).toBeNull();
    expect(freeTripCap("company", false, 10)).toBeNull();
  });
});
