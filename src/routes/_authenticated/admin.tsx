import { createFileRoute, redirect } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SmtpForm } from "@/components/ws/SmtpForm";
import { PaymentAccounts, SuperAdmins } from "@/components/ws/AdminPaymentsAndAdmins";
import { statusLabel, type CompanyStatus } from "@/lib/subscription";
import { Badge } from "@/components/ui/badge";

type Plan = Database["public"]["Tables"]["plans"]["Row"];

export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: async ({ context }) => {
    const { data } = await supabase.rpc("has_role", { _user_id: context.user.id, _role: "super_admin" });
    if (!data) throw redirect({ to: "/dashboard" });
  },
  head: () => ({ meta: [{ title: "Platform admin — WanderSync" }, { name: "description", content: "Manage subscription plans, trials and companies." }] }),
  component: Admin,
});

function Admin() {
  const { user } = Route.useRouteContext();
  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <h1 className="text-3xl font-extrabold">Platform admin</h1>
      <Tabs defaultValue="companies">
        <TabsList><TabsTrigger value="companies">Companies</TabsTrigger><TabsTrigger value="unlocks">Trip unlocks</TabsTrigger><TabsTrigger value="sponsors">Sponsors</TabsTrigger><TabsTrigger value="plans">Plans</TabsTrigger><TabsTrigger value="settings">Pricing, trial & mail</TabsTrigger><TabsTrigger value="payments">Payment accounts</TabsTrigger><TabsTrigger value="admins">Admins</TabsTrigger></TabsList>
        <TabsContent value="companies"><Companies /></TabsContent>
        <TabsContent value="unlocks"><Unlocks /></TabsContent>
        <TabsContent value="sponsors"><Sponsors /></TabsContent>
        <TabsContent value="plans"><Plans /></TabsContent>
        <TabsContent value="settings"><Settings /></TabsContent>
        <TabsContent value="payments"><PaymentAccounts /></TabsContent>
        <TabsContent value="admins"><SuperAdmins myId={user.id} /></TabsContent>
      </Tabs>
    </main>
  );
}

