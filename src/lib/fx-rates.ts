import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { parseRates, RATE_URLS, type Rates } from "@/lib/fx";

const CACHE_KEY = "ws:fx-rates";

const cached = (): Rates | undefined => {
  try { return parseRates(JSON.parse(localStorage.getItem(CACHE_KEY) ?? "null")) ?? undefined; } catch { return undefined; }
};

async function fetchRates(): Promise<Rates> {
  for (const url of RATE_URLS) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
      const rates = res.ok ? parseRates(await res.json()) : null;
      if (rates) {
        try { localStorage.setItem(CACHE_KEY, JSON.stringify(rates)); } catch { /* kept in memory only */ }
        return rates;
      }
    } catch { /* try the mirror */ }
  }
  // Offline (common abroad): the last rates this phone saw are better than none.
  const last = cached();
  if (last) return last;
  throw new Error("Exchange rates are unavailable right now");
}

/** Daily exchange rates in the browser, remembered on the device for use offline. */
export function useRates(): Rates | null {
  const q = useQuery({ queryKey: ["fx-rates"], queryFn: fetchRates, staleTime: 6 * 60 * 60_000, retry: 1 });
  // Saved rates show straight away (after mount, so the first render matches the server) while fresh ones load.
  const [saved, setSaved] = useState<Rates | null>(null);
  useEffect(() => { setSaved(cached() ?? null); }, []);
  return q.data ?? saved;
}
