import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, CalendarDays, CheckCircle2, MapPin, Megaphone, Plus, Siren, Sparkles, Trash2, Utensils } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { must } from "@/lib/must";
import { generateItinerary, type AiItineraryItem } from "@/lib/ai-itinerary.functions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { mapsUrl } from "@/components/ws/shared";
import { QRCodeSVG } from "qrcode.react";
import { QrScanner } from "@/components/ws/QrScanner";
import { emailAnnouncement } from "@/lib/smtp.functions";
import { StaffCheckins, StaffDocuments, TravelerDocuments } from "@/components/ws/TripOps";
import { StaffExpenses, TravelerExpenses } from "@/components/ws/TripExpenses";
import { StaffSponsors, TravelerSponsors } from "@/components/ws/TripSponsors";

export const Route = createFileRoute("/_authenticated/trip/$tripId")({
  head: () => ({ meta: [{ title: "Trip — WanderSync" }, { name: "description", content: "Trip itinerary, travelers, extras, announcements and safety." }] }),
  component: TripPage,
});

const money = (n: number | string) => `$${Number(n).toFixed(2)}`;
const MEALS = ["Breakfast Included", "Lunch Included", "Lunch: Self-pay", "Dinner: Group Booking", "Dinner: Self-pay"];

function useTripData(tripId: string) {
  const trip = useQuery({ queryKey: ["trip", tripId], meta: { quiet: true }, queryFn: async () => {
    const { data, error } = await supabase.from("trips").select("*").eq("id", tripId).single();
    if (error) throw error;
    return data;
  } });
  const staff = useQuery({ queryKey: ["trip-staff", tripId], queryFn: async () => {
    const { user } = await must(supabase.auth.getUser());
    return (await must(supabase.rpc("is_trip_staff", { _trip: tripId, _user: user!.id }))) ?? false;
  } });
  return { trip, staff };
}

function TripPage() {
  const { tripId } = Route.useParams();
  const { trip, staff } = useTripData(tripId);
  const free = useQuery({ queryKey: ["trip-free", tripId], queryFn: async () => (await must(supabase.rpc("trip_is_free", { _trip: tripId }))) ?? false });
  if (trip.isLoading || staff.isLoading) return <TripSkeleton />;
  if (!trip.data) return <p className="p-10 text-center">This trip doesn't exist, or your account isn't on it. Ask the organiser to invite your email.</p>;
  const t = trip.data;
  const isFree = free.data ?? false;
  return (
    <main>
      <header className="latitudes bg-lagoon-deep text-navy-foreground">
        <div className="mx-auto max-w-6xl px-4 pb-7 pt-4 sm:pb-9">
          <Link to="/dashboard" className="-ml-2 inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm text-navy-foreground/75 hover:text-navy-foreground"><ArrowLeft className="h-4 w-4" /> My trips</Link>
          <h1 className="rise mt-3 text-[clamp(1.9rem,5vw,2.75rem)] font-bold leading-[1.05]">{t.title}</h1>
          <p className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-navy-foreground/75">
            <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" />{t.destination || "Destination to be confirmed"}</span>
            <span className="flex items-center gap-1.5 font-board text-xs text-sunset"><CalendarDays className="h-4 w-4" />{t.start_date ?? "TBC"} – {t.end_date ?? "TBC"}</span>
          </p>
        </div>
      </header>
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-6">
        {staff.data ? <StaffView tripId={tripId} destination={t.destination} isFree={isFree} unlockRequested={t.unlock_requested} /> : <TravelerView tripId={tripId} destination={t.destination} isFree={isFree} />}
      </div>
    </main>
  );
}

function TripSkeleton() {
  return (
    <main aria-busy className="animate-pulse">
      <div className="h-40 bg-lagoon-deep" />
      <div className="mx-auto max-w-6xl space-y-3 px-4 py-6">
        <div className="h-9 w-2/3 rounded-full bg-muted" />
        <div className="h-28 rounded-2xl bg-muted" />
        <div className="h-28 rounded-2xl bg-muted" />
      </div>
    </main>
  );
}

/* ---------- shared data hooks ---------- */
const useItinerary = (tripId: string) => useQuery({ queryKey: ["itin", tripId], queryFn: async () => (await must(supabase.from("itinerary_items").select("*").eq("trip_id", tripId).order("day").order("time"))) ?? [] });
const useAddons = (tripId: string) => useQuery({ queryKey: ["addons", tripId], queryFn: async () => (await must(supabase.from("addons").select("*").eq("trip_id", tripId).order("created_at"))) ?? [] });
const useBookings = (tripId: string) => useQuery({ queryKey: ["bookings", tripId], queryFn: async () => (await must(supabase.from("addon_bookings").select("*").eq("trip_id", tripId))) ?? [] });
const useTravelers = (tripId: string) => useQuery({ queryKey: ["travelers", tripId], queryFn: async () => (await must(supabase.from("trip_travelers").select("*").eq("trip_id", tripId).order("created_at"))) ?? [] });
const useMessages = (tripId: string) => useQuery({ queryKey: ["msgs", tripId], queryFn: async () => (await must(supabase.from("trip_messages").select("*").eq("trip_id", tripId).order("created_at", { ascending: false }))) ?? [] });
const useSos = (tripId: string) => useQuery({ queryKey: ["sos", tripId], queryFn: async () => (await must(supabase.from("sos_alerts").select("*").eq("trip_id", tripId).order("created_at", { ascending: false }))) ?? [] });

