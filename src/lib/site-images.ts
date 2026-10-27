import sydney from "@/assets/photo-sydney-harbour.jpg";
import dolomites from "@/assets/photo-dolomites-village.jpg";
import dubaiNight from "@/assets/photo-dubai-night.jpg";
import burj from "@/assets/photo-dubai-burj-al-arab.jpg";
import desert from "@/assets/trip-cover.jpg";

/**
 * Places in the product whose photo a super admin can replace from Admin → Site images.
 * Each slot ships with a bundled photo, used until an admin uploads one.
 */
export const SITE_IMAGE_SLOTS = {
  landing_hero: { label: "Landing page hero", where: "Full-screen photo at the top of the home page", fallback: sydney, alt: "Sydney Harbour with the Opera House on a sunny day" },
  landing_cta: { label: "Landing page closing photo", where: "Large photo behind the last call to action", fallback: dolomites, alt: "Alpine village below the Dolomites" },
  app_home: { label: "Traveler app home", where: "Phone previews on the home page and the traveler app header", fallback: dubaiNight, alt: "Dubai skyline at night" },
  auth_panel: { label: "Sign-in page", where: "Photo beside the sign-in and sign-up form", fallback: burj, alt: "Burj Al Arab and the Dubai skyline at dusk" },
  trip_cover: { label: "Default trip cover", where: "Trip page header and trip cards on the dashboard", fallback: desert, alt: "Travelers walking across desert dunes at sunset" },
} as const;

export type SiteImageSlot = keyof typeof SITE_IMAGE_SLOTS;
export type SiteImageRow = { slot: string; path: string; alt: string; updated_at: string };
export type SiteImages = Record<SiteImageSlot, { src: string; alt: string; custom: boolean }>;

export const SITE_MEDIA_BUCKET = "site-media";

export function publicMediaUrl(supabaseUrl: string, path: string) {
  return `${supabaseUrl.replace(/\/+$/, "")}/storage/v1/object/public/${SITE_MEDIA_BUCKET}/${path.split("/").map(encodeURIComponent).join("/")}`;
}

/** Admin uploads win; unknown slots are ignored; every slot always resolves to a photo. */
export function resolveSiteImages(rows: SiteImageRow[], supabaseUrl: string | undefined): SiteImages {
  const out = {} as SiteImages;
  for (const slot of Object.keys(SITE_IMAGE_SLOTS) as SiteImageSlot[]) {
    const def = SITE_IMAGE_SLOTS[slot];
    const row = rows.find((r) => r.slot === slot);
    out[slot] = row && supabaseUrl
      ? { src: publicMediaUrl(supabaseUrl, row.path), alt: row.alt || def.alt, custom: true }
      : { src: def.fallback, alt: def.alt, custom: false };
  }
  return out;
}
