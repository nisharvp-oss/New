import { createFileRoute, Link } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { Check, CalendarDays, Megaphone, ShieldCheck, Siren, Users, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { Database } from "@/integrations/supabase/types";

const getPricing = createServerFn({ method: "GET" }).handler(async () => {
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
  const [{ data: plans }, { data: trialDays }] = await Promise.all([
    sb.from("plans").select("id,name,description,price,billing_interval,max_trips,max_organisers,max_travelers_per_trip,features").eq("is_active", true).order("sort_order"),
    sb.rpc("get_trial_days"),
  ]);
  return { plans: plans ?? [], trialDays: (trialDays as number | null) ?? 14 };
});
const pricingQuery = queryOptions({ queryKey: ["pricing"], queryFn: () => getPricing() });

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "WanderSync — Group Travel Platform for Travel Companies" },
      { name: "description", content: "Run every group trip in one place: organisers, caretakers, itineraries, tickets, expense splitting and SOS safety. Start a free trial." },
      { property: "og:title", content: "WanderSync — Group Travel Platform for Travel Companies" },
      { property: "og:description", content: "Run every group trip in one place. Start a free trial today." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(pricingQuery),
  component: Landing,
  errorComponent: () => <div className="p-10 text-center">Pricing could not load. Please refresh.</div>,
});

const features = [
  { icon: Users, t: "Many trips, one team", d: "Assign a dedicated organiser and caretaker to every trip." },
  { icon: CalendarDays, t: "Itineraries & tickets", d: "Day-by-day plans, meal tags and tickets on every traveler's phone." },
  { icon: Megaphone, t: "Promote upcoming trips", d: "Announce new trips with discount codes and referral links." },
  { icon: Wallet, t: "Get paid your way", d: "Travelers pay you directly — cash, payment link or bank transfer." },
  { icon: Siren, t: "SOS safety", d: "One tap alerts with live location to the organiser and caretaker." },
  { icon: ShieldCheck, t: "Your own email", d: "Send from your own mail server and brand." },
];

function Landing() {
  const { data } = useSuspenseQuery(pricingQuery);
  return (
    <main>
      <section className="bg-gradient-ocean text-navy-foreground">
        <div className="mx-auto max-w-6xl px-4 py-20 text-center">
          <p className="mb-4 inline-block rounded-full border border-navy-foreground/20 px-3 py-1 text-xs font-semibold uppercase tracking-widest">For travel companies</p>
          <h1 className="mx-auto max-w-3xl text-4xl font-extrabold tracking-tight md:text-6xl">Run every group trip from one place</h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-navy-foreground/80">Organisers, caretakers and travelers stay in sync — itineraries, tickets, add-ons, shared expenses and emergency alerts.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button size="lg" asChild className="bg-gradient-sunset shadow-glow"><Link to="/auth" search={{ plan: undefined }}>Start {data.trialDays}-day free trial</Link></Button>
            <Button size="lg" variant="secondary" asChild><Link to="/demo">Try the demo</Link></Button>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-4 px-4 py-16 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f) => (
          <Card key={f.t} className="p-6 shadow-card">
            <f.icon className="h-6 w-6 text-primary" />
            <h3 className="mt-3 font-bold">{f.t}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{f.d}</p>
          </Card>
        ))}
      </section>

      <section className="bg-muted/40 py-16" id="pricing">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center text-3xl font-extrabold">Simple pricing</h2>
          <p className="mt-2 text-center text-muted-foreground">Every plan starts with a {data.trialDays}-day free trial. No card needed.</p>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {data.plans.map((p) => (
              <Card key={p.id} className="flex flex-col p-6 shadow-card">
                <h3 className="text-xl font-bold">{p.name}</h3>
                <p className="text-sm text-muted-foreground">{p.description}</p>
                <p className="mt-4 text-4xl font-extrabold">${Number(p.price).toFixed(0)}<span className="text-base font-medium text-muted-foreground">/{p.billing_interval}</span></p>
                <ul className="mt-4 flex-1 space-y-2 text-sm">
                  <li className="flex gap-2"><Check className="h-4 w-4 text-primary" />{p.max_trips ?? "Unlimited"} trips</li>
                  <li className="flex gap-2"><Check className="h-4 w-4 text-primary" />{p.max_organisers ?? "Unlimited"} organisers</li>
                  <li className="flex gap-2"><Check className="h-4 w-4 text-primary" />{p.max_travelers_per_trip ?? "Unlimited"} travelers per trip</li>
                  {p.features.map((f) => <li key={f} className="flex gap-2"><Check className="h-4 w-4 text-primary" />{f}</li>)}
                </ul>
                <Button className="mt-6" asChild><Link to="/auth" search={{ plan: p.id }}>Start free trial</Link></Button>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