function useLive(tripId: string) {
  const qc = useQueryClient();
  useEffect(() => {
    const ch = supabase.channel(`trip-${tripId}-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "sos_alerts", filter: `trip_id=eq.${tripId}` }, () => qc.invalidateQueries({ queryKey: ["sos", tripId] }))
      .on("postgres_changes", { event: "*", schema: "public", table: "trip_messages", filter: `trip_id=eq.${tripId}` }, () => qc.invalidateQueries({ queryKey: ["msgs", tripId] }))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [tripId, qc]);
}

function ItineraryList({ items, onDelete }: { items: { id: string; day: number; time: string; title: string; location: string; meals: string[]; notice: string }[]; onDelete?: (id: string) => void }) {
  const days = [...new Set(items.map((i) => i.day))];
  if (!items.length) return <p className="text-muted-foreground">No schedule yet.</p>;
  return (
    <div className="space-y-4">
      {days.map((d) => (
        <Card key={d} className="p-4 shadow-card">
          <h3 className="mb-3 font-bold">Day {d}</h3>
          <div className="space-y-3">
            {items.filter((i) => i.day === d).map((i) => (
              <div key={i.id} className="flex gap-3 border-l-2 border-primary pl-3">
                <span className="w-12 shrink-0 font-mono text-sm font-bold">{i.time}</span>
                <div className="flex-1">
                  <p className="font-semibold">{i.title}</p>
                  {i.location && <a href={mapsUrl(i.location)} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-sm text-primary"><MapPin className="h-3.5 w-3.5" />{i.location}</a>}
                  <div className="mt-1 flex flex-wrap gap-1">{i.meals.map((m) => <Badge key={m} variant="secondary"><Utensils className="mr-1 h-3 w-3" />{m}</Badge>)}</div>
                  {i.notice && <p className="mt-1 rounded bg-muted px-2 py-1 text-xs">{i.notice}</p>}
                </div>
                {onDelete && <Button size="icon" variant="ghost" aria-label="Delete" onClick={() => onDelete(i.id)}><Trash2 className="h-4 w-4" /></Button>}
              </div>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}

function Announcements({ tripId, canPost }: { tripId: string; canPost: boolean }) {
  const msgs = useMessages(tripId);
  const qc = useQueryClient();
  const [text, setText] = useState("");
  const [mail, setMail] = useState(true);
  const sendMail = useServerFn(emailAnnouncement);
  const post = async () => {
    const { data: u } = await supabase.auth.getUser();
    const { data: p } = await supabase.from("profiles").select("full_name,email").eq("id", u.user!.id).single();
    const { data: row, error } = await supabase.from("trip_messages").insert({ trip_id: tripId, user_id: u.user!.id, author: p?.full_name || p?.email || "Organiser", text }).select("id").single();
    if (error) { toast.error(error.message); return; }
    setText("");
    if (mail && row) {
      try {
        const r = await sendMail({ data: { messageId: row.id } });
        if (r.error) toast.error(`Posted, but not emailed: ${r.error}`);
        else toast.success(`Emailed ${r.sent} traveler(s)${r.failed ? `, ${r.failed} failed` : ""}`);
      } catch (e) { toast.error(e instanceof Error ? e.message : "Email failed"); }
    }
    qc.invalidateQueries({ queryKey: ["msgs", tripId] });
  };
  return (
    <div className="space-y-3">
      {canPost && (
        <Card className="flex gap-2 p-4"><Input placeholder="Announcement to all travelers…" value={text} onChange={(e) => setText(e.target.value)} /><Button onClick={post} disabled={!text.trim()}><Megaphone className="h-4 w-4" /> Send</Button>
          <label className="flex items-center gap-1 whitespace-nowrap text-xs"><input type="checkbox" checked={mail} onChange={(e) => setMail(e.target.checked)} /> Email travelers</label></Card>
      )}
      {msgs.data?.map((m) => (
        <Card key={m.id} className="p-4"><p className="text-xs text-muted-foreground">{m.author} · {new Date(m.created_at).toLocaleString()}</p><p>{m.text}</p></Card>
      ))}
      {msgs.data?.length === 0 && <p className="text-muted-foreground">No announcements yet.</p>}
    </div>
  );
}

/* ---------- staff ---------- */
function FreeTripBanner({ tripId, requested }: { tripId: string; requested: boolean }) {
  const qc = useQueryClient();
  const travelers = useTravelers(tripId);
  const terms = useQuery({ queryKey: ["free-terms"], queryFn: async () => (await must(supabase.rpc("free_trip_terms")))?.[0] ?? null });
  if (!terms.data) return null;
  const count = travelers.data?.length ?? 0;
  const request = async () => {
    const { error } = await supabase.from("trips").update({ unlock_requested: true }).eq("id", tripId);
    if (error) { toast.error(error.message); return; }
    toast.success("Request sent. The WanderSync team will confirm your payment and unlock the trip.");
    qc.invalidateQueries({ queryKey: ["trip", tripId] });
  };
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border bg-muted/50 p-4 text-sm">
      <p className="flex-1">Free trip: <b>{count} of {terms.data.free_travelers}</b> travelers. Unlock unlimited travelers and remove sponsors for a one-time <b>${Number(terms.data.unlock_price).toFixed(0)}</b>.</p>
      {requested ? <Badge variant="outline">Unlock requested</Badge> : <Button size="sm" onClick={request}>Unlock this trip</Button>}
    </div>
  );
}

function StaffView({ tripId, destination, isFree, unlockRequested }: { tripId: string; destination: string; isFree: boolean; unlockRequested: boolean }) {
  useLive(tripId);
  const sos = useSos(tripId);
  const qc = useQueryClient();
  const active = sos.data?.filter((s) => s.status === "active") ?? [];
  const resolve = async (id: string) => {
    const { error } = await supabase.from("sos_alerts").update({ status: "resolved" }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries({ queryKey: ["sos", tripId] });
  };
  return (
    <>
      {isFree && <FreeTripBanner tripId={tripId} requested={unlockRequested} />}
      {active.map((a) => (
        <div key={a.id} className="sos-pulse flex flex-wrap items-center gap-3 rounded-2xl bg-destructive p-4 text-destructive-foreground">
          <Siren className="h-8 w-8" />
          <div className="flex-1"><p className="font-extrabold">SOS from {a.traveler_name} · {new Date(a.created_at).toLocaleTimeString()}</p>
            <p className="text-sm opacity-90">{a.message || "Emergency assistance requested"} · {a.phone}</p></div>
          {a.lat != null && <Button size="sm" variant="secondary" asChild><a href={`https://www.google.com/maps?q=${a.lat},${a.lng}`} target="_blank" rel="noreferrer">Open map</a></Button>}
          <Button size="sm" variant="outline" className="bg-transparent" onClick={() => resolve(a.id)}>Resolve</Button>
        </div>
      ))}
      <Tabs defaultValue="travelers">
        <TabsList>
          <TabsTrigger value="travelers">Travelers</TabsTrigger><TabsTrigger value="itinerary">Itinerary</TabsTrigger>
          <TabsTrigger value="addons">Add-ons</TabsTrigger><TabsTrigger value="sponsors">Sponsors</TabsTrigger><TabsTrigger value="news">Announcements</TabsTrigger>
          <TabsTrigger value="tickets">Tickets</TabsTrigger><TabsTrigger value="checkins">Check-ins</TabsTrigger><TabsTrigger value="docs">Documents</TabsTrigger><TabsTrigger value="expenses">Expenses</TabsTrigger><TabsTrigger value="safety">Safety log</TabsTrigger>
        </TabsList>
        <TabsContent value="travelers"><StaffTravelers tripId={tripId} /></TabsContent>
        <TabsContent value="itinerary"><StaffItinerary tripId={tripId} /></TabsContent>
        <TabsContent value="addons"><StaffAddons tripId={tripId} /></TabsContent>
        <TabsContent value="sponsors"><StaffSponsors tripId={tripId} destination={destination} isFree={isFree} /></TabsContent>
        <TabsContent value="tickets"><StaffTickets tripId={tripId} /></TabsContent>
        <TabsContent value="checkins"><StaffCheckins tripId={tripId} /></TabsContent>
        <TabsContent value="docs"><StaffDocuments tripId={tripId} /></TabsContent>
        <TabsContent value="expenses"><StaffExpenses tripId={tripId} /></TabsContent>
        <TabsContent value="news"><Announcements tripId={tripId} canPost /></TabsContent>
        <TabsContent value="safety">
          <Card className="divide-y">{sos.data?.map((s) => (
            <div key={s.id} className="flex items-center justify-between p-3 text-sm"><span>{s.traveler_name} · {new Date(s.created_at).toLocaleString()} · {s.message}</span><Badge variant={s.status === "active" ? "destructive" : "secondary"}>{s.status}</Badge></div>
          ))}{sos.data?.length === 0 && <p className="p-4 text-muted-foreground">No alerts.</p>}</Card>
        </TabsContent>
      </Tabs>
    </>
  );
}

