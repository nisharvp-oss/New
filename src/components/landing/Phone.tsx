import type { ReactNode } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  Bell, CalendarDays, ChevronRight, Home, MapPin, MessageCircle, Plane, Siren, Sparkles, Ticket, UserRound, Utensils, Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSiteImages } from "@/lib/site-images.functions";

/** iPhone-style frame. Children fill the screen; the frame scales with its width. */
export function PhoneFrame({ children, className, dark = false }: { children: ReactNode; className?: string; dark?: boolean }) {
  return (
    <div aria-hidden className={cn("relative aspect-[9/19.2] w-[300px] rounded-[3rem] bg-[oklch(0.18_0.02_265)] p-[10px] shadow-float ring-1 ring-black/10", className)}>
      <div className="relative h-full w-full overflow-hidden rounded-[2.4rem] bg-background">
        {children}
        <span className="absolute left-1/2 top-2.5 z-20 h-[26px] w-[92px] -translate-x-1/2 rounded-full bg-black" />
        <StatusBar dark={dark} />
      </div>
    </div>
  );
}

function StatusBar({ dark }: { dark: boolean }) {
  return (
    <div className={cn("absolute inset-x-0 top-0 z-10 flex h-11 items-center justify-between px-7 text-[11px] font-semibold", dark ? "text-white" : "text-foreground")}>
      <span>9:41</span>
      <span className="flex items-center gap-1">
        <svg viewBox="0 0 18 12" className="h-2.5 w-4 fill-current"><rect x="0" y="8" width="3" height="4" rx="1" /><rect x="5" y="5" width="3" height="7" rx="1" /><rect x="10" y="2" width="3" height="10" rx="1" /><rect x="15" y="0" width="3" height="12" rx="1" /></svg>
        <svg viewBox="0 0 26 12" className="h-2.5 w-5"><rect x="0.5" y="0.5" width="22" height="11" rx="3" className="fill-none stroke-current" opacity=".5" /><rect x="2" y="2" width="17" height="8" rx="1.8" className="fill-current" /></svg>
      </span>
    </div>
  );
}

const NAV = [
  { Icon: Home, label: "Home" },
  { Icon: CalendarDays, label: "Plan" },
  { Icon: Wallet, label: "Split" },
  { Icon: MessageCircle, label: "Chat" },
  { Icon: UserRound, label: "Me" },
];

function BottomNav({ active }: { active: string }) {
  return (
    <nav className="absolute inset-x-0 bottom-0 flex justify-around border-t bg-card px-2 pb-5 pt-2">
      {NAV.map(({ Icon, label }) => (
        <span key={label} className={cn("flex flex-col items-center gap-0.5 text-[9px] font-semibold", label === active ? "text-primary" : "text-muted-foreground")}>
          <Icon className="h-[18px] w-[18px]" strokeWidth={label === active ? 2.4 : 1.8} />
          {label}
        </span>
      ))}
    </nav>
  );
}

export function Face({ name, className }: { name: string; className?: string }) {
  const hues = [266, 200, 155, 35, 320];
  const h = hues[name.charCodeAt(0) % hues.length];
  return (
    <span className={cn("grid h-7 w-7 shrink-0 place-items-center rounded-full text-[10px] font-bold ring-2 ring-card", className)} style={{ background: `oklch(0.9 0.06 ${h})`, color: `oklch(0.35 0.12 ${h})` }}>
      {name.split(" ").map((p) => p[0]).join("").slice(0, 2)}
    </span>
  );
}

