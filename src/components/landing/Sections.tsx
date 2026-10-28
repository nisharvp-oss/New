import { Link } from "@tanstack/react-router";
import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import {
  ArrowRight, ArrowUpRight, Banknote, BellRing, Briefcase, Check, CheckCircle2, ClipboardList, CreditCard, FileText, Link2,
  MapPin, Navigation, Phone, QrCode, ShieldCheck, Siren, Star, Ticket, Users, Utensils, Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Wordmark } from "@/components/ws/Brand";
import { useSession } from "@/hooks/use-session";
import { cn } from "@/lib/utils";
import cover from "@/assets/trip-cover.jpg";
import quad from "@/assets/addon-quad.jpg";
import scuba from "@/assets/addon-scuba.jpg";
import cook from "@/assets/addon-cook.jpg";
import { Face, HomeScreen, PhoneFrame, SosScreen, SplitScreen, TicketScreen } from "./Phone";
import { useSiteImages } from "@/lib/site-images.functions";
import type { Tier } from "@/lib/pricing";
import { Car as CarArt, CityScene, Ferry, MiniCity, MiniPeaks, MiniSea, MiniSky, MountainScene, Plane as PlaneArt, SeaScene, SkyScene, Train as TrainArt } from "./JourneyArt";

const d = (ms: number) => ({ "--d": `${ms}ms` }) as CSSProperties;

