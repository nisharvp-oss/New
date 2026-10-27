import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Crown, Eye, MousePointerClick } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { SponsorImageUpload } from "@/components/ws/SponsorMedia";

type Sponsor = Database["public"]["Tables"]["trip_sponsors"]["Row"];

export const Route = createFileRoute("/_authenticated/sponsor")({
  head: () => ({ meta: [
    { title: "Sponsor dashboard — WanderSync" },
    { name: "description", content: "Manage your sponsor listings, logo, flyer and results across WanderSync trips." },
    { property: "og:title", content: "Sponsor dashboard — WanderSync" },
    { property: "og:description", content: "Manage your sponsor listings and see how travelers engage." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: SponsorDashboard,
});

function SponsorDashboard() {
  const { user } = Route.useRouteContext();
  const listings = useQuery({
    queryKey: ["my-sponsorships", user.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("trip_sponsors").select("*").ilike("contact_email", user.email ?? "-").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  const list = listings.data ?? [];
  const views = list.reduce((a, s) => a + s.views, 0);
  const clicks = list.reduce((a, s) => a + s.clicks, 0);
  return (
    <main className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      <div>
        <h1 className="text-3xl font-extrabold">Sponsor dashboard</h1>
        <p className="text-muted-foreground">Listings where trip organisers added {user.email} as the sponsor contact.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-4 shadow-card"><p className="text-sm text-muted-foreground">Listings</p><p className="text-2xl font-bold">{list.length}</p></Card>
        <Card className="p-4 shadow-card"><p className="flex items-center gap-1 text-sm text-muted-foreground"><Eye className="h-4 w-4" />Times shown</p><p className="text-2xl font-bold">{views}</p></Card>
        <Card className="p-4 shadow-card"><p className="flex items-center gap-1 text-sm text-muted-foreground"><MousePointerClick className="h-4 w-4" />Taps</p><p className="text-2xl font-bold">{clicks}</p></Card>
      </div>
      {list.length === 0 && !listings.isLoading && (
        <Card className="p-6 text-muted-foreground shadow-card">No listings yet. Ask the trip organiser to add your business with this email as the contact.</Card>
      )}
      {list.map((s) => <ListingEditor key={s.id} s={s} />)}
    </main>
  );
}

function ListingEditor({ s }: { s: Sponsor }) {
  const qc = useQueryClient();
  const [f, setF] = useState({ name: s.name, description: s.description, logo_url: s.logo_url, flyer_url: s.flyer_url, video_url: s.video_url, website: s.website, phone: s.phone, address: s.address });
  const trip = useQuery({ queryKey: ["sponsor-trip", s.trip_id], queryFn: async () => (await supabase.from("trips").select("title,destination").eq("id", s.trip_id).maybeSingle()).data });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("trip_sponsors").update(f).eq("id", s.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Listing saved");
    qc.invalidateQueries({ queryKey: ["my-sponsorships"] });
  };
  return (
    <Card className="p-5 shadow-card">
      <form onSubmit={save} className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="flex-1 text-lg font-bold">{s.name}</h2>
          {s.is_premium && <Badge><Crown className="mr-1 h-3 w-3" />Premium</Badge>}
          <Badge variant="secondary">{s.kind === "local" ? s.category || "Local business" : "Sponsor"}</Badge>
        </div>
        <p className="text-sm text-muted-foreground">Trip: {trip.data ? `${trip.data.title}${trip.data.destination ? ` · ${trip.data.destination}` : ""}` : "—"} · Shown {s.views} times · {s.clicks} taps</p>
        <div className="grid gap-4 md:grid-cols-2">
          <SponsorImageUpload label="Logo" value={f.logo_url} onChange={(v) => setF({ ...f, logo_url: v })} />
          <SponsorImageUpload label="Flyer" value={f.flyer_url} onChange={(v) => setF({ ...f, flyer_url: v })} />
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <div><Label>Name</Label><Input required value={f.name} onChange={set("name")} /></div>
          <div><Label>Video link</Label><Input type="url" value={f.video_url} onChange={set("video_url")} /></div>
          <div><Label>Website</Label><Input type="url" value={f.website} onChange={set("website")} /></div>
          <div><Label>Phone</Label><Input value={f.phone} onChange={set("phone")} /></div>
        </div>
        <div><Label>Address</Label><Input value={f.address} onChange={set("address")} /></div>
        <div><Label>Description / offer</Label><Textarea value={f.description} onChange={set("description")} /></div>
        <Button>Save listing</Button>
      </form>
    </Card>
  );
}