function StaffTravelers({ tripId }: { tripId: string }) {
  const q = useTravelers(tripId);
  const qc = useQueryClient();
  const [f, setF] = useState({ name: "", email: "" });
  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("trip_travelers").insert({ trip_id: tripId, name: f.name, email: f.email });
    if (error) { toast.error(error.message); return; }
    toast.success(`${f.name} added. They see the trip after signing up with ${f.email}.`);
    setF({ name: "", email: "" });
    qc.invalidateQueries({ queryKey: ["travelers", tripId] });
  };
  const upd = async (id: string, payment: string) => {
    const { error } = await supabase.from("trip_travelers").update({ payment }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries({ queryKey: ["travelers", tripId] });
  };
  const del = async (id: string) => {
    const { error } = await supabase.from("trip_travelers").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries({ queryKey: ["travelers", tripId] });
  };
  return (
    <div className="space-y-4">
      <Card className="p-4">
        <form onSubmit={add} className="flex flex-wrap items-end gap-2">
          <div className="flex-1"><Label>Name</Label><Input required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
          <div className="flex-1"><Label>Email</Label><Input type="email" required value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></div>
          <Button><Plus className="h-4 w-4" /> Add traveler</Button>
        </form>
      </Card>
      <Card className="overflow-x-auto">
        <Table>
          <TableHeader><TableRow><TableHead>Traveler</TableHead><TableHead>Phone / emergency</TableHead><TableHead>Dietary</TableHead><TableHead>Joined</TableHead><TableHead>Payment</TableHead><TableHead /></TableRow></TableHeader>
          <TableBody>
            {q.data?.map((t) => (
              <TableRow key={t.id}>
                <TableCell><p className="font-semibold">{t.name}</p><p className="text-xs text-muted-foreground">{t.email}</p></TableCell>
                <TableCell className="text-xs">{t.phone || "—"}<br />{t.emergency || "—"}</TableCell>
                <TableCell>{t.dietary || "—"}</TableCell>
                <TableCell>{t.user_id ? <Badge>Signed up</Badge> : <Badge variant="outline">Invited</Badge>}</TableCell>
                <TableCell>
                  <Select value={t.payment} onValueChange={(v) => upd(t.id, v)}>
                    <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="pending">Pending</SelectItem><SelectItem value="partial">Partial</SelectItem><SelectItem value="paid">Paid</SelectItem></SelectContent>
                  </Select>
                </TableCell>
                <TableCell><Button size="icon" variant="ghost" aria-label="Remove" onClick={() => del(t.id)}><Trash2 className="h-4 w-4" /></Button></TableCell>
              </TableRow>
            ))}
            {q.data?.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">No travelers yet.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

function StaffItinerary({ tripId }: { tripId: string }) {
  const q = useItinerary(tripId);
  const qc = useQueryClient();
  const [f, setF] = useState({ day: 1, time: "09:00", title: "", location: "", notice: "", meals: [] as string[] });
  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("itinerary_items").insert({ trip_id: tripId, ...f });
    if (error) { toast.error(error.message); return; }
    setF({ ...f, title: "", location: "", notice: "", meals: [] });
    qc.invalidateQueries({ queryKey: ["itin", tripId] });
  };
  const del = async (id: string) => {
    await supabase.from("itinerary_items").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["itin", tripId] });
  };
  return (
    <div className="space-y-4">
    <AiPlanner tripId={tripId} />
    <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
      <ItineraryList items={q.data ?? []} onDelete={del} />
      <Card className="h-fit p-4 shadow-card">
        <form onSubmit={add} className="space-y-3">
          <h3 className="font-bold">Add to schedule</h3>
          <div className="grid grid-cols-2 gap-2">
            <div><Label>Day</Label><Input type="number" min={1} value={f.day} onChange={(e) => setF({ ...f, day: Number(e.target.value) })} /></div>
            <div><Label>Time</Label><Input type="time" value={f.time} onChange={(e) => setF({ ...f, time: e.target.value })} /></div>
          </div>
          <div><Label>Title</Label><Input required value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></div>
          <div><Label>Location</Label><Input value={f.location} onChange={(e) => setF({ ...f, location: e.target.value })} /></div>
          <div className="flex flex-wrap gap-1">{MEALS.map((m) => (
            <button type="button" key={m} onClick={() => setF({ ...f, meals: f.meals.includes(m) ? f.meals.filter((x) => x !== m) : [...f.meals, m] })}
              className={`rounded-full border px-2 py-0.5 text-xs ${f.meals.includes(m) ? "border-primary bg-primary text-primary-foreground" : ""}`}>{m}</button>
          ))}</div>
          <div><Label>Notice</Label><Textarea value={f.notice} onChange={(e) => setF({ ...f, notice: e.target.value })} /></div>
          <Button className="w-full">Add</Button>
        </form>
      </Card>
    </div>
    </div>
  );
}

