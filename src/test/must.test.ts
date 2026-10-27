import { describe, expect, it } from "vitest";
import { must } from "@/lib/must";

describe("must", () => {
  it("returns data when the query succeeds", async () => {
    await expect(must(Promise.resolve({ data: [1, 2], error: null }))).resolves.toEqual([1, 2]);
  });

  it("keeps a legitimate null (e.g. maybeSingle with no row)", async () => {
    await expect(must(Promise.resolve({ data: null, error: null }))).resolves.toBeNull();
  });

  it("throws the backend message instead of returning empty data", async () => {
    const failed = Promise.resolve({ data: null, error: { message: "permission denied for table trips" } });
    await expect(must(failed)).rejects.toThrow("permission denied for table trips");
  });
});
