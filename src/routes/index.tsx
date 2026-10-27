import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useRef } from "react";
import { ExtrasGallery, FeatureStory, FinalCta, Footer, Hero, Nav, Pricing, Roles, SplitSection } from "@/components/landing/Sections";
import { useLandingMotion } from "@/components/landing/motion";
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

function Landing() {
  const { data } = useSuspenseQuery(pricingQuery);
  const root = useRef<HTMLDivElement>(null);
  useLandingMotion(root);
  return (
    <div ref={root} className="overflow-x-clip">
      <Nav />
      <main>
        <Hero trialDays={data.trialDays} />
        <FeatureStory />
        <SplitSection />
        <ExtrasGallery />
        <Roles />
        <Pricing plans={data.plans} trialDays={data.trialDays} freeTravelers={data.freeTravelers} unlockPrice={data.unlockPrice} />
        <FinalCta trialDays={data.trialDays} />
      </main>
      <Footer />
    </div>
  );
}
