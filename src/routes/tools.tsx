import type { ReactNode } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Compass as CompassIcon, Languages, MapPin, Plane, ScrollText, Smartphone } from "lucide-react";
import { AirlineCheckin } from "@/components/ws/AirlineCheckin";
import { Compass } from "@/components/ws/Compass";
import { EsimFinder } from "@/components/ws/SponsorOffers";
import { ToolArt, type ToolArtName } from "@/components/ws/ToolArt";
import { Translator } from "@/components/ws/Translator";
import { VisaFinder } from "@/components/ws/VisaFinder";
import { airlinesQuery } from "@/lib/airlines.functions";
import { sponsorOffersQuery } from "@/lib/sponsor-offers.functions";
import { visaPagesQuery } from "@/lib/visa.functions";

export const Route = createFileRoute("/tools")({
  head: () => ({
    meta: [
      { title: "Travel tools — WanderSync" },
      { name: "description", content: "Free travel tools: airline check-in, visa pages for your destination, eSIM deals, a translator and phrasebook, a compass, and locations that open in your own maps app." },
      { property: "og:title", content: "Travel tools — WanderSync" },
      { property: "og:description", content: "Free travel tools for groups: check-in, visas, eSIMs, translator, compass and more." },
    ],
  }),
  loader: ({ context: { queryClient: qc } }) =>
    Promise.all([qc.ensureQueryData(airlinesQuery), qc.ensureQueryData(visaPagesQuery), qc.ensureQueryData(sponsorOffersQuery("esim")), qc.ensureQueryData(sponsorOffersQuery("visa"))]),
  component: Tools,
});

const TOOLS = [
  { id: "flight-check-in", label: "Check-in", icon: Plane },
  { id: "visa", label: "Visa", icon: ScrollText },
  { id: "esim", label: "eSIM", icon: Smartphone },
  { id: "translator", label: "Translator", icon: Languages },
  { id: "compass", label: "Compass", icon: CompassIcon },
  { id: "maps", label: "Maps", icon: MapPin },
];

function Tools() {
  return (
    <main className="mx-auto max-w-3xl px-4 pb-12 pt-8 sm:pt-12">
      <h1 className="text-[clamp(2rem,6vw,2.75rem)] font-extrabold leading-tight tracking-[-0.03em]">Travel tools</h1>
      <p className="mt-2 text-lg text-muted-foreground">Free for everyone, no sign-in needed.</p>
      <nav aria-label="Tools" className="-mx-4 mt-5 flex gap-2 overflow-x-auto px-4 pb-1">
        {TOOLS.map(({ id, label, icon: Icon }) => (
          <a key={id} href={`#${id}`} className="inline-flex shrink-0 items-center gap-2 rounded-full border bg-card px-4 py-2 text-sm font-semibold shadow-card hover:bg-muted"><Icon className="h-4 w-4 text-primary" />{label}</a>
        ))}
      </nav>

      <Tool id="flight-check-in" art="checkin" title="Flight check-in" lead="Choose your airline and go straight to its online check-in page.">
        <AirlineCheckin />
      </Tool>
      <Tool id="visa" art="visa" title="Apply for a visa" lead="Pick where you're going and your passport. We'll open the official visa page for that country.">
        <VisaFinder />
      </Tool>
      <Tool id="esim" art="esim" title="eSIM for your trip" lead="Stay online abroad without roaming charges. Pick your destination to see eSIM deals.">
        <EsimFinder />
      </Tool>
      <Tool id="translator" art="translator" title="Translator" lead="Type what you want to say, or use the phrasebook to show a local the words.">
        <Translator />
      </Tool>
      <Tool id="compass" art="compass" title="Compass" lead="Find north with your phone's sensor, and save a spot so you can always find your way back.">
        <Compass />
      </Tool>
      <Tool id="maps" art="maps" title="Locations open in your own maps app"
        lead="Meeting points, sponsors and SOS alerts open in Google Maps, Apple Maps, Waze or any navigation app on your phone. On Android you can pick from every app you have installed." />
    </main>
  );
}

function Tool({ id, art, title, lead, children }: { id: string; art: ToolArtName; title: string; lead: string; children?: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-h`} className="mt-4 scroll-mt-24 overflow-hidden rounded-3xl border bg-card shadow-card first-of-type:mt-6">
      <div className="flex items-center gap-3 bg-gradient-to-br from-accent via-accent/50 to-card p-5 pb-3 sm:p-7 sm:pb-4">
        <div className="min-w-0 flex-1">
          <h2 id={`${id}-h`} className="text-xl font-bold tracking-tight sm:text-2xl">{title}</h2>
          <p className="mt-1 text-sm text-muted-foreground sm:text-base">{lead}</p>
        </div>
        <ToolArt name={art} className="h-24 w-32 shrink-0 sm:h-28 sm:w-40" />
      </div>
      {children && <div className="p-5 pt-4 sm:p-7 sm:pt-5">{children}</div>}
    </section>
  );
}
