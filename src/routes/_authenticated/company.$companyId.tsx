import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, CalendarDays, MapPin, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { SmtpForm } from "@/components/ws/SmtpForm";
import { isWritable, statusLabel, type CompanyStatus } from "@/lib/subscription";

type Company = Database["public"]["Tables"]["companies"]["Row"];
type Role = Database["public"]["Enums"]["company_role"];

export const Route = createFileRoute("/_authenticated/company/$companyId")({
  head: () => ({ meta: [{ title: "Company — WanderSync" }, { name: "description", content: "Manage your trips, team, payment details and mail settings." }] }),
  component: CompanyPage,
});

function useCompany(id: string) {
  return useQuery({ queryKey: ["company", id], queryFn: async () => {
    const { data, error } = await supabase.from("companies").select("*, plan:plans(*)").eq("id", id).single();
    if (error) throw error;
    return data;
  } });
}
function useTeam(id: string) {
  return useQuery({ queryKey: ["team", id], queryFn: async () => {
    const { data: members } = await supabase.from("company_members").select("id,user_id,role").eq("company_id", id);
    const ids = (members ?? []).map((m) => m.user_id);
    const { data: profiles } = ids.length ? await supabase.from("profiles").select("id,email,full_name").in("id", ids) : { data: [] };
    return (members ?? []).map((m) => ({ ...m, profile: profiles?.find((p) => p.id === m.user_id) }));
  } });
}

function CompanyPage() {
  const { companyId } = Route.useParams();
  const { user } = Route.useRouteContext();
  const company = useCompany(companyId);
  const team = useTeam(companyId);
  if (company.isLoading) return <p className="p-10 text-center text-muted-foreground">Loading…</p>;
  if (!company.data) return <p className="p-10 text-center">Company not found or you don't have access.</p>;
  const c = company.data;
  const myRole = team.data?.find((m) => m.user_id === user.id)?.role;
  const isOwner = myRole === "owner";
  const writable = isWritable({ ...c, status: c.status as CompanyStatus });
  const personal = c.kind === "personal";

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-extrabold">{c.name}</h1>
        {personal ? <Badge variant="secondary">Personal organiser</Badge> : <>
          <Badge variant="outline">{statusLabel({ ...c, status: c.status as CompanyStatus })}</Badge>
          {c.plan && <Badge variant="secondary">{c.plan.name} plan</Badge>}
          {myRole && <Badge className="capitalize">{myRole}</Badge>}
        </>}
      </div>
      {personal && <p className="text-sm text-muted-foreground">Each trip is free for a small group. Open a trip to add travelers, sponsors and more, or to unlock it for a bigger group.</p>}
      {!writable && (
        <div className="flex items-center gap-3 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          Your subscription isn't active, so trips are read-only. Contact the platform team to activate your plan.
        </div>
      )}
      <Tabs defaultValue="trips">
        <TabsList className="flex-wrap">
          <TabsTrigger value="trips">Trips</TabsTrigger>
          {!personal && <TabsTrigger value="team">Team</TabsTrigger>}
          {isOwner && <TabsTrigger value="payments">Payment details</TabsTrigger>}
          {isOwner && <TabsTrigger value="mail">Mail settings</TabsTrigger>}
        </TabsList>
        <TabsContent value="trips"><Trips company={c} team={team.data ?? []} canEdit={writable && (isOwner || myRole === "organiser")} isOwner={isOwner} /></TabsContent>
        {!personal && <TabsContent value="team"><Team companyId={companyId} team={team.data ?? []} isOwner={isOwner} maxOrganisers={c.plan?.max_organisers ?? null} /></TabsContent>}
        {isOwner && <TabsContent value="payments"><Payments company={c} /></TabsContent>}
        {isOwner && <TabsContent value="mail">
          <SmtpForm companyId={companyId} initial={c} onSave={async (f) => (await supabase.from("companies").update(f).eq("id", companyId)).error?.message ?? null} />
        </TabsContent>}
      </Tabs>
    </main>
  );
}

type TeamRow = { id: string; user_id: string; role: Role; profile?: { email: string | null; full_name: string | null } | undefined };
const who = (t: TeamRow | undefined) => t?.profile?.full_name || t?.profile?.email || "Unassigned";

