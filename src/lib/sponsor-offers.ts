/**
 * Sponsored offers in Tools, matched to the traveler's destination: eSIM providers and visa agencies.
 * Super admins add each one with a flyer, the sponsor's link and the countries it covers (none =
 * worldwide). Country offers show first, then worldwide ones, each in admin order.
 */
export type OfferKind = "esim" | "visa";

export const OFFER_KINDS = {
  esim: { table: "esim_offers", rpc: "record_esim_click", folder: "esim", noun: "eSIM offer", cta: "Get this eSIM" },
  visa: { table: "visa_agencies", rpc: "record_visa_click", folder: "visa", noun: "visa agency", cta: "Contact this agency" },
} as const satisfies Record<OfferKind, { table: string; rpc: string; folder: string; noun: string; cta: string }>;

export type SponsorOffer = {
  id: string; provider: string; headline: string; url: string;
  flyer_url: string | null; countries: string[]; sort_order: number;
};
export type OfferInput = { provider: string; headline: string; url: string; countries: string[] };

/** Offers for a country: ones made for that country first, then worldwide ones, each in admin order. */
export function offersFor<T extends Pick<SponsorOffer, "countries" | "sort_order" | "provider">>(offers: T[], country: string | null): T[] {
  if (!country) return [];
  const c = country.toUpperCase();
  const local = offers.filter((o) => o.countries.includes(c));
  const global = offers.filter((o) => o.countries.length === 0);
  const byOrder = (a: T, b: T) => a.sort_order - b.sort_order || a.provider.localeCompare(b.provider);
  return [...local.sort(byOrder), ...global.sort(byOrder)];
}

export const isHttpsUrl = (url: string) => {
  try { return new URL(url).protocol === "https:" && !/\s/.test(url); } catch { return false; }
};

/** Cleans an admin's offer and says what's wrong with it, matching the database checks. */
export function validateOffer(input: OfferInput): { value: OfferInput; error: string | null } {
  const value = {
    provider: input.provider.trim(),
    headline: input.headline.trim(),
    url: input.url.trim(),
    countries: [...new Set(input.countries.map((c) => c.trim().toUpperCase()).filter(Boolean))].sort(),
  };
  if (!value.provider) return { value, error: "Enter the sponsor's name" };
  if (!isHttpsUrl(value.url)) return { value, error: "Enter the sponsor's full link, starting with https://" };
  if (value.countries.some((c) => !/^[A-Z]{2}$/.test(c))) return { value, error: "Pick countries from the list" };
  return { value, error: null };
}
