import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import {
  AlertTriangle, CalendarDays, CheckCircle2, DollarSign, MapPin, Megaphone, Plus, Send, ShieldCheck,
  Siren, Ticket as TicketIcon, Trash2, Users, Utensils, Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useApp, memberName, money, type Meal, type PayMethod, type TicketType } from "@/lib/store";
import { Avatar, QRCode, addonImages, cover, mapsUrl, useHydratedStore } from "@/components/ws/shared";

export const Route = createFileRoute("/demo")({
  head: () => ({
    meta: [
      { title: "Demo Organizer Dashboard — WanderSync" },
      { name: "description", content: "Manage your group trip: travelers, privacy, itinerary, tickets, add-ons and SOS alerts." },
      { property: "og:title", content: "Demo Organizer Dashboard — WanderSync" },
      { property: "og:description", content: "Manage your group trip: travelers, privacy, itinerary, tickets, add-ons and SOS alerts." },
    ],
  }),
  component: Organizer,
});

function Organizer() {
  const ready = useHydratedStore();
  const s = useApp();
  if (!ready) return <div className="p-10 text-center text-muted-foreground">Loading trip…</div>;
  const active = s.sos.filter((x) => x.status === "active");
  const revenue = s.bookings.filter((b) => b.status === "paid").reduce((t, b) => t + (s.addons.find((a) => a.id === b.addonId)?.price ?? 0), 0);
  const accepted = s.members.filter((m) => m.invite === "accepted").length;

  return (
    <main className="mx-auto max-w-7xl space-y-6 px-4 py-6">
      {active.map((a) => {
        const m = s.members.find((x) => x.id === a.memberId);
        return (
          <div key={a.id} className="flex flex-wrap items-center gap-4 rounded-2xl bg-destructive p-4 text-destructive-foreground sos-pulse">
            <Siren className="h-8 w-8 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="font-extrabold">SOS from {m?.name} · {new Date(a.at).toLocaleTimeString()}</p>
              <p className="text-sm opacity-90">{a.message || "Emergency assistance requested"} · {m?.phone} · {a.lat.toFixed(5)}, {a.lng.toFixed(5)}</p>
            </div>
            <Button variant="secondary" size="sm" asChild>
              <a href={`https://www.google.com/maps?q=${a.lat},${a.lng}`} target="_blank" rel="noreferrer"><MapPin className="h-4 w-4" /> Open in Google Maps</a>
            </Button>
            <Button variant="outline" size="sm" className="border-destructive-foreground/40 bg-transparent" onClick={() => { s.resolveSos(a.id); toast.success("Alert marked resolved"); }}>
              Resolve
            </Button>
          </div>
        );
      })}

      <section className="relative overflow-hidden rounded-3xl shadow-card">
        <img src={cover} alt="Desert dunes at sunset" width={1600} height={704} className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-navy/95 via-navy/50 to-navy/10" />
        <div className="relative flex min-h-56 flex-wrap items-end justify-between gap-4 p-5 pt-20 text-navy-foreground sm:p-6 sm:pt-28 md:min-h-64">
          <div>
            <Badge variant="sunset" className="mb-2">Organizer</Badge>
            <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">{s.trip.title}</h1>
            <p className="mt-1 flex items-center gap-2 text-sm opacity-90"><MapPin className="h-4 w-4" /> {s.trip.destination} · <CalendarDays className="h-4 w-4" /> Nov 12 – 16, 2026</p>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <Stat label="Travelers" value={`${accepted}/${s.members.length}`} />
            <Stat label="Add-on revenue" value={money(revenue)} />
            <Stat label="Active SOS" value={String(active.length)} alert={active.length > 0} />
          </div>
        </div>
      </section>

      <Tabs defaultValue="travelers">
        <TabsList>
          <TabsTrigger value="travelers"><Users className="h-4 w-4" /> Travelers</TabsTrigger>
          <TabsTrigger value="itinerary"><CalendarDays className="h-4 w-4" /> Itinerary</TabsTrigger>
          <TabsTrigger value="tickets"><TicketIcon className="h-4 w-4" /> Tickets</TabsTrigger>
          <TabsTrigger value="addons"><Sparkles className="h-4 w-4" /> Add-ons</TabsTrigger>
          <TabsTrigger value="safety"><ShieldCheck className="h-4 w-4" /> Safety</TabsTrigger>
          <TabsTrigger value="broadcast"><Megaphone className="h-4 w-4" /> Broadcast</TabsTrigger>
        </TabsList>
        <TabsContent value="travelers" className="mt-4"><TravelersTab /></TabsContent>
        <TabsContent value="itinerary" className="mt-4"><ItineraryTab /></TabsContent>
        <TabsContent value="tickets" className="mt-4"><TicketsTab /></TabsContent>
        <TabsContent value="addons" className="mt-4"><AddonsTab /></TabsContent>
        <TabsContent value="safety" className="mt-4"><SafetyTab /></TabsContent>
        <TabsContent value="broadcast" className="mt-4"><BroadcastTab /></TabsContent>
      </Tabs>
    </main>
  );
}

