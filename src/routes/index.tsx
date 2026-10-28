import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useRef } from "react";
import { ExtrasGallery, FeatureStory, FinalCta, Footer, Hero, JourneyOverlay, Nav, Pricing, Roles, SplitSection } from "@/components/landing/Sections";
import { useLandingMotion } from "@/components/landing/motion";
import { buildPricingTiers, DEFAULT_PLANS, DEFAULT_TERMS, type PlanRow } from "@/lib/pricing";

const PLAN_COLUMNS = "id,name,description,price,billing_interval,max_trips,max_organisers,max_travelers_per_trip,features";

const getPricing = createServerFn({ method: "GET" }).handler(async () => {
  // Pricing must always render: if the backend is unreachable, show the default line-up.
  try {
    const { publicServerClient } = await import("@/lib/public-client.server");
    // ad_free/contact_sales and public_pricing_terms are newer than the generated types.
    type Res<T> = PromiseLike<{ data: T | null; error: unknown }>;
    const sb = publicServerClient() as unknown as {
      from: (t: "plans") => { select: (c: string) => { eq: (c: string, v: boolean) => { order: (c: string) => Res<PlanRow[]> } } };
      rpc: (fn: "public_pricing_terms" | "free_trip_terms") => Res<{ free_travelers: number; unlock_price: number; unlock_max_travelers?: number; currency: string; sales_email?: string }[]>;
    };
    const activePlans = (cols: string) => sb.from("plans").select(cols).eq("is_active", true).order("sort_order");
    // Each falls back to the pre-0012 shape when the pricing migration isn't applied yet.
    const [plans, terms] = await Promise.all([
      Promise.resolve(activePlans(`${PLAN_COLUMNS},ad_free,contact_sales`)).then((r) => (r.error ? activePlans(PLAN_COLUMNS) : r)),
      Promise.resolve(sb.rpc("public_pricing_terms")).then((r) => (r.error ? sb.rpc("free_trip_terms") : r)),
    ]);
    const t = terms.data?.[0];
    return {
      plans: plans.data?.length ? plans.data : DEFAULT_PLANS,
      terms: t
        ? { freeTravelers: t.free_travelers, unlockPrice: Number(t.unlock_price), unlockMaxTravelers: t.unlock_max_travelers ?? DEFAULT_TERMS.unlockMaxTravelers, currency: t.currency || "USD", salesEmail: t.sales_email ?? "" }
        : DEFAULT_TERMS,
    };
  } catch {
    return { plans: DEFAULT_PLANS, terms: DEFAULT_TERMS };
  }
});
const pricingQuery = queryOptions({ queryKey: ["pricing"], queryFn: () => getPricing() });

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "WanderSync — Group travel, run from one app" },
      { name: "description", content: "Plan itineraries, issue QR tickets, check travelers in, split shared costs and answer an SOS. One app for travel companies and every traveler on the trip." },
      { property: "og:title", content: "WanderSync — Group travel, run from one app" },
      { property: "og:description", content: "One app for travel companies and every traveler on the trip. Sign up free, no credit card needed." },
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
        <div data-journey className="relative">
          <Hero />
          <FeatureStory />
          <JourneyOverlay />
        </div>
        <SplitSection />
        <ExtrasGallery />
        <Roles />
        <Pricing tiers={buildPricingTiers(data.plans, data.terms)} />
        <FinalCta />
      </main>
      <Footer />
    </div>
  );
}
