import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Compass as CompassIcon, LocateFixed, MapPinned, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { bearing, cardinal, headingFrom, unwrap, type OrientationReading } from "@/lib/compass";
import { distanceKm, formatDistance, type LatLng } from "@/lib/geo";

type Spot = LatLng & { label: string };
const SPOT_KEY = "ws:compass-spot";
type Status = "idle" | "on" | "denied" | "no-sensor";
type PermissionApi = { requestPermission?: () => Promise<"granted" | "denied"> };

const readSpot = (): Spot | null => {
  try { const v = localStorage.getItem(SPOT_KEY); return v ? (JSON.parse(v) as Spot) : null; } catch { return null; }
};

/** Live compass from the phone's sensor, plus "save this spot" to find the way back to it. */
export function Compass() {
  const [status, setStatus] = useState<Status>("idle");
  const [heading, setHeading] = useState<number | null>(null);
  const [turn, setTurn] = useState(0);
  const [spot, setSpot] = useState<Spot | null>(null);
  const [label, setLabel] = useState("");
  const [here, setHere] = useState<LatLng | null>(null);
  const [locating, setLocating] = useState(false);
  const last = useRef(0);

  useEffect(() => { setSpot(readSpot()); }, []);

  useEffect(() => {
    if (status !== "on") return;
    const screenAngle = () => window.screen?.orientation?.angle ?? 0;
    let seen = false;
    const onReading = (e: Event) => {
      const h = headingFrom(e as unknown as OrientationReading, screenAngle());
      if (h == null) return;
      seen = true;
      setHeading(h);
      last.current = unwrap(last.current, h);
      setTurn(last.current);
    };
    // Android Chrome sends north-based readings on deviceorientationabsolute; iOS on deviceorientation.
    const type = "ondeviceorientationabsolute" in window ? "deviceorientationabsolute" : "deviceorientation";
    window.addEventListener(type, onReading);
    const timer = window.setTimeout(() => { if (!seen) setStatus("no-sensor"); }, 2000);
    return () => { window.removeEventListener(type, onReading); window.clearTimeout(timer); };
  }, [status]);

  // Track where we are while a spot is saved, so the arrow and distance stay current.
  useEffect(() => {
    if (!spot || !("geolocation" in navigator)) return;
    const id = navigator.geolocation.watchPosition((p) => setHere({ lat: p.coords.latitude, lng: p.coords.longitude }), () => undefined, { enableHighAccuracy: true, maximumAge: 5000 });
    return () => navigator.geolocation.clearWatch(id);
  }, [spot]);

  const start = async () => {
    const api = (window as unknown as { DeviceOrientationEvent?: PermissionApi }).DeviceOrientationEvent;
    if (!api) { setStatus("no-sensor"); return; }
    if (api.requestPermission) {
      try { if ((await api.requestPermission()) !== "granted") { setStatus("denied"); return; } } catch { setStatus("denied"); return; }
    }
    setStatus("on");
  };

  const saveSpot = () => {
    if (!("geolocation" in navigator)) { toast.error("This browser can't share your location"); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (p) => {
        const s = { lat: p.coords.latitude, lng: p.coords.longitude, label: label.trim() || "Saved spot" };
        setSpot(s); setHere(s); setLocating(false); setLabel("");
        try { localStorage.setItem(SPOT_KEY, JSON.stringify(s)); } catch { /* kept for this visit only */ }
        toast.success(`${s.label} saved`, { description: "The compass will point back to it." });
      },
      () => { setLocating(false); toast.error("Couldn't get your location", { description: "Allow location for this site and try again." }); },
      { enableHighAccuracy: true, timeout: 15000 },
    );
  };
  const clearSpot = () => { setSpot(null); try { localStorage.removeItem(SPOT_KEY); } catch { /* nothing saved */ } };

  const toSpot = spot && here ? bearing(here, spot) : null;
  const away = spot && here ? distanceKm(here, spot) : null;
  const arrived = away != null && away < 0.02;

  return (
    <div className="grid items-center gap-6 sm:grid-cols-[minmax(0,15rem)_1fr]">
      <div className="relative mx-auto aspect-square w-full max-w-60">
        <div className="absolute inset-0 rounded-full border-8 border-muted bg-card shadow-card" />
        <svg viewBox="0 0 200 200" className="absolute inset-0 h-full w-full transition-transform duration-300 ease-out motion-reduce:transition-none" style={{ transform: `rotate(${-turn}deg)` }} aria-hidden>
          {Array.from({ length: 72 }, (_, i) => (
            <line key={i} x1="100" y1="14" x2="100" y2={i % 18 === 0 ? 30 : i % 2 === 0 ? 24 : 20} transform={`rotate(${i * 5} 100 100)`} className={i === 0 ? "stroke-destructive" : "stroke-muted-foreground/50"} strokeWidth={i % 18 === 0 ? 3 : 1.2} strokeLinecap="round" />
          ))}
          {(["N", "E", "S", "W"] as const).map((d, i) => (
            <text key={d} x="100" y="48" textAnchor="middle" transform={`rotate(${i * 90} 100 100)`} className={d === "N" ? "fill-destructive text-[18px] font-extrabold" : "fill-foreground text-[15px] font-bold"}>{d}</text>
          ))}
          {toSpot != null && (
            <g transform={`rotate(${toSpot} 100 100)`}><path d="M100 52 l9 15 h-18 z" className="fill-primary" /></g>
          )}
        </svg>
        {/* Fixed pointer: the direction the top of the phone faces. */}
        <svg viewBox="0 0 200 200" className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden>
          <path d="M100 4 l7 12 h-14 z" className="fill-foreground" />
          <circle cx="100" cy="100" r="5" className="fill-foreground" />
        </svg>
        <div className="absolute inset-0 grid place-items-center">
          <div className="mt-16 text-center">
            <p className="text-3xl font-extrabold tabular-nums tracking-tight" aria-live="polite">{heading == null ? "—" : `${Math.round(heading)}°`}</p>
            <p className="text-sm font-semibold text-muted-foreground">{heading == null ? "" : cardinal(heading)}</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {status === "idle" && <Button size="lg" className="w-full rounded-2xl" onClick={start}><CompassIcon /> Start compass</Button>}
        {status === "denied" && <p className="rounded-2xl bg-muted p-4 text-sm">Motion access was blocked. Allow "Motion & Orientation" for this site in your browser settings, then reload.</p>}
        {status === "no-sensor" && <p className="rounded-2xl bg-muted p-4 text-sm">This device has no compass sensor. Open this page on your phone; saved spots still show their distance here.</p>}
        {status === "on" && <p className="text-sm text-muted-foreground">Hold your phone flat, away from metal. If it drifts, move it in a figure 8 to recalibrate.</p>}

        <div className="rounded-2xl border p-4">
          <p className="flex items-center gap-2 font-semibold"><MapPinned className="h-4 w-4 text-primary" /> Find your way back</p>
          {spot ? (
            <div className="mt-2 space-y-2">
              <p className="text-sm">
                {arrived ? <>You're at <b>{spot.label}</b>.</> : away != null && toSpot != null
                  ? <><b>{spot.label}</b> is {formatDistance(away)} away, to the {cardinal(toSpot)}. Follow the blue arrow.</>
                  : <>Finding your location to point to <b>{spot.label}</b>…</>}
              </p>
              <Button size="sm" variant="outline" onClick={clearSpot}><X /> Forget {spot.label}</Button>
            </div>
          ) : (
            <div className="mt-2 space-y-2">
              <p className="text-sm text-muted-foreground">Save where you are now (your hotel, the bus, the meeting point) and the compass points back to it.</p>
              <div className="flex gap-2">
                <Input placeholder="Name it, e.g. Hotel" value={label} onChange={(e) => setLabel(e.target.value)} maxLength={40} />
                <Button onClick={saveSpot} disabled={locating}><LocateFixed /> {locating ? "Locating…" : "Save spot"}</Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
