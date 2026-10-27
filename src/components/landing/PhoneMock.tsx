import { CalendarDays, MapPin, MessageCircle, Siren, Sparkles, Ticket, Wallet } from "lucide-react";

/** A traveler's home screen, drawn in markup so it stays sharp and themeable. */
export function PhoneMock() {
  return (
    <div aria-hidden className="relative mx-auto w-[min(19rem,82vw)]">
      <div className="rounded-[2.75rem] bg-navy p-2.5 shadow-[0_50px_100px_-40px_oklch(0.2_0.05_205/0.65)] ring-1 ring-navy-foreground/10">
        <div className="relative overflow-hidden rounded-[2.2rem] bg-background">
          <div className="bg-lagoon-deep px-5 pb-5 pt-3 text-navy-foreground">
            <div className="flex items-center justify-between text-[10px] font-semibold"><span>9:41</span><span className="h-5 w-20 rounded-full bg-navy" /><span>5G</span></div>
            <div className="mt-4 flex items-start justify-between">
              <div>
                <p className="text-xs text-navy-foreground/70">Hi Alex</p>
                <p className="font-display text-lg font-semibold leading-tight">Dubai & Desert<br />Discovery</p>
              </div>
              <span className="sos-pulse inline-flex items-center gap-1 rounded-full bg-destructive px-2.5 py-1 text-[11px] font-bold text-destructive-foreground"><Siren className="h-3 w-3" />SOS</span>
            </div>
          </div>
          <div className="space-y-2.5 p-3">
            <div className="rounded-2xl border bg-card p-3">
              <p className="text-[11px] text-muted-foreground">Next up, 15:00</p>
              <p className="text-sm font-semibold">Desert safari departs</p>
              <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground"><MapPin className="h-3 w-3" />Hotel lobby</p>
              <p className="mt-2 rounded-lg bg-accent px-2 py-1 text-[11px] text-accent-foreground">Bring sunglasses, closed shoes and a scarf.</p>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border bg-card p-3">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-secondary"><Ticket className="h-4 w-4 text-primary" /></span>
              <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">EK 202 to Dubai</p><p className="text-[11px] text-muted-foreground">Seat 34A</p></div>
              <span className="text-[11px] font-semibold text-primary">Show QR</span>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border bg-card p-3">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-secondary"><Wallet className="h-4 w-4 text-primary" /></span>
              <div className="flex-1"><p className="text-sm font-semibold">You owe Sarah</p><p className="text-[11px] text-muted-foreground">Room 304 crew</p></div>
              <span className="text-sm font-semibold tabular-nums">$42.50</span>
            </div>
          </div>
          <div className="flex justify-around border-t bg-card px-2 pb-4 pt-2 text-[9px] font-semibold text-muted-foreground">
            {[[CalendarDays, "Trip"], [Ticket, "Tickets"], [Sparkles, "Extras"], [Wallet, "Split"], [MessageCircle, "Chat"]].map(([Icon, l], i) => {
              const I = Icon as typeof CalendarDays;
              return <span key={l as string} className={`flex flex-col items-center gap-0.5 ${i === 0 ? "text-primary" : ""}`}><I className="h-4 w-4" />{l as string}</span>;
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
