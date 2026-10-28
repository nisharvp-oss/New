/**
 * Currency conversion for "My expenses" from a free, keyless daily rates feed (the open-source
 * fawazahmed0/currency-api, served by jsDelivr with a Cloudflare Pages mirror). Rates are fetched
 * once with USD as the base; every other pair is a cross rate. Indicative only: banks and card
 * providers add their own margin.
 */
export type Rates = { date: string; usd: Record<string, number> };

export const RATE_URLS = [
  "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.min.json",
  "https://latest.currency-api.pages.dev/v1/currencies/usd.min.json",
];

/** Reads the feed's { date, usd: { aed: 3.67, … } } into upper-case codes; null if it isn't usable. */
export function parseRates(json: unknown): Rates | null {
  const j = json as { date?: unknown; usd?: unknown } | null;
  if (!j || typeof j.date !== "string" || !j.usd || typeof j.usd !== "object") return null;
  const usd: Record<string, number> = { USD: 1 };
  for (const [k, v] of Object.entries(j.usd as Record<string, unknown>)) {
    if (/^[a-z]{3}$/.test(k) && typeof v === "number" && v > 0 && Number.isFinite(v)) usd[k.toUpperCase()] = v;
  }
  return Object.keys(usd).length > 1 ? { date: j.date, usd } : null;
}

/** How many `to` one `from` buys, or null when either currency isn't in the feed. */
export function rate(from: string, to: string, rates: Rates): number | null {
  if (from === to) return 1;
  const a = rates.usd[from], b = rates.usd[to];
  return a && b ? b / a : null;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

export function convert(amount: number, from: string, to: string, rates: Rates): number | null {
  const r = rate(from, to, rates);
  return r == null ? null : round2(amount * r);
}

/** Sum of amounts in several currencies, in one; currencies the feed lacks are listed, not guessed. */
export function totalIn(items: { amount: number; currency: string }[], to: string, rates: Rates) {
  let total = 0;
  const missing = new Set<string>();
  for (const i of items) {
    const r = rate(i.currency, to, rates);
    if (r == null) missing.add(i.currency); else total += i.amount * r;
  }
  return { total: round2(total), missing: [...missing].sort() };
}

/** Rates older than this many days get a "rates from <date>" warning (e.g. offline on a trip). */
export const isStale = (rates: Rates, today = new Date()) => (today.getTime() - new Date(`${rates.date}T00:00:00Z`).getTime()) / 86_400_000 > 3;
