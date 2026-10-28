import type { ReactNode } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Languages, MapPin, Plane, Smartphone } from "lucide-react";
import { AirlineCheckin } from "@/components/ws/AirlineCheckin";
import { EsimFinder } from "@/components/ws/EsimOffers";
import { Translator } from "@/components/ws/Translator";
import { airlinesQuery } from "@/lib/airlines.functions";
import { esimOffersQuery } from "@/lib/esim.functions";

export const Route = createFileRoute("/tools")({
  head: () => ({
    meta: [
      { title: "Travel tools — WanderSync" },
      { name: "description", content: "Free travel tools: airline online check-in, a translator and phrasebook, eSIM deals for your destination, and locations that open in your own maps app." },
      { property: "og:title", content: "Travel tools — WanderSync" },
      { property: "og:description", content: "Free travel tools for groups: check-in, translator, eSIMs and more." },
    ],
  }),
  loader: ({ context }) => Promise.all([context.queryClient.ensureQueryData(airlinesQuery), context.queryClient.ensureQueryData(esimOffersQuery)]),
  component: Tools,
});

const NAV = [
  { href: "#flight-check-in", label: "Check-in", icon: Plane },
  { href: "#translator", label: "Translator", icon: Languages },
  { href: "#esim", label: "eSIM", icon: Smartphone },
  { href: "#maps", label: "Maps", icon: MapPin },
];

function Tools() {
  return (
    <main className="mx-auto max-w-3xl px-4 pb-12 pt-8 sm:pt-12">
      <h1 className="text-[clamp(2rem,6vw,2.75rem)] font-extrabold leading-tight tracking-[-0.03em]">Travel tools</h1>
      <p className="mt-2 text-lg text-muted-foreground">Free for everyone, no sign-in needed.</p>
      <nav aria-label="Tools" className="-mx-4 mt-5 flex gap-2 overflow-x-auto px-4 pb-1">
        {NAV.map(({ href, label, icon: Icon }) => (
          <a key={href} href={href} className="inline-flex shrink-0 items-center gap-2 rounded-full border bg-card px-4 py-2 text-sm font-semibold shadow-card hover:bg-muted"><Icon className="h-4 w-4 text-primary" />{label}</a>
        ))}
      </nav>

      <Tool id="flight-check-in" icon={<Plane className="h-5 w-5" />} title="Flight check-in" lead="Choose your airline and go straight to its online check-in page.">
        <AirlineCheckin />
      </Tool>
      <Tool id="translator" icon={<Languages className="h-5 w-5" />} title="Translator" lead="Type what you want to say, or use the phrasebook to show a local the words.">
        <Translator />
      </Tool>
      <Tool id="esim" icon={<Smartphone className="h-5 w-5" />} title="eSIM for your trip" lead="Stay online abroad without roaming charges. Pick your destination to see eSIM deals.">
        <EsimFinder />
      </Tool>
      <Tool id="maps" icon={<MapPin className="h-5 w-5" />} title="Locations open in your own maps app" muted
        lead="Meeting points, sponsors and SOS alerts open in Google Maps, Apple Maps, Waze or any navigation app on your phone. On Android you can pick from every app you have installed." />
    </main>
  );
}

function Tool({ id, icon, title, lead, muted = false, children }: { id: string; icon: ReactNode; title: string; lead: string; muted?: boolean; children?: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-h`} className="mt-4 scroll-mt-24 rounded-3xl border bg-card p-5 shadow-card first-of-type:mt-6 sm:p-7">
      <div className="flex items-start gap-4">
        <span className={muted ? "grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-accent text-primary" : "grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground"}>{icon}</span>
        <div>
          <h2 id={`${id}-h`} className="text-xl font-bold">{title}</h2>
          <p className="mt-1 text-muted-foreground">{lead}</p>
        </div>
      </div>
      {children && <div className="mt-6">{children}</div>}
    </section>
  );
}
