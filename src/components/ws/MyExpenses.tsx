import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeftRight, BedDouble, Bus, CircleEllipsis, Lock, PiggyBank, Plus, ShoppingBag, Ticket, Trash2, Utensils, type LucideIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ReceiptButton, ReceiptInput, removeReceipt, uploadReceipt } from "@/components/ws/Receipt";
import { budgetStatus, byDay, CATEGORIES, CURRENCIES, formatMoney, totalsByCurrency, type Budget, type Category, type MyExpense } from "@/lib/my-expenses";
import { convert, isStale, rate, type Rates } from "@/lib/fx";
import { useRates } from "@/lib/fx-rates";
import { cn } from "@/lib/utils";

const ICONS: Record<Category, LucideIcon> = { food: Utensils, transport: Bus, stay: BedDouble, activities: Ticket, shopping: ShoppingBag, other: CircleEllipsis };
const label = (c: Category) => CATEGORIES.find((x) => x.id === c)!.label;
const CURRENCY_KEY = "ws:my-currency";
const HOME_KEY = "ws:home-currency";
const today = () => new Date().toISOString().slice(0, 10);
const dayLabel = (d: string) => new Date(`${d}T12:00:00`).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });

type Res = PromiseLike<{ data: unknown; error: { message: string } | null }>;
// personal_expenses / personal_budgets (migration 0016) are newer than the generated types.
type Db = {
  from(t: "personal_expenses"): {
    select: (c: string) => { eq: (c: "trip_id", v: string) => { order: (c: string, o: { ascending: boolean }) => PromiseLike<{ data: MyExpense[] | null; error: { message: string } | null }> } };
    insert: (row: Omit<MyExpense, "id"> & { trip_id: string }) => Res;
    delete: () => { eq: (c: "id", v: string) => Res };
  };
  from(t: "personal_budgets"): {
    select: (c: string) => { eq: (c: "trip_id", v: string) => { maybeSingle: () => PromiseLike<{ data: Budget | null; error: { message: string } | null }> } };
    upsert: (row: Budget & { trip_id: string; user_id: string; updated_at: string }) => Res;
    delete: () => { eq: (c: "trip_id", v: string) => { eq: (c: "user_id", v: string) => Res } };
  };
};
const db = supabase as unknown as Db;

const saved = (key: string, fallback: string) => { try { return localStorage.getItem(key) ?? fallback; } catch { return fallback; } };
const remember = (key: string, value: string) => { try { localStorage.setItem(key, value); } catch { /* not remembered */ } };

/** A remembered choice, read after mount so the server render and first client render match. */
function useSaved(key: string, fallback: string) {
  const [value, setValue] = useState<string | null>(null);
  useEffect(() => { setValue(saved(key, "") || null); }, [key]);
  return value ?? fallback;
}
const shortDate = (d: string) => new Date(`${d}T12:00:00`).toLocaleDateString(undefined, { day: "numeric", month: "short" });

/** Expenses shown in one currency where rates allow; ones the rates can't convert keep their own. */
const inCurrency = (list: MyExpense[], to: string, rates: Rates | null) =>
  rates ? list.map((e) => { const c = convert(e.amount, e.currency, to, rates); return c == null ? e : { ...e, amount: c, currency: to }; }) : list;

