import { createServerFn } from "@tanstack/react-start";
import { queryOptions, useQuery } from "@tanstack/react-query";
import { resolveSiteImages, type SiteImageRow, type SiteImages } from "@/lib/site-images";

export const getSiteImages = createServerFn({ method: "GET" }).handler(async (): Promise<SiteImageRow[]> => {
  // Photos must never break a page: on any failure every slot keeps its bundled photo.
  try {
    const { publicServerClient } = await import("@/lib/public-client.server");
    // site_images is newer than the generated types, so read it through an untyped view of the client.
    const sb = publicServerClient() as unknown as { from: (t: string) => { select: (c: string) => PromiseLike<{ data: SiteImageRow[] | null; error: unknown }> } };
    const { data, error } = await sb.from("site_images").select("slot,path,alt,updated_at");
    return error ? [] : (data ?? []);
  } catch {
    return [];
  }
});

export const siteImagesQuery = queryOptions({ queryKey: ["site-images"], queryFn: () => getSiteImages(), staleTime: 5 * 60_000 });

/** Photos for every slot: the admin's upload when there is one, otherwise the bundled photo. */
export function useSiteImages(): SiteImages {
  const { data } = useQuery(siteImagesQuery);
  return resolveSiteImages(data ?? [], import.meta.env["VITE_SUPABASE_URL"] as string | undefined);
}
