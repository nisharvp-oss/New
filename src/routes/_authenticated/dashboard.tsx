import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Building2, Crown, ArrowRight, Users, Megaphone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { statusLabel, type CompanyStatus } from "@/lib/subscription";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Your workspace — WanderSync" }, { name: "description", content: "Your WanderSync companies and admin tools." }] }),
  component: Dashboard,
});

function Dashboard() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [name, setName] = useState("");

  useEffect(() => {
    supabase.rpc("accept_my_invites").then(({ data }) => {
      if (data && data > 0) { toast.success("You joined your team"); qc.invalidateQueries({ queryKey: ["memberships"] }); }
    });
  }, [qc]);

  const admin = useQuery({
    queryKey: ["is-admin", user.id],
    queryFn: async () => (await supabase.rpc("has_role", { _user_id: user.id, _role: "super_admin" })).data ?? false,
  });
  const memberships = useQuery({
    queryKey: ["memberships", user.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("company_members").select("role, company:companies(id,name,status,trial_ends_at,paid_until,kind)").eq("user_id", user.id);
      if (error) throw error;
      return data;
    },
  });

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    const plan = sessionStorage.getItem("ws-plan");
    const { data, error } = await supabase.rpc("create_company", { _name: name, _plan: plan as string });
    if (error) { toast.error(error.message); return; }
    sessionStorage.removeItem("ws-plan");
    toast.success("Your free trial has started");
    navigate({ to: "/company/$companyId", params: { companyId: data as string } });
  };

  const myTrips = useQuery({
    queryKey: ["my-trips", user.id],
    queryFn: async () => {
      await supabase.rpc("link_my_trips");
      const { data: tt } = await supabase.from("trip_travelers").select("trip_id").eq("user_id", user.id);
      const ids = (tt ?? []).map((x) => x.trip_id);
      const { data } = await supabase.from("trips").select("id,title,destination,start_date,organiser_id,caretaker_id")
        .or(`organiser_id.eq.${user.id},caretaker_id.eq.${user.id}${ids.length ? `,id.in.(${ids.join(",")})` : ""}`).order("start_date");
      return (data ?? []).map((t) => ({ ...t, as: t.organiser_id === user.id ? "Organiser" : t.caretaker_id === user.id ? "Caretaker" : "Traveler" }));
    },
  });
  const terms = useQuery({ queryKey: ["free-terms"], queryFn: async () => (await supabase.rpc("free_trip_terms")).data?.[0] ?? null });
  const startPersonal = async () => {
    const { data, error } = await supabase.rpc("get_personal_space");
    if (error) { toast.error(error.message); return; }
    navigate({ to: "/company/$companyId", params: { companyId: data as string } });
  };
  const list = memberships.data ?? [];
  const ownsOne = list.some((m) => m.role === "owner" && m.company?.kind !== "personal");
  const personal = list.find((m) => m.company?.kind === "personal");

  return (
    <main className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      <h1 className="text-3xl font-extrabold">Your workspace</h1>
      {admin.data && (
        <Card className="flex items-center gap-4 p-5 shadow-card">
          <Crown className="h-8 w-8 text-primary" />
          <div className="flex-1"><p className="font-bold">Platform admin</p><p className="text-sm text-muted-foreground">Plans, prices, trial length, companies and platform mail.</p></div>
          <Button asChild><Link to="/admin">Open <ArrowRight className="h-4 w-4" /></Link></Button>
        </Card>
      )}
      <Card className="flex flex-wrap items-center gap-4 p-5 shadow-card">
        <Users className="h-8 w-8 text-primary" />
        <div className="flex-1">
          <p className="font-bold">Organise a trip yourself</p>
          <p className="text-sm text-muted-foreground">Free for up to {terms.data?.free_travelers ?? 10} travelers per trip. Bigger trips are a one-time ${Number(terms.data?.unlock_price ?? 20).toFixed(0)} per trip.</p>
        </div>
        <Button onClick={startPersonal}>{personal ? "My trips" : "Start organising"} <ArrowRight className="h-4 w-4" /></Button>
      </Card>
      <Card className="flex items-center gap-4 p-5 shadow-card">
        <Megaphone className="h-8 w-8 text-primary" />
        <div className="flex-1"><p className="font-bold">Sponsor dashboard</p><p className="text-sm text-muted-foreground">Business owners: update your logo, flyer and offer, and see how many travelers saw you.</p></div>
        <Button variant="outline" asChild><Link to="/sponsor">Open <ArrowRight className="h-4 w-4" /></Link></Button>
      </Card>
      {list.filter((m) => m.company?.kind !== "personal").map((m) => m.company && (
        <Card key={m.company.id} className="flex items-center gap-4 p-5 shadow-card">
          <Building2 className="h-8 w-8 text-primary" />
          <div className="flex-1">
            <p className="font-bold">{m.company.name}</p>
            <div className="mt-1 flex gap-2"><Badge variant="secondary" className="capitalize">{m.role}</Badge>
              <Badge variant="outline">{statusLabel({ ...m.company, status: m.company.status as CompanyStatus })}</Badge></div>
          </div>
          <Button asChild><Link to="/company/$companyId" params={{ companyId: m.company.id }}>Open <ArrowRight className="h-4 w-4" /></Link></Button>
        </Card>
      ))}
      {(myTrips.data?.length ?? 0) > 0 && (
        <section className="space-y-3">
          <h2 className="text-xl font-bold">My trips</h2>
          {myTrips.data!.map((t) => (
            <Card key={t.id} className="flex items-center gap-4 p-4 shadow-card">
              <div className="flex-1"><p className="font-bold">{t.title}</p><p className="text-sm text-muted-foreground">{t.destination} · {t.start_date ?? "dates TBC"}</p></div>
              <Badge variant="secondary">{t.as}</Badge>
              <Button size="sm" asChild><Link to="/trip/$tripId" params={{ tripId: t.id }}>Open</Link></Button>
            </Card>
          ))}
        </section>
      )}
      {memberships.isSuccess && !ownsOne && (
        <Card className="p-6 shadow-card">
          <h2 className="text-xl font-bold">Set up your travel company</h2>
          <p className="text-sm text-muted-foreground">Starts your free trial. If your company invited you, ask the owner to invite <b>{user.email}</b> and refresh.</p>
          <form onSubmit={create} className="mt-4 flex flex-wrap items-end gap-2">
            <div className="flex-1"><Label>Company name</Label><Input value={name} onChange={(e) => setName(e.target.value)} required /></div>
            <Button>Start free trial</Button>
          </form>
        </Card>
      )}
    </main>
  );
}
