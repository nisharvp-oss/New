import { describe, expect, it } from "vitest";
import { embassySearchUrl, SCHENGEN, SCHENGEN_URL, validateVisaPage, VISA_PAGES, visaLinkFor, visaRulesSearchUrl } from "@/lib/visa";
import { bearing, cardinal, headingFrom, unwrap } from "@/lib/compass";
import { budgetStatus, byDay, totalsByCurrency, type MyExpense } from "@/lib/my-expenses";
import { shrinkToFit, SHRINK_STEPS } from "@/lib/image-upload";
import { COUNTRY_CODES } from "@/lib/countries";

describe("visa pages", () => {
  it("lists each country once, with an https official page", () => {
    expect(new Set(VISA_PAGES.map((p) => p.code)).size).toBe(VISA_PAGES.length);
    for (const p of VISA_PAGES) {
      expect(COUNTRY_CODES).toContain(p.code);
      expect(validateVisaPage(p).error).toBeNull();
    }
  });

  it("uses the listed page, then the EU page for Schengen, then a search", () => {
    expect(visaLinkFor("ae", "United Arab Emirates")).toMatchObject({ url: "https://smartservices.icp.gov.ae", source: "official" });
    expect(SCHENGEN).toContain("ES");
    expect(visaLinkFor("ES", "Spain")).toMatchObject({ url: SCHENGEN_URL, source: "schengen" });
    expect(visaLinkFor("PE", "Peru")).toMatchObject({ url: "https://www.google.com/search?q=Peru%20official%20visa%20application", source: "search" });
  });

  it("lets admin edits replace the bundled list", () => {
    expect(visaLinkFor("PE", "Peru", [{ code: "PE", url: "https://example.gob.pe", note: "Migraciones" }]).url).toBe("https://example.gob.pe");
  });

  it("searches rules and embassies for the traveler's passport", () => {
    expect(visaRulesSearchUrl("Japan", "India")).toBe("https://www.google.com/search?q=Japan%20visa%20requirements%20for%20India%20citizens");
    expect(embassySearchUrl("Japan", "India")).toBe("https://www.google.com/search?q=Japan%20embassy%20in%20India");
  });

  it("explains what's wrong with an admin's edit", () => {
    expect(validateVisaPage({ code: "", url: "https://a.gov", note: "" }).error).toMatch(/country/);
    expect(validateVisaPage({ code: "ae", url: "http://a.gov", note: "" }).error).toMatch(/https/);
    expect(validateVisaPage({ code: " ae ", url: " https://a.gov ", note: " x " }).value).toEqual({ code: "AE", url: "https://a.gov", note: "x" });
  });
});

describe("compass", () => {
  it("reads iOS and Android headings and corrects for a sideways screen", () => {
    expect(headingFrom({ alpha: 10, webkitCompassHeading: 90 })).toBe(90);
    expect(headingFrom({ alpha: 90, absolute: true })).toBe(270);
    expect(headingFrom({ alpha: 0, absolute: true }, 90)).toBe(90);
    expect(headingFrom({ alpha: 90, absolute: false })).toBeNull();
  });

  it("finds the bearing between two places", () => {
    expect(bearing({ lat: 0, lng: 0 }, { lat: 1, lng: 0 })).toBeCloseTo(0);
    expect(bearing({ lat: 0, lng: 0 }, { lat: 0, lng: 1 })).toBeCloseTo(90);
    expect(bearing({ lat: 25.2, lng: 55.27 }, { lat: 24.45, lng: 54.38 })).toBeGreaterThan(225);
  });

  it("names directions and turns the short way past north", () => {
    expect([0, 44, 90, 200, 350].map(cardinal)).toEqual(["N", "NE", "E", "S", "N"]);
    expect(unwrap(359, 1)).toBe(361);
    expect(unwrap(10, 350)).toBe(-10);
  });
});

describe("my expenses", () => {
  const e = (id: string, amount: number, currency: string, category: MyExpense["category"], spent_on: string): MyExpense => ({ id, amount, currency, category, note: "", spent_on, receipt_path: null });
  const list = [e("1", 12.5, "AED", "food", "2026-11-02"), e("2", 40, "AED", "transport", "2026-11-02"), e("3", 7.25, "AED", "food", "2026-11-03"), e("4", 20, "USD", "shopping", "2026-11-03")];

  it("totals per currency without mixing them", () => {
    expect(totalsByCurrency(list)).toEqual([
      { currency: "AED", total: 59.75, categories: [{ category: "transport", total: 40 }, { category: "food", total: 19.75 }] },
      { currency: "USD", total: 20, categories: [{ category: "shopping", total: 20 }] },
    ]);
  });

  it("groups by day, newest first", () => {
    const days = byDay(list);
    expect(days.map((d) => d.date)).toEqual(["2026-11-03", "2026-11-02"]);
    expect(days[0]!.totals).toEqual([{ currency: "USD", total: 20 }, { currency: "AED", total: 7.25 }]);
  });

  it("tracks a budget in its own currency", () => {
    expect(budgetStatus(list, { amount: 100, currency: "AED" })).toEqual({ spent: 59.75, left: 40.25, over: false, pct: 60 });
    expect(budgetStatus(list, { amount: 15, currency: "USD" })).toMatchObject({ over: true, left: -5, pct: 100 });
  });
});

describe("receipt shrinking", () => {
  const fake = (sizeFor: (edge: number, q: number) => number) => async (edge: number, q: number) => new Blob([new Uint8Array(sizeFor(edge, q))]);

  it("keeps the sharpest version that fits in 50 KB", async () => {
    const tried: number[] = [];
    const blob = await shrinkToFit(fake((edge, q) => { tried.push(edge); return Math.round(edge * edge * q * 0.08); }));
    expect(blob.size).toBeLessThanOrEqual(50 * 1024);
    expect(tried[0]).toBe(SHRINK_STEPS[0]!.edge);
    expect(tried.length).toBeLessThan(SHRINK_STEPS.length);
  });

  it("returns a small photo on the first try", async () => {
    expect((await shrinkToFit(fake(() => 9000))).size).toBe(9000);
  });

  it("explains when a photo can't be made small enough", async () => {
    await expect(shrinkToFit(fake(() => 80 * 1024))).rejects.toThrow(/below 50 KB/);
  });
});
