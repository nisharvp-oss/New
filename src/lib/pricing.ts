/**
 * The pricing line-up shown on the landing page. Free Zone and Pay as you go come from the
 * personal-trip settings (free travelers, unlock price and cap); the rest are company plans.
 * Everything here is editable by super admins: plans in Admin → Plans, the rest in Admin → Settings.
 */
export type PlanRow = {
  id: string; name: string; description: string | null; price: number; billing_interval: string;
  max_trips: number | null; max_organisers: number | null; max_travelers_per_trip: number | null;
  features: string[]; ad_free?: boolean | null; contact_sales?: boolean | null;
};
export type PricingTerms = { freeTravelers: number; unlockPrice: number; unlockMaxTravelers: number; currency: string; salesEmail: string };

export type Tier = {
  key: string;
  name: string;
  blurb: string;
  price: string | null;
  per: string | null;
  points: string[];
  cta: { kind: "signup"; plan?: string } | { kind: "contact"; email: string };
  highlight: boolean;
  badge: string | null;
};

export function money(amount: number, currency: string) {
  const whole = Number.isInteger(amount);
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency, minimumFractionDigits: whole ? 0 : 2 }).format(amount);
  } catch {
    return `$${whole ? amount : amount.toFixed(2)}`;
  }
}

const per = (interval: string) => (interval === "year" ? "per year" : "per month");

export function buildPricingTiers(plans: PlanRow[], t: PricingTerms): Tier[] {
  const tiers: Tier[] = [
    {
      key: "free", name: "Free Zone", blurb: "For anyone who signs up",
      price: money(0, t.currency), per: "forever",
      points: [`Trips of up to ${t.freeTravelers} people`, "Every feature in the app", "No credit card needed"],
      cta: { kind: "signup" }, highlight: false, badge: null,
    },
    {
      key: "payg", name: "Pay as you go", blurb: `When a trip grows past ${t.freeTravelers} people`,
      price: money(t.unlockPrice, t.currency), per: "per trip",
      points: [`Up to ${t.unlockMaxTravelers} travelers on that trip`, "One-time payment, no subscription", "Every feature in the app"],
      cta: { kind: "signup" }, highlight: false, badge: null,
    },
  ];
  const paid = plans.filter((p) => !p.contact_sales);
  paid.forEach((p, i) => {
    const points = [
      p.max_trips == null ? "Unlimited trips" : `Up to ${p.max_trips} trips a year`,
      p.max_travelers_per_trip == null ? "Any group size" : `Up to ${p.max_travelers_per_trip} people per trip`,
      ...(p.max_organisers == null ? [] : [`${p.max_organisers} organisers`]),
      ...p.features,
    ];
    tiers.push({
      key: p.id, name: p.name, blurb: p.description ?? "", price: money(Number(p.price), t.currency), per: per(p.billing_interval),
      points, cta: { kind: "signup", plan: p.id }, highlight: paid.length > 1 && i === paid.length - 1, badge: p.ad_free ? "Ad-free" : null,
    });
  });
  for (const p of plans.filter((x) => x.contact_sales)) {
    tiers.push({ key: p.id, name: p.name, blurb: p.description ?? "", price: null, per: null, points: p.features, cta: { kind: "contact", email: t.salesEmail }, highlight: false, badge: null });
  }
  return tiers;
}

/** Mirrors migration 0012; shown when the plans can't be loaded so pricing never renders empty. */
export const DEFAULT_PLANS: PlanRow[] = [
  { id: "organiser", name: "Organiser", description: "For organisers running trips through the year", price: 35, billing_interval: "month", max_trips: 15, max_organisers: null, max_travelers_per_trip: 100, features: ["Every feature in the app", "Your own organisers and caretakers", "Trip emails sent from your own address"], ad_free: false, contact_sales: false },
  { id: "business", name: "Business", description: "For travel companies with a full season", price: 50, billing_interval: "month", max_trips: 25, max_organisers: null, max_travelers_per_trip: 100, features: ["Everything in Organiser", "Ad-free: no sponsors on your trips"], ad_free: true, contact_sales: false },
  { id: "enterprise", name: "Enterprise", description: "For large operators and agencies", price: 0, billing_interval: "month", max_trips: null, max_organisers: null, max_travelers_per_trip: null, features: ["Custom trip and traveler limits", "Volume pricing for large groups"], ad_free: true, contact_sales: true },
];
export const DEFAULT_TERMS: PricingTerms = { freeTravelers: 10, unlockPrice: 20, unlockMaxTravelers: 100, currency: "USD", salesEmail: "" };
