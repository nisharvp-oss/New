import { describe, expect, it } from "vitest";
import { googleTranslateUrl, LANGUAGES, PHRASEBOOK, PHRASES, phrasebookLanguages } from "@/lib/translate";
import { offersFor, validateOffer, type SponsorOffer } from "@/lib/sponsor-offers";
import { COUNTRIES, countryName, flag, searchCountries } from "@/lib/countries";

describe("translate", () => {
  it("builds a Google Translate link with the text filled in", () => {
    expect(googleTranslateUrl("Where is the toilet?", "ar")).toBe("https://translate.google.com/?sl=auto&tl=ar&text=Where+is+the+toilet%3F&op=translate");
  });

  it("has every phrase in every phrasebook language, and only for listed languages", () => {
    for (const [code, list] of Object.entries(PHRASEBOOK)) {
      expect(list).toHaveLength(PHRASES.length);
      expect(LANGUAGES.some((l) => l.code === code)).toBe(true);
    }
    expect(phrasebookLanguages().length).toBe(Object.keys(PHRASEBOOK).length);
  });
});

describe("countries", () => {
  it("names countries and builds flags", () => {
    expect(countryName("AE")).toBe("United Arab Emirates");
    expect(flag("ae")).toBe("🇦🇪");
    expect(COUNTRIES.length).toBeGreaterThan(240);
  });

  it("finds countries by name or code, best match first", () => {
    expect(searchCountries("ae")[0]!.code).toBe("AE");
    expect(searchCountries("united")[0]!.name.startsWith("United")).toBe(true);
  });
});

describe("eSIM offers", () => {
  const o = (id: string, countries: string[], sort_order = 0): SponsorOffer => ({ id, provider: id, headline: "", url: "https://x.com", flyer_url: null, countries, sort_order });
  const offers = [o("world", []), o("gulf", ["AE", "SA"], 2), o("uae", ["AE"], 1), o("uk", ["GB"])];

  it("shows country-specific offers first, then worldwide ones", () => {
    expect(offersFor(offers, "ae").map((x) => x.id)).toEqual(["uae", "gulf", "world"]);
    expect(offersFor(offers, "FR").map((x) => x.id)).toEqual(["world"]);
    expect(offersFor(offers, null)).toEqual([]);
  });

  it("tidies and checks an admin's offer", () => {
    expect(validateOffer({ provider: " Airalo ", headline: "", url: "https://airalo.com/x", countries: ["ae", "AE", " sa"] }))
      .toEqual({ value: { provider: "Airalo", headline: "", url: "https://airalo.com/x", countries: ["AE", "SA"] }, error: null });
    expect(validateOffer({ provider: "", headline: "", url: "https://a.com", countries: [] }).error).toMatch(/name/);
    expect(validateOffer({ provider: "A", headline: "", url: "http://a.com", countries: [] }).error).toMatch(/https/);
  });
});
