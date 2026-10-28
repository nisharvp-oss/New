import { createServerFn } from "@tanstack/react-start";
import { queryOptions, useQuery } from "@tanstack/react-query";
import { publicMediaUrl } from "@/lib/site-images";
import { OFFER_KINDS, type OfferKind, type SponsorOffer } from "@/lib/sponsor-offers";

export type OfferRow = Omit<SponsorOffer, "flyer_url"> & { flyer_path: string | null };

/** Active sponsored offers of one kind, or none if the table can't be read (the tool then says so). */
export const getSponsorOffers = createServerFn({ method: "GET" })
  .inputValidator((kind: OfferKind) => {
    if (!(kind in OFFER_KINDS)) throw new Error("Unknown offer kind");
    return kind;
  })
  .handler(async ({ data: kind }): Promise<OfferRow[]> => {
    try {
      const { publicServerClient } = await import("@/lib/public-client.server");
      // esim_offers (0014) and visa_agencies (0015) are newer than the generated types.
      const sb = publicServerClient() as unknown as {
        from: (t: string) => { select: (c: string) => { eq: (c: string, v: boolean) => { order: (c: string) => PromiseLike<{ data: OfferRow[] | null; error: unknown }> } } };
      };
      const { data, error } = await sb.from(OFFER_KINDS[kind].table).select("id,provider,headline,url,flyer_path,countries,sort_order").eq("is_active", true).order("sort_order");
      return !error && data ? data : [];
    } catch {
      return [];
    }
  });

export const sponsorOffersQuery = (kind: OfferKind) =>
  queryOptions({ queryKey: ["sponsor-offers", kind], queryFn: () => getSponsorOffers({ data: kind }), staleTime: 10 * 60_000 });

export const flyerUrl = (path: string | null) => {
  const base = import.meta.env["VITE_SUPABASE_URL"] as string | undefined;
  return path && base ? publicMediaUrl(base, path) : null;
};

export function useSponsorOffers(kind: OfferKind): SponsorOffer[] {
  const rows = useQuery(sponsorOffersQuery(kind)).data ?? [];
  return rows.map(({ flyer_path, ...o }) => ({ ...o, flyer_url: flyerUrl(flyer_path) }));
}