function AiPlanner({ tripId }: { tripId: string }) {
  const qc = useQueryClient();
  const gen = useServerFn(generateItinerary);
  const trip = useQuery({ queryKey: ["trip-basic", tripId], queryFn: async () => (await must(supabase.from("trips").select("destination,start_date,end_date").eq("id", tripId).maybeSingle())) });
  const [f, setF] = useState({ destination: "", startDate: "", endDate: "", interests: "" });
  const [items, setItems] = useState<AiItineraryItem[]>([]);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (trip.data) setF((p) => ({ ...p, destination: p.destination || trip.data!.destination || "", startDate: p.startDate || trip.data!.start_date || "", endDate: p.endDate || trip.data!.end_date || "" }));
  }, [trip.data]);
  const run = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setItems([]);
    try {
      const r = await gen({ data: { tripId, ...f } });
      if (r.error) toast.error(r.error); else setItems(r.items);
    } catch (err) { toast.error(err instanceof Error ? err.message : "Generation failed"); }
    finally { setBusy(false); }
  };
  const save = async () => {
    const { error } = await supabase.from("itinerary_items").insert(items.map((i) => ({ trip_id: tripId, ...i })));
    if (error) { toast.error(error.message); return; }
    toast.success(`Added ${items.length} items to the schedule`);
    setItems([]);
    qc.invalidateQueries({ queryKey: ["itin", tripId] });
  };
  return (
    <Card className="p-4 shadow-card">
      <form onSubmit={run} className="space-y-3">
        <h3 className="flex items-center gap-2 font-bold"><Sparkles className="h-4 w-4 text-primary" /> AI itinerary planner</h3>
        <div className="grid gap-2 sm:grid-cols-3">
          <div><Label>Destination</Label><Input required value={f.destination} onChange={(e) => setF({ ...f, destination: e.target.value })} /></div>
          <div><Label>Start</Label><Input required type="date" value={f.startDate} onChange={(e) => setF({ ...f, startDate: e.target.value })} /></div>
          <div><Label>End</Label><Input required type="date" value={f.endDate} onChange={(e) => setF({ ...f, endDate: e.target.value })} /></div>
        </div>
        <div><Label>Traveler interests</Label><Textarea placeholder="e.g. history, street food, hiking, vegetarian-friendly" value={f.interests} onChange={(e) => setF({ ...f, interests: e.target.value })} /></div>
        <Button disabled={busy}>{busy ? "Generating… (can take a minute)" : "Generate day-by-day plan"}</Button>
      </form>
      {items.length > 0 && (
        <div className="mt-4 space-y-3">
          <ItineraryList items={items.map((i, k) => ({ id: String(k), ...i }))} onDelete={(id) => setItems(items.filter((_, k) => String(k) !== id))} />
          <div className="flex gap-2"><Button onClick={save}>Add all to schedule</Button><Button variant="outline" onClick={() => setItems([])}>Discard</Button></div>
        </div>
      )}
    </Card>
  );
}

