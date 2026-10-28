import { createServerFn } from "@tanstack/react-start";
import { queryOptions, useQuery } from "@tanstack/react-query";
import { VISA_PAGES, type VisaPage } from "@/lib/visa";

/** Active official visa pages from Admin → Visa, or the bundled list if the table can't be read. */
export const getVisaPages = createServerFn({ method: "GET" }).handler(async (): Promise<VisaPage[]> => {
  try {
    const { publicServerClient } = await import("@/lib/public-client.server");
    // visa_pages (migration 0015) is newer than the generated types.
    const sb = publicServerClient() as unknown as {
      from: (t: "visa_pages") => { select: (c: string) => { eq: (c: string, v: boolean) => PromiseLike<{ data: VisaPage[] | null; error: unknown }> } };
    };
    const { data, error } = await sb.from("visa_pages").select("code,url,note").eq("is_active", true);
    return !error && data?.length ? data : VISA_PAGES;
  } catch {
    return VISA_PAGES;
  }
});

export const visaPagesQuery = queryOptions({ queryKey: ["visa-pages"], queryFn: () => getVisaPages(), staleTime: 10 * 60_000 });

export function useVisaPages(): VisaPage[] {
  return useQuery(visaPagesQuery).data ?? VISA_PAGES;
}