export function HomeScreen() {
  const photos = useSiteImages();
  return (
    <div className="relative h-full">
      <div className="relative h-[44%]">
        <img src={photos.app_home.src} alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/30 to-black/70" />
        <div className="absolute inset-x-0 top-12 flex items-center justify-between px-4">
          <span className="flex items-center gap-2 text-[13px] font-semibold text-white"><Face name="Alex Rivera" />Hi, Alex</span>
          <span className="grid h-8 w-8 place-items-center rounded-full bg-white/90"><Bell className="h-4 w-4" /></span>
        </div>
        <div className="absolute bottom-10 left-4 right-4 text-white">
          <p className="text-[11px] opacity-85">Day 2 of 5, Dubai</p>
          <p className="text-[19px] font-bold leading-tight">Dubai & Desert Discovery</p>
        </div>
      </div>
      <div className="relative -mt-7 space-y-3 px-3">
        <div className="grid grid-cols-4 gap-1 rounded-2xl bg-card p-3 shadow-card">
          {[[CalendarDays, "Plan"], [Ticket, "Tickets"], [Wallet, "Split"], [Sparkles, "Extras"]].map(([I, l]) => {
            const Icon = I as typeof Ticket;
            return (
              <span key={l as string} className="flex flex-col items-center gap-1 text-[10px] font-semibold">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-accent text-primary"><Icon className="h-[18px] w-[18px]" /></span>
                {l as string}
              </span>
            );
          })}
        </div>
        <p className="px-1 text-[13px] font-bold">Next up</p>
        <div className="rounded-2xl bg-card p-3 shadow-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[13px] font-bold">Desert safari departs</p>
              <p className="mt-0.5 flex items-center gap-1 text-[10px] text-muted-foreground"><MapPin className="h-3 w-3" />Hotel lobby</p>
            </div>
            <span className="rounded-lg bg-accent px-2 py-1 text-[11px] font-bold text-primary">15:00</span>
          </div>
          <p className="mt-2 rounded-lg bg-muted px-2 py-1.5 text-[10px] text-muted-foreground">Bring sunglasses, closed shoes and a scarf.</p>
        </div>
        <div className="flex items-center gap-3 rounded-2xl bg-card p-3 shadow-card">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-accent text-primary"><Utensils className="h-4 w-4" /></span>
          <div className="flex-1"><p className="text-[12px] font-bold">Bedouin camp BBQ</p><p className="text-[10px] text-muted-foreground">19:00, group booking</p></div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>
      <BottomNav active="Home" />
    </div>
  );
}

export function TicketScreen() {
  return (
    <div className="relative h-full bg-muted pt-12">
      <div className="px-4">
        <p className="text-[19px] font-bold">My tickets</p>
        <div className="mt-3 grid grid-cols-2 rounded-xl bg-card p-1 text-[11px] font-semibold shadow-card">
          <span className="rounded-lg bg-primary py-1.5 text-center text-primary-foreground">Upcoming</span>
          <span className="py-1.5 text-center text-muted-foreground">Used</span>
        </div>
      </div>
      <div className="mx-3 mt-4 overflow-hidden rounded-2xl bg-card shadow-card">
        <div className="bg-primary p-4 text-primary-foreground">
          <div className="flex items-center justify-between text-[10px] opacity-85"><span>Emirates EK 202</span><span>12 Nov</span></div>
          <div className="mt-2 flex items-center justify-between">
            <div><p className="text-[24px] font-extrabold leading-none">JFK</p><p className="text-[10px] opacity-80">New York</p></div>
            <div className="flex flex-1 items-center px-3"><span className="h-px flex-1 border-t border-dashed border-white/60" /><Plane className="mx-1 h-4 w-4" /><span className="h-px flex-1 border-t border-dashed border-white/60" /></div>
            <div className="text-right"><p className="text-[24px] font-extrabold leading-none">DXB</p><p className="text-[10px] opacity-80">Dubai</p></div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 px-4 py-3 text-[10px]">
          {[["Passenger", "Alex Rivera"], ["Seat", "34A"], ["Boards", "07:40"]].map(([k, v]) => (
            <div key={k}><p className="text-muted-foreground">{k}</p><p className="text-[12px] font-bold">{v}</p></div>
          ))}
        </div>
        <div className="relative border-t border-dashed px-4 py-4">
          <span className="absolute -left-2.5 -top-2.5 h-5 w-5 rounded-full bg-muted" />
          <span className="absolute -right-2.5 -top-2.5 h-5 w-5 rounded-full bg-muted" />
          <div className="mx-auto w-fit rounded-xl bg-white p-2"><QRCodeSVG value="WANDERSYNC-EK202-34A" size={96} /></div>
          <p className="mt-2 text-center font-board text-[10px] tracking-widest text-muted-foreground">EK202-34A-RIVERA</p>
        </div>
      </div>
      <div className="mx-3 mt-3 flex items-center gap-3 rounded-2xl bg-card p-3 shadow-card">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-accent text-primary"><Ticket className="h-4 w-4" /></span>
        <div className="flex-1"><p className="text-[12px] font-bold">Burj Khalifa, At the Top</p><p className="text-[10px] text-muted-foreground">14 Nov, 17:30</p></div>
      </div>
      <BottomNav active="Plan" />
    </div>
  );
}