function StaffAddons({ tripId }: { tripId: string }) {
  const addons = useAddons(tripId);
  const bookings = useBookings(tripId);
  const travelers = useTravelers(tripId);
  const qc = useQueryClient();
  const [f, setF] = useState({ title: "", description: "", price: "", cutoff: "" });
  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("addons").insert({ trip_id: tripId, title: f.title, description: f.description, price: Number(f.price || 0), cutoff: f.cutoff ? new Date(f.cutoff).toISOString() : null, methods: ["cash", "link", "bank"] });
    if (error) { toast.error(error.message); return; }
    setF({ title: "", description: "", price: "", cutoff: "" });
    qc.invalidateQueries({ queryKey: ["addons", tripId] });
  };
  const markPaid = async (id: string) => {
    const { error } = await supabase.from("addon_bookings").update({ status: "paid" }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries({ queryKey: ["bookings", tripId] });
  };
  const del = async (id: string) => { await supabase.from("addons").delete().eq("id", id); qc.invalidateQueries({ queryKey: ["addons", tripId] }); };
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
      <div className="space-y-4">
        {addons.data?.map((a) => {
          const bs = bookings.data?.filter((b) => b.addon_id === a.id) ?? [];
          const paid = bs.filter((b) => b.status === "paid").length * Number(a.price);
          return (
            <Card key={a.id} className="space-y-2 p-4 shadow-card">
              <div className="flex items-start justify-between"><div><h3 className="font-bold">{a.title} · {money(a.price)}</h3><p className="text-sm text-muted-foreground">{a.description}</p>
                {a.cutoff && <p className="text-xs text-muted-foreground">Book by {new Date(a.cutoff).toLocaleString()}</p>}</div>
                <Button size="icon" variant="ghost" aria-label="Delete" onClick={() => del(a.id)}><Trash2 className="h-4 w-4" /></Button></div>
              <p className="text-sm font-semibold">{bs.length} booked · {money(paid)} collected</p>
              {bs.map((b) => (
                <div key={b.id} className="flex items-center justify-between rounded bg-muted px-3 py-1.5 text-sm">
                  <span>{travelers.data?.find((t) => t.id === b.traveler_id)?.name ?? "Traveler"} · {b.method}</span>
                  {b.status === "paid" ? <Badge><CheckCircle2 className="mr-1 h-3 w-3" />Paid</Badge> : <Button size="sm" variant="outline" onClick={() => markPaid(b.id)}>Mark paid</Button>}
                </div>
              ))}
            </Card>
          );
        })}
        {addons.data?.length === 0 && <p className="text-muted-foreground">No add-ons yet.</p>}
      </div>
      <Card className="h-fit p-4 shadow-card">
        <form onSubmit={add} className="space-y-3">
          <h3 className="font-bold">New add-on</h3>
          <div><Label>Title</Label><Input required value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></div>
          <div><Label>Description</Label><Textarea value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></div>
          <div><Label>Price ($)</Label><Input type="number" value={f.price} onChange={(e) => setF({ ...f, price: e.target.value })} /></div>
          <div><Label>Booking cutoff</Label><Input type="datetime-local" value={f.cutoff} onChange={(e) => setF({ ...f, cutoff: e.target.value })} /></div>
          <Button className="w-full">Add</Button>
        </form>
      </Card>
    </div>
  );
}

