import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  AlertTriangle, CalendarDays, Check, ExternalLink, MapPin, Megaphone, MessageCircle, Plus, Send,
  Siren, Ticket as TicketIcon, Users, Utensils, Wallet, Sparkles, HandCoins,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useApp, memberName, money, type Meal, type PayMethod, type Expense } from "@/lib/store";
import { computeSplits, netBalances, simplifyDebts } from "@/lib/splitwise";
import { Avatar, QRCode, addonImages, mapsUrl, useHydratedStore } from "@/components/ws/shared";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/traveler")({
  head: () => ({
    meta: [
      { title: "Traveler App — WanderSync" },
      { name: "description", content: "Your trip in your pocket: schedule, tickets, extras, shared expenses and one-tap SOS." },
      { property: "og:title", content: "Traveler App — WanderSync" },
      { property: "og:description", content: "Your trip in your pocket: schedule, tickets, extras, shared expenses and one-tap SOS." },
    ],
  }),
  component: Traveler,
});

type Tab = "trip" | "tickets" | "extras" | "money" | "people";
const TABS: { id: Tab; label: string; Icon: typeof CalendarDays }[] = [
  { id: "trip", label: "Trip", Icon: CalendarDays },
  { id: "tickets", label: "Tickets", Icon: TicketIcon },
  { id: "extras", label: "Extras", Icon: Sparkles },
  { id: "money", label: "Split", Icon: Wallet },
  { id: "people", label: "Chat", Icon: MessageCircle },
];

