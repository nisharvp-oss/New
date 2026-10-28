import { createServerFn } from "@tanstack/react-start";
import { queryOptions, useQuery } from "@tanstack/react-query";
import { AIRLINES, type Airline } from "@/lib/airlines";

/** Active airlines from Admin → Airlines, or the bundled list if the table can't be read. */
export const getAirlines = createServerFn({ method: "GET" }).handler(async (): Promise<Airline[]> => {
  try {
    const { publicServerClient } = await import("@/lib/public-client.server");
    // airlines (migration 0013) is newer than the generated types.
    const sb = publicServerClient() as unknown as {
      from: (t: "airlines") => { select: (c: string) => { eq: (c: string, v: boolean) => { order: (c: string) => PromiseLike<{ data: Airline[] | null; error: unknown }> } } };
    };
    const { data, error } = await sb.from("airlines").select("code,name,region,url").eq("is_active", true).order("sort_order");
    return !error && data?.length ? data : AIRLINES;
  } catch {
    return AIRLINES;
  }
});

export const airlinesQuery = queryOptions({ queryKey: ["airlines"], queryFn: () => getAirlines(), staleTime: 10 * 60_000 });

export function useAirlines(): Airline[] {
  return useQuery(airlinesQuery).data ?? AIRLINES;
}
