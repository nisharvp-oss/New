import { useState } from "react";
import { ExternalLink, Smartphone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { CountryPicker } from "@/components/ws/CountryPicker";
import { countryName } from "@/lib/countries";
import { offersFor, type EsimOffer } from "@/lib/esim";
import { useEsimOffers } from "@/lib/esim.functions";

// record_esim_click (migration 0014) is newer than the generated types.
const recordClick = (id: string) =>
  (supabase as unknown as { rpc: (fn: "record_esim_click", args: { _id: string }) => PromiseLike<unknown> }).rpc("record_esim_click", { _id: id }).then(undefined, () => undefined);

/** Pick a destination and see the sponsored eSIM offers for it; each flyer opens the sponsor's own link. */
export function EsimFinder({ initialCountry = null }: { initialCountry?: string | null }) {
  const [country, setCountry] = useState<string | null>(initialCountry);
  const offers = offersFor(useEsimOffers(), country);

  return (
    <div className="space-y-4">
      <CountryPicker selected={country ? [country] : []} onToggle={setCountry} placeholder="Where are you travelling?" />
      {country && (offers.length ? (
        <ul className="grid gap-3 sm:grid-cols-2">
          {offers.map((o) => <li key={o.id}><EsimCard offer={o} country={country} /></li>)}
        </ul>
      ) : (
        <p className="rounded-2xl bg-muted p-4 text-sm text-muted-foreground">
          No eSIM offers for {countryName(country)} yet. Your mobile network's roaming packs or a local SIM at the airport are good options.
        </p>
      ))}
      <p className="text-xs text-muted-foreground">Offers are from sponsors and open on the provider's own website. Check your phone supports eSIM before you buy.</p>
    </div>
  );
}

function EsimCard({ offer, country }: { offer: EsimOffer; country: string }) {
  const where = offer.countries.length === 0 ? "Worldwide" : offer.countries.length === 1 ? countryName(country) : `${countryName(country)} + ${offer.countries.length - 1} more`;
  return (
    <a
      href={offer.url}
      target="_blank"
      rel="sponsored noopener noreferrer"
      onClick={() => { void recordClick(offer.id); }}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border bg-card shadow-card transition hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {offer.flyer_url ? (
        <img src={offer.flyer_url} alt={`${offer.provider} eSIM offer`} loading="lazy" className="aspect-[4/3] w-full bg-muted object-cover" />
      ) : (
        <div className="grid aspect-[4/3] w-full place-items-center bg-accent text-primary"><Smartphone className="h-10 w-10" /></div>
      )}
      <div className="flex flex-1 flex-col gap-1 p-4">
        <div className="flex items-center justify-between gap-2 text-xs">
          <span className="font-medium text-muted-foreground">{where}</span>
          <span className="rounded-full bg-muted px-2 py-0.5 font-semibold text-muted-foreground">Sponsored</span>
        </div>
        <p className="text-lg font-bold">{offer.provider}</p>
        {offer.headline && <p className="text-sm text-muted-foreground">{offer.headline}</p>}
        <span className="mt-auto inline-flex items-center gap-1.5 pt-2 text-sm font-semibold text-primary">Get this eSIM <ExternalLink className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" /></span>
      </div>
    </a>
  );
}
