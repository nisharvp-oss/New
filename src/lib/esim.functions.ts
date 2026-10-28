import { createServerFn } from "@tanstack/react-start";
import { queryOptions, useQuery } from "@tanstack/react-query";
import { publicMediaUrl } from "@/lib/site-images";
import type { EsimOffer } from "@/lib/esim";

export type EsimRow = Omit<EsimOffer, "flyer_url"> & { flyer_path: string | null };

/** Active sponsored eSIM offers, or none if the table can't be read (the tool then says so). */
export const getEsimOffers = createServerFn({ method: "GET" }).handler(async (): Promise<EsimRow[]> => {
  try {
    const { publicServerClient } = await import("@/lib/public-client.server");
    // esim_offers (migration 0014) is newer than the generated types.
    const sb = publicServerClient() as unknown as {
      from: (t: "esim_offers") => { select: (c: string) => { eq: (c: string, v: boolean) => { order: (c: string) => PromiseLike<{ data: EsimRow[] | null; error: unknown }> } } };
    };
    const { data, error } = await sb.from("esim_offers").select("id,provider,headline,url,flyer_path,countries,sort_order").eq("is_active", true).order("sort_order");
    return !error && data ? data : [];
  } catch {
    return [];
  }
});

export const esimOffersQuery = queryOptions({ queryKey: ["esim-offers"], queryFn: () => getEsimOffers(), staleTime: 10 * 60_000 });

export const esimFlyerUrl = (path: string | null) => {
  const base = import.meta.env["VITE_SUPABASE_URL"] as string | undefined;
  return path && base ? publicMediaUrl(base, path) : null;
};

export function useEsimOffers(): EsimOffer[] {
  const rows = useQuery(esimOffersQuery).data ?? [];
  return rows.map(({ flyer_path, ...o }) => ({ ...o, flyer_url: esimFlyerUrl(flyer_path) }));
}
