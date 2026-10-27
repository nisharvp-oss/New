import { describe, expect, it } from "vitest";
import { publicMediaUrl, resolveSiteImages, SITE_IMAGE_SLOTS } from "@/lib/site-images";

const URL = "https://abc.supabase.co/";

describe("resolveSiteImages", () => {
  it("uses the bundled photo for every slot when nothing is uploaded", () => {
    const images = resolveSiteImages([], URL);
    for (const [slot, def] of Object.entries(SITE_IMAGE_SLOTS)) {
      expect(images[slot as keyof typeof SITE_IMAGE_SLOTS]).toEqual({ src: def.fallback, alt: def.alt, custom: false });
    }
  });

  it("prefers the admin's upload and keeps the default alt text when none is given", () => {
    const images = resolveSiteImages([{ slot: "landing_hero", path: "landing_hero/1.jpg", alt: "", updated_at: "" }], URL);
    expect(images.landing_hero).toEqual({
      src: "https://abc.supabase.co/storage/v1/object/public/site-media/landing_hero/1.jpg",
      alt: SITE_IMAGE_SLOTS.landing_hero.alt,
      custom: true,
    });
    expect(images.landing_cta.custom).toBe(false);
  });

  it("ignores rows for slots the app no longer has", () => {
    const images = resolveSiteImages([{ slot: "old_banner", path: "x.jpg", alt: "", updated_at: "" }], URL);
    expect(Object.values(images).every((i) => !i.custom)).toBe(true);
  });

  it("falls back when the backend URL is unknown", () => {
    const images = resolveSiteImages([{ slot: "landing_hero", path: "a.jpg", alt: "Beach", updated_at: "" }], undefined);
    expect(images.landing_hero.custom).toBe(false);
  });
});

describe("publicMediaUrl", () => {
  it("encodes each path segment", () => {
    expect(publicMediaUrl(URL, "landing hero/my photo.jpg")).toBe(
      "https://abc.supabase.co/storage/v1/object/public/site-media/landing%20hero/my%20photo.jpg",
    );
  });
});
