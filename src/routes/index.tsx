import { createFileRoute, Link } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ArrowUpRight, Check, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Wordmark } from "@/components/ws/Brand";
import { DeparturesBoard } from "@/components/landing/DeparturesBoard";
import { RouteJourney } from "@/components/landing/RouteJourney";
import { PhoneMock } from "@/components/landing/PhoneMock";
import { useSession } from "@/hooks/use-session";
import { cn } from "@/lib/utils";
import type { Database } from "@/integrations/supabase/types";

const getPricing = createServerFn({ method: "GET" }).handler(async () => {
  // The landing page must render even when the backend is unreachable, so failures fall back to no plans.
  try {
    const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
    const sb = createClient<Database>(process.env["SUPABASE_URL"]!, key, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      } },
    });
    const [{ data: plans }, { data: trialDays }, { data: terms }] = await Promise.all([
      sb.from("plans").select("id,name,description,price,billing_interval,max_trips,max_organisers,max_travelers_per_trip,features").eq("is_active", true).order("sort_order"),
      sb.rpc("get_trial_days"),
      sb.rpc("free_trip_terms"),
    ]);
    const t = terms?.[0];
    return {
      plans: plans ?? [],
      trialDays: (trialDays as number | null) ?? 14,
      freeTravelers: t?.free_travelers ?? 10,
      unlockPrice: Number(t?.unlock_price ?? 20),
    };
  } catch {
    return { plans: [], trialDays: 14, freeTravelers: 10, unlockPrice: 20 };
  }
});
const pricingQuery = queryOptions({ queryKey: ["pricing"], queryFn: () => getPricing() });

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "WanderSync — Group travel, run from one app" },
      { name: "description", content: "Plan itineraries, issue QR tickets, check travelers in, split shared costs and answer an SOS. One app for travel companies and every traveler on the trip." },
      { property: "og:title", content: "WanderSync — Group travel, run from one app" },
      { property: "og:description", content: "One app for travel companies and every traveler on the trip. Start a free trial." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(pricingQuery),
  component: Landing,
});

