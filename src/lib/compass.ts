/**
 * Compass maths for the phone's own orientation sensor: no maps service or API key involved.
 * iOS reports a ready-made compass heading; Android reports an absolute alpha rotation that turns
 * the other way. Both are corrected for the screen being turned sideways.
 */
import type { LatLng } from "@/lib/geo";

export type OrientationReading = { alpha: number | null; absolute?: boolean; webkitCompassHeading?: number };

const norm = (deg: number) => ((deg % 360) + 360) % 360;

/** Degrees clockwise from north that the top of the phone points to, or null if unknown. */
export function headingFrom(e: OrientationReading, screenAngle = 0): number | null {
  if (typeof e.webkitCompassHeading === "number" && !Number.isNaN(e.webkitCompassHeading)) return norm(e.webkitCompassHeading + screenAngle);
  if (e.absolute && e.alpha != null) return norm(360 - e.alpha + screenAngle);
  return null;
}

/** Initial great-circle bearing from one point to another, degrees clockwise from north. */
export function bearing(from: LatLng, to: LatLng): number {
  const rad = (d: number) => (d * Math.PI) / 180;
  const y = Math.sin(rad(to.lng - from.lng)) * Math.cos(rad(to.lat));
  const x = Math.cos(rad(from.lat)) * Math.sin(rad(to.lat)) - Math.sin(rad(from.lat)) * Math.cos(rad(to.lat)) * Math.cos(rad(to.lng - from.lng));
  return norm((Math.atan2(y, x) * 180) / Math.PI);
}

const POINTS = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"] as const;
export const cardinal = (deg: number) => POINTS[Math.round(norm(deg) / 45) % 8]!;

/**
 * Next rotation for a dial that follows `heading` without spinning the long way round when it
 * crosses north (359° → 1° turns by 2°, not 358°).
 */
export function unwrap(previous: number, heading: number): number {
  const delta = ((norm(heading) - norm(previous) + 540) % 360) - 180;
  return previous + delta;
}
