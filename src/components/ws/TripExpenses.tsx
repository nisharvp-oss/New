import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowRight, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { must } from "@/lib/must";
import { computeSplits, netBalances, simplifyDebts, type Expense, type Settlement, type Split } from "@/lib/splitwise";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

/** "company" = the travel company / organisers paid it. */
const COMPANY = "company";
const money = (n: number) => n.toFixed(2);

function useExpenseData(tripId: string) {
  const travelers = useQuery({ queryKey: ["travelers", tripId], queryFn: async () => (await must(supabase.from("trip_travelers").select("*").eq("trip_id", tripId).order("created_at"))) ?? [] });
  const expenses = useQuery({ queryKey: ["expenses", tripId], queryFn: async () => (await must(supabase.from("trip_expenses").select("*").eq("trip_id", tripId).order("created_at", { ascending: false }))) ?? [] });
  const settlements = useQuery({ queryKey: ["settlements", tripId], queryFn: async () => (await must(supabase.from("trip_settlements").select("*").eq("trip_id", tripId).order("created_at", { ascending: false }))) ?? [] });
  const exps: Expense[] = (expenses.data ?? []).map((e) => ({ id: e.id, groupId: tripId, paidBy: e.paid_by, amount: Number(e.amount), description: e.description, splitType: e.split_type as Expense["splitType"], splits: (e.splits as unknown as Split[]) ?? [], createdAt: e.created_at }));
  const sets: Settlement[] = (settlements.data ?? []).map((s) => ({ id: s.id, groupId: tripId, from: s.from_id, to: s.to_id, amount: Number(s.amount) }));
  const balances = netBalances(exps, sets);
  const names = new Map<string, string>([[COMPANY, "Organisers"], ...(travelers.data ?? []).map((t) => [t.id, t.name] as [string, string])]);
  const name = (id: string) => names.get(id) ?? "Removed traveler";
  return { travelers: travelers.data ?? [], exps, sets, balances, transfers: simplifyDebts(balances), name };
}