function LandingNav() {
  const { user } = useSession();
  const [solid, setSolid] = useState(false);
  useEffect(() => {
    const on = () => setSolid(window.scrollY > 24);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  return (
    <header className={cn("pt-safe fixed inset-x-0 top-0 z-50 text-navy-foreground transition-[background-color,box-shadow] duration-300", solid ? "bg-navy/90 shadow-[0_1px_0_oklch(1_0_0/8%)] backdrop-blur-md" : "bg-transparent")}>
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link to="/" aria-label="WanderSync home"><Wordmark /></Link>
        <nav className="flex items-center gap-1 text-sm">
          <a href="#how" className="hidden rounded-lg px-3 py-2 text-navy-foreground/75 hover:text-navy-foreground md:inline">How it works</a>
          <a href="#pricing" className="hidden rounded-lg px-3 py-2 text-navy-foreground/75 hover:text-navy-foreground md:inline">Pricing</a>
          <Link to="/demo" className="hidden rounded-lg px-3 py-2 text-navy-foreground/75 hover:text-navy-foreground md:inline">Sample trip</Link>
          {user ? (
            <Button size="sm" className="ml-2 bg-sunset text-sunset-foreground hover:bg-sunset/90" asChild><Link to="/dashboard">Open app</Link></Button>
          ) : (
            <>
              <Link to="/auth" search={{ plan: undefined }} className="rounded-lg px-3 py-2 text-navy-foreground/85 hover:text-navy-foreground">Sign in</Link>
              <Button size="sm" className="hidden bg-sunset text-sunset-foreground hover:bg-sunset/90 sm:inline-flex" asChild><Link to="/auth" search={{ plan: undefined }}>Start free trial</Link></Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

function Landing() {
  const { data } = useSuspenseQuery(pricingQuery);
  return (
    <div className="overflow-x-clip">
      <LandingNav />

      {/* Hero: the one orchestrated moment — headline rises, then the board flaps in. */}
      <section className="latitudes relative bg-lagoon-deep text-navy-foreground">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 pb-16 pt-28 sm:px-6 sm:pb-24 sm:pt-36 lg:grid-cols-[1.1fr_1fr] lg:gap-12">
          <div className="min-w-0">
            <h1 className="font-display text-[clamp(2.75rem,6.2vw,4.75rem)] font-bold leading-[0.95] tracking-[-0.035em]">
              <span className="rise block" style={{ "--d": "0ms" } as React.CSSProperties}>The whole group</span>
              <span className="rise block" style={{ "--d": "120ms" } as React.CSSProperties}>on one itinerary.</span>
            </h1>
            <p className="rise mt-6 max-w-[34rem] text-lg leading-relaxed text-navy-foreground/80 sm:text-xl" style={{ "--d": "260ms" } as React.CSSProperties}>
              WanderSync gives travel companies one place to plan trips, issue tickets, check people in and answer an SOS, and puts the whole trip in every traveler's pocket.
            </p>
            <div className="rise mt-9 flex flex-col gap-3 sm:flex-row" style={{ "--d": "380ms" } as React.CSSProperties}>
              <Button size="lg" className="bg-sunset text-sunset-foreground shadow-glow hover:bg-sunset/90" asChild>
                <Link to="/auth" search={{ plan: undefined }}>Start {data.trialDays}-day free trial</Link>
              </Button>
              <Button size="lg" variant="ghost" className="border border-navy-foreground/20 text-navy-foreground hover:bg-navy-foreground/10 hover:text-navy-foreground" asChild>
                <Link to="/demo">Explore a sample trip</Link>
              </Button>
            </div>
            <p className="rise mt-4 text-sm text-navy-foreground/60" style={{ "--d": "460ms" } as React.CSSProperties}>No card needed. Works on any phone, no app store.</p>
          </div>
          <div className="rise min-w-0" style={{ "--d": "200ms" } as React.CSSProperties}>
            <DeparturesBoard className="lg:rotate-[-1.5deg]" />
          </div>
        </div>
      </section>

      <section id="how" className="scroll-mt-20 py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <h2 className="max-w-2xl text-[clamp(2rem,4.5vw,3.25rem)] font-bold leading-[1.05]">From the first plan to the last payment</h2>
          <p className="mt-4 max-w-xl text-lg text-muted-foreground">Organisers, caretakers and travelers work from the same trip, so nobody is reading last week's PDF.</p>
          <div className="mt-14 sm:mt-20"><RouteJourney /></div>
        </div>
      </section>

      <section className="border-y bg-card py-20 sm:py-28">
        <div className="mx-auto grid max-w-7xl items-center gap-14 px-4 sm:px-6 lg:grid-cols-[auto_1fr] lg:gap-24">
          <PhoneMock />
          <div>
            <h2 className="max-w-lg text-[clamp(2rem,4.5vw,3.25rem)] font-bold leading-[1.05]">The trip, in every traveler's pocket</h2>
            <p className="mt-4 max-w-lg text-lg text-muted-foreground">Travelers open a link and add it to their home screen. Today's plan, their tickets, what they owe and an SOS button are one tap away.</p>
            <dl className="mt-10 grid gap-x-10 gap-y-6 sm:grid-cols-2">
              {[
                ["Owners", "Run the company, invite the team and set how travelers pay."],
                ["Organisers", "Build trips, issue tickets and post announcements."],
                ["Caretakers", "Travel with the group, scan check-ins and answer alerts."],
                ["Travelers", "See the plan, carry tickets and split costs with friends."],
              ].map(([t, d]) => (
                <div key={t} className="border-l-2 border-sunset pl-4">
                  <dt className="font-display text-lg font-semibold">{t}</dt>
                  <dd className="mt-1 text-muted-foreground">{d}</dd>
                </div>
              ))}
            </dl>
            <Button variant="outline" size="lg" className="mt-10" asChild>
              <Link to="/traveler"><Smartphone /> Open the traveler app</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="bg-navy py-20 text-navy-foreground sm:py-24">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[1.2fr_1fr] lg:items-end">
          <h2 className="text-[clamp(2rem,4.5vw,3.25rem)] font-bold leading-[1.05]">Trip payments never pass through us.</h2>
          <p className="text-lg leading-relaxed text-navy-foreground/75">Travelers pay you the way they already do: cash, your payment link or a bank transfer. WanderSync is paid only for your subscription, so there is no cut of your bookings.</p>
        </div>
      </section>

      <section id="pricing" className="scroll-mt-20 py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <h2 className="text-[clamp(2rem,4.5vw,3.25rem)] font-bold leading-[1.05]">Pricing</h2>
          <p className="mt-3 text-lg text-muted-foreground">Every company plan starts with a {data.trialDays}-day free trial. No card needed.</p>
          {data.plans.length > 0 ? (
            <div className="mt-12 grid gap-5 md:grid-cols-3">
              {data.plans.map((p, i) => {
                const featured = data.plans.length > 2 && i === 1;
                return (
                  <div key={p.id} className={cn("flex flex-col rounded-3xl border p-6 sm:p-7", featured ? "border-navy bg-navy text-navy-foreground" : "bg-card shadow-card")}>
                    <h3 className="text-xl font-bold">{p.name}</h3>
                    <p className={cn("mt-1 text-sm", featured ? "text-navy-foreground/70" : "text-muted-foreground")}>{p.description}</p>
                    <p className="mt-6 font-display text-5xl font-bold tracking-tight">${Number(p.price).toFixed(0)}<span className={cn("ml-1 font-sans text-base font-medium", featured ? "text-navy-foreground/70" : "text-muted-foreground")}>/ {p.billing_interval}</span></p>
                    <ul className="mt-6 flex-1 space-y-2.5 text-sm">
                      {[`${p.max_trips ?? "Unlimited"} trips`, `${p.max_organisers ?? "Unlimited"} organisers`, `${p.max_travelers_per_trip ?? "Unlimited"} travelers per trip`, ...p.features].map((f) => (
                        <li key={f} className="flex gap-2.5"><Check className={cn("mt-0.5 h-4 w-4 shrink-0", featured ? "text-sunset" : "text-primary")} />{f}</li>
                      ))}
                    </ul>
                    <Button className={cn("mt-7 w-full", featured && "bg-sunset text-sunset-foreground hover:bg-sunset/90")} size="lg" variant={featured ? "default" : "outline"} asChild>
                      <Link to="/auth" search={{ plan: p.id }}>Start free trial</Link>
                    </Button>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="mt-10 rounded-2xl border bg-card p-6 text-muted-foreground">Plans couldn't load right now. Start your free trial and choose a plan from your workspace.</p>
          )}
          <div className="mt-6 flex flex-col gap-4 rounded-3xl bg-accent p-6 text-accent-foreground sm:flex-row sm:items-center sm:justify-between sm:p-7">
            <div>
              <p className="font-display text-xl font-semibold">Organising a trip for friends or family?</p>
              <p className="mt-1">Free for up to {data.freeTravelers} travelers. Bigger trips are a one-time ${data.unlockPrice.toFixed(0)} per trip.</p>
            </div>
            <Button size="lg" className="shrink-0 bg-accent-foreground text-accent hover:bg-accent-foreground/90" asChild>
              <Link to="/auth" search={{ plan: undefined }}>Plan a trip free</Link>
            </Button>
          </div>
        </div>
      </section>

      <footer className="pb-safe border-t bg-card">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <Wordmark />
          <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <Link to="/demo" className="hover:text-foreground">Sample trip</Link>
            <Link to="/traveler" className="hover:text-foreground">Traveler app</Link>
            <Link to="/sponsor" className="inline-flex items-center gap-1 hover:text-foreground">For local businesses <ArrowUpRight className="h-3.5 w-3.5" /></Link>
            <Link to="/auth" search={{ plan: undefined }} className="hover:text-foreground">Sign in</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
