import type { ReactNode } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Check, MapPin, Sparkles, Utensils } from "lucide-react";
import { cn } from "@/lib/utils";
import { useInView, useScrollProgress } from "./motion";

/** The trip lifecycle as a route: the line fills with scroll and each stop lights up as the tip reaches it. */
export function RouteJourney() {
  const track = useScrollProgress<HTMLOListElement>(0.55, 0.55);
  return (
    <ol ref={track} className="relative space-y-16 pl-10 sm:space-y-24 sm:pl-16">
      <span aria-hidden className="absolute bottom-2 left-[11px] top-2 w-[2px] bg-[repeating-linear-gradient(to_bottom,var(--border)_0_6px,transparent_6px_12px)] sm:left-[19px]" />
      <span aria-hidden className="absolute left-[11px] top-2 w-[2px] origin-top bg-sunset sm:left-[19px]" style={{ height: "calc((100% - 1rem) * var(--p, 0))" }} />
      <Stop title="Build the itinerary once" body="Lay out each day with times, places and meals, or let the AI planner draft it from a destination and dates. Every trip gets its own organiser and caretaker." visual={<PlanVisual />} />
      <Stop title="Everything lands on their phone" body="Tickets with scannable QR codes, boarding passes, documents and announcements. Caretakers scan people in at each stop, and one tap sends an SOS with live location." visual={<TravelVisual />} />
      <Stop title="No spreadsheet at the end" body="Travelers log shared costs and see who owes whom, settled in the fewest payments. Add-ons are paid to you directly: cash, payment link or bank transfer." visual={<SettleVisual />} />
    </ol>
  );
}

function Stop({ title, body, visual }: { title: string; body: string; visual: ReactNode }) {
  const [ref, reached] = useInView<HTMLLIElement>("0px 0px -45% 0px");
  return (
    <li ref={ref} data-reached={reached} className="stop relative grid items-center gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-14">
      <span aria-hidden className="stop-dot absolute -left-10 top-1.5 h-6 w-6 rounded-full border-4 border-background bg-border sm:-left-16 sm:h-10 sm:w-10 sm:border-[6px]" />
      <div className="max-w-md">
        <h3 className="text-2xl font-bold sm:text-[2rem] sm:leading-tight">{title}</h3>
        <p className="mt-3 text-base leading-relaxed text-muted-foreground sm:text-lg">{body}</p>
      </div>
      <div>{visual}</div>
    </li>
  );
}

function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("rounded-2xl border bg-card p-4 shadow-card sm:p-5", className)}>{children}</div>;
}

function PlanVisual() {
  const items = [
    { t: "08:00", what: "Breakfast at the hotel", where: "Rove Downtown", meal: "Included" },
    { t: "15:00", what: "Desert safari departs", where: "Hotel lobby", meal: null },
    { t: "19:00", what: "Bedouin camp BBQ", where: "Al Marmoom", meal: "Group booking" },
  ];
  return (
    <Panel>
      <div className="flex items-center justify-between gap-2">
        <p className="font-display text-lg font-semibold">Day 2, Desert & dunes</p>
        <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-accent-foreground"><Sparkles className="h-3.5 w-3.5" /> AI draft</span>
      </div>
      <ul className="mt-4 divide-y">
        {items.map((i) => (
          <li key={i.t} className="flex gap-4 py-3">
            <span className="w-12 shrink-0 font-board text-sm tabular-nums text-muted-foreground">{i.t}</span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{i.what}</p>
              <p className="flex items-center gap-1 text-sm text-muted-foreground"><MapPin className="h-3.5 w-3.5" />{i.where}</p>
            </div>
            {i.meal && <span className="hidden items-center gap-1 self-start rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground sm:inline-flex"><Utensils className="h-3 w-3" />{i.meal}</span>}
          </li>
        ))}
      </ul>
    </Panel>
  );
}

function TravelVisual() {
  return (
    <div className="grid gap-3 sm:grid-cols-[1.25fr_1fr]">
      <div className="relative overflow-hidden rounded-2xl bg-navy p-5 text-navy-foreground shadow-card">
        <p className="text-sm text-navy-foreground/70">Burj Khalifa, At the Top</p>
        <p className="mt-1 font-display text-xl font-semibold">Alex Rivera</p>
        <div className="mt-4 flex items-end justify-between gap-3">
          <div className="text-sm">
            <p className="text-navy-foreground/70">Slot</p>
            <p className="font-board">17:30</p>
          </div>
          <div className="rounded-lg bg-white p-1.5"><QRCodeSVG value="WANDERSYNC-BK-1730-0042" size={72} /></div>
        </div>
        <span aria-hidden className="absolute -left-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-background" />
        <span aria-hidden className="absolute -right-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-background" />
      </div>
      <Panel className="flex flex-col justify-between">
        <p className="text-sm text-muted-foreground">Checked in at the lobby</p>
        <p className="mt-2 font-display text-4xl font-bold tabular-nums">22<span className="text-xl text-muted-foreground">/24</span></p>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-secondary"><div className="h-full w-[92%] rounded-full bg-primary" /></div>
      </Panel>
    </div>
  );
}

function SettleVisual() {
  return (
    <Panel>
      <p className="font-display text-lg font-semibold">Room 304 crew</p>
      <ul className="mt-3 space-y-3 text-sm">
        <li className="flex justify-between gap-3"><span>Taxi and dinner at Ravi's<span className="block text-muted-foreground">Paid by Sarah, split 3 ways</span></span><span className="font-semibold tabular-nums">$97.50</span></li>
        <li className="flex justify-between gap-3"><span>Water and snacks<span className="block text-muted-foreground">Paid by John, split 3 ways</span></span><span className="font-semibold tabular-nums">$30.00</span></li>
      </ul>
      <div className="mt-4 flex items-center justify-between gap-3 rounded-xl bg-secondary p-3">
        <p className="text-sm"><b>Alex</b> pays <b>Sarah</b> <span className="tabular-nums">$42.50</span></p>
        <span className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"><Check className="h-3.5 w-3.5" /> Settle up</span>
      </div>
    </Panel>
  );
}
