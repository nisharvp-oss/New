// Pure helpers for sponsor distance and ordering.
export type LatLng = { lat: number; lng: number };

export function distanceKm(a: LatLng, b: LatLng): number {
  const R = 6371;
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function formatDistance(km: number): string {
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(km < 10 ? 1 : 0)} km`;
}

type Sortable = { is_premium: boolean; lat: number | null; lng: number | null; created_at: string };

/** Premium first, then nearest to origin (unknown locations last), then newest. */
export function sortSponsors<T extends Sortable>(list: T[], origin: LatLng | null): (T & { km: number | null })[] {
  return list
    .map((s) => ({ ...s, km: origin && s.lat != null && s.lng != null ? distanceKm(origin, { lat: s.lat, lng: s.lng }) : null }))
    .sort((a, b) => {
      if (a.is_premium !== b.is_premium) return a.is_premium ? -1 : 1;
      if (a.km != null && b.km != null && a.km !== b.km) return a.km - b.km;
      if ((a.km == null) !== (b.km == null)) return a.km == null ? 1 : -1;
      return b.created_at.localeCompare(a.created_at);
    });
}

/** Free (personal, not unlocked) trips cap travelers; returns null when unlimited by this rule. */
export function freeTripCap(kind: string, unlocked: boolean, freeLimit: number): number | null {
  return kind === "personal" && !unlocked ? freeLimit : null;
}
