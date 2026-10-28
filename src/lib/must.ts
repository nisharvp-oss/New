type Response = { data: unknown; error: { message: string } | null };

/**
 * Unwraps a Supabase response and throws on error, so React Query sees the
 * failure instead of an empty result that looks like "nothing here yet".
 */
export async function must<R extends Response>(query: PromiseLike<R>): Promise<R["data"]> {
  const res = await query;
  if (res.error) throw new Error(res.error.message);
  return res.data;
}