function Trips({ company, team, canEdit, isOwner }: { company: Company; team: TeamRow[]; canEdit: boolean; isOwner: boolean }) {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["trips", company.id], queryFn: async () => (await supabase.from("trips").select("*").eq("company_id", company.id).order("start_date")).data ?? [] });
  const del = async (id: string) => {
    const { error } = await supabase.from("trips").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries({ queryKey: ["trips", company.id] });
  };
  return (
    <div className="space-y-4">
      {canEdit && <TripDialog companyId={company.id} team={team} />}
      <div className="grid gap-4 md:grid-cols-2">
        {q.data?.map((t) => (
          <Card key={t.id} className="space-y-2 p-5 shadow-card">
            <div className="flex items-start justify-between gap-2">
              <Link to="/trip/$tripId" params={{ tripId: t.id }} className="text-lg font-bold hover:text-primary">{t.title} →</Link>
              {isOwner && <Button size="icon" variant="ghost" onClick={() => del(t.id)} aria-label="Delete trip"><Trash2 className="h-4 w-4" /></Button>}
            </div>
            <p className="flex items-center gap-1 text-sm text-muted-foreground"><MapPin className="h-4 w-4" />{t.destination || "—"}</p>
            <p className="flex items-center gap-1 text-sm text-muted-foreground"><CalendarDays className="h-4 w-4" />{t.start_date ?? "?"} → {t.end_date ?? "?"}</p>
            <div className="flex flex-wrap gap-2 text-xs">
              <Badge variant="secondary">Organiser: {who(team.find((m) => m.user_id === t.organiser_id))}</Badge>
              <Badge variant="secondary">Caretaker: {who(team.find((m) => m.user_id === t.caretaker_id))}</Badge>
              {t.price != null && <Badge variant="outline">${Number(t.price).toFixed(0)}</Badge>}
              {t.seats != null && <Badge variant="outline">{t.seats} seats</Badge>}
            </div>
          </Card>
        ))}
      </div>
      {q.data?.length === 0 && <p className="text-muted-foreground">No trips yet.</p>}
    </div>
  );
}

