/**
 * Links that open a location in whichever maps or navigation app the person has, without any
 * paid maps service: each app's own public URL scheme, plus the standard geo: link that makes
 * Android show its "Open with" chooser of installed navigation apps.
 */
export type Place = { lat: number; lng: number; label?: string | undefined };
export type MapApp = { id: "google" | "apple" | "waze" | "device"; name: string; url: string };

const coords = ({ lat, lng }: Place) => `${lat.toFixed(6)},${lng.toFixed(6)}`;

export function mapLinks(p: Place, platform: "android" | "ios" | "other" = "other"): MapApp[] {
  const c = coords(p);
  const label = p.label ? encodeURIComponent(p.label) : "";
  const apps: MapApp[] = [
    { id: "google", name: "Google Maps", url: `https://www.google.com/maps/search/?api=1&query=${c}` },
    { id: "apple", name: "Apple Maps", url: `https://maps.apple.com/?ll=${c}&q=${label || c}` },
    { id: "waze", name: "Waze", url: `https://waze.com/ul?ll=${c}&navigate=yes` },
  ];
  // geo: lets Android offer every installed navigation app; iOS and desktops don't handle it.
  if (platform === "android") apps.unshift({ id: "device", name: "Choose an app on this phone", url: `geo:${c}?q=${c}${label ? `(${label})` : ""}` });
  return apps;
}

export function detectPlatform(ua: string): "android" | "ios" | "other" {
  if (/android/i.test(ua)) return "android";
  if (/iphone|ipad|ipod/i.test(ua) || (/macintosh/i.test(ua) && /mobile/i.test(ua))) return "ios";
  return "other";
}

/** A plain-text message with a map link, for sharing a location through any messaging app. */
export function shareText(p: Place) {
  return `${p.label ? `${p.label}: ` : ""}https://www.google.com/maps/search/?api=1&query=${coords(p)}`;
}