function Stat({ label, value, alert }: { label: string; value: string; alert?: boolean }) {
  return (
    <div className={`rounded-xl px-4 py-2 backdrop-blur ${alert ? "bg-destructive" : "bg-navy-foreground/15"}`}>
      <p className="text-xl font-extrabold">{value}</p>
      <p className="text-[11px] uppercase tracking-wider opacity-80">{label}</p>
    </div>
  );
}

const inviteVariant = { accepted: "success", invited: "warning", declined: "muted" } as const;
const payVariant = { paid: "success", partial: "warning", pending: "muted" } as const;

function TravelersTab() {
  const { members, privacy, setPrivacy, invite } = useApp();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [open, setOpen] = useState(false);
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <Card className="overflow-hidden shadow-card">
        <div className="flex items-center justify-between border-b p-4">
          <h2 className="font-bold">Traveler roster</h2>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4" /> Invite traveler</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Invite by email</DialogTitle></DialogHeader>
              <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); if (!name || !email) return; invite(name, email); toast.success(`Invitation sent to ${email}`); setName(""); setEmail(""); setOpen(false); }}>
                <div><Label>Full name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
                <div><Label>Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
                <Button type="submit" className="w-full"><Send className="h-4 w-4" /> Send invite</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader><TableRow><TableHead>Traveler</TableHead><TableHead>Phone</TableHead><TableHead>Emergency contact</TableHead><TableHead>Dietary</TableHead><TableHead>Invite</TableHead><TableHead>Payment</TableHead></TableRow></TableHeader>
            <TableBody>
              {members.map((m) => (
                <TableRow key={m.id}>
                  <TableCell><div className="flex items-center gap-3"><Avatar name={m.name} /><div><p className="font-semibold">{m.name}</p><p className="text-xs text-muted-foreground">{m.email}</p></div></div></TableCell>
                  <TableCell className="whitespace-nowrap text-sm">{m.phone}</TableCell>
                  <TableCell className="text-sm">{m.emergency}</TableCell>
                  <TableCell className="text-sm">{m.dietary}</TableCell>
                  <TableCell><Badge variant={inviteVariant[m.invite]} className="capitalize">{m.invite}</Badge></TableCell>
                  <TableCell><Badge variant={payVariant[m.payment]} className="capitalize">{m.payment}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
      <Card className="h-fit space-y-5 p-5 shadow-card">
        <div><h2 className="font-bold">Privacy & visibility</h2><p className="text-sm text-muted-foreground">Controls what travelers see about each other.</p></div>
        {([
          ["showRoster", "Show attendee roster to other travelers"],
          ["nameOnly", "Show full name only (hide phone & email)"],
          ["allowMessaging", "Allow travelers to message each other"],
        ] as const).map(([k, label]) => (
          <label key={k} className="flex items-start justify-between gap-4 text-sm font-medium">
            {label}
            <Switch checked={privacy[k]} onCheckedChange={(v) => { setPrivacy({ [k]: v }); toast(`${label}: ${v ? "On" : "Off"}`); }} />
          </label>
        ))}
      </Card>
    </div>
  );
}

const MEALS: Meal[] = ["Breakfast Included", "Lunch Included", "Lunch: Self-pay", "Dinner: Group Booking", "Dinner: Self-pay"];

function mealVariant(m: Meal) {
  return m.includes("Self-pay") ? ("muted" as const) : ("sunset" as const);
}

function ItineraryTab() {
  const { days, itinerary, addItem, removeItem } = useApp();
  const [form, setForm] = useState({ day: 1, time: "09:00", title: "", location: "", notice: "", meals: [] as Meal[] });
  const [open, setOpen] = useState(false);
  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4" /> Add activity</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New itinerary item</DialogTitle></DialogHeader>
            <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); if (!form.title) return; addItem(form); toast.success("Activity added"); setOpen(false); setForm({ ...form, title: "", location: "", notice: "", meals: [] }); }}>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Day</Label><Input type="number" min={1} value={form.day} onChange={(e) => setForm({ ...form, day: Number(e.target.value) })} /></div>
                <div><Label>Time</Label><Input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} /></div>
              </div>
              <div><Label>Activity</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
              <div><Label>Location</Label><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
              <div><Label>Notice / dress code</Label><Textarea value={form.notice} onChange={(e) => setForm({ ...form, notice: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-2">
                {MEALS.map((m) => (
                  <label key={m} className="flex items-center gap-2 text-sm"><Checkbox checked={form.meals.includes(m)} onCheckedChange={(v) => setForm({ ...form, meals: v ? [...form.meals, m] : form.meals.filter((x) => x !== m) })} />{m}</label>
                ))}
              </div>
              <Button type="submit" className="w-full">Add to itinerary</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      {days.map((d) => (
        <Card key={d.day} className="p-5 shadow-card">
          <h3 className="mb-4 flex items-center gap-3 text-lg font-extrabold"><span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-sunset text-sm text-sunset-foreground">D{d.day}</span>Day {d.day}: {d.title}</h3>
          <ol className="relative ml-4 space-y-4 border-l-2 border-dashed pl-6">
            {itinerary.filter((i) => i.day === d.day).map((i) => (
              <li key={i.id} className="group relative">
                <span className="absolute -left-[33px] top-1 h-3.5 w-3.5 rounded-full border-2 border-primary bg-card" />
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-bold text-primary">{i.time}</p>
                    <p className="font-semibold">{i.title}</p>
                    <a href={mapsUrl(i.location)} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"><MapPin className="h-3.5 w-3.5" />{i.location}</a>
                  </div>
                  <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100" onClick={() => removeItem(i.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">{i.meals.map((m) => <Badge key={m} variant={mealVariant(m)}><Utensils className="mr-1 h-3 w-3" />{m}</Badge>)}</div>
                {i.notice && <p className="mt-2 flex items-start gap-2 rounded-lg bg-warning/15 p-2 text-sm"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning-foreground dark:text-warning" />{i.notice}</p>}
              </li>
            ))}
          </ol>
        </Card>
      ))}
    </div>
  );
}

function TicketsTab() {
  const { tickets, members, assignTicket, addTicket } = useApp();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ title: "", type: "museum" as TicketType, seat: "", date: "2026-11-14", assignedTo: null as string | null });
  const going = members.filter((m) => m.invite === "accepted");
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4" /> Create ticket</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New ticket</DialogTitle></DialogHeader>
            <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); if (!f.title) return; addTicket(f); toast.success("Ticket created"); setOpen(false); }}>
              <div><Label>Title</Label><Input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="Louvre Museum Entry" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Type</Label>
                  <Select value={f.type} onValueChange={(v) => setF({ ...f, type: v as TicketType })}><SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{["flight", "museum", "train", "activity"].map((t) => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}</SelectContent></Select>
                </div>
                <div><Label>Date</Label><Input type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></div>
              </div>
              <div><Label>Seat / reference</Label><Input value={f.seat} onChange={(e) => setF({ ...f, seat: e.target.value })} /></div>
              <Button type="submit" className="w-full">Create</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {tickets.map((t) => (
          <Card key={t.id} className="flex gap-4 p-4 shadow-card">
            <QRCode value={t.qr} size={88} />
            <div className="min-w-0 flex-1 space-y-2">
              <Badge variant="secondary" className="capitalize">{t.type}</Badge>
              <p className="font-bold leading-tight">{t.title}</p>
              <p className="text-xs text-muted-foreground">{t.seat} · {t.date}</p>
              <Select value={t.assignedTo ?? "none"} onValueChange={(v) => { assignTicket(t.id, v === "none" ? null : v); toast.success(v === "none" ? "Unassigned" : `Allocated to ${memberName(v, members)}`); }}>
                <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="none">Unassigned</SelectItem>{going.map((m) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

const methodLabel: Record<PayMethod, string> = { cash: "Cash on arrival", link: "PayPal / link", bank: "Bank transfer" };

function AddonsTab() {
  const { addons, bookings, members, markPaid, addAddon } = useApp();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ title: "", description: "", price: 50, cutoff: "2026-11-13T18:00", methods: ["cash"] as PayMethod[], paymentLink: "", bankNotes: "" });
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4" /> New add-on</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New optional extra</DialogTitle></DialogHeader>
            <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); if (!f.title) return; addAddon({ ...f, image: "default" }); toast.success("Add-on published"); setOpen(false); }}>
              <div><Label>Title</Label><Input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></div>
              <div><Label>Description</Label><Textarea value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Price (USD)</Label><Input type="number" value={f.price} onChange={(e) => setF({ ...f, price: Number(e.target.value) })} /></div>
                <div><Label>Booking cutoff</Label><Input type="datetime-local" value={f.cutoff} onChange={(e) => setF({ ...f, cutoff: e.target.value })} /></div>
              </div>
              <div className="flex flex-wrap gap-3">{(Object.keys(methodLabel) as PayMethod[]).map((m) => (
                <label key={m} className="flex items-center gap-2 text-sm"><Checkbox checked={f.methods.includes(m)} onCheckedChange={(v) => setF({ ...f, methods: v ? [...f.methods, m] : f.methods.filter((x) => x !== m) })} />{methodLabel[m]}</label>
              ))}</div>
              {f.methods.includes("link") && <div><Label>PayPal / checkout URL</Label><Input value={f.paymentLink} onChange={(e) => setF({ ...f, paymentLink: e.target.value })} /></div>}
              {f.methods.includes("bank") && <div><Label>Bank transfer notes</Label><Textarea value={f.bankNotes} onChange={(e) => setF({ ...f, bankNotes: e.target.value })} /></div>}
              <Button type="submit" className="w-full">Publish</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {addons.map((a) => {
          const list = bookings.filter((b) => b.addonId === a.id);
          const rev = list.filter((b) => b.status === "paid").length * a.price;
          return (
            <Card key={a.id} className="overflow-hidden shadow-card">
              <div className="flex">
                <img src={addonImages[a.image] ?? addonImages["default"]} alt={a.title} loading="lazy" width={1024} height={656} className="h-auto w-36 object-cover" />
                <div className="flex-1 space-y-1 p-4">
                  <div className="flex items-start justify-between gap-2"><p className="font-bold">{a.title}</p><p className="font-extrabold text-primary">{money(a.price)}</p></div>
                  <p className="text-sm text-muted-foreground">{a.description}</p>
                  <div className="flex flex-wrap gap-1.5 pt-1">{a.methods.map((m) => <Badge key={m} variant="secondary">{methodLabel[m]}</Badge>)}</div>
                  <div className="flex gap-4 pt-2 text-sm"><span className="flex items-center gap-1"><Users className="h-4 w-4" />{list.length} booked</span><span className="flex items-center gap-1"><DollarSign className="h-4 w-4" />{money(rev)} collected</span></div>
                </div>
              </div>
              {list.length > 0 && (
                <ul className="divide-y border-t">
                  {list.map((b) => (
                    <li key={b.id} className="flex items-center justify-between gap-2 px-4 py-2 text-sm">
                      <span className="font-medium">{memberName(b.memberId, members)}</span>
                      <span className="text-muted-foreground">{methodLabel[b.method]}</span>
                      {b.status === "paid" ? <Badge variant="success">Paid</Badge> : (
                        <Button size="sm" variant="outline" onClick={() => { markPaid(b.id); toast.success("Payment marked collected"); }}><CheckCircle2 className="h-4 w-4" /> Mark paid</Button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function SafetyTab() {
  const { sos, members, resolveSos } = useApp();
  if (!sos.length)
    return <Card className="p-10 text-center shadow-card"><ShieldCheck className="mx-auto h-10 w-10 text-success" /><p className="mt-3 font-bold">All clear</p><p className="text-sm text-muted-foreground">No SOS alerts. Try sending one from Traveler Mode.</p></Card>;
  return (
    <div className="space-y-3">
      {sos.map((a) => {
        const m = members.find((x) => x.id === a.memberId);
        return (
          <Card key={a.id} className="flex flex-wrap items-center gap-4 p-4 shadow-card">
            <Avatar name={m?.name ?? "?"} />
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{m?.name} <span className="text-sm font-normal text-muted-foreground">· {new Date(a.at).toLocaleString()} · to {a.target}</span></p>
              <p className="text-sm text-muted-foreground">{a.message || "Emergency assistance requested"} · {m?.phone}</p>
            </div>
            <Badge variant={a.status === "active" ? "sos" : "muted"}>{a.status === "active" ? "SOS" : "Resolved"}</Badge>
            <Button size="sm" variant="outline" asChild><a href={`https://www.google.com/maps?q=${a.lat},${a.lng}`} target="_blank" rel="noreferrer"><MapPin className="h-4 w-4" /> Map</a></Button>
            {a.status === "active" && <Button size="sm" onClick={() => resolveSos(a.id)}>Resolve</Button>}
          </Card>
        );
      })}
    </div>
  );
}

function BroadcastTab() {
  const { messages, sendMsg } = useApp();
  const [text, setText] = useState("");
  const list = messages.filter((m) => m.channel === "broadcast");
  return (
    <Card className="mx-auto max-w-2xl p-5 shadow-card">
      <h2 className="mb-4 font-bold">Organizer broadcast</h2>
      <ul className="mb-4 space-y-3">{list.map((m) => (
        <li key={m.id} className="rounded-xl bg-secondary p-3 text-sm"><p>{m.text}</p><p className="mt-1 text-xs text-muted-foreground">{new Date(m.at).toLocaleString()}</p></li>
      ))}</ul>
      <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); if (!text.trim()) return; sendMsg("broadcast", "organizer", text.trim()); setText(""); toast.success("Announcement sent to all travelers"); }}>
        <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Write an announcement…" />
        <Button type="submit"><Send className="h-4 w-4" /></Button>
      </form>
    </Card>
  );
}