function TripDialog({ companyId, team }: { companyId: string; team: TeamRow[] }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ title: "", destination: "", description: "", start_date: "", end_date: "", price: "", seats: "", organiser_id: "", caretaker_id: "" });
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("trips").insert({
      company_id: companyId, title: f.title, destination: f.destination, description: f.description,
      start_date: f.start_date || null, end_date: f.end_date || null,
      price: f.price ? Number(f.price) : null, seats: f.seats ? Number(f.seats) : null,
      organiser_id: f.organiser_id || null, caretaker_id: f.caretaker_id || null,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Trip created");
    setOpen(false);
    qc.invalidateQueries({ queryKey: ["trips", companyId] });
  };
  const pick = (role: Role[], k: "organiser_id" | "caretaker_id") => (
    <Select value={f[k]} onValueChange={(v) => setF({ ...f, [k]: v })}>
      <SelectTrigger><SelectValue placeholder="Choose" /></SelectTrigger>
      <SelectContent>{team.filter((m) => role.includes(m.role)).map((m) => <SelectItem key={m.user_id} value={m.user_id}>{who(m)}</SelectItem>)}</SelectContent>
    </Select>
  );
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button><Plus className="h-4 w-4" /> New trip</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>New trip</DialogTitle></DialogHeader>
        <form onSubmit={save} className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2"><Label>Title</Label><Input required value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></div>
          <div className="sm:col-span-2"><Label>Destination</Label><Input value={f.destination} onChange={(e) => setF({ ...f, destination: e.target.value })} /></div>
          <div><Label>Start</Label><Input type="date" value={f.start_date} onChange={(e) => setF({ ...f, start_date: e.target.value })} /></div>
          <div><Label>End</Label><Input type="date" value={f.end_date} onChange={(e) => setF({ ...f, end_date: e.target.value })} /></div>
          <div><Label>Price per person ($)</Label><Input type="number" value={f.price} onChange={(e) => setF({ ...f, price: e.target.value })} /></div>
          <div><Label>Seats</Label><Input type="number" value={f.seats} onChange={(e) => setF({ ...f, seats: e.target.value })} /></div>
          <div><Label>Organiser</Label>{pick(["owner", "organiser"], "organiser_id")}</div>
          <div><Label>Caretaker</Label>{pick(["caretaker", "organiser", "owner"], "caretaker_id")}</div>
          <div className="sm:col-span-2"><Label>Description</Label><Textarea value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></div>
          <Button className="sm:col-span-2">Create trip</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Team({ companyId, team, isOwner, maxOrganisers }: { companyId: string; team: TeamRow[]; isOwner: boolean; maxOrganisers: number | null }) {
  const qc = useQueryClient();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"organiser" | "caretaker">("organiser");
  const invites = useQuery({ enabled: isOwner, queryKey: ["invites", companyId], queryFn: async () => (await supabase.from("company_invites").select("*").eq("company_id", companyId)).data ?? [] });
  const invite = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("company_invites").insert({ company_id: companyId, email: email.trim().toLowerCase(), role });
    if (error) { toast.error(error.message); return; }
    toast.success(`Invite saved. Ask ${email} to sign up with that email.`);
    setEmail("");
    qc.invalidateQueries({ queryKey: ["invites", companyId] });
  };
  const remove = async (id: string, table: "company_members" | "company_invites") => {
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries({ queryKey: [table === "company_members" ? "team" : "invites", companyId] });
  };
  const organisers = team.filter((m) => m.role === "organiser").length;
  return (
    <div className="space-y-4">
      <Card className="divide-y">
        {team.map((m) => (
          <div key={m.id} className="flex items-center gap-3 p-4">
            <div className="flex-1"><p className="font-semibold">{who(m)}</p><p className="text-xs text-muted-foreground">{m.profile?.email}</p></div>
            <Badge variant="secondary" className="capitalize">{m.role}</Badge>
            {isOwner && m.role !== "owner" && <Button size="icon" variant="ghost" aria-label="Remove" onClick={() => remove(m.id, "company_members")}><Trash2 className="h-4 w-4" /></Button>}
          </div>
        ))}
        {invites.data?.map((i) => (
          <div key={i.id} className="flex items-center gap-3 p-4 text-muted-foreground">
            <div className="flex-1"><p>{i.email}</p><p className="text-xs">Invited — joins when they sign up</p></div>
            <Badge variant="outline" className="capitalize">{i.role}</Badge>
            <Button size="icon" variant="ghost" aria-label="Cancel invite" onClick={() => remove(i.id, "company_invites")}><Trash2 className="h-4 w-4" /></Button>
          </div>
        ))}
      </Card>
      {isOwner && (
        <Card className="p-5 shadow-card">
          <p className="mb-3 text-sm text-muted-foreground">Organisers: {organisers} of {maxOrganisers ?? "unlimited"}</p>
          <form onSubmit={invite} className="flex flex-wrap items-end gap-2">
            <div className="flex-1"><Label>Email</Label><Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
            <Select value={role} onValueChange={(v) => setRole(v as "organiser" | "caretaker")}>
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="organiser">Organiser</SelectItem><SelectItem value="caretaker">Caretaker</SelectItem></SelectContent>
            </Select>
            <Button>Invite</Button>
          </form>
        </Card>
      )}
    </div>
  );
}

function Payments({ company }: { company: Company }) {
  const qc = useQueryClient();
  const [f, setF] = useState({ contact_email: "", phone: "", payment_link: "", bank_details: "", cash_note: "" });
  useEffect(() => setF({ contact_email: company.contact_email ?? "", phone: company.phone ?? "", payment_link: company.payment_link ?? "", bank_details: company.bank_details ?? "", cash_note: company.cash_note ?? "" }), [company]);
  const save = async () => {
    const { error } = await supabase.from("companies").update(f).eq("id", company.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Payment details saved");
    qc.invalidateQueries({ queryKey: ["company", company.id] });
  };
  return (
    <Card className="space-y-3 p-6 shadow-card">
      <p className="text-sm text-muted-foreground">Travelers pay you directly using these details. WanderSync never touches trip money.</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div><Label>Contact email</Label><Input value={f.contact_email} onChange={(e) => setF({ ...f, contact_email: e.target.value })} /></div>
        <div><Label>Phone</Label><Input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></div>
        <div className="sm:col-span-2"><Label>Payment link (PayPal, Stripe link, etc.)</Label><Input value={f.payment_link} onChange={(e) => setF({ ...f, payment_link: e.target.value })} /></div>
        <div className="sm:col-span-2"><Label>Bank transfer details</Label><Textarea value={f.bank_details} onChange={(e) => setF({ ...f, bank_details: e.target.value })} /></div>
        <div className="sm:col-span-2"><Label>Cash instructions</Label><Input value={f.cash_note} onChange={(e) => setF({ ...f, cash_note: e.target.value })} /></div>
      </div>
      <Button onClick={save}>Save</Button>
    </Card>
  );
}