/** A traveler's own spending on this trip: private to them, never split or shared. */
export function MyExpenses({ tripId }: { tripId: string }) {
  const qc = useQueryClient();
  const uid = useQuery({ queryKey: ["uid"], queryFn: async () => (await supabase.auth.getUser()).data.user?.id ?? null, staleTime: Infinity });
  const list = useQuery({
    queryKey: ["my-expenses", tripId],
    queryFn: async () => {
      // RLS returns only the signed-in person's rows.
      const { data, error } = await db.from("personal_expenses").select("id,amount,currency,category,note,spent_on,receipt_path").eq("trip_id", tripId).order("spent_on", { ascending: false });
      if (error) throw new Error(error.message);
      return (data ?? []).map((e) => ({ ...e, amount: Number(e.amount) }));
    },
  });
  const budget = useQuery({
    queryKey: ["my-budget", tripId],
    queryFn: async () => {
      const { data, error } = await db.from("personal_budgets").select("amount,currency").eq("trip_id", tripId).maybeSingle();
      if (error) throw new Error(error.message);
      return data ? { ...data, amount: Number(data.amount) } : null;
    },
  });
  const refresh = () => { qc.invalidateQueries({ queryKey: ["my-expenses", tripId] }); qc.invalidateQueries({ queryKey: ["my-budget", tripId] }); };
  const items = list.data ?? [];
  const rates = useRates();
  const [home, setHomeState] = useState<string | null>(null);
  const usual = useSaved(CURRENCY_KEY, "USD");
  const savedHome = useSaved(HOME_KEY, budget.data?.currency ?? usual);
  const homeCurrency = home ?? savedHome;
  const setHome = (c: string) => { setHomeState(c); remember(HOME_KEY, c); };
  const view = inCurrency(items, homeCurrency, rates);
  const totals = totalsByCurrency(view);
  const mixed = new Set(items.map((e) => e.currency)).size > 1 || items.some((e) => e.currency !== homeCurrency);

  const remove = async (e: MyExpense) => {
    const { error } = await db.from("personal_expenses").delete().eq("id", e.id);
    if (error) { toast.error(error.message); return; }
    await removeReceipt(e.receipt_path);
    refresh();
  };

  if (list.isError) return <p className="rounded-2xl border border-destructive/40 bg-destructive/5 p-4 text-sm">My expenses didn't load: {(list.error as Error).message}</p>;

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_360px] lg:grid-rows-[auto_1fr] lg:items-start">
      {/* Phones: converter first, then expenses, then the add form. Desktop: expenses left, both cards right. */}
      <div className="lg:col-start-2 lg:row-start-1"><Converter rates={rates} home={homeCurrency} /></div>
      <div className="space-y-4 lg:col-start-1 lg:row-span-2 lg:row-start-1">
        <Card className="overflow-hidden shadow-card">
          <div className="bg-navy p-5 text-navy-foreground">
            <div className="flex items-start justify-between gap-3">
              <p className="flex items-center gap-1.5 text-sm opacity-80"><Lock className="h-3.5 w-3.5" /> Only you can see this</p>
              <Select value={homeCurrency} onValueChange={setHome}>
                <SelectTrigger aria-label="Show totals in" className="h-8 w-auto gap-1 border-navy-foreground/25 bg-navy-foreground/10 px-2.5 text-xs text-navy-foreground"><span className="opacity-70">Show in</span><SelectValue /></SelectTrigger>
                <SelectContent>{CURRENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <p className="mt-1 text-3xl font-extrabold tracking-tight">{rates && mixed && totals.length ? "≈ " : ""}{totals.length ? formatMoney(totals[0]!.total, totals[0]!.currency) : formatMoney(0, homeCurrency)}</p>
            {totals.slice(1).map((t) => <p key={t.currency} className="text-sm opacity-80">+ {formatMoney(t.total, t.currency)}</p>)}
            {rates && mixed && items.length > 0 && (
              <p className="mt-1 text-xs opacity-70">
                {totalsByCurrency(items).map((t) => formatMoney(t.total, t.currency)).join(" + ")} · rates from {shortDate(rates.date)}{isStale(rates) ? " (offline)" : ""}
              </p>
            )}
          </div>
          <div className="space-y-4 p-4">
            <BudgetBar tripId={tripId} uid={uid.data ?? null} budget={budget.data ?? null} items={items} rates={rates} onChanged={refresh} />
            {totals[0] && (
              <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {totals[0].categories.map(({ category, total }) => {
                  const Icon = ICONS[category];
                  return (
                    <li key={category} className="flex items-center gap-2 rounded-xl bg-muted/60 p-2.5">
                      <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent text-primary"><Icon className="h-4 w-4" /></span>
                      <span className="min-w-0 text-xs"><span className="block truncate text-muted-foreground">{label(category)}</span><span className="font-bold">{formatMoney(total, totals[0]!.currency)}</span></span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </Card>

        {list.isLoading ? <div className="h-32 animate-pulse rounded-2xl bg-muted" /> : items.length === 0 ? (
          <Card className="p-6 text-center text-sm text-muted-foreground shadow-card">Nothing logged yet. Add what you spend, like meals, taxis and souvenirs, to see where your money goes.</Card>
        ) : byDay(items).map((day) => (
          <Card key={day.date} className="divide-y shadow-card">
            <div className="flex items-center justify-between p-3">
              <p className="font-bold">{dayLabel(day.date)}</p>
              <p className="text-sm text-muted-foreground">{byDay(view).find((d) => d.date === day.date)!.totals.map((t) => formatMoney(t.total, t.currency)).join(" + ")}</p>
            </div>
            {day.items.map((e) => {
              const Icon = ICONS[e.category];
              return (
                <div key={e.id} className="flex items-center gap-3 p-3 text-sm">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-accent text-primary"><Icon className="h-4 w-4" /></span>
                  <span className="min-w-0 flex-1"><span className="block truncate font-medium">{e.note || label(e.category)}</span><span className="text-xs text-muted-foreground">{label(e.category)}</span></span>
                  <span className="text-right">
                    <span className="block font-bold">{formatMoney(e.amount, e.currency)}</span>
                    {rates && e.currency !== homeCurrency && convert(e.amount, e.currency, homeCurrency, rates) != null && (
                      <span className="block text-xs text-muted-foreground">≈ {formatMoney(convert(e.amount, e.currency, homeCurrency, rates)!, homeCurrency)}</span>
                    )}
                  </span>
                  {e.receipt_path && <ReceiptButton path={e.receipt_path} />}
                  <Button size="icon" variant="ghost" aria-label={`Delete ${e.note || label(e.category)}`} onClick={() => remove(e)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              );
            })}
          </Card>
        ))}
      </div>
      <div className="lg:col-start-2 lg:row-start-2"><AddExpense tripId={tripId} uid={uid.data ?? null} onAdded={refresh} /></div>
    </div>
  );
}

function BudgetBar({ tripId, uid, budget, items, rates, onChanged }: { tripId: string; uid: string | null; budget: Budget | null; items: MyExpense[]; rates: Rates | null; onChanged: () => void }) {
  const [editing, setEditing] = useState(false);
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState(budget?.currency ?? "USD");
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(amount);
    if (!uid || !(amt > 0)) { toast.error("Enter a budget above zero"); return; }
    const { error } = await db.from("personal_budgets").upsert({ trip_id: tripId, user_id: uid, amount: amt, currency, updated_at: new Date().toISOString() });
    if (error) { toast.error(error.message); return; }
    setEditing(false); onChanged();
  };
  if (editing) {
    return (
      <form onSubmit={save} className="flex flex-wrap gap-2">
        <Input className="w-32" type="number" inputMode="decimal" min="0" step="0.01" placeholder="Budget" value={amount} onChange={(e) => setAmount(e.target.value)} autoFocus />
        <CurrencySelect value={currency} onChange={setCurrency} />
        <Button size="sm" className="h-10">Save</Button>
        <Button size="sm" variant="ghost" className="h-10" type="button" onClick={() => setEditing(false)}>Cancel</Button>
      </form>
    );
  }
  if (!budget) return <Button variant="outline" size="sm" onClick={() => setEditing(true)}><PiggyBank /> Set a budget</Button>;
  const s = budgetStatus(items, budget, rates);
  return (
    <button type="button" className="block w-full space-y-1.5 text-left" onClick={() => { setAmount(String(budget.amount)); setCurrency(budget.currency); setEditing(true); }}>
      <div className="flex justify-between text-sm">
        <span className="font-medium">Budget {formatMoney(budget.amount, budget.currency)}</span>
        <span className={cn("font-semibold", s.over ? "text-destructive" : "text-muted-foreground")}>{s.over ? `${formatMoney(-s.left, budget.currency)} over` : `${formatMoney(s.left, budget.currency)} left`}</span>
      </div>
      <Progress value={s.pct} className={cn("h-2.5", s.over && "[&>div]:bg-destructive")} aria-label={`${s.pct}% of budget spent`} />
      {s.missing.length > 0 && <p className="text-xs text-muted-foreground">Not counted (no rate): {s.missing.join(", ")}</p>}
    </button>
  );
}

function CurrencySelect({ value, onChange, label = "Currency", rememberAs = CURRENCY_KEY }: { value: string; onChange: (c: string) => void; label?: string; rememberAs?: string | null }) {
  return (
    <Select value={value} onValueChange={(c) => { onChange(c); if (rememberAs) remember(rememberAs, c); }}>
      <SelectTrigger className="w-24" aria-label={label}><SelectValue /></SelectTrigger>
      <SelectContent>{CURRENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
    </Select>
  );
}

/** Quick converter: what a price in the local currency is at home, using the same daily rates. */
function Converter({ rates, home }: { rates: Rates | null; home: string }) {
  const [amount, setAmount] = useState("100");
  const [picked, setFrom] = useState<string | null>(null);
  const usual = useSaved(CURRENCY_KEY, "USD");
  const from = picked ?? usual;
  const [to, setTo] = useState<string | null>(null);
  const target = to ?? home;
  const n = Number(amount);
  const result = rates && n > 0 ? convert(n, from, target, rates) : null;
  const r = rates ? rate(from, target, rates) : null;
  return (
    <Card className="p-4 shadow-card">
      <h3 className="flex items-center gap-2 font-bold"><ArrowLeftRight className="h-4 w-4 text-primary" /> Currency converter</h3>
      <div className="mt-3 flex gap-2">
        <Input type="number" inputMode="decimal" min="0" step="0.01" aria-label="Amount to convert" value={amount} onChange={(e) => setAmount(e.target.value)} />
        <CurrencySelect value={from} onChange={setFrom} label="Convert from" rememberAs={null} />
      </div>
      <div className="mt-2 flex items-center gap-2">
        <Button type="button" size="icon" variant="outline" aria-label="Swap currencies" onClick={() => { setFrom(target); setTo(from); }}><ArrowLeftRight className="rotate-90" /></Button>
        <p className="min-w-0 flex-1 truncate text-2xl font-extrabold tracking-tight" aria-live="polite">{result != null ? formatMoney(result, target) : "—"}</p>
        <CurrencySelect value={target} onChange={setTo} label="Convert to" rememberAs={null} />
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        {!rates ? "Rates load when you're online, then work offline too." : r == null ? "No rate for this pair." : `1 ${from} = ${new Intl.NumberFormat(undefined, { maximumSignificantDigits: 5 }).format(r)} ${target} · ${shortDate(rates.date)}${isStale(rates) ? " (saved rates)" : ""}. Your bank's rate may differ.`}
      </p>
    </Card>
  );
}

function AddExpense({ tripId, uid, onAdded }: { tripId: string; uid: string | null; onAdded: () => void }) {
  const [amount, setAmount] = useState("");
  const [picked, setCurrency] = useState<string | null>(null);
  const usual = useSaved(CURRENCY_KEY, "USD");
  const currency = picked ?? usual;
  const [category, setCategory] = useState<Category>("food");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(today);
  const [receipt, setReceipt] = useState<Blob | null>(null);
  const [busy, setBusy] = useState(false);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Math.round(Number(amount) * 100) / 100;
    if (!uid || !(amt > 0)) { toast.error("Enter an amount above zero"); return; }
    setBusy(true);
    let receipt_path: string | null = null;
    try {
      if (receipt) receipt_path = await uploadReceipt(tripId, uid, receipt);
      const { error } = await db.from("personal_expenses").insert({ trip_id: tripId, amount: amt, currency, category, note: note.trim(), spent_on: date, receipt_path });
      if (error) throw new Error(error.message);
      toast.success("Expense added");
      setAmount(""); setNote(""); setReceipt(null);
      onAdded();
    } catch (err) {
      await removeReceipt(receipt_path);
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="h-fit p-4 shadow-card">
      <form onSubmit={add} className="space-y-3">
        <h3 className="font-bold">Add an expense</h3>
        <div className="flex gap-2">
          <Input className="text-lg font-semibold" type="number" inputMode="decimal" min="0" step="0.01" placeholder="0.00" aria-label="Amount" value={amount} onChange={(e) => setAmount(e.target.value)} />
          <CurrencySelect value={currency} onChange={setCurrency} />
        </div>
        <div role="radiogroup" aria-label="Category" className="grid grid-cols-3 gap-2">
          {CATEGORIES.map((c) => {
            const Icon = ICONS[c.id];
            const on = category === c.id;
            return (
              <button key={c.id} type="button" role="radio" aria-checked={on} onClick={() => setCategory(c.id)}
                className={cn("flex flex-col items-center gap-1 rounded-xl border p-2 text-[11px] font-medium leading-tight transition", on ? "border-primary bg-accent text-primary" : "hover:bg-muted")}>
                <Icon className="h-4 w-4" />{c.label}
              </button>
            );
          })}
        </div>
        <div><Label htmlFor="my-note">Note</Label><Input id="my-note" placeholder="e.g. Taxi to the souk" maxLength={200} value={note} onChange={(e) => setNote(e.target.value)} /></div>
        <div><Label htmlFor="my-date">Date</Label><Input id="my-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
        <div className="space-y-1.5"><Label>Receipt (optional)</Label><ReceiptInput value={receipt} onChange={setReceipt} /></div>
        <Button className="w-full" disabled={busy}><Plus /> {busy ? "Saving…" : "Add expense"}</Button>
      </form>
    </Card>
  );
}