/* ---------- traveler ---------- */
function TravelerView({ tripId, destination, isFree }: { tripId: string; destination: string; isFree: boolean }) {
  useLive(tripId);
  const itin = useItinerary(tripId);
  const travelers = useTravelers(tripId);
  const [uid, setUid] = useState<string | null>(null);
  useEffect(() => { supabase.auth.getUser().then(({ data }) => setUid(data.user?.id ?? null)); }, []);
  const me = travelers.data?.find((t) => t.user_id === uid);
  return (
    <>
      {me && <SosButton tripId={tripId} name={me.name} phone={me.phone} />}
      <Tabs defaultValue="plan">
        <TabsList><TabsTrigger value="plan">Schedule</TabsTrigger><TabsTrigger value="tickets">Tickets</TabsTrigger><TabsTrigger value="docs">Documents</TabsTrigger><TabsTrigger value="expenses">Expenses</TabsTrigger><TabsTrigger value="extras">Extras</TabsTrigger>{isFree && <TabsTrigger value="sponsors">Sponsors & nearby</TabsTrigger>}<TabsTrigger value="news">News</TabsTrigger><TabsTrigger value="me">My details</TabsTrigger></TabsList>
        <TabsContent value="plan"><ItineraryList items={itin.data ?? []} /></TabsContent>
        <TabsContent value="tickets">{me ? <MyTickets travelerId={me.id} /> : null}</TabsContent>
        <TabsContent value="docs">{me ? <TravelerDocuments tripId={tripId} travelerId={me.id} /> : null}</TabsContent>
        <TabsContent value="expenses">{me ? <TravelerExpenses tripId={tripId} travelerId={me.id} /> : null}</TabsContent>
        <TabsContent value="extras">{me ? <TravelerExtras tripId={tripId} travelerId={me.id} /> : null}</TabsContent>
        {isFree && <TabsContent value="sponsors"><TravelerSponsors tripId={tripId} destination={destination} /></TabsContent>}
        <TabsContent value="news"><Announcements tripId={tripId} canPost={false} /></TabsContent>
        <TabsContent value="me">{me ? <MyDetails traveler={me} /> : null}</TabsContent>
      </Tabs>
    </>
  );
}

function SosButton({ tripId, name, phone }: { tripId: string; name: string; phone: string }) {
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const send = () => {
    setBusy(true);
    const go = async (lat: number | null, lng: number | null) => {
      const { data: u } = await supabase.auth.getUser();
      const { error } = await supabase.from("sos_alerts").insert({ trip_id: tripId, user_id: u.user!.id, traveler_name: name, phone, lat, lng, message: msg });
      setBusy(false);
      if (error) toast.error(error.message); else { toast.success("SOS sent. Your organiser and caretaker have been alerted."); setMsg(""); }
    };
    if (!navigator.geolocation) { go(null, null); return; }
    navigator.geolocation.getCurrentPosition((p) => go(p.coords.latitude, p.coords.longitude), () => go(null, null), { timeout: 8000 });
  };
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} aria-label="Send SOS"
        className="sos-pulse press fixed bottom-[calc(5.75rem+var(--safe-bottom))] right-4 z-40 flex h-16 w-16 flex-col items-center justify-center rounded-full bg-destructive text-xs font-bold text-destructive-foreground shadow-lg md:bottom-8 md:right-8">
        <Siren className="h-6 w-6" />SOS
      </button>
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent className="pb-safe">
          <div className="mx-auto w-full max-w-md space-y-4 px-4 pb-6 pt-2">
            <DrawerTitle className="flex items-center gap-2 font-display text-xl text-destructive"><Siren className="h-5 w-5" /> Send an emergency alert?</DrawerTitle>
            <p className="text-sm text-muted-foreground">Your organiser and caretaker get your name, phone and current location straight away.</p>
            <Textarea placeholder="What's happening? (optional)" value={msg} onChange={(e) => setMsg(e.target.value)} />
            <Button variant="destructive" size="lg" className="w-full" onClick={() => { send(); setOpen(false); }} disabled={busy}>{busy ? "Getting your location…" : "Send SOS now"}</Button>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}