const BARS = [28, 46, 34, 62, 88, 70, 40];

export function SplitScreen() {
  return (
    <div className="relative h-full bg-muted pt-12">
      <div className="px-4">
        <p className="text-[11px] text-muted-foreground">Room 304 crew</p>
        <p className="text-[19px] font-bold">Shared costs</p>
      </div>
      <div className="mx-3 mt-3 rounded-2xl bg-card p-4 shadow-card">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[11px] text-muted-foreground">You owe Sarah</p>
            <p className="text-[30px] font-extrabold leading-tight tracking-tight">$42.50</p>
          </div>
          <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold text-primary">3 people</span>
        </div>
        <div className="mt-3 flex h-16 items-end gap-1.5">
          {BARS.map((h, i) => (
            <span key={i} className="flex-1 rounded-md" style={{ height: `${h}%`, background: `color-mix(in oklab, var(--primary) ${30 + h * 0.7}%, white)` }} />
          ))}
        </div>
        <div className="mt-1 flex justify-between text-[9px] text-muted-foreground"><span>Mon</span><span>Sun</span></div>
      </div>
      <div className="mx-3 mt-3 divide-y rounded-2xl bg-card px-3 shadow-card">
        {[["Sarah Chen", "Taxi and dinner", "$97.50"], ["John Okafor", "Water and snacks", "$30.00"], ["Alex Rivera", "Museum tickets", "$54.00"]].map(([who, what, amt]) => (
          <div key={what} className="flex items-center gap-2.5 py-2.5">
            <Face name={who!} />
            <div className="min-w-0 flex-1"><p className="truncate text-[12px] font-semibold">{what}</p><p className="text-[10px] text-muted-foreground">Paid by {who!.split(" ")[0]}</p></div>
            <span className="text-[12px] font-bold tabular-nums">{amt}</span>
          </div>
        ))}
      </div>
      <div className="mx-3 mt-3 rounded-xl bg-primary py-2.5 text-center text-[12px] font-semibold text-primary-foreground">Settle up with Sarah</div>
      <BottomNav active="Split" />
    </div>
  );
}

export function SosScreen() {
  return (
    <div className="relative h-full">
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 300 640" preserveAspectRatio="xMidYMid slice">
        <rect width="300" height="640" className="fill-muted" />
        <g className="stroke-card" strokeWidth="14" fill="none" strokeLinecap="round">
          <path d="M-20 180 L320 120" /><path d="M-20 420 L320 380" /><path d="M90 -20 L130 660" /><path d="M230 -20 L200 660" />
        </g>
        <g className="stroke-border" strokeWidth="6" fill="none"><path d="M-20 300 L320 270" /><path d="M20 -20 L40 660" /></g>
        <rect x="150" y="190" width="40" height="60" rx="6" className="fill-accent" />
        <rect x="20" y="460" width="60" height="40" rx="6" className="fill-accent" />
      </svg>
      <div className="absolute left-1/2 top-[34%] -translate-x-1/2 -translate-y-1/2">
        <span className="sos-pulse grid h-28 w-28 place-items-center rounded-full bg-destructive text-destructive-foreground shadow-float">
          <span className="flex flex-col items-center text-[13px] font-extrabold"><Siren className="mb-1 h-7 w-7" />SOS</span>
        </span>
      </div>
      <div className="absolute inset-x-3 bottom-[88px] rounded-2xl bg-card p-4 shadow-card">
        <p className="text-[14px] font-bold">Alert sent</p>
        <p className="mt-0.5 text-[11px] text-muted-foreground">Your live location is shared with your trip team.</p>
        <div className="mt-3 space-y-2">
          {[["Sarah Chen", "Caretaker, 400 m away"], ["Omar Haddad", "Organiser, calling you"]].map(([n, r]) => (
            <div key={n} className="flex items-center gap-2.5"><Face name={n!} /><div className="flex-1"><p className="text-[12px] font-semibold">{n}</p><p className="text-[10px] text-muted-foreground">{r}</p></div><span className="h-2 w-2 rounded-full bg-success" /></div>
          ))}
        </div>
      </div>
      <BottomNav active="Home" />
    </div>
  );
}
