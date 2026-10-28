import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Globe2, Pencil } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CountryPicker } from "@/components/ws/CountryPicker";
import { SponsorOfferCards } from "@/components/ws/SponsorOffers";
import { ToolArt } from "@/components/ws/ToolArt";
import { VisaFinder } from "@/components/ws/VisaFinder";
import { countryName, flag, guessCountry } from "@/lib/countries";

// trips.destination_country (migration 0017) is newer than the generated types.
const setCountry = (tripId: string, code: string | null) =>
  (supabase.from("trips") as unknown as { update: (r: { destination_country: string | null }) => { eq: (c: "id", v: string) => PromiseLike<{ error: { message: string } | null }> } })
    .update({ destination_country: code }).eq("id", tripId);

/**
 * "Visa & eSIM" on a trip: the official visa page for the trip's country and, on trips that show
 * sponsors, the visa agencies and eSIM offers for it. Staff set or change the country here.
 */
export function TripEssentials({ tripId, country, destination, canEdit, showSponsors }: {
  tripId: string; country: string | null; destination: string; canEdit: boolean; showSponsors: boolean;
}) {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const guess = guessCountry(destination);

  const save = async (code: string) => {
    setBusy(true);
    const { error } = await setCountry(tripId, code);
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success(`Destination country set to ${countryName(code)}`);
    setEditing(false);
    qc.invalidateQueries({ queryKey: ["trip", tripId] });
  };

  if (!country || editing) {
    return (
      <Card className="flex flex-col gap-5 p-5 shadow-card sm:flex-row sm:items-center">
        <ToolArt name="visa" className="mx-auto h-24 w-32 shrink-0" />
        <div className="flex-1 space-y-3">
          {canEdit ? (
            <>
              <div>
                <h3 className="text-lg font-bold">Which country is this trip going to?</h3>
                <p className="text-sm text-muted-foreground">Travelers then see the official visa page for it{showSponsors ? ", plus visa agencies and eSIM deals" : ""}.</p>
              </div>
              {guess && guess !== country && (
                <Button disabled={busy} onClick={() => save(guess)}><span aria-hidden>{flag(guess)}</span> Use {countryName(guess)}</Button>
              )}
              <CountryPicker selected={country ? [country] : []} onToggle={save} placeholder={guess ? "Or choose another country" : "Choose the country"} className="h-12" />
              {editing && <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>Cancel</Button>}
            </>
          ) : (
            <div>
              <h3 className="text-lg font-bold">Visa and eSIM help is on its way</h3>
              <p className="text-sm text-muted-foreground">Your organiser hasn't set this trip's country yet. Meanwhile, you can look up any country in Tools.</p>
              <Button asChild variant="outline" className="mt-3"><Link to="/tools" hash="visa"><Globe2 /> Open Tools</Link></Button>
            </div>
          )}
        </div>
      </Card>
    );
  }

  const name = countryName(country);
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-lg font-bold"><span className="text-2xl" aria-hidden>{flag(country)}</span>{name}</p>
        {canEdit && <Button size="sm" variant="ghost" onClick={() => setEditing(true)}><Pencil /> Change country</Button>}
      </div>
      <Section art="visa" title={`Visa for ${name}`} lead="Choose your passport to check the rules that apply to you.">
        <VisaFinder destination={country} showSponsors={showSponsors} />
      </Section>
      {showSponsors && (
        <Section art="esim" title="Stay connected" lead={`eSIM deals that work in ${name}. Set it up before you fly.`}>
          <SponsorOfferCards kind="esim" country={country} empty={
            <p className="rounded-2xl bg-muted p-4 text-sm text-muted-foreground">No eSIM offers for {name} yet. Your mobile network's roaming packs or a local SIM at the airport are good options.</p>
          } />
        </Section>
      )}
    </div>
  );
}

function Section({ art, title, lead, children }: { art: "visa" | "esim"; title: string; lead: string; children: React.ReactNode }) {
  return (
    <Card className="overflow-hidden shadow-card">
      <div className="flex items-center gap-3 bg-gradient-to-br from-accent via-accent/50 to-card px-5 pb-2 pt-4">
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-bold tracking-tight">{title}</h3>
          <p className="text-sm text-muted-foreground">{lead}</p>
        </div>
        <ToolArt name={art} className="h-20 w-28 shrink-0" />
      </div>
      <div className="p-5 pt-4">{children}</div>
    </Card>
  );
}
