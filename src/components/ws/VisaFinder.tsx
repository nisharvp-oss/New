import { useEffect, useState } from "react";
import { Building2, ExternalLink, Info, ScrollText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { CountryPicker } from "@/components/ws/CountryPicker";
import { SponsorOfferCards } from "@/components/ws/SponsorOffers";
import { countryName } from "@/lib/countries";
import { embassySearchUrl, visaLinkFor, visaRulesSearchUrl } from "@/lib/visa";
import { useVisaPages } from "@/lib/visa.functions";

const PASSPORT_KEY = "ws:passport";

/**
 * Destination + passport → the destination's official visa page, then sponsored visa agencies.
 * Inside a trip the destination is fixed, and agencies only show where the trip shows sponsors.
 */
export function VisaFinder({ destination, showSponsors = true }: { destination?: string; showSponsors?: boolean } = {}) {
  const pages = useVisaPages();
  const [picked, setDest] = useState<string | null>(null);
  const dest = destination ?? picked;
  const [passport, setPassport] = useState<string | null>(null);

  useEffect(() => {
    try { setPassport(localStorage.getItem(PASSPORT_KEY)); } catch { /* storage blocked: start empty */ }
  }, []);
  const pickPassport = (code: string) => {
    setPassport(code);
    try { localStorage.setItem(PASSPORT_KEY, code); } catch { /* not remembered, still works */ }
  };

  const destName = dest ? countryName(dest) : "";
  const passName = passport ? countryName(passport) : "";
  const link = dest ? visaLinkFor(dest, destName, pages) : null;

  return (
    <div className="space-y-4">
      <div className={destination ? "grid gap-3" : "grid gap-3 sm:grid-cols-2"}>
        {!destination && (
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground">Travelling to</Label>
            <CountryPicker selected={dest ? [dest] : []} onToggle={setDest} placeholder="Choose destination" />
          </div>
        )}
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-muted-foreground">My passport</Label>
          <CountryPicker selected={passport ? [passport] : []} onToggle={pickPassport} placeholder="Choose passport" />
        </div>
      </div>

      {dest && link && (
        dest === passport ? (
          <p className="flex gap-3 rounded-2xl bg-accent p-4 text-sm"><Info className="h-5 w-5 shrink-0 text-primary" />That's your own country, so you don't need a visa to go home.</p>
        ) : (
          <div className="space-y-3">
            <div className="rounded-2xl border bg-background p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{link.source === "search" ? "No official page listed yet" : "Official visa page"}</p>
              <p className="mt-1 font-semibold">{link.note}</p>
              <Button asChild size="lg" className="mt-3 h-auto min-h-12 w-full whitespace-normal rounded-2xl py-3 text-center">
                <a href={link.url} target="_blank" rel="noopener noreferrer">
                  <ScrollText /> {link.source === "search" ? `Find the ${destName} visa page` : `Apply for a ${destName} visa`} <ExternalLink className="opacity-70" />
                </a>
              </Button>
              {passport && (
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  <Button asChild variant="outline" className="h-auto min-h-10 whitespace-normal rounded-xl py-2 text-center">
                    <a href={visaRulesSearchUrl(destName, passName)} target="_blank" rel="noopener noreferrer"><Info /> Rules for {passName} passports</a>
                  </Button>
                  <Button asChild variant="outline" className="h-auto min-h-10 whitespace-normal rounded-xl py-2 text-center">
                    <a href={embassySearchUrl(destName, passName)} target="_blank" rel="noopener noreferrer"><Building2 /> {destName} embassy in {passName}</a>
                  </Button>
                </div>
              )}
            </div>
            {showSponsors && <SponsorOfferCards kind="visa" country={dest} />}
          </div>
        )
      )}
      <p className="text-xs text-muted-foreground">
        Visa rules depend on your passport and can change. Always confirm on the official page before you book.{showSponsors && ' Agencies marked "Sponsored" are paid listings.'}
      </p>
    </div>
  );
}
