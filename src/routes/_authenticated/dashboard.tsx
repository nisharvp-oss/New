import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Building2, ChevronRight, Crown, ArrowRight, MapPin, Users, Megaphone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { must } from "@/lib/must";
import { Button } from "@/components/ui/button";
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
    // Linking writes to the database, so run it once per visit rather than on every refetch.
    supabase.rpc("link_my_trips").then(({ data }) => {
      if (data) qc.invalidateQueries({ queryKey: ["my-trips"] });
    });
  }, [qc]);

  const admin = useQuery({
    queryKey: ["is-admin", user.id],
    queryFn: async () => (await must(supabase.rpc("has_role", { _user_id: user.id, _role: "super_admin" }))) ?? false,
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
      const tt = await must(supabase.from("trip_travelers").select("trip_id").eq("user_id", user.id));
      const ids = (tt ?? []).map((x) => x.trip_id);
      const data = await must(supabase.from("trips").select("id,title,destination,start_date,organiser_id,caretaker_id")
        .or(`organiser_id.eq.${user.id},caretaker_id.eq.${user.id}${ids.length ? `,id.in.(${ids.join(",")})` : ""}`).order("start_date"));
      return (data ?? []).map((t) => ({ ...t, as: t.organiser_id === user.id ? "Organiser" : t.caretaker_id === user.id ? "Caretaker" : "Traveler" }));
    },
  });
  const terms = useQuery({ queryKey: ["free-terms"], queryFn: async () => (await must(supabase.rpc("free_trip_terms")))?.[0] ?? null });
  const startPersonal = async () => {
    const { data, error } = await supabase.rpc("get_personal_space");
    if (error) { toast.error(error.message); return; }
    navigate({ to: "/company/$companyId", params: { companyId: data as string } });
  };
  const list = memberships.data ?? [];
  const ownsOne = list.some((m) => m.role === "owner" && m.company?.kind !== "personal");
  const personal = list.find((m) => m.company?.kind === "personal");

  const firstName = (user.user_metadata?.["full_name"] as string | undefined)?.split(" ")[0];
  const trips = myTrips.data ?? [];
  const companies = list.filter((m) => m.company?.kind !== "personal");

  return (
    <main className="mx-auto max-w-4xl px-4 pb-10 pt-6 sm:pt-10">
      <header className="rise">
        <p className="text-sm text-muted-foreground" suppressHydrationWarning>{new Date().toLocaleDateString([], { weekday: "long", day: "numeric", month: "long" })}</p>
        <h1 className="mt-1 text-[clamp(2rem,6vw,2.75rem)] font-bold leading-tight">{firstName ? `Hi ${firstName}` : "Your trips"}</h1>
      </header>

      <section className="mt-8" aria-labelledby="trips-h">
        <div className="flex items-baseline justify-between">
          <h2 id="trips-h" className="text-xl font-bold">My trips</h2>
          {trips.length > 0 && <span className="text-sm text-muted-foreground">{trips.length}</span>}
        </div>
        {myTrips.isLoading ? (
          <div className="mt-3 h-36 animate-pulse rounded-3xl bg-muted" />
        ) : myTrips.isError ? (
          <div role="alert" className="mt-3 rounded-3xl border border-destructive/40 bg-destructive/5 p-6 text-center">
            <p className="font-semibold">Your trips didn't load</p>
            <p className="mt-1 text-sm text-muted-foreground">{myTrips.error.message}</p>
            <Button variant="outline" className="mt-4" onClick={() => myTrips.refetch()}>Try again</Button>
          </div>
        ) : trips.length === 0 ? (
          <div className="mt-3 rounded-3xl border border-dashed p-6 text-center">
            <p className="font-semibold">No trips yet</p>
            <p className="mt-1 text-sm text-muted-foreground">Trips you organise, look after or are invited to show up here.</p>
          </div>
        ) : (
          <div className="no-scrollbar -mx-4 mt-3 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0">
            {trips.map((t) => (
              <Link key={t.id} to="/trip/$tripId" params={{ tripId: t.id }}
                className="press relative w-[82%] shrink-0 snap-start overflow-hidden rounded-3xl bg-navy p-5 text-navy-foreground shadow-card sm:w-auto">
                <div className="flex items-start justify-between gap-3">
                  <span className="rounded-full bg-navy-foreground/10 px-2.5 py-1 text-xs font-semibold">{t.as}</span>
                  <ArrowRight className="h-5 w-5 text-navy-foreground/60" />
                </div>
                <p className="mt-6 font-display text-2xl font-semibold leading-tight">{t.title}</p>
                <div className="mt-4 flex items-end justify-between gap-3 border-t border-dashed border-navy-foreground/20 pt-3 text-sm">
                  <span className="flex min-w-0 items-center gap-1 text-navy-foreground/75"><MapPin className="h-4 w-4 shrink-0" /><span className="truncate">{t.destination}</span></span>
                  <span className="shrink-0 font-board text-xs text-sunset">{t.start_date ?? "Dates TBC"}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {companies.length > 0 && (
        <section className="mt-10" aria-labelledby="co-h">
          <h2 id="co-h" className="text-xl font-bold">Companies</h2>
          <ul className="mt-3 divide-y overflow-hidden rounded-2xl border bg-card shadow-card">
            {companies.map((m) => m.company && (
              <li key={m.company.id}>
                <Link to="/company/$companyId" params={{ companyId: m.company.id }} className="flex items-center gap-4 p-4 transition-colors hover:bg-muted/60 active:bg-muted">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-secondary font-display text-lg font-bold text-secondary-foreground">{m.company.name.slice(0, 1).toUpperCase()}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{m.company.name}</p>
                    <div className="mt-1 flex flex-wrap gap-1.5"><Badge variant="secondary" className="capitalize">{m.role}</Badge>
                      <Badge variant="outline">{statusLabel({ ...m.company, status: m.company.status as CompanyStatus })}</Badge></div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-10" aria-labelledby="more-h">
        <h2 id="more-h" className="text-xl font-bold">More</h2>
        <ul className="mt-3 divide-y overflow-hidden rounded-2xl border bg-card shadow-card">
          <li>
            <button type="button" onClick={startPersonal} className="flex w-full items-center gap-4 p-4 text-left transition-colors hover:bg-muted/60 active:bg-muted">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-accent text-accent-foreground"><Users className="h-5 w-5" /></span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{personal ? "My personal trips" : "Organise a trip yourself"}</p>
                <p className="text-sm text-muted-foreground">Free for up to {terms.data?.free_travelers ?? 10} travelers. Bigger trips are a one-time ${Number(terms.data?.unlock_price ?? 20).toFixed(0)}.</p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </button>
          </li>
          <li>
            <Link to="/sponsor" className="flex items-center gap-4 p-4 transition-colors hover:bg-muted/60 active:bg-muted">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-secondary text-primary"><Megaphone className="h-5 w-5" /></span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold">Sponsor dashboard</p>
                <p className="text-sm text-muted-foreground">For local businesses: update your logo, flyer and offer, and see how many travelers saw it.</p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </Link>
          </li>
          {admin.data && (
            <li>
              <Link to="/admin" className="flex items-center gap-4 p-4 transition-colors hover:bg-muted/60 active:bg-muted">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-navy text-sunset"><Crown className="h-5 w-5" /></span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">Platform admin</p>
                  <p className="text-sm text-muted-foreground">Plans, prices, trial length, companies and platform mail.</p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </Link>
            </li>
          )}
        </ul>
      </section>

      {memberships.isSuccess && !ownsOne && (
        <section className="mt-10 rounded-3xl bg-navy p-6 text-navy-foreground sm:p-8">
          <Building2 className="h-7 w-7 text-sunset" />
          <h2 className="mt-4 text-2xl font-bold">Set up your travel company</h2>
          <p className="mt-2 text-navy-foreground/75">This starts your free trial. If a company invited you, ask the owner to invite <b className="text-navy-foreground">{user.email}</b>, then reopen this page.</p>
          <form onSubmit={create} className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="company" className="text-navy-foreground/80">Company name</Label>
              <Input id="company" className="h-12 rounded-xl border-navy-foreground/20 bg-navy-foreground/10 text-navy-foreground placeholder:text-navy-foreground/40" placeholder="e.g. Atlas Group Tours" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <Button size="lg" className="bg-sunset text-sunset-foreground hover:bg-sunset/90">Start free trial</Button>
          </form>
        </section>
      )}
    </main>
  );
}