function Companies() {
  const qc = useQueryClient();
  const plans = useQuery({ queryKey: ["admin-plans"], queryFn: async () => (await supabase.from("plans").select("*").order("sort_order")).data ?? [] });
  const q = useQuery({ queryKey: ["admin-companies"], queryFn: async () => (await supabase.from("companies").select("id,name,contact_email,status,plan_id,trial_ends_at,paid_until,created_at").eq("kind", "company").order("created_at", { ascending: false })).data ?? [] });
  const update = async (id: string, patch: Database["public"]["Tables"]["companies"]["Update"]) => {
    const { error } = await supabase.from("companies").update(patch).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Company updated");
    qc.invalidateQueries({ queryKey: ["admin-companies"] });
  };
  const rows = q.data ?? [];
  const mrr = rows.filter((c) => c.status === "active").reduce((t, c) => {
    const p = plans.data?.find((x) => x.id === c.plan_id);
    return t + (p ? (p.billing_interval === "year" ? Number(p.price) / 12 : Number(p.price)) : 0);
  }, 0);
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-4"><p className="text-sm text-muted-foreground">Companies</p><p className="text-2xl font-extrabold">{rows.length}</p></Card>
        <Card className="p-4"><p className="text-sm text-muted-foreground">On trial</p><p className="text-2xl font-extrabold">{rows.filter((c) => c.status === "trial").length}</p></Card>
        <Card className="p-4"><p className="text-sm text-muted-foreground">Monthly revenue (active)</p><p className="text-2xl font-extrabold">${mrr.toFixed(0)}</p></Card>
      </div>
      <Card className="overflow-x-auto">
        <Table>
          <TableHeader><TableRow><TableHead>Company</TableHead><TableHead>Status</TableHead><TableHead>Plan</TableHead><TableHead>Paid until</TableHead><TableHead /></TableRow></TableHeader>
          <TableBody>
            {rows.map((c) => (
              <TableRow key={c.id}>
                <TableCell><p className="font-semibold">{c.name}</p><p className="text-xs text-muted-foreground">{c.contact_email}</p></TableCell>
                <TableCell>
                  <Select value={c.status} onValueChange={(v) => update(c.id, { status: v })}>
                    <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="trial">Trial</SelectItem><SelectItem value="active">Active</SelectItem><SelectItem value="suspended">Suspended</SelectItem></SelectContent>
                  </Select>
                  <p className="mt-1 text-xs text-muted-foreground">{statusLabel({ ...c, status: c.status as CompanyStatus })}</p>
                </TableCell>
                <TableCell>
                  <Select value={c.plan_id ?? ""} onValueChange={(v) => update(c.id, { plan_id: v })}>
                    <SelectTrigger className="w-36"><SelectValue placeholder="No plan" /></SelectTrigger>
                    <SelectContent>{plans.data?.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                  </Select>
                </TableCell>
                <TableCell><Input type="date" className="w-40" defaultValue={c.paid_until?.slice(0, 10) ?? ""} onBlur={(e) => update(c.id, { paid_until: e.target.value ? new Date(e.target.value).toISOString() : null })} /></TableCell>
                <TableCell className="space-x-1 whitespace-nowrap">
                  <Button size="sm" variant="outline" onClick={() => update(c.id, { trial_ends_at: new Date(Date.parse(c.trial_ends_at ?? new Date().toISOString()) + 7 * 86400000).toISOString() })}>+7 trial days</Button>
                  <Button size="sm" onClick={() => {
                    const p = plans.data?.find((x) => x.id === c.plan_id);
                    const d = new Date(); d.setMonth(d.getMonth() + (p?.billing_interval === "year" ? 12 : 1));
                    update(c.id, { status: "active", paid_until: d.toISOString() });
                  }}>Mark paid</Button>
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">No companies yet.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

function Plans() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["admin-plans"], queryFn: async () => (await supabase.from("plans").select("*").order("sort_order")).data ?? [] });
  const add = async () => {
    const { error } = await supabase.from("plans").insert({ name: "New plan", price: 0, sort_order: (q.data?.length ?? 0) + 1 });
    if (error) toast.error(error.message); else qc.invalidateQueries({ queryKey: ["admin-plans"] });
  };
  return (
    <div className="space-y-4">
      {q.data?.map((p) => <PlanCard key={p.id} plan={p} />)}
      <Button onClick={add}><Plus className="h-4 w-4" /> Add plan</Button>
    </div>
  );
}

function PlanCard({ plan }: { plan: Plan }) {
  const qc = useQueryClient();
  const [p, setP] = useState(plan);
  const num = (v: string) => (v === "" ? null : Number(v));
  const save = async () => {
    const { id, created_at, ...rest } = p;
    const { error } = await supabase.from("plans").update(rest).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success(`${p.name} saved`);
    qc.invalidateQueries({ queryKey: ["admin-plans"] });
  };
  const del = async () => {
    const { error } = await supabase.from("plans").delete().eq("id", p.id);
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries({ queryKey: ["admin-plans"] });
  };
  return (
    <Card className="space-y-3 p-5 shadow-card">
      <div className="grid gap-3 sm:grid-cols-4">
        <div className="sm:col-span-2"><Label>Name</Label><Input value={p.name} onChange={(e) => setP({ ...p, name: e.target.value })} /></div>
        <div><Label>Price ($)</Label><Input type="number" value={p.price} onChange={(e) => setP({ ...p, price: Number(e.target.value) })} /></div>
        <div><Label>Billed every</Label>
          <Select value={p.billing_interval} onValueChange={(v) => setP({ ...p, billing_interval: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="month">Month</SelectItem><SelectItem value="year">Year</SelectItem></SelectContent>
          </Select>
        </div>
        <div className="sm:col-span-4"><Label>Description</Label><Input value={p.description} onChange={(e) => setP({ ...p, description: e.target.value })} /></div>
        <div><Label>Max trips</Label><Input type="number" placeholder="Unlimited" value={p.max_trips ?? ""} onChange={(e) => setP({ ...p, max_trips: num(e.target.value) })} /></div>
        <div><Label>Max organisers</Label><Input type="number" placeholder="Unlimited" value={p.max_organisers ?? ""} onChange={(e) => setP({ ...p, max_organisers: num(e.target.value) })} /></div>
        <div><Label>Max travelers / trip</Label><Input type="number" placeholder="Unlimited" value={p.max_travelers_per_trip ?? ""} onChange={(e) => setP({ ...p, max_travelers_per_trip: num(e.target.value) })} /></div>
        <div className="flex items-end gap-2 pb-2"><Switch checked={p.is_active} onCheckedChange={(v) => setP({ ...p, is_active: v })} /><span className="text-sm">Shown on pricing</span></div>
        <div className="sm:col-span-4"><Label>Features (one per line)</Label><Textarea rows={3} value={p.features.join("\n")} onChange={(e) => setP({ ...p, features: e.target.value.split("\n").filter(Boolean) })} /></div>
      </div>
      <div className="flex gap-2"><Button onClick={save}>Save</Button><Button variant="ghost" onClick={del}><Trash2 className="h-4 w-4" /> Delete</Button></div>
    </Card>
  );
}

function Settings() {
  const q = useQuery({ queryKey: ["platform-settings"], queryFn: async () => (await supabase.from("platform_settings").select("*").eq("id", 1).single()).data });
  const [days, setDays] = useState(14);
  const [freeN, setFreeN] = useState(10);
  const [price, setPrice] = useState(20);
  useEffect(() => { if (q.data) { setDays(q.data.trial_days); setFreeN(q.data.free_trip_travelers); setPrice(Number(q.data.trip_unlock_price)); } }, [q.data]);
  if (!q.data) return null;
  const save = async (patch: Database["public"]["Tables"]["platform_settings"]["Update"], msg: string) => {
    const { error } = await supabase.from("platform_settings").update(patch).eq("id", 1);
    if (error) toast.error(error.message); else toast.success(msg);
  };
  return (
    <div className="space-y-4">
      <Card className="flex flex-wrap items-end gap-3 p-6 shadow-card">
        <div><Label>Free trial length (days)</Label><Input type="number" min={0} className="w-32" value={days} onChange={(e) => setDays(Number(e.target.value))} /></div>
        <Button onClick={() => save({ trial_days: days }, "Trial length saved")}>Save</Button>
        <p className="w-full text-sm text-muted-foreground">Applies to companies that sign up from now on.</p>
      </Card>
      <Card className="flex flex-wrap items-end gap-3 p-6 shadow-card">
        <div><Label>Free travelers per personal trip</Label><Input type="number" min={1} className="w-32" value={freeN} onChange={(e) => setFreeN(Number(e.target.value))} /></div>
        <div><Label>One-time unlock price ($)</Label><Input type="number" min={0} className="w-32" value={price} onChange={(e) => setPrice(Number(e.target.value))} /></div>
        <Button onClick={() => save({ free_trip_travelers: freeN, trip_unlock_price: price }, "Personal trip pricing saved")}>Save</Button>
        <p className="w-full text-sm text-muted-foreground">Individual organisers get this many travelers free on each trip. Above that they pay once per trip.</p>
      </Card>
      <SmtpForm companyId={null} initial={q.data} onSave={async (f) => (await supabase.from("platform_settings").update(f).eq("id", 1)).error?.message ?? null} />
    </div>
  );
}

function Unlocks() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["admin-unlocks"], queryFn: async () => {
    const { data } = await supabase.from("trips").select("id,title,destination,unlocked,unlock_requested,created_at,company:companies!inner(name,kind,contact_email)").eq("company.kind", "personal").order("unlock_requested", { ascending: false }).order("created_at", { ascending: false });
    return data ?? [];
  } });
  const set = async (id: string, unlocked: boolean) => {
    const { error } = await supabase.rpc("admin_set_trip_unlock", { _trip: id, _unlocked: unlocked });
    if (error) { toast.error(error.message); return; }
    toast.success(unlocked ? "Trip unlocked" : "Trip locked");
    qc.invalidateQueries({ queryKey: ["admin-unlocks"] });
  };
  return (
    <Card className="overflow-x-auto">
      <Table>
        <TableHeader><TableRow><TableHead>Trip</TableHead><TableHead>Organiser</TableHead><TableHead>Status</TableHead><TableHead /></TableRow></TableHeader>
        <TableBody>
          {q.data?.map((t) => (
            <TableRow key={t.id}>
              <TableCell><p className="font-semibold">{t.title}</p><p className="text-xs text-muted-foreground">{t.destination}</p></TableCell>
              <TableCell className="text-sm">{t.company.contact_email}</TableCell>
              <TableCell>{t.unlocked ? <Badge>Unlocked</Badge> : t.unlock_requested ? <Badge variant="destructive">Wants to unlock</Badge> : <Badge variant="outline">Free</Badge>}</TableCell>
              <TableCell>{t.unlocked ? <Button size="sm" variant="outline" onClick={() => set(t.id, false)}>Lock</Button> : <Button size="sm" onClick={() => set(t.id, true)}>Mark paid & unlock</Button>}</TableCell>
            </TableRow>
          ))}
          {q.data?.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">No personal trips yet.</TableCell></TableRow>}
        </TableBody>
      </Table>
    </Card>
  );
}

function Sponsors() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["admin-sponsors"], queryFn: async () => (await supabase.from("trip_sponsors").select("id,name,kind,category,is_premium,trip:trips(title,destination)").order("is_premium", { ascending: false }).order("created_at", { ascending: false })).data ?? [] });
  const set = async (id: string, is_premium: boolean) => {
    const { error } = await supabase.rpc("admin_set_sponsor_premium", { _sponsor: id, _premium: is_premium });
    if (error) toast.error(error.message); else qc.invalidateQueries({ queryKey: ["admin-sponsors"] });
  };
  return (
    <Card className="overflow-x-auto">
      <p className="p-4 text-sm text-muted-foreground">Premium sponsors pay the platform and are shown first on every trip they appear on.</p>
      <Table>
        <TableHeader><TableRow><TableHead>Sponsor</TableHead><TableHead>Trip</TableHead><TableHead>Premium</TableHead></TableRow></TableHeader>
        <TableBody>
          {q.data?.map((s) => (
            <TableRow key={s.id}>
              <TableCell><p className="font-semibold">{s.name}</p><p className="text-xs text-muted-foreground">{s.kind === "local" ? s.category : "Brand sponsor"}</p></TableCell>
              <TableCell className="text-sm">{s.trip?.title} · {s.trip?.destination}</TableCell>
              <TableCell><Switch checked={s.is_premium} onCheckedChange={(v) => set(s.id, v)} /></TableCell>
            </TableRow>
          ))}
          {q.data?.length === 0 && <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground">No sponsors yet.</TableCell></TableRow>}
        </TableBody>
      </Table>
    </Card>
  );
}
