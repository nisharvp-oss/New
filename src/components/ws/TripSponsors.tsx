import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Crown, ExternalLink, MapPin, Phone, PlayCircle, Search, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { must } from "@/lib/must";
import type { Database } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SponsorImage, SponsorImageUpload } from "@/components/ws/SponsorMedia";
import { formatDistance, sortSponsors, type LatLng } from "@/lib/geo";

type Sponsor = Database["public"]["Tables"]["trip_sponsors"]["Row"];
export const CATEGORIES = ["Restaurant", "Cafe", "Souvenir shop", "Perfume shop", "Clothing", "Jewellery", "Spa & wellness", "Tour & activity", "Transport", "Hotel", "Other"];
const OSM_TAG: Record<string, string> = { Restaurant: "restaurant", Cafe: "cafe", "Souvenir shop": "souvenir shop", "Perfume shop": "perfumery", Clothing: "clothes shop", Jewellery: "jewelry", "Spa & wellness": "spa", "Tour & activity": "tour", Transport: "car rental", Hotel: "hotel", Other: "" };

const useSponsors = (tripId: string) => useQuery({ queryKey: ["sponsors", tripId], queryFn: async () => (await must(supabase.from("trip_sponsors").select("*").eq("trip_id", tripId))) ?? [] });

type OsmHit = { place_id: number; name: string; display_name: string; lat: string; lon: string; type: string };
async function osmSearch(q: string): Promise<OsmHit[]> {
  const r = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=10&q=${encodeURIComponent(q)}`, { headers: { "Accept-Language": "en" } });
  if (!r.ok) throw new Error("Map search is busy, try again in a moment");
  return r.json();
}

/** Where the trip is, looked up once from its destination. */
function useTripPlace(destination: string) {
  return useQuery({ queryKey: ["geo", destination], enabled: !!destination, staleTime: Infinity, meta: { quiet: true }, queryFn: async () => {
    const [hit] = await osmSearch(destination);
    return hit ? { lat: Number(hit.lat), lng: Number(hit.lon) } : null;
  } });
}

function SponsorCard({ s, onDelete, track }: { s: Sponsor & { km: number | null }; onDelete?: (() => void) | undefined; track?: boolean | undefined }) {
  useEffect(() => { if (track) supabase.rpc("record_sponsor_event", { _id: s.id, _kind: "view" }); }, [track, s.id]);
  const tap = () => { if (track) supabase.rpc("record_sponsor_event", { _id: s.id, _kind: "click" }); };
  return (
    <Card className={`space-y-3 p-4 shadow-card ${s.is_premium ? "border-primary ring-1 ring-primary" : ""}`}>
      <div className="flex items-start gap-3">
        <SponsorImage value={s.logo_url} alt={`${s.name} logo`} className="h-14 w-14 shrink-0 rounded-lg border object-contain" />
        <div className="min-w-0 flex-1">
          <h3 className="font-bold">{s.name}</h3>
          <div className="mt-1 flex flex-wrap gap-1">
            {s.is_premium && <Badge><Crown className="mr-1 h-3 w-3" />Premium</Badge>}
            <Badge variant="secondary">{s.kind === "local" ? s.category || "Local business" : "Sponsor"}</Badge>
            {s.km != null && <Badge variant="outline"><MapPin className="mr-1 h-3 w-3" />{formatDistance(s.km)}</Badge>}
          </div>
        </div>
        {onDelete && <Button size="icon" variant="ghost" aria-label="Delete" onClick={onDelete}><Trash2 className="h-4 w-4" /></Button>}
      </div>
      {s.description && <p className="text-sm text-muted-foreground">{s.description}</p>}
      <SponsorImage value={s.flyer_url} alt={`${s.name} flyer`} className="max-h-72 w-full rounded-lg object-cover" />
      {s.address && <p className="text-xs text-muted-foreground">{s.address}</p>}
      <div className="flex flex-wrap gap-2" onClickCapture={tap}>
        {s.video_url && <Button size="sm" variant="outline" asChild><a href={s.video_url} target="_blank" rel="noreferrer"><PlayCircle className="h-4 w-4" />Watch video</a></Button>}
        {s.website && <Button size="sm" variant="outline" asChild><a href={s.website} target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4" />Website</a></Button>}
        {s.phone && <Button size="sm" variant="outline" asChild><a href={`tel:${s.phone}`}><Phone className="h-4 w-4" />Call</a></Button>}
        {s.lat != null && <Button size="sm" variant="outline" asChild><a href={`https://www.google.com/maps/dir/?api=1&destination=${s.lat},${s.lng}`} target="_blank" rel="noreferrer"><MapPin className="h-4 w-4" />Directions</a></Button>}
      </div>
    </Card>
  );
}