function TravelerExtras({ tripId, travelerId }: { tripId: string; travelerId: string }) {
  const addons = useAddons(tripId);
  const bookings = useBookings(tripId);
  const qc = useQueryClient();
  const pay = useQuery({ queryKey: ["payinfo", tripId], queryFn: async () => (await must(supabase.rpc("trip_payment_info", { _trip: tripId })))?.[0] ?? null });
  const book = async (addonId: string, method: string) => {
    const { error } = await supabase.from("addon_bookings").insert({ trip_id: tripId, addon_id: addonId, traveler_id: travelerId, method });
    if (error) { toast.error(error.message); return; }
    toast.success("Booked — pay using the details below");
    qc.invalidateQueries({ queryKey: ["bookings", tripId] });
  };
  return (
    <div className="space-y-4">
      {addons.data?.map((a) => {
        const mine = bookings.data?.find((b) => b.addon_id === a.id && b.traveler_id === travelerId);
        const closed = a.cutoff ? new Date(a.cutoff) < new Date() : false;
        return (
          <Card key={a.id} className="space-y-2 p-4 shadow-card">
            <h3 className="font-bold">{a.title} · {money(a.price)}</h3>
            <p className="text-sm text-muted-foreground">{a.description}</p>
            {mine ? <Badge>{mine.status === "paid" ? "Paid" : `Booked · pay by ${mine.method}`}</Badge>
              : closed ? <Badge variant="outline">Booking closed</Badge>
              : <div className="flex flex-wrap gap-2">{a.methods.map((m) => <Button key={m} size="sm" variant="outline" onClick={() => book(a.id, m)}>Book · pay by {m}</Button>)}</div>}
          </Card>
        );
      })}
      {addons.data?.length === 0 && <p className="text-muted-foreground">No extras offered yet.</p>}
      {pay.data && (
        <Card className="space-y-1 bg-muted/50 p-4 text-sm">
          <p className="font-bold">How to pay {pay.data.company_name}</p>
          {pay.data.payment_link && <p>Online: <a className="text-primary underline" href={pay.data.payment_link} target="_blank" rel="noreferrer">{pay.data.payment_link}</a></p>}
          {pay.data.bank_details && <p className="whitespace-pre-wrap">Bank: {pay.data.bank_details}</p>}
          {pay.data.cash_note && <p>Cash: {pay.data.cash_note}</p>}
        </Card>
      )}
    </div>
  );
}

