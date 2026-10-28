import { describe, expect, it } from "vitest";
import { AIRLINES, airlineFromFlight, checkinSearchUrl, searchAirlines } from "@/lib/airlines";
import { detectPlatform, mapLinks, shareText } from "@/lib/maps";

describe("airlines", () => {
  it("lists each airline once, with an https check-in page", () => {
    expect(new Set(AIRLINES.map((a) => a.code)).size).toBe(AIRLINES.length);
    for (const a of AIRLINES) expect(a.url).toMatch(/^https:\/\//);
  });

  it("finds airlines by code first, then by name or country", () => {
    expect(searchAirlines("ek")[0]!.name).toBe("Emirates");
    expect(searchAirlines("qatar")[0]!.code).toBe("QR");
    expect(searchAirlines("air").map((a) => a.code)).toContain("G9");
    expect(searchAirlines("india").map((a) => a.code)).toEqual(expect.arrayContaining(["AI", "6E"]));
    expect(searchAirlines("zzz")).toEqual([]);
  });

  it("lists everything alphabetically when the search is empty", () => {
    const names = searchAirlines("").map((a) => a.name);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
  });

  it("recognises the airline in a flight number", () => {
    expect(airlineFromFlight("EK 202 New York → Dubai")?.name).toBe("Emirates");
    expect(airlineFromFlight("flight fz1543")?.name).toBe("flydubai");
    expect(airlineFromFlight("6E 1407")?.name).toBe("IndiGo");
    expect(airlineFromFlight("Burj Khalifa, At the Top")).toBeNull();
  });

  it("falls back to a search for airlines not listed", () => {
    expect(checkinSearchUrl("Cathay Pacific")).toBe("https://www.google.com/search?q=Cathay%20Pacific%20online%20check-in");
  });
});

describe("maps", () => {
  const sos = { lat: 25.197197, lng: 55.274376, label: "Alex Rivera" };

  it("opens the point in Google Maps, Apple Maps and Waze", () => {
    const links = mapLinks(sos);
    expect(links.map((l) => l.id)).toEqual(["google", "apple", "waze"]);
    expect(links[0]!.url).toBe("https://www.google.com/maps/search/?api=1&query=25.197197,55.274376");
    expect(links[2]!.url).toBe("https://waze.com/ul?ll=25.197197,55.274376&navigate=yes");
  });

  it("offers the phone's own app chooser first on Android", () => {
    const links = mapLinks(sos, "android");
    expect(links[0]).toMatchObject({ id: "device", url: "geo:25.197197,55.274376?q=25.197197,55.274376(Alex%20Rivera)" });
  });

  it("detects the platform from the browser", () => {
    expect(detectPlatform("Mozilla/5.0 (Linux; Android 14)")).toBe("android");
    expect(detectPlatform("Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)")).toBe("ios");
    expect(detectPlatform("Mozilla/5.0 (Windows NT 10.0)")).toBe("other");
  });

  it("writes a shareable message with a map link", () => {
    expect(shareText(sos)).toBe("Alex Rivera: https://www.google.com/maps/search/?api=1&query=25.197197,55.274376");
  });
});