function SponsorList({ list, origin, onDelete, track }: { list: Sponsor[]; origin: LatLng | null; onDelete?: (id: string) => void; track?: boolean | undefined }) {
  const [cat, setCat] = useState("all");
  const sorted = sortSponsors(list, origin);
  const brand = sorted.filter((s) => s.kind !== "local");
  const local = sorted.filter((s) => s.kind === "local" && (cat === "all" || s.category === cat));
  const cats = [...new Set(list.filter((s) => s.kind === "local").map((s) => s.category).filter(Boolean))];
  return (
    <div className="space-y-6">
      {brand.length > 0 && <section className="space-y-3"><h3 className="text-lg font-bold">Trip sponsors</h3><div className="grid gap-4 md:grid-cols-2">{brand.map((s) => <SponsorCard key={s.id} s={s} track={track} onDelete={onDelete ? () => onDelete(s.id) : undefined} />)}</div></section>}
      {(local.length > 0 || cats.length > 0) && (
        <section className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="flex-1 text-lg font-bold">Local businesses</h3>
            <Select value={cat} onValueChange={setCat}>
              <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="all">All categories</SelectItem>{cats.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid gap-4 md:grid-cols-2">{local.map((s) => <SponsorCard key={s.id} s={s} track={track} onDelete={onDelete ? () => onDelete(s.id) : undefined} />)}</div>
        </section>
      )}
      {list.length === 0 && <p className="text-muted-foreground">No sponsors yet.</p>}
    </div>
  );
}

const empty = { kind: "sponsor", name: "", category: "Restaurant", description: "", logo_url: "", flyer_url: "", video_url: "", website: "", phone: "", address: "", contact_email: "", lat: null as number | null, lng: null as number | null };

export function StaffSponsors({ tripId, destination, isFree }: { tripId: string; destination: string; isFree: boolean }) {
  const qc = useQueryClient();
  const sponsors = useSponsors(tripId);
  const place = useTripPlace(destination);
  const [f, setF] = useState(empty);
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<OsmHit[]>([]);
  const [busy, setBusy] = useState(false);

  const search = async () => {
    setBusy(true);
    try {
      const term = q.trim() || OSM_TAG[f.category] || f.category;
      setHits(await osmSearch(`${term} ${destination}`.trim()));
    } catch (e) { toast.error((e as Error).message); }
    setBusy(false);
  };
  const pick = (h: OsmHit) => {
    setF({ ...f, kind: "local", name: h.name || h.display_name.split(",")[0] || "", address: h.display_name, lat: Number(h.lat), lng: Number(h.lon) });
    setHits([]);
  };
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("trip_sponsors").insert({ ...f, trip_id: tripId, category: f.kind === "local" ? f.category : "" });
    if (error) { toast.error(error.message); return; }
    toast.success("Sponsor added");
    setF({ ...empty, kind: f.kind, category: f.category });
    qc.invalidateQueries({ queryKey: ["sponsors", tripId] });
  };
  const del = async (id: string) => {
    const { error } = await supabase.from("trip_sponsors").delete().eq("id", id);
    if (error) toast.error(error.message); else qc.invalidateQueries({ queryKey: ["sponsors", tripId] });
  };
  const set = (k: keyof typeof empty) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
      <div className="space-y-3">
        <p className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">
          {isFree ? "Travelers see these sponsors on this trip. Premium sponsors are always shown first." : "This trip is ad-free, so travelers don't see sponsors."}
          {" "}Distances are from {destination || "the trip destination"}; travelers see distance from where they are.
        </p>
        <SponsorList list={sponsors.data ?? []} origin={place.data ?? null} onDelete={del} />
      </div>
      <Card className="h-fit p-4 shadow-card">
        <form onSubmit={save} className="space-y-3">
          <h3 className="font-bold">Add sponsor</h3>
          <Select value={f.kind} onValueChange={(v) => setF({ ...f, kind: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="sponsor">Trip sponsor (brand)</SelectItem><SelectItem value="local">Local business</SelectItem></SelectContent>
          </Select>
          {f.kind === "local" && (
            <>
              <div><Label>Category</Label>
                <Select value={f.category} onValueChange={(v) => setF({ ...f, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Find on the map</Label>
                <div className="flex gap-2">
                  <Input placeholder={`e.g. ${f.category} name, near ${destination || "city"}`} value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); search(); } }} />
                  <Button type="button" size="icon" variant="outline" onClick={search} disabled={busy} aria-label="Search map"><Search className="h-4 w-4" /></Button>
                </div>
                {hits.length > 0 && (
                  <div className="mt-2 max-h-56 divide-y overflow-auto rounded-md border text-sm">
                    {hits.map((h) => <button type="button" key={h.place_id} onClick={() => pick(h)} className="block w-full p-2 text-left hover:bg-muted"><b>{h.name || h.type}</b><span className="block truncate text-xs text-muted-foreground">{h.display_name}</span></button>)}
                  </div>
                )}
                {f.lat != null && <p className="mt-1 text-xs text-muted-foreground">Location set ✓</p>}
              </div>
            </>
          )}
          <div><Label>Name</Label><Input required value={f.name} onChange={set("name")} /></div>
          <div><Label>Short description / offer</Label><Textarea value={f.description} onChange={set("description")} /></div>
          <SponsorImageUpload label="Logo" value={f.logo_url} onChange={(v) => setF({ ...f, logo_url: v })} />
          <SponsorImageUpload label="Flyer" value={f.flyer_url} onChange={(v) => setF({ ...f, flyer_url: v })} />
          <div><Label>Sponsor's email (optional)</Label><Input type="email" placeholder="They can manage this listing" value={f.contact_email} onChange={set("contact_email")} /><p className="mt-1 text-xs text-muted-foreground">When they sign in with this email, they can upload their own logo and flyer and see results in their sponsor dashboard.</p></div>
          <div><Label>Video link</Label><Input type="url" placeholder="YouTube, Instagram…" value={f.video_url} onChange={set("video_url")} /></div>
          <div><Label>Website</Label><Input type="url" value={f.website} onChange={set("website")} /></div>
          <div><Label>Phone</Label><Input value={f.phone} onChange={set("phone")} /></div>
          {f.kind === "local" && <div><Label>Address</Label><Input value={f.address} onChange={set("address")} /></div>}
          <Button className="w-full">Add</Button>
          <p className="text-xs text-muted-foreground">Want to be featured first? Premium placement is arranged with the WanderSync team.</p>
        </form>
      </Card>
    </div>
  );
}

export function TravelerSponsors({ tripId, destination }: { tripId: string; destination: string }) {
  const sponsors = useSponsors(tripId);
  const place = useTripPlace(destination);
  const [here, setHere] = useState<LatLng | null>(null);
  useEffect(() => {
    navigator.geolocation?.getCurrentPosition((p) => setHere({ lat: p.coords.latitude, lng: p.coords.longitude }), () => {}, { timeout: 8000 });
  }, []);
  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">{here ? "Distances from where you are now." : `Distances from ${destination || "the destination"}.`}</p>
      <SponsorList list={sponsors.data ?? []} origin={here ?? place.data ?? null} track />
    </div>
  );
}