function Traveler() {
  const ready = useHydratedStore();
  const [tab, setTab] = useState<Tab>("trip");
  const s = useApp();
  if (!ready) return <div className="p-10 text-center text-muted-foreground">Loading trip…</div>;
  const me = s.members.find((m) => m.id === s.currentTravelerId)!;
  const going = s.members.filter((m) => m.invite === "accepted");

  return (
    <main className="pb-tabbar mx-auto max-w-md">
      <div className="latitudes bg-lagoon-deep px-5 pb-7 pt-4 text-navy-foreground">
        <div className="flex items-center justify-between gap-2">
          <Select value={s.currentTravelerId} onValueChange={(v) => s.set("currentTravelerId", v)}>
            <SelectTrigger className="h-8 w-auto gap-2 border-navy-foreground/20 bg-navy-foreground/10 text-xs"><span className="opacity-70">Viewing as</span><SelectValue /></SelectTrigger>
            <SelectContent>{going.map((m) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}</SelectContent>
          </Select>
          <SosButton memberId={me.id} />
        </div>
        <p className="mt-4 text-sm opacity-80">Hi {me.name.split(" ")[0]} 👋</p>
        <h1 className="text-2xl font-extrabold tracking-tight">{s.trip.title}</h1>
        <p className="flex items-center gap-1 text-sm opacity-80"><MapPin className="h-3.5 w-3.5" /> {s.trip.destination} · Nov 12–16</p>
      </div>
      <div className="px-4 pt-4">
        {tab === "trip" && <TripView />}
        {tab === "tickets" && <TicketsView meId={me.id} />}
        {tab === "extras" && <ExtrasView meId={me.id} />}
        {tab === "money" && <MoneyView meId={me.id} />}
        {tab === "people" && <PeopleView meId={me.id} />}
      </div>
      <nav aria-label="Trip sections" className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t bg-card/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-md justify-around py-2">
          {TABS.map(({ id, label, Icon }) => (
            <button key={id} onClick={() => setTab(id)} className={cn("press flex flex-1 flex-col items-center gap-1 py-1.5 text-[11px] font-semibold transition-colors", tab === id ? "text-primary" : "text-muted-foreground")} aria-current={tab === id ? "page" : undefined}>
              <Icon className="h-5 w-5" />{label}
            </button>
          ))}
        </div>
      </nav>
    </main>
  );
}

function SosButton({ memberId }: { memberId: string }) {
  const sendSos = useApp((s) => s.sendSos);
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState("");
  const [target, setTarget] = useState<"organizer" | "group">("organizer");
  const [busy, setBusy] = useState(false);
  const fire = () => {
    setBusy(true);
    let sent = false;
    const done = (lat: number, lng: number, real: boolean) => {
      if (sent) return;
      sent = true;
      sendSos({ memberId, lat, lng, message: msg, target });
      setBusy(false); setOpen(false); setMsg("");
      toast.error("SOS sent", { description: `${real ? "Live" : "Approximate"} location shared with ${target === "organizer" ? "the organizer" : "your group"}.` });
    };
    const fallback = () => done(25.1972 + Math.random() * 0.01, 55.2744 + Math.random() * 0.01, false);
    if (!navigator.geolocation) return fallback();
    setTimeout(fallback, 6000);
    navigator.geolocation.getCurrentPosition((p) => done(p.coords.latitude, p.coords.longitude, true), fallback, { timeout: 5000 });
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" size="sm" className="rounded-full font-extrabold sos-pulse"><Siren className="h-4 w-4" /> SOS</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle className="flex items-center gap-2 text-destructive"><Siren className="h-5 w-5" /> Send emergency alert?</DialogTitle></DialogHeader>
        <p className="text-sm text-muted-foreground">Your current GPS location, name and phone will be shared immediately.</p>
        <RadioGroup value={target} onValueChange={(v) => setTarget(v as typeof target)} className="grid grid-cols-2 gap-2">
          {(["organizer", "group"] as const).map((t) => (
            <Label key={t} className={cn("flex cursor-pointer items-center gap-2 rounded-lg border p-3", target === t && "border-destructive")}><RadioGroupItem value={t} />{t === "organizer" ? "Organizer / admin" : "My peer group"}</Label>
          ))}
        </RadioGroup>
        <Textarea placeholder="Optional: what's happening?" value={msg} onChange={(e) => setMsg(e.target.value)} />
        <DialogFooter><Button variant="destructive" className="w-full" disabled={busy} onClick={fire}>{busy ? "Getting location…" : "Send SOS now"}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const mealVariant = (m: Meal) => (m.includes("Self-pay") ? ("muted" as const) : ("sunset" as const));

function TripView() {
  const { days, itinerary, messages } = useApp();
  const [day, setDay] = useState(days[0]?.day ?? 1);
  const latest = messages.filter((m) => m.channel === "broadcast").at(-1);
  return (
    <div className="space-y-4">
      {latest && <Card className="flex gap-3 border-sunset/40 bg-accent p-3 text-sm text-accent-foreground"><Megaphone className="h-5 w-5 shrink-0" /><p>{latest.text}</p></Card>}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {days.map((d) => (
          <button key={d.day} onClick={() => setDay(d.day)} className={cn("shrink-0 rounded-full px-4 py-1.5 text-sm font-semibold", day === d.day ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground shadow-card")}>Day {d.day}</button>
        ))}
      </div>
      <h2 className="text-lg font-extrabold">{days.find((d) => d.day === day)?.title}</h2>
      {itinerary.filter((i) => i.day === day).map((i) => (
        <Card key={i.id} className="p-4 shadow-card">
          <div className="flex gap-3">
            <span className="h-fit rounded-lg bg-secondary px-2 py-1 text-sm font-bold text-primary">{i.time}</span>
            <div className="min-w-0 flex-1">
              <p className="font-bold">{i.title}</p>
              <a href={mapsUrl(i.location)} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-sm text-muted-foreground"><MapPin className="h-3.5 w-3.5" /> {i.location}</a>
              <div className="mt-2 flex flex-wrap gap-1.5">{i.meals.map((m) => <Badge key={m} variant={mealVariant(m)}><Utensils className="mr-1 h-3 w-3" />{m}</Badge>)}</div>
              {i.notice && <p className="mt-2 flex gap-2 rounded-lg bg-warning/15 p-2 text-xs"><AlertTriangle className="h-4 w-4 shrink-0" />{i.notice}</p>}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

function TicketsView({ meId }: { meId: string }) {
  const tickets = useApp((s) => s.tickets).filter((t) => t.assignedTo === meId);
  const name = useApp((s) => memberName(meId, s.members));
  if (!tickets.length) return <Card className="p-8 text-center text-sm text-muted-foreground">No tickets allocated to you yet.</Card>;
  return (
    <div className="space-y-4">
      {tickets.map((t) => (
        <Card key={t.id} className="overflow-hidden shadow-card">
          <div className="flex items-center justify-between bg-gradient-ocean px-4 py-3 text-navy-foreground">
            <span className="text-xs font-bold uppercase tracking-widest opacity-80">{t.type}</span>
            <span className="text-xs opacity-80">{t.date}</span>
          </div>
          <div className="space-y-1 p-4">
            <p className="text-lg font-extrabold">{t.title}</p>
            <p className="text-sm text-muted-foreground">{name} · {t.seat}</p>
          </div>
          <div className="relative border-t-2 border-dashed">
            <span className="absolute -left-3 -top-3 h-6 w-6 rounded-full bg-background" />
            <span className="absolute -right-3 -top-3 h-6 w-6 rounded-full bg-background" />
          </div>
          <div className="flex flex-col items-center gap-2 p-5">
            <QRCode value={t.qr} size={200} />
            <p className="font-mono text-xs tracking-widest text-muted-foreground">{t.qr}</p>
          </div>
        </Card>
      ))}
    </div>
  );
}

const methodLabel: Record<PayMethod, string> = { cash: "Cash to guide", link: "Card / PayPal", bank: "Bank transfer" };

function ExtrasView({ meId }: { meId: string }) {
  const { addons, bookings, book } = useApp();
  const [picking, setPicking] = useState<string | null>(null);
  const [method, setMethod] = useState<PayMethod>("cash");
  const a = addons.find((x) => x.id === picking);
  return (
    <div className="space-y-4">
      {addons.map((x) => {
        const mine = bookings.find((b) => b.addonId === x.id && b.memberId === meId);
        const closed = new Date(x.cutoff) < new Date();
        return (
          <Card key={x.id} className="overflow-hidden shadow-card">
            <img src={addonImages[x.image] ?? addonImages["default"]} alt={x.title} loading="lazy" width={1024} height={656} className="h-36 w-full object-cover" />
            <div className="space-y-2 p-4">
              <div className="flex items-start justify-between"><p className="font-bold">{x.title}</p><p className="text-lg font-extrabold text-sunset">{money(x.price)}</p></div>
              <p className="text-sm text-muted-foreground">{x.description}</p>
              <p className="text-xs text-muted-foreground">Book by {new Date(x.cutoff).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}</p>
              {mine ? (
                <div className="flex items-center justify-between rounded-lg bg-secondary p-2 text-sm">
                  <span>{methodLabel[mine.method]}</span>
                  <Badge variant={mine.status === "paid" ? "success" : "warning"}>{mine.status === "paid" ? "Paid" : "Pending confirmation"}</Badge>
                </div>
              ) : (
                <Button className="w-full bg-gradient-sunset text-sunset-foreground shadow-glow" disabled={closed} onClick={() => { setPicking(x.id); setMethod(x.methods[0] ?? "cash"); }}>{closed ? "Booking closed" : "Opt-in / Book"}</Button>
              )}
            </div>
          </Card>
        );
      })}
      <Dialog open={!!a} onOpenChange={(o) => !o && setPicking(null)}>
        <DialogContent>
          {a && (<>
            <DialogHeader><DialogTitle>Book {a.title}</DialogTitle></DialogHeader>
            <RadioGroup value={method} onValueChange={(v) => setMethod(v as PayMethod)} className="space-y-2">
              {a.methods.map((m) => (
                <Label key={m} className={cn("flex cursor-pointer items-center gap-3 rounded-lg border p-3", method === m && "border-primary")}><RadioGroupItem value={m} />{methodLabel[m]}</Label>
              ))}
            </RadioGroup>
            {method === "link" && a.paymentLink && <a href={a.paymentLink} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm font-semibold text-primary"><ExternalLink className="h-4 w-4" /> Open checkout ({money(a.price)})</a>}
            {method === "bank" && <p className="rounded-lg bg-secondary p-3 text-xs">{a.bankNotes}</p>}
            {method === "cash" && <p className="text-sm text-muted-foreground">Hand {money(a.price)} to your guide. They'll mark it as collected.</p>}
            <DialogFooter><Button className="w-full" onClick={() => { book(a.id, meId, method); setPicking(null); toast.success("Booked! Awaiting payment confirmation."); }}><Check className="h-4 w-4" /> Confirm booking</Button></DialogFooter>
          </>)}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MoneyView({ meId }: { meId: string }) {
  const { groups, expenses, settlements, members, addGroup, addExpense, settle } = useApp();
  const mine = groups.filter((g) => g.members.includes(meId));
  const [gid, setGid] = useState(mine[0]?.id ?? "");
  const group = mine.find((g) => g.id === gid) ?? mine[0];
  const gExp = expenses.filter((e) => e.groupId === group?.id);
  const transfers = useMemo(() => simplifyDebts(netBalances(gExp, settlements.filter((x) => x.groupId === group?.id))), [gExp, settlements, group]);
  const n = (id: string) => (id === meId ? "You" : memberName(id, members).split(" ")[0]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {mine.map((g) => (
          <button key={g.id} onClick={() => setGid(g.id)} className={cn("shrink-0 rounded-full px-4 py-1.5 text-sm font-semibold", group?.id === g.id ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground shadow-card")}>{g.name}</button>
        ))}
        <NewGroupDialog meId={meId} onCreate={(name, ids) => { addGroup(name, ids); toast.success(`"${name}" created`); }} />
      </div>
      {group ? (<>
        <Card className="p-4 shadow-card">
          <h3 className="mb-2 flex items-center gap-2 font-bold"><HandCoins className="h-4 w-4 text-sunset" /> Balances</h3>
          {transfers.length === 0 ? <p className="text-sm text-muted-foreground">Everyone is settled up 🎉</p> : (
            <ul className="space-y-2">{transfers.map((t, i) => (
              <li key={i} className="flex items-center justify-between gap-2 text-sm">
                <span><b>{n(t.from)}</b> {t.from === meId ? "owe" : "owes"} <b>{n(t.to)}</b> <span className="font-extrabold text-sunset">{money(t.amount)}</span></span>
                {(t.from === meId || t.to === meId) && <Button size="sm" variant="outline" onClick={() => { settle(group.id, t.from, t.to, t.amount); toast.success("Settlement recorded"); }}>Settle up</Button>}
              </li>
            ))}</ul>
          )}
          <div className="mt-3 flex flex-wrap gap-1.5">{group.members.filter((id) => !transfers.some((t) => t.from === id || t.to === id)).map((id) => <Badge key={id} variant="success">{n(id)} settled</Badge>)}</div>
        </Card>
        <div className="flex items-center justify-between"><h3 className="font-bold">Expenses</h3><AddExpenseDialog groupId={group.id} memberIds={group.members} meId={meId} onAdd={(e) => { addExpense(e); toast.success("Expense added"); }} /></div>
        {gExp.length === 0 && <p className="text-sm text-muted-foreground">No expenses yet.</p>}
        {[...gExp].reverse().map((e) => (
          <Card key={e.id} className="flex items-center gap-3 p-3 shadow-card">
            <Avatar name={memberName(e.paidBy, members)} />
            <div className="min-w-0 flex-1"><p className="font-semibold">{e.description}</p><p className="text-xs text-muted-foreground">{n(e.paidBy)} paid · split {e.splitType}</p></div>
            <p className="font-extrabold">{money(e.amount)}</p>
          </Card>
        ))}
      </>) : <Card className="p-8 text-center text-sm text-muted-foreground">Create a group with friends to start splitting bills.</Card>}
    </div>
  );
}

function NewGroupDialog({ meId, onCreate }: { meId: string; onCreate: (name: string, ids: string[]) => void }) {
  const members = useApp((s) => s.members).filter((m) => m.invite === "accepted" && m.id !== meId);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [ids, setIds] = useState<string[]>([]);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size="sm" variant="outline" className="shrink-0 rounded-full"><Plus className="h-4 w-4" /> Group</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>New sub-group</DialogTitle></DialogHeader>
        <Input placeholder="e.g. Hiking Buddies" value={name} onChange={(e) => setName(e.target.value)} />
        <div className="space-y-2">{members.map((m) => (
          <label key={m.id} className="flex items-center gap-2 text-sm"><Checkbox checked={ids.includes(m.id)} onCheckedChange={(v) => setIds(v ? [...ids, m.id] : ids.filter((x) => x !== m.id))} />{m.name}</label>
        ))}</div>
        <DialogFooter><Button className="w-full" disabled={!name || !ids.length} onClick={() => { onCreate(name, [meId, ...ids]); setOpen(false); setName(""); setIds([]); }}>Create group</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AddExpenseDialog({ groupId, memberIds, meId, onAdd }: { groupId: string; memberIds: string[]; meId: string; onAdd: (e: Omit<Expense, "id" | "createdAt">) => void }) {
  const members = useApp((s) => s.members);
  const [open, setOpen] = useState(false);
  const [desc, setDesc] = useState("");
  const [amount, setAmount] = useState("");
  const [paidBy, setPaidBy] = useState(meId);
  const [type, setType] = useState<Expense["splitType"]>("equal");
  const [vals, setVals] = useState<Record<string, number>>({});
  const amt = Number(amount) || 0;
  const sum = memberIds.reduce((t, id) => t + (vals[id] ?? 0), 0);
  const valid = desc && amt > 0 && (type === "equal" || (type === "exact" ? Math.abs(sum - amt) < 0.01 : Math.abs(sum - 100) < 0.01));
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4" /> Add expense</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Add expense</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Description</Label><Input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Dinner at the souk" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Amount (USD)</Label><Input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} /></div>
            <div><Label>Paid by</Label>
              <Select value={paidBy} onValueChange={setPaidBy}><SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{memberIds.map((id) => <SelectItem key={id} value={id}>{memberName(id, members)}</SelectItem>)}</SelectContent></Select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-1 rounded-lg bg-muted p-1">
            {(["equal", "exact", "percent"] as const).map((t) => (
              <button key={t} type="button" onClick={() => setType(t)} className={cn("rounded-md py-1.5 text-sm font-semibold capitalize", type === t ? "bg-card shadow-card" : "text-muted-foreground")}>{t === "equal" ? "Equally" : t === "exact" ? "Exact" : "Percent"}</button>
            ))}
          </div>
          {type !== "equal" && (
            <div className="space-y-2">
              {memberIds.map((id) => (
                <div key={id} className="flex items-center gap-2"><span className="flex-1 text-sm">{memberName(id, members)}</span>
                  <Input className="w-28" type="number" step="0.01" value={vals[id] ?? ""} onChange={(e) => setVals({ ...vals, [id]: Number(e.target.value) })} placeholder={type === "percent" ? "%" : "$"} /></div>
              ))}
              <p className={cn("text-xs", valid ? "text-success" : "text-destructive")}>Total: {type === "percent" ? `${sum}% of 100%` : `${money(sum)} of ${money(amt)}`}</p>
            </div>
          )}
        </div>
        <DialogFooter><Button className="w-full" disabled={!valid} onClick={() => { onAdd({ groupId, paidBy, amount: amt, description: desc, splitType: type, splits: computeSplits(amt, memberIds, type, vals) }); setOpen(false); setDesc(""); setAmount(""); setVals({}); }}>Save expense</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PeopleView({ meId }: { meId: string }) {
  const { members, privacy, messages, groups, sendMsg } = useApp();
  const myGroups = groups.filter((g) => g.members.includes(meId));
  const [channel, setChannel] = useState("broadcast");
  const [text, setText] = useState("");
  const list = messages.filter((m) => m.channel === channel);
  const canPost = channel !== "broadcast" && privacy.allowMessaging;
  return (
    <div className="space-y-5">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {[{ id: "broadcast", name: "📣 Organizer" }, ...myGroups].map((c) => (
          <button key={c.id} onClick={() => setChannel(c.id)} className={cn("shrink-0 rounded-full px-4 py-1.5 text-sm font-semibold", channel === c.id ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground shadow-card")}>{c.name}</button>
        ))}
      </div>
      <Card className="space-y-3 p-4 shadow-card">
        {list.length === 0 && <p className="text-sm text-muted-foreground">No messages yet.</p>}
        {list.map((m) => (
          <div key={m.id} className={cn("max-w-[85%] rounded-2xl px-3 py-2 text-sm", m.from === meId ? "ml-auto bg-primary text-primary-foreground" : "bg-secondary")}>
            {m.from !== meId && <p className="text-xs font-bold opacity-70">{memberName(m.from, members)}</p>}
            {m.text}
          </div>
        ))}
        {canPost ? (
          <form className="flex gap-2 pt-2" onSubmit={(e) => { e.preventDefault(); if (!text.trim()) return; sendMsg(channel, meId, text.trim()); setText(""); }}>
            <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Message your group…" />
            <Button type="submit" size="icon"><Send className="h-4 w-4" /></Button>
          </form>
        ) : (
          <p className="pt-2 text-xs text-muted-foreground">{channel === "broadcast" ? "Announcements from your tour organizer." : "The organizer has turned off traveler messaging."}</p>
        )}
      </Card>
      <div>
        <h3 className="mb-2 flex items-center gap-2 font-bold"><Users className="h-4 w-4" /> Group members</h3>
        {!privacy.showRoster ? (
          <Card className="p-6 text-center text-sm text-muted-foreground">The organizer has kept the roster private.</Card>
        ) : (
          <div className="space-y-2">{members.filter((m) => m.invite === "accepted").map((m) => (
            <Card key={m.id} className="flex items-center gap-3 p-3 shadow-card">
              <Avatar name={m.name} />
              <div className="min-w-0"><p className="font-semibold">{m.name}{m.id === meId && " (you)"}</p>
                {!privacy.nameOnly && <p className="truncate text-xs text-muted-foreground">{m.email} · {m.phone}</p>}</div>
            </Card>
          ))}</div>
        )}
      </div>
    </div>
  );
}
