import { createFileRoute } from "@tanstack/react-router";
import { MapPin, Plane } from "lucide-react";
import { AirlineCheckin } from "@/components/ws/AirlineCheckin";

export const Route = createFileRoute("/tools")({
  head: () => ({
    meta: [
      { title: "Travel tools — WanderSync" },
      { name: "description", content: "Free travel tools: go straight to your airline's online check-in page, and open any location in the maps app on your phone." },
      { property: "og:title", content: "Travel tools — WanderSync" },
      { property: "og:description", content: "Free travel tools for groups: airline online check-in and more." },
    ],
  }),
  component: Tools,
});

function Tools() {
  return (
    <main className="mx-auto max-w-3xl px-4 pb-12 pt-8 sm:pt-12">
      <h1 className="text-[clamp(2rem,6vw,2.75rem)] font-extrabold leading-tight tracking-[-0.03em]">Travel tools</h1>
      <p className="mt-2 text-lg text-muted-foreground">Free for everyone, no sign-in needed.</p>

      <section id="flight-check-in" aria-labelledby="checkin-h" className="mt-8 rounded-3xl border bg-card p-5 shadow-card sm:p-7">
        <div className="flex items-start gap-4">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground"><Plane className="h-5 w-5" /></span>
          <div>
            <h2 id="checkin-h" className="text-xl font-bold">Flight check-in</h2>
            <p className="mt-1 text-muted-foreground">Choose your airline and go straight to its online check-in page.</p>
          </div>
        </div>
        <div className="mt-6"><AirlineCheckin /></div>
      </section>

      <section aria-labelledby="maps-h" className="mt-4 rounded-3xl border bg-card p-5 shadow-card sm:p-7">
        <div className="flex items-start gap-4">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-accent text-primary"><MapPin className="h-5 w-5" /></span>
          <div>
            <h2 id="maps-h" className="text-xl font-bold">Locations open in your own maps app</h2>
            <p className="mt-1 text-muted-foreground">
              Meeting points, sponsors and SOS alerts open in Google Maps, Apple Maps, Waze or any navigation app on your phone. On Android you can pick from every app you have installed.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
