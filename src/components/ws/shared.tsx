import { Link, useRouterState } from "@tanstack/react-router";
import { Compass, LayoutDashboard, Smartphone, RotateCcw, Siren } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { BrandMark } from "./Brand";
import { useApp } from "@/lib/store";
import quad from "@/assets/addon-quad.jpg";
import scuba from "@/assets/addon-scuba.jpg";
import cook from "@/assets/addon-cook.jpg";
import cover from "@/assets/trip-cover.jpg";

export const addonImages: Record<string, string> = { quad, scuba, cook, default: cover };
export { cover };

export function useHydratedStore() {
  const [ok, setOk] = useState(false);
  useEffect(() => {
    Promise.resolve(useApp.persist.rehydrate()).then(() => setOk(true));
  }, []);
  return ok;
}

export function RoleBar() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const reset = useApp((s) => s.reset);
  const activeSos = useApp((s) => s.sos.filter((x) => x.status === "active").length);
  const tab = (to: "/traveler" | "/demo", label: string, Icon: typeof Compass) => (
    <Link
      to={to}
      className={cn(
        "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold transition-colors sm:px-4",
        path === to ? "bg-card text-foreground shadow-card" : "text-navy-foreground/70 hover:text-navy-foreground",
      )}
    >
      <Icon className="h-4 w-4" />
      <span>{label}</span>
    </Link>
  );
  return (
    <header className="pt-safe sticky top-0 z-40 bg-navy/95 text-navy-foreground backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 px-4">
        <Link to="/" aria-label="WanderSync home" className="flex items-center gap-2">
          <BrandMark />
          <span className="hidden font-display text-[1.15rem] font-bold tracking-tight sm:inline">WanderSync</span>
          <span className="hidden rounded-full bg-navy-foreground/10 px-2 py-0.5 text-xs text-navy-foreground/75 md:inline">Sample trip</span>
        </Link>
        <nav className="flex items-center gap-1 rounded-full bg-navy-foreground/10 p-1">
          {tab("/demo", "Organiser", LayoutDashboard)}
          {tab("/traveler", "Traveler", Smartphone)}
        </nav>
        <div className="flex items-center gap-2">
          {activeSos > 0 && path !== "/demo" && (
            <span className="flex items-center gap-1 rounded-full bg-destructive px-2 py-1 text-xs font-bold text-destructive-foreground">
              <Siren className="h-3.5 w-3.5" /> {activeSos}
            </span>
          )}
          <button onClick={reset} title="Reset demo data" className="rounded-full p-2 text-navy-foreground/70 hover:bg-navy-foreground/10 hover:text-navy-foreground">
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}

export function QRCode({ value, size = 160 }: { value: string; size?: number }) {
  // Deterministic mock QR pattern from the string
  const n = 25;
  let h = 2166136261;
  for (const c of value) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  const rand = () => ((h = Math.imul(h ^ (h >>> 15), 2246822507) ^ Math.imul(h ^ (h >>> 13), 3266489909)) >>> 0) / 4294967296;
  const finder = (x: number, y: number) => {
    for (const [fx, fy] of [[0, 0], [n - 7, 0], [0, n - 7]] as const) {
      const dx = x - fx, dy = y - fy;
      if (dx >= 0 && dx < 7 && dy >= 0 && dy < 7) {
        return dx === 0 || dx === 6 || dy === 0 || dy === 6 || (dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4) ? 1 : 0;
      }
    }
    return -1;
  };
  const cells: [number, number][] = [];
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++) {
      const f = finder(x, y);
      if (f === 1 || (f === -1 && rand() > 0.5)) cells.push([x, y]);
    }
  return (
    <svg viewBox={`-2 -2 ${n + 4} ${n + 4}`} width={size} height={size} className="rounded-md bg-card text-foreground" shapeRendering="crispEdges">
      <rect x={-2} y={-2} width={n + 4} height={n + 4} className="fill-card" />
      {cells.map(([x, y]) => (
        <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} className="fill-navy dark:fill-foreground" />
      ))}
    </svg>
  );
}

export function initials(name: string) {
  return name.split(" ").map((p) => p[0]).slice(0, 2).join("");
}

export function Avatar({ name, className }: { name: string; className?: string }) {
  return (
    <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-full bg-secondary text-xs font-bold text-secondary-foreground", className)}>
      {initials(name)}
    </span>
  );
}

export function mapsUrl(q: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}
