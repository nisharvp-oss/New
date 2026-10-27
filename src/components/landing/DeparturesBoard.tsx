import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { SplitFlap } from "./SplitFlap";
import { usePrefersReducedMotion } from "./motion";

type Row = { time: string; city: string; trip: string; pax: number; status: string };

const POOL: Omit<Row, "time" | "status">[] = [
  { city: "Dubai", trip: "Desert Discovery", pax: 24 },
  { city: "Kyoto", trip: "Autumn Temples", pax: 18 },
  { city: "Lisbon", trip: "Alfama Food Walk", pax: 12 },
  { city: "Cusco", trip: "Sacred Valley Trek", pax: 9 },
  { city: "Zanzibar", trip: "Stone Town & Reef", pax: 31 },
  { city: "Reykjavik", trip: "Ring Road Lights", pax: 14 },
  { city: "Marrakech", trip: "Atlas & Medina", pax: 22 },
  { city: "Hanoi", trip: "Ha Long by Junk", pax: 16 },
  { city: "Cape Town", trip: "Peninsula & Wine", pax: 20 },
];
const STATUSES = ["Boarding", "On time", "Check-in", "Gate 4", "On time"];
const TIMES = ["07:40", "09:15", "11:05", "13:30", "16:50"];

const initial: Row[] = TIMES.map((time, i) => ({ time, status: STATUSES[i]!, ...POOL[i]! }));

export function DeparturesBoard({ className }: { className?: string }) {
  const reduced = usePrefersReducedMotion();
  const [rows, setRows] = useState(initial);
  const [clock, setClock] = useState<string | null>(null);

  useEffect(() => {
    const fmt = () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
    setClock(fmt());
    const t = setInterval(() => setClock(fmt()), 15_000);
    return () => clearInterval(t);
  }, []);

  // After the opening sequence, one row at a time rolls over to a new trip.
  useEffect(() => {
    if (reduced) return;
    let n = 5;
    const t = setInterval(() => {
      setRows((prev) => {
        const slot = n % prev.length;
        const inUse = new Set(prev.map((r) => r.city));
        const next = POOL.find((p, i) => i >= n % POOL.length && !inUse.has(p.city)) ?? POOL.find((p) => !inUse.has(p.city))!;
        n++;
        return prev.map((r, i) => (i === slot ? { ...r, ...next, status: STATUSES[(slot + n) % STATUSES.length]! } : r));
      });
    }, 3800);
    return () => clearInterval(t);
  }, [reduced]);

  return (
    <div className={cn("board relative overflow-hidden rounded-[1.25rem] p-3 sm:p-5", className)}>
      <div className="mb-3 flex items-center justify-between px-1 text-board-dim">
        <span className="font-display text-lg font-semibold tracking-tight text-board-ink sm:text-xl">Departures</span>
        <span className="font-board text-xs tabular-nums sm:text-sm" suppressHydrationWarning>{clock ?? " "}</span>
      </div>
      <div className="grid grid-cols-[auto_1fr_auto] gap-x-2.5 gap-y-1.5 sm:grid-cols-[auto_auto_1fr_auto] sm:gap-x-4 lg:grid-cols-[auto_1fr_auto] 2xl:grid-cols-[auto_auto_1fr_auto]">
        <span className="board-head">Time</span>
        <span className="board-head">Destination</span>
        <span className="board-head hidden sm:block lg:hidden 2xl:block">Group</span>
        <span className="board-head text-right">Status</span>
        {rows.map((r, i) => (
          <div key={r.time} className="contents">
            <span className="self-center font-board text-xs tabular-nums text-board-dim sm:text-base">{r.time}</span>
            <SplitFlap text={r.city} length={9} delay={250 + i * 260} className="text-[0.72rem] sm:text-base" />
            <span className="hidden min-w-0 self-center sm:block lg:hidden 2xl:block">
              <span className="block truncate text-sm text-board-ink">{r.trip}</span>
              <span className="block text-xs text-board-dim">{r.pax} travelers</span>
            </span>
            <SplitFlap
              text={r.status}
              length={8}
              delay={900 + i * 260}
              className={cn("justify-self-end text-[0.56rem] sm:text-xs", r.status === "Boarding" ? "flap-amber" : "flap-quiet")}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
