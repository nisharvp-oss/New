/**
 * eSIM offers are sponsored links that super admins add in Admin → eSIM: a provider, a flyer, the
 * sponsor's link and the countries it covers (none = worldwide). Travelers pick a destination in Tools.
 */
export type EsimOffer = {
  id: string; provider: string; headline: string; url: string;
  flyer_url: string | null; countries: string[]; sort_order: number;
};
export type EsimInput = { provider: string; headline: string; url: string; countries: string[] };

/** Offers for a country: ones made for that country first, then worldwide ones, each in admin order. */
export function offersFor(offers: EsimOffer[], country: string | null): EsimOffer[] {
  if (!country) return [];
  const c = country.toUpperCase();
  const local = offers.filter((o) => o.countries.includes(c));
  const global = offers.filter((o) => o.countries.length === 0);
  const byOrder = (a: EsimOffer, b: EsimOffer) => a.sort_order - b.sort_order || a.provider.localeCompare(b.provider);
  return [...local.sort(byOrder), ...global.sort(byOrder)];
}

export function validateEsim(input: EsimInput): { value: EsimInput; error: string | null } {
  const value = {
    provider: input.provider.trim(),
    headline: input.headline.trim(),
    url: input.url.trim(),
    countries: [...new Set(input.countries.map((c) => c.trim().toUpperCase()).filter(Boolean))].sort(),
  };
  if (!value.provider) return { value, error: "Enter the provider's name" };
  let ok = false;
  try { ok = new URL(value.url).protocol === "https:" && !/\s/.test(value.url); } catch { ok = false; }
  if (!ok) return { value, error: "Enter the sponsor's full link, starting with https://" };
  if (value.countries.some((c) => !/^[A-Z]{2}$/.test(c))) return { value, error: "Pick countries from the list" };
  return { value, error: null };
}