export function StaffExpenses({ tripId }: { tripId: string }) {
  const qc = useQueryClient();
  const d = useExpenseData(tripId);
  const [desc, setDesc] = useState("");
  const [amount, setAmount] = useState("");
  const [paidBy, setPaidBy] = useState(COMPANY);
  const [type, setType] = useState<Expense["splitType"]>("equal");
  const [picked, setPicked] = useState<string[] | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const members = picked ?? d.travelers.map((t) => t.id);
  const refresh = () => { qc.invalidateQueries({ queryKey: ["expenses", tripId] }); qc.invalidateQueries({ queryKey: ["settlements", tripId] }); };

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(amount);
    if (!desc.trim() || !(amt > 0) || members.length === 0) { toast.error("Add a description, an amount and at least one traveler"); return; }
    const nums = Object.fromEntries(members.map((id) => [id, Number(values[id] ?? 0)]));
    const splits = computeSplits(amt, members, type, nums);
    const sum = splits.reduce((s, x) => s + x.amount, 0);
    if (Math.abs(sum - amt) > 0.011) { toast.error(type === "percent" ? "Percentages must add up to 100" : `Shares add up to ${money(sum)}, not ${money(amt)}`); return; }
    const { error } = await supabase.from("trip_expenses").insert({ trip_id: tripId, description: desc.trim(), amount: amt, paid_by: paidBy, split_type: type, splits: splits as never });
    if (error) { toast.error(error.message); return; }
    toast.success("Cost added"); setDesc(""); setAmount(""); setValues({}); refresh();
  };
  const settle = async (from: string, to: string, amt: number) => {
    const { error } = await supabase.from("trip_settlements").insert({ trip_id: tripId, from_id: from, to_id: to, amount: amt });
    if (error) toast.error(error.message); else { toast.success("Marked as paid"); refresh(); }
  };
  const del = async (table: "trip_expenses" | "trip_settlements", id: string) => {
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) toast.error(error.message); else refresh();
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
      <div className="space-y-4">
        <Card className="divide-y shadow-card">
          <p className="p-3 font-bold">Who owes whom</p>
          {d.transfers.map((t) => (
            <div key={t.from + t.to} className="flex flex-wrap items-center gap-2 p-3 text-sm">
              <span className="font-medium">{d.name(t.from)}</span><ArrowRight className="h-4 w-4 text-muted-foreground" /><span className="font-medium">{d.name(t.to)}</span>
              <span className="ml-auto font-bold">{money(t.amount)}</span>
              <Button size="sm" variant="outline" onClick={() => settle(t.from, t.to, t.amount)}>Mark paid</Button>
            </div>
          ))}
          {d.transfers.length === 0 && <p className="p-4 text-muted-foreground">Everyone is settled up.</p>}
        </Card>
        <Card className="divide-y shadow-card">
          <p className="p-3 font-bold">Costs</p>
          {d.exps.map((e) => (
            <div key={e.id} className="p-3 text-sm">
              <div className="flex items-center gap-2">
                <span className="flex-1 font-medium">{e.description}</span><span className="font-bold">{money(e.amount)}</span>
                <Button size="icon" variant="ghost" onClick={() => del("trip_expenses", e.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
              <p className="text-muted-foreground">Paid by {d.name(e.paidBy)} · split {e.splitType} between {e.splits.length}</p>
            </div>
          ))}
          {d.exps.length === 0 && <p className="p-4 text-muted-foreground">No costs yet.</p>}
        </Card>
        {d.sets.length > 0 && (
          <Card className="divide-y shadow-card">
            <p className="p-3 font-bold">Payments recorded</p>
            {d.sets.map((s) => (
              <div key={s.id} className="flex items-center gap-2 p-3 text-sm">
                <span className="flex-1">{d.name(s.from)} paid {d.name(s.to)}</span><span className="font-bold">{money(s.amount)}</span>
                <Button size="icon" variant="ghost" onClick={() => del("trip_settlements", s.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            ))}
          </Card>
        )}
      </div>
      <Card className="h-fit p-4 shadow-card">
        <form onSubmit={add} className="space-y-3">
          <h3 className="font-bold">Add a cost</h3>
          <div><Label>What for</Label><Input placeholder="e.g. Group dinner" value={desc} onChange={(e) => setDesc(e.target.value)} /></div>
          <div><Label>Amount</Label><Input type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} /></div>
          <div><Label>Paid by</Label>
            <Select value={paidBy} onValueChange={setPaidBy}><SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value={COMPANY}>Organisers</SelectItem>{d.travelers.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent></Select></div>
          <div><Label>Split</Label>
            <Select value={type} onValueChange={(v) => setType(v as Expense["splitType"])}><SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="equal">Equally</SelectItem><SelectItem value="exact">Exact amounts</SelectItem><SelectItem value="percent">Percentages</SelectItem></SelectContent></Select></div>
          <div className="space-y-2">
            <Label>Between</Label>
            {d.travelers.map((t) => {
              const on = members.includes(t.id);
              return (
                <div key={t.id} className="flex items-center gap-2 text-sm">
                  <Checkbox checked={on} onCheckedChange={(c) => setPicked(c ? [...members, t.id] : members.filter((m) => m !== t.id))} />
                  <span className="flex-1">{t.name}</span>
                  {on && type !== "equal" && <Input className="h-8 w-24" type="number" step="0.01" placeholder={type === "percent" ? "%" : "0.00"} value={values[t.id] ?? ""} onChange={(e) => setValues({ ...values, [t.id]: e.target.value })} />}
                </div>
              );
            })}
            {d.travelers.length === 0 && <p className="text-sm text-muted-foreground">Add travelers first.</p>}
          </div>
          <Button className="w-full">Add cost</Button>
        </form>
      </Card>
    </div>
  );
}

export function TravelerExpenses({ tripId, travelerId }: { tripId: string; travelerId: string }) {
  const d = useExpenseData(tripId);
  const bal = d.balances[travelerId] ?? 0;
  const mine = d.transfers.filter((t) => t.from === travelerId || t.to === travelerId);
  return (
    <div className="space-y-4">
      <Card className="p-4 shadow-card">
        <p className="text-sm text-muted-foreground">Your balance</p>
        <p className="text-2xl font-bold">{bal < -0.005 ? `You owe ${money(-bal)}` : bal > 0.005 ? `You're owed ${money(bal)}` : "All settled"}</p>
        {mine.map((t) => <p key={t.from + t.to} className="text-sm">{t.from === travelerId ? `Pay ${d.name(t.to)} ${money(t.amount)}` : `${d.name(t.from)} pays you ${money(t.amount)}`}</p>)}
      </Card>
      <Card className="divide-y shadow-card">
        {d.exps.filter((e) => e.paidBy === travelerId || e.splits.some((s) => s.memberId === travelerId)).map((e) => {
          const share = e.splits.find((s) => s.memberId === travelerId)?.amount ?? 0;
          return (
            <div key={e.id} className="flex items-center gap-2 p-3 text-sm">
              <span className="flex-1"><span className="font-medium">{e.description}</span><br /><span className="text-muted-foreground">Paid by {d.name(e.paidBy)} · total {money(e.amount)}</span></span>
              <Badge variant="secondary">Your share {money(share)}</Badge>
            </div>
          );
        })}
        {d.exps.length === 0 && <p className="p-4 text-muted-foreground">No shared costs yet.</p>}
      </Card>
    </div>
  );
}