function MyDetails({ traveler }: { traveler: { id: string; trip_id: string; name: string; phone: string; emergency: string; dietary: string } }) {
  const [f, setF] = useState({ name: traveler.name, phone: traveler.phone, emergency: traveler.emergency, dietary: traveler.dietary });
  const qc = useQueryClient();
  const save = async () => {
    const { error } = await supabase.from("trip_travelers").update(f).eq("id", traveler.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Details saved");
    qc.invalidateQueries({ queryKey: ["travelers", traveler.trip_id] });
  };
  return (
    <Card className="grid gap-3 p-4 sm:grid-cols-2">
      <div><Label>Name</Label><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
      <div><Label>Phone</Label><Input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></div>
      <div><Label>Emergency contact</Label><Input value={f.emergency} onChange={(e) => setF({ ...f, emergency: e.target.value })} /></div>
      <div><Label>Dietary needs</Label><Input value={f.dietary} onChange={(e) => setF({ ...f, dietary: e.target.value })} /></div>
      <Button className="sm:col-span-2" onClick={save}>Save</Button>
    </Card>
  );
}

/* ---------- tickets ---------- */
type Ticket = { id: string; traveler_id: string; title: string; details: string; valid_on: string | null; code: string; status: string };
function TicketCard({ t, name, onStatus }: { t: Ticket; name?: string | undefined; onStatus?: (s: string) => void }) {
  return (
    <Card className="flex gap-4 p-4 shadow-card">
      <div className="rounded-md bg-card p-2"><QRCodeSVG value={`WSTKT:${t.code}`} size={112} /></div>
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-center gap-2"><p className="font-bold">{t.title}</p><Badge variant={t.status === "valid" ? "default" : "secondary"}>{t.status}</Badge></div>
        {name && <p className="text-sm">{name}</p>}
        {t.valid_on && <p className="text-sm text-muted-foreground">Valid {t.valid_on}</p>}
        {t.details && <p className="text-sm text-muted-foreground">{t.details}</p>}
        <p className="font-mono text-xs text-muted-foreground">{t.code}</p>
        {onStatus && <div className="flex gap-1 pt-1">{["valid", "used", "void"].filter((x) => x !== t.status).map((x) => <Button key={x} size="sm" variant="outline" onClick={() => onStatus(x)}>Mark {x}</Button>)}</div>}
      </div>
    </Card>
  );
}
function StaffTickets({ tripId }: { tripId: string }) {
  const qc = useQueryClient();
  const travelers = useTravelers(tripId);
  const tickets = useQuery({ queryKey: ["tickets", tripId], queryFn: async () => ((await must(supabase.from("trip_tickets").select("*").eq("trip_id", tripId).order("created_at"))) ?? []) as Ticket[] });
  const [f, setF] = useState({ traveler: "all", title: "", details: "", valid_on: "" });
  const [check, setCheck] = useState("");
  const refresh = () => qc.invalidateQueries({ queryKey: ["tickets", tripId] });
  const issue = async (e: React.FormEvent) => {
    e.preventDefault();
    const ids = f.traveler === "all" ? (travelers.data ?? []).map((t) => t.id) : [f.traveler];
    if (!ids.length) { toast.error("Add travelers first"); return; }
    const { error } = await supabase.from("trip_tickets").insert(ids.map((id) => ({ trip_id: tripId, traveler_id: id, title: f.title, details: f.details, valid_on: f.valid_on || null })));
    if (error) { toast.error(error.message); return; }
    toast.success(`Issued ${ids.length} ticket(s)`); setF({ ...f, title: "", details: "" }); refresh();
  };
  const setStatus = async (id: string, status: string) => { const { error } = await supabase.from("trip_tickets").update({ status }).eq("id", id); if (error) toast.error(error.message); refresh(); };
  const name = (id: string) => travelers.data?.find((t) => t.id === id)?.name;
  const code = check.trim().replace(/^WSTKT:/, "");
  const found = code ? tickets.data?.find((t) => t.code === code) : undefined;
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
      <div className="space-y-3">
        {tickets.data?.map((t) => <TicketCard key={t.id} t={t} name={name(t.traveler_id)} onStatus={(s) => setStatus(t.id, s)} />)}
        {tickets.data?.length === 0 && <p className="text-muted-foreground">No tickets issued yet.</p>}
      </div>
      <div className="space-y-4">
        <Card className="p-4 shadow-card"><form onSubmit={issue} className="space-y-3">
          <h3 className="font-bold">Issue ticket</h3>
          <div><Label>Traveler</Label><Select value={f.traveler} onValueChange={(v) => setF({ ...f, traveler: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All travelers</SelectItem>{travelers.data?.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent></Select></div>
          <div><Label>Title</Label><Input required placeholder="e.g. Museum entry, Train seat 14B" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></div>
          <div><Label>Valid on</Label><Input type="date" value={f.valid_on} onChange={(e) => setF({ ...f, valid_on: e.target.value })} /></div>
          <div><Label>Details</Label><Textarea value={f.details} onChange={(e) => setF({ ...f, details: e.target.value })} /></div>
          <Button className="w-full">Issue</Button>
        </form></Card>
        <Card className="space-y-2 p-4 shadow-card">
          <h3 className="font-bold">Check a ticket</h3>
          <QrScanner onScan={setCheck} />
          <Input placeholder="…or paste a code" value={check} onChange={(e) => setCheck(e.target.value)} />
          {code && (found ? <div className="text-sm"><Badge variant={found.status === "valid" ? "default" : "destructive"}>{found.status}</Badge> {found.title} · {name(found.traveler_id)}{found.status === "valid" && <Button size="sm" className="ml-2" onClick={() => setStatus(found.id, "used")}>Check in</Button>}</div> : <p className="text-sm text-destructive">Not a ticket for this trip.</p>)}
        </Card>
      </div>
    </div>
  );
}
function MyTickets({ travelerId }: { travelerId: string }) {
  const q = useQuery({ queryKey: ["mytickets", travelerId], queryFn: async () => ((await must(supabase.from("trip_tickets").select("*").eq("traveler_id", travelerId).order("valid_on"))) ?? []) as Ticket[] });
  const [scanned, setScanned] = useState("");
  const code = scanned.trim().replace(/^WSTKT:/, "");
  const hit = code ? q.data?.find((t) => t.code === code) : undefined;
  return (
    <div className="space-y-4">
      <Card className="space-y-2 p-4 shadow-card">
        <h3 className="font-bold">Scan a ticket</h3>
        <QrScanner onScan={setScanned} />
        {code && (hit ? <TicketCard t={hit} /> : <p className="text-sm text-destructive">This code isn't one of your tickets.</p>)}
      </Card>
      <div className="grid gap-3 md:grid-cols-2">{q.data?.map((t) => <TicketCard key={t.id} t={t} />)}{q.data?.length === 0 && <p className="text-muted-foreground">No tickets yet.</p>}</div>
    </div>
  );
}