export function Nav() {
  const { user } = useSession();
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 40);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  return (
    <header className="pt-safe fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-5">
      <div className={cn(
        "mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 rounded-2xl px-3 transition-[background-color,box-shadow,color] duration-300 sm:px-4",
        scrolled ? "bg-card/85 text-foreground shadow-card backdrop-blur-xl" : "text-white",
      )}>
        <Link to="/" aria-label="WanderSync home"><Wordmark /></Link>
        <nav className="flex items-center gap-1 text-sm font-medium">
          {[["#features", "Features"], ["#split", "Split bills"], ["#pricing", "Pricing"]].map(([h, l]) => (
            <a key={h} href={h} className={cn("hidden rounded-lg px-3 py-2 md:inline", scrolled ? "text-muted-foreground hover:text-foreground" : "text-white/80 hover:text-white")}>{l}</a>
          ))}
          {user ? (
            <Button size="sm" className="ml-1 rounded-full px-4" asChild><Link to="/dashboard">Open app</Link></Button>
          ) : (
            <>
              <Link to="/auth" search={{ plan: undefined }} className={cn("rounded-lg px-3 py-2", scrolled ? "text-foreground" : "text-white")}>Sign in</Link>
              <Button size="sm" className="hidden rounded-full px-4 sm:inline-flex" asChild><Link to="/auth" search={{ plan: undefined }}>Sign up free</Link></Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

function Glass({ children, className, style }: { children: ReactNode; className?: string; style?: CSSProperties }) {
  return <div style={style} className={cn("rounded-2xl bg-card/95 p-3 shadow-float ring-1 ring-black/5 backdrop-blur", className)}>{children}</div>;
}

export function Hero() {
  const photos = useSiteImages();
  return (
    <section className="relative px-2 pt-2 sm:px-3 sm:pt-3">
      <div className="relative overflow-hidden rounded-[2rem] sm:rounded-[2.5rem]">
        <div data-parallax="0.18" className="absolute inset-0">
          <img src={photos.landing_hero.src} alt={photos.landing_hero.alt} className="intro-photo h-full w-full object-cover" fetchPriority="high" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-black/45" />
        <div className="relative mx-auto grid min-h-[min(100svh,900px)] max-w-7xl items-end gap-10 px-5 pb-12 pt-32 sm:px-8 lg:grid-cols-[1.5fr_1fr] lg:pb-16">
          <div className="text-white">
            <p className="intro inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-sm backdrop-blur" style={d(100)}>
              <span className="h-2 w-2 rounded-full bg-success" /> For tour operators and group organisers
            </p>
            <h1 className="mt-5 text-[clamp(2.6rem,4.1vw,3.75rem)] font-extrabold leading-[1.02] tracking-[-0.035em]">
              <span className="intro block lg:whitespace-nowrap" style={d(200)}>The group trip app</span>
              <span className="intro block lg:whitespace-nowrap" style={d(320)}>travelers actually open.</span>
            </h1>
            <p className="intro mt-5 max-w-xl text-lg text-white/85 sm:text-xl" style={d(460)}>
              Plan the itinerary, hand out tickets, check people in, split costs and answer an SOS. One app for your team and everyone on the trip.
            </p>
            <div className="intro mt-8 flex flex-col gap-3 sm:flex-row" style={d(580)}>
              <Button size="lg" className="rounded-full px-7 shadow-glow" asChild><Link to="/auth" search={{ plan: undefined }}>Sign up free <ArrowRight /></Link></Button>
              <Button size="lg" variant="ghost" className="rounded-full bg-white/15 px-7 text-white backdrop-blur hover:bg-white/25 hover:text-white" asChild><Link to="/traveler">See the traveler app</Link></Button>
            </div>
            <p className="intro mt-4 text-sm text-white/75" style={d(660)}>Free to sign up. No credit card needed.</p>
          </div>
          <div className="relative hidden justify-center lg:flex">
            <div data-stop-d="0" className="intro relative" style={d(400)}>
              <PhoneFrame dark className="w-[290px]"><HomeScreen /></PhoneFrame>
              <Glass className="float-y absolute -left-24 top-24 w-52" style={d(0)}>
                <div className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-success" /><p className="text-sm font-semibold">22 of 24 checked in</p></div>
                <div className="mt-2 flex -space-x-2">{["Sarah Chen", "John Okafor", "Priya Nair", "Lukas Weber"].map((n) => <Face key={n} name={n} />)}<span className="grid h-7 w-7 place-items-center rounded-full bg-muted text-[10px] font-bold ring-2 ring-card">+18</span></div>
              </Glass>
              <Glass className="float-y absolute -right-20 bottom-36 w-48" style={d(1500)}>
                <p className="text-xs text-muted-foreground">Settled up</p>
                <p className="text-sm font-semibold">Alex paid Sarah <span className="text-primary">$42.50</span></p>
              </Glass>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

type Point = { icon: typeof Ticket; t: string; d: string };
const STEPS: { kicker: string; icon: typeof Ticket; title: string; body: string; points: Point[]; screen: ReactNode }[] = [
  {
    kicker: "Itinerary", icon: ClipboardList, title: "Today's plan, on every phone",
    body: "Build each day once and every traveler carries it. No printed schedules, no forwarded PDFs, no \"what time is pickup?\" messages.",
    points: [
      { icon: MapPin, t: "Times and meeting points", d: "with a map link for every stop" },
      { icon: Utensils, t: "Meal notes", d: "included, group booking or self-pay" },
      { icon: BellRing, t: "Instant updates", d: "change a time and everyone sees it" },
    ],
    screen: <HomeScreen />,
  },
  {
    kicker: "Tickets & check-in", icon: Ticket, title: "Tickets that never get lost",
    body: "Flights, entries, transfers and boarding passes sit in each traveler's app, ready to scan at the gate or the bus door.",
    points: [
      { icon: QrCode, t: "Scannable QR codes", d: "for every ticket you issue" },
      { icon: FileText, t: "Documents and boarding passes", d: "sent to the right person" },
      { icon: CheckCircle2, t: "Check-ins at each stop", d: "caretakers see who's missing" },
    ],
    screen: <TicketScreen />,
  },
  {
    kicker: "Split bills", icon: Wallet, title: "Split the bill, keep the friendship",
    body: "Travelers log what they paid as they go. WanderSync keeps a running balance and works out who owes whom.",
    points: [
      { icon: Users, t: "Groups for anything", d: "rooms, activities or the whole trip" },
      { icon: Wallet, t: "Equal, exact or percentage", d: "splits that add up to the cent" },
      { icon: Check, t: "Fewest payments", d: "to settle everyone up at the end" },
    ],
    screen: <SplitScreen />,
  },
  {
    kicker: "Safety", icon: Siren, title: "Help is one tap away",
    body: "If something goes wrong, a traveler presses SOS and the people responsible for them know straight away.",
    points: [
      { icon: Navigation, t: "Live location", d: "shared with the organiser and caretaker" },
      { icon: Phone, t: "Name and phone", d: "so the team can call back immediately" },
      { icon: ShieldCheck, t: "Safety log", d: "every alert recorded and resolved" },
    ],
    screen: <SosScreen />,
  },
];

/** The vehicle and scene for each leg of the route, from the hero phone down to the last feature. */
export const JOURNEY_LEGS = [
  { label: "By air", Vehicle: PlaneArt, Scene: SkyScene, Mini: MiniSky, tilt: 28 },
  { label: "By sea", Vehicle: Ferry, Scene: SeaScene, Mini: MiniSea, tilt: 10 },
  { label: "By rail", Vehicle: TrainArt, Scene: MountainScene, Mini: MiniPeaks, tilt: 14 },
  { label: "By road", Vehicle: CarArt, Scene: CityScene, Mini: MiniCity, tilt: 10 },
];

/**
 * Route drawn between the hero phone and each feature phone; journey.ts sizes the paths from the
 * stops' positions, moves each vehicle along its leg as the page scrolls, and shows that leg's
 * scene while the vehicle is on the move: beside the route on wide screens, a mini version riding
 * behind the vehicle on the narrow timeline.
 */
export function JourneyOverlay() {
  return (
    <div aria-hidden data-journey-overlay className="pointer-events-none absolute inset-0 z-30 overflow-hidden">
      {JOURNEY_LEGS.map(({ Scene }, i) => (
        <div key={i} data-scene={i} data-active="false" className="absolute left-0 top-0 hidden h-[170px] w-[360px] lg:block">
          <div className="scene-depth h-full w-full"><Scene /></div>
        </div>
      ))}
      {JOURNEY_LEGS.map(({ Mini }, i) => (
        <div key={i} data-companion={i} data-active="false" className="absolute left-0 top-0 h-[38px] w-[56px] lg:hidden">
          <Mini />
        </div>
      ))}
      <svg data-route className="absolute left-0 top-0 overflow-visible">
        {JOURNEY_LEGS.map((_, i) => (
          <g key={i} data-leg={i}>
            <path data-base className="fill-none stroke-primary/30" strokeWidth="2.5" strokeDasharray="1 9" strokeLinecap="round" />
            <path data-progress className="fill-none stroke-primary" strokeWidth="3" strokeLinecap="round" />
          </g>
        ))}
        {[0, 1, 2, 3, 4].map((i) => <circle key={i} data-dot={i} r="7" className="fill-primary stroke-card" strokeWidth="3.5" />)}
      </svg>
      {JOURNEY_LEGS.map(({ Vehicle, tilt }, i) => (
        <div key={i} data-vehicle={i} data-tilt={tilt} className="absolute left-0 top-0 h-[28px] w-[54px] opacity-0 drop-shadow-lg transition-opacity duration-300 lg:h-[52px] lg:w-[98px]">
          <Vehicle />
        </div>
      ))}
    </div>
  );
}

export function FeatureStory() {
  return (
    <section id="features" className="scroll-mt-20 pb-16 pt-20 sm:pb-24 sm:pt-28">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="relative max-w-2xl pl-16 lg:pl-0" data-reveal>
          <span data-stop-m="0" className="absolute left-0 top-1 h-6 w-6 lg:hidden" />
          <p className="font-semibold text-primary">Everything in one app</p>
          <h2 className="mt-3 text-[clamp(2rem,4.6vw,3.5rem)] font-extrabold leading-[1.05] tracking-[-0.03em]">Your whole trip, in everyone's pocket</h2>
          <p className="mt-4 text-lg text-muted-foreground">Follow a trip from the first plan to the last stop. Every traveler gets the same app, your team sees everything.</p>
        </div>

        <ol className="mt-14 space-y-24 sm:mt-16 lg:mt-48 lg:space-y-40">
          {STEPS.map((s, i) => {
            const phoneLeft = i % 2 === 0;
            return (
              <li key={s.title} data-stop-m={i + 1} className="grid items-center gap-10 pl-16 lg:grid-cols-2 lg:gap-20 lg:pl-0">
                <div data-reveal className={cn("max-w-lg", phoneLeft ? "lg:order-2" : "lg:justify-self-end")}>
                  <span className="inline-flex items-center gap-2 rounded-full bg-accent px-3 py-1.5 text-sm font-semibold text-primary">
                    <s.icon className="h-4 w-4" />{s.kicker}
                  </span>
                  <h3 className="mt-4 text-[clamp(1.75rem,3.2vw,2.5rem)] font-extrabold leading-tight tracking-[-0.03em]">{s.title}</h3>
                  <p className="mt-3 text-lg leading-relaxed text-muted-foreground">{s.body}</p>
                  <ul className="mt-6 space-y-3">
                    {s.points.map((p) => (
                      <li key={p.t} className="flex items-center gap-3">
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-card text-primary shadow-card"><p.icon className="h-[18px] w-[18px]" /></span>
                        <span><span className="font-semibold">{p.t}</span> <span className="text-muted-foreground">{p.d}</span></span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className={cn("flex justify-center", phoneLeft ? "lg:order-1 lg:justify-end" : "lg:justify-start")}>
                  <div data-stop-d={i + 1} className="relative">
                    <div className="absolute -inset-10 -z-10 rounded-full bg-accent/80 blur-3xl" />
                    <PhoneFrame className="w-[240px] sm:w-[270px]">{s.screen}</PhoneFrame>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}

export function SplitSection() {
  return (
    <section id="split" className="scroll-mt-20 bg-card py-24 sm:py-32">
      <div className="mx-auto grid max-w-7xl items-center gap-14 px-5 sm:px-8 lg:grid-cols-2 lg:gap-20">
        <div data-reveal>
          <p className="font-semibold text-primary">Split bills</p>
          <h2 className="mt-3 text-[clamp(2rem,4.6vw,3.5rem)] font-extrabold leading-[1.05] tracking-[-0.03em]">No more "who paid for dinner?"</h2>
          <p className="mt-5 max-w-lg text-lg leading-relaxed text-muted-foreground">Travelers add what they paid, split equally or by amount. WanderSync keeps a running balance for each group and works out the fewest payments to settle up.</p>
          <ul className="mt-8 space-y-3">
            {["Equal, exact or percentage splits", "Room groups, activity groups, whole trip", "Settle with one tap when it's paid"].map((t) => (
              <li key={t} className="flex items-center gap-3"><span className="grid h-6 w-6 place-items-center rounded-full bg-accent text-primary"><Check className="h-3.5 w-3.5" /></span>{t}</li>
            ))}
          </ul>
        </div>
        <div className="grid gap-4 sm:grid-cols-2" data-reveal-group>
          <div className="rounded-3xl border bg-background p-6 sm:col-span-2">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Trip spend so far</p>
                <p className="mt-1 text-5xl font-extrabold tracking-[-0.03em]">$<span data-count="1420">1,420</span></p>
              </div>
              <span className="rounded-full bg-success/10 px-3 py-1 text-sm font-semibold text-success">4 of 6 settled</span>
            </div>
            <div className="mt-6 flex h-28 items-end gap-2">
              {[30, 52, 38, 70, 100, 76, 44].map((h, i) => (
                <span key={i} className="flex-1 rounded-lg" style={{ height: `${h}%`, background: `color-mix(in oklab, var(--primary) ${25 + h * 0.75}%, white)` }} />
              ))}
            </div>
            <div className="mt-2 flex justify-between text-xs text-muted-foreground">{["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((x) => <span key={x}>{x}</span>)}</div>
          </div>
          <div className="rounded-3xl border bg-background p-6">
            <p className="text-sm text-muted-foreground">You owe Sarah</p>
            <p className="mt-1 text-3xl font-extrabold tracking-[-0.02em]">$<span data-count="42.50">42.50</span></p>
            <div className="mt-4 flex items-center gap-2"><Face name="Sarah Chen" className="h-9 w-9" /><Face name="Alex Rivera" className="-ml-3 h-9 w-9" /></div>
            <span className="mt-5 inline-flex w-full items-center justify-center rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground">Settle up</span>
          </div>
          <div className="rounded-3xl border bg-background p-6">
            <p className="text-sm text-muted-foreground">Latest</p>
            <ul className="mt-3 space-y-3 text-sm">
              {[["Sarah Chen", "Taxi and dinner", "97.50"], ["John Okafor", "Water and snacks", "30.00"]].map(([n, w, a]) => (
                <li key={w} className="flex items-center gap-2.5"><Face name={n!} /><span className="flex-1 truncate">{w}</span><span className="font-semibold tabular-nums">${a}</span></li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

const EXTRAS = [
  { img: quad, title: "Sunset quad biking", place: "Al Marmoom desert", price: 65, cutoff: "Book by 11 Nov", rating: "4.9" },
  { img: scuba, title: "Intro dive at JBR", place: "Jumeirah Beach", price: 120, cutoff: "Book by 10 Nov", rating: "4.8" },
  { img: cook, title: "Emirati cooking class", place: "Al Fahidi", price: 45, cutoff: "Book by 13 Nov", rating: "5.0" },
  { img: cover, title: "Dune walk at dawn", place: "Lahbab red dunes", price: 30, cutoff: "Book by 12 Nov", rating: "4.7" },
];

export function ExtrasGallery() {
  return (
    <section data-hscroll className="overflow-hidden py-24 sm:py-32 lg:flex lg:h-screen lg:flex-col lg:justify-center lg:py-0">
      <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end" data-reveal>
          <div>
            <p className="font-semibold text-primary">Add-ons</p>
            <h2 className="mt-3 max-w-xl text-[clamp(2rem,4.6vw,3.5rem)] font-extrabold leading-[1.05] tracking-[-0.03em]">Sell the extras travelers want</h2>
          </div>
          <p className="max-w-sm text-lg text-muted-foreground">List optional activities with a price and a booking cutoff. Travelers book in the app and pay you directly.</p>
        </div>
      </div>
      <div data-track className="no-scrollbar mt-10 flex snap-x snap-mandatory gap-5 overflow-x-auto px-5 pb-4 sm:px-8 lg:mt-14 lg:overflow-visible lg:px-[max(2rem,calc((100vw-80rem)/2+2rem))]">
        {EXTRAS.map((x) => (
          <article key={x.title} className="group relative w-[78vw] max-w-[420px] shrink-0 snap-start overflow-hidden rounded-[2rem] bg-card shadow-card sm:w-[380px] lg:w-[420px]">
            <div className="relative aspect-[4/3] overflow-hidden">
              <img src={x.img} alt={x.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
              <span className="absolute left-4 top-4 rounded-full bg-black/45 px-3 py-1 text-xs font-medium text-white backdrop-blur">{x.cutoff}</span>
              <span className="absolute right-4 top-4 flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold"><Star className="h-3.5 w-3.5 fill-sunset text-sunset" />{x.rating}</span>
            </div>
            <div className="flex items-end justify-between gap-4 p-5">
              <div className="min-w-0">
                <h3 className="truncate text-xl font-bold">{x.title}</h3>
                <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground"><MapPin className="h-3.5 w-3.5" />{x.place}</p>
              </div>
              <p className="shrink-0 text-right"><span className="block text-xs text-muted-foreground">From</span><span className="text-2xl font-extrabold">${x.price}</span></p>
            </div>
          </article>
        ))}
        <div className="flex w-[78vw] max-w-[340px] shrink-0 snap-start flex-col justify-center rounded-[2rem] bg-primary p-8 text-primary-foreground sm:w-[340px]">
          <p className="text-2xl font-extrabold leading-tight">Travelers pay the way you choose</p>
          <ul className="mt-6 space-y-3">
            <li className="flex items-center gap-3"><Banknote className="h-5 w-5" />Cash on the trip</li>
            <li className="flex items-center gap-3"><Link2 className="h-5 w-5" />Your payment link</li>
            <li className="flex items-center gap-3"><CreditCard className="h-5 w-5" />Bank transfer</li>
          </ul>
        </div>
      </div>
    </section>
  );
}

const ROLES = [
  { icon: Briefcase, title: "Owners", body: "Run the company, invite your team and set how travelers pay you." },
  { icon: ClipboardList, title: "Organisers", body: "Build trips, issue tickets and post announcements to the group." },
  { icon: ShieldCheck, title: "Caretakers", body: "Travel with the group, scan check-ins and respond to alerts." },
  { icon: Users, title: "Travelers", body: "See the plan, carry tickets, book extras and split costs." },
];

export function Roles() {
  return (
    <section className="bg-card py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <h2 className="max-w-2xl text-[clamp(2rem,4.6vw,3.5rem)] font-extrabold leading-[1.05] tracking-[-0.03em]" data-reveal>Made for everyone on the trip</h2>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4" data-reveal-group>
          {ROLES.map((r) => (
            <div key={r.title} className="rounded-3xl border bg-background p-6 transition-shadow hover:shadow-card">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-accent text-primary"><r.icon className="h-5 w-5" /></span>
              <h3 className="mt-5 text-xl font-bold">{r.title}</h3>
              <p className="mt-2 text-muted-foreground">{r.body}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-[1.4fr_1fr]" data-reveal-group>
          <div className="flex flex-col justify-between gap-6 rounded-3xl bg-navy p-8 text-navy-foreground sm:p-10">
            <BellRing className="h-7 w-7 text-sunset" />
            <div>
              <p className="text-3xl font-extrabold leading-tight tracking-[-0.02em]">Trip payments go straight to you.</p>
              <p className="mt-3 max-w-lg text-navy-foreground/70">WanderSync never handles your travelers' money. We're paid only for your subscription, so there's no cut of your bookings.</p>
            </div>
          </div>
          <div className="flex flex-col justify-between gap-6 rounded-3xl bg-accent p-8 sm:p-10">
            <MapPin className="h-7 w-7 text-primary" />
            <div>
              <p className="text-2xl font-extrabold leading-tight tracking-[-0.02em]">Local businesses can sponsor free trips</p>
              <Link to="/sponsor" className="mt-3 inline-flex items-center gap-1 font-semibold text-primary">Sponsor dashboard <ArrowUpRight className="h-4 w-4" /></Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function Pricing({ tiers }: { tiers: Tier[] }) {
  return (
    <section id="pricing" className="scroll-mt-20 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="mx-auto max-w-2xl text-center" data-reveal>
          <h2 className="text-[clamp(2rem,4.6vw,3.5rem)] font-extrabold leading-[1.05] tracking-[-0.03em]">Free to start. Pay only when you grow.</h2>
          <p className="mt-3 text-lg text-muted-foreground">Sign up free, no credit card needed. Every plan includes every feature.</p>
        </div>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-5" data-reveal-group>
          {tiers.map((t) => (
            <div key={t.key} className={cn("relative flex flex-col rounded-[1.75rem] p-6", t.highlight ? "bg-primary text-primary-foreground shadow-glow" : "border bg-card")}>
              {t.badge && <span className={cn("absolute right-5 top-5 rounded-full px-2.5 py-1 text-xs font-semibold", t.highlight ? "bg-white/20" : "bg-accent text-primary")}>{t.badge}</span>}
              <h3 className="text-lg font-bold">{t.name}</h3>
              <p className={cn("mt-1 min-h-10 text-sm", t.highlight ? "text-primary-foreground/80" : "text-muted-foreground")}>{t.blurb}</p>
              {t.price ? (
                <p className="mt-5 text-4xl font-extrabold tracking-[-0.03em]">{t.price}<span className={cn("ml-1.5 text-sm font-medium", t.highlight ? "text-primary-foreground/80" : "text-muted-foreground")}>{t.per}</span></p>
              ) : (
                <p className="mt-5 text-2xl font-extrabold leading-10 tracking-[-0.02em]">Let's talk</p>
              )}
              <ul className="mt-5 flex-1 space-y-2.5 text-sm">
                {t.points.map((f) => <li key={f} className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0" />{f}</li>)}
              </ul>
              {t.cta.kind === "contact" ? (
                <Button size="lg" variant="outline" className="mt-7 w-full rounded-full" asChild>
                  <a href={t.cta.email ? `mailto:${t.cta.email}?subject=${encodeURIComponent("WanderSync Enterprise")}` : "#pricing"}>Contact us</a>
                </Button>
              ) : (
                <Button size="lg" className={cn("mt-7 w-full rounded-full", t.highlight && "bg-white text-primary hover:bg-white/90")} variant={t.highlight ? "default" : t.key === "free" ? "default" : "outline"} asChild>
                  <Link to="/auth" search={{ plan: t.cta.plan }}>{t.key === "free" ? "Sign up free" : t.key === "payg" ? "Start a trip" : `Choose ${t.name}`}</Link>
                </Button>
              )}
            </div>
          ))}
        </div>
        <p className="mt-6 text-center text-sm text-muted-foreground" data-reveal>Trip payments from your travelers always go straight to you.</p>
      </div>
    </section>
  );
}

export function FinalCta() {
  const photos = useSiteImages();
  return (
    <section className="pb-3">
      <div data-expand className="relative overflow-hidden">
        <img src={photos.landing_cta.src} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/10" />
        <div className="relative mx-auto flex min-h-[80svh] max-w-7xl flex-col items-start justify-end px-5 pb-16 text-white sm:px-8 sm:pb-20">
          <h2 className="max-w-3xl text-[clamp(2.4rem,6vw,4.75rem)] font-extrabold leading-[1.02] tracking-[-0.035em]" data-reveal>Your next group trip, without the chaos.</h2>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row" data-reveal>
            <Button size="lg" className="rounded-full px-7 shadow-glow" asChild><Link to="/auth" search={{ plan: undefined }}>Sign up free <ArrowRight /></Link></Button>
            <Button size="lg" variant="ghost" className="rounded-full bg-white/15 px-7 text-white backdrop-blur hover:bg-white/25 hover:text-white" asChild><Link to="/demo">Explore a sample trip</Link></Button>
          </div>
        </div>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="pb-safe">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <Wordmark />
        <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
          <Link to="/demo" className="hover:text-foreground">Sample trip</Link>
          <Link to="/traveler" className="hover:text-foreground">Traveler app</Link>
          <Link to="/sponsor" className="hover:text-foreground">For local businesses</Link>
          <Link to="/auth" search={{ plan: undefined }} className="hover:text-foreground">Sign in</Link>
        </nav>
      </div>
    </footer>
  );
}
