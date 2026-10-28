import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ExternalLink, Plus, Search, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { searchAirlines, validateAirline, type AirlineInput } from "@/lib/airlines";
import { airlinesQuery } from "@/lib/airlines.functions";

type Row = AirlineInput & { is_active: boolean; sort_order: number };
type Res = PromiseLike<{ data: unknown; error: { message: string } | null }>;
// airlines (migration 0013) is newer than the generated database types; this is the slice we use.
type AirlinesTable = {
  select: (c: string) => { order: (c: string) => PromiseLike<{ data: Row[] | null; error: { message: string } | null }> };
  insert: (row: Row) => Res;
  update: (row: Partial<Row> & { updated_at: string }) => { eq: (c: "code", v: string) => Res };
  delete: () => { eq: (c: "code", v: string) => Res };
};
const table = () => (supabase as unknown as { from: (t: "airlines") => AirlinesTable }).from("airlines");
const adminQueryKey = ["admin-airlines"];

/** Super admins manage the airlines and check-in links behind Tools → Flight check-in. */
export function AdminAirlines() {
  const qc = useQueryClient();
  const [query, setQuery] = useState("");
  const rows = useQuery({
    queryKey: adminQueryKey,
    queryFn: async () => {
      const { data, error } = await table().select("code,name,region,url,is_active,sort_order").order("sort_order");
      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });
  const refresh = () => {
    qc.invalidateQueries({ queryKey: adminQueryKey });
    qc.invalidateQueries({ queryKey: airlinesQuery.queryKey });
  };
  const list = rows.data ?? [];
  const shown = query ? searchAirlines(query, list) as Row[] : list;
  const active = list.filter((r) => r.is_active).length;

  return (
    <div className="space-y-4">
      <p className="max-w-2xl text-sm text-muted-foreground">
        These airlines appear in Tools → Flight check-in, and their codes add a check-in button to matching flight tickets. Use "Test" after editing a link to make sure it opens the airline's check-in page.
      </p>
      <AddAirline existing={list} nextOrder={(list.at(-1)?.sort_order ?? 0) + 1} onAdded={refresh} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search airlines" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <p className="text-sm text-muted-foreground">{active} shown in the tool, {list.length - active} hidden</p>
      </div>
      {rows.isLoading ? (
        <div className="h-40 animate-pulse rounded-2xl bg-muted" />
      ) : rows.isError ? (
        <p className="rounded-2xl border border-destructive/40 bg-destructive/5 p-4 text-sm">Airlines didn't load: {(rows.error as Error).message}. If this is a new install, the airlines database update may not be applied yet.</p>
      ) : (
        <ul className="divide-y overflow-hidden rounded-2xl border bg-card shadow-card">
          {shown.map((r) => <AirlineRow key={`${r.code}:${r.url}:${r.name}`} row={r} onChanged={refresh} />)}
          {shown.length === 0 && <li className="p-6 text-center text-sm text-muted-foreground">No airlines match "{query}".</li>}
        </ul>
      )}
    </div>
  );
}

function AirlineRow({ row, onChanged }: { row: Row; onChanged: () => void }) {
  const [f, setF] = useState<AirlineInput>({ code: row.code, name: row.name, region: row.region, url: row.url });
  const [busy, setBusy] = useState(false);
  const dirty = f.name !== row.name || f.region !== row.region || f.url !== row.url;

  const run = async (op: () => Res, ok: string) => {
    setBusy(true);
    const { error } = await op();
    setBusy(false);
    if (error) toast.error(error.message); else { toast.success(ok); onChanged(); }
  };
  const save = () => {
    const { value, error } = validateAirline(f);
    if (error) { toast.error(error); return; }
    run(() => table().update({ name: value.name, region: value.region, url: value.url, updated_at: new Date().toISOString() }).eq("code", row.code), `${value.name} saved`);
  };
  const setActive = (v: boolean) => run(() => table().update({ is_active: v, updated_at: new Date().toISOString() }).eq("code", row.code), v ? `${row.name} shown in the tool` : `${row.name} hidden from the tool`);
  const remove = () => {
    if (!window.confirm(`Delete ${row.name}? You can hide it instead to keep the link.`)) return;
    run(() => table().delete().eq("code", row.code), `${row.name} deleted`);
  };

  return (
    <li className="grid gap-3 p-4 lg:grid-cols-[3.5rem_1fr_1fr_2fr_auto] lg:items-end">
      <div><Label className="text-xs">Code</Label><p className="mt-1 flex h-10 items-center justify-center rounded-lg bg-muted font-board text-sm font-semibold">{row.code}</p></div>
      <div><Label className="text-xs" htmlFor={`n-${row.code}`}>Airline</Label><Input id={`n-${row.code}`} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
      <div><Label className="text-xs" htmlFor={`r-${row.code}`}>Country</Label><Input id={`r-${row.code}`} value={f.region} onChange={(e) => setF({ ...f, region: e.target.value })} /></div>
      <div><Label className="text-xs" htmlFor={`u-${row.code}`}>Check-in link</Label><Input id={`u-${row.code}`} type="url" value={f.url} onChange={(e) => setF({ ...f, url: e.target.value })} /></div>
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" variant="outline" asChild><a href={f.url} target="_blank" rel="noopener noreferrer">Test <ExternalLink /></a></Button>
        <Button size="sm" disabled={!dirty || busy} onClick={save}>Save</Button>
        <label className="flex items-center gap-2 text-sm"><Switch checked={row.is_active} disabled={busy} onCheckedChange={setActive} />Shown</label>
        <Button size="icon" variant="ghost" aria-label={`Delete ${row.name}`} disabled={busy} onClick={remove}><Trash2 /></Button>
      </div>
    </li>
  );
}

function AddAirline({ existing, nextOrder, onAdded }: { existing: Row[]; nextOrder: number; onAdded: () => void }) {
  const empty = { code: "", name: "", region: "", url: "" };
  const [f, setF] = useState<AirlineInput>(empty);
  const [busy, setBusy] = useState(false);
  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    const { value, error } = validateAirline(f);
    if (error) { toast.error(error); return; }
    if (existing.some((r) => r.code === value.code)) { toast.error(`${value.code} is already in the list. Edit it below instead.`); return; }
    setBusy(true);
    const res = await table().insert({ ...value, is_active: true, sort_order: nextOrder });
    setBusy(false);
    if (res.error) { toast.error(res.error.message); return; }
    toast.success(`${value.name} added`);
    setF(empty);
    onAdded();
  };
  return (
    <form onSubmit={add} className="grid gap-3 rounded-2xl border border-dashed bg-card p-4 lg:grid-cols-[5rem_1fr_1fr_2fr_auto] lg:items-end">
      <div><Label className="text-xs" htmlFor="new-code">Code</Label><Input id="new-code" maxLength={2} placeholder="EK" className="uppercase" value={f.code} onChange={(e) => setF({ ...f, code: e.target.value })} /></div>
      <div><Label className="text-xs" htmlFor="new-name">Airline</Label><Input id="new-name" placeholder="Emirates" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
      <div><Label className="text-xs" htmlFor="new-region">Country</Label><Input id="new-region" placeholder="UAE" value={f.region} onChange={(e) => setF({ ...f, region: e.target.value })} /></div>
      <div><Label className="text-xs" htmlFor="new-url">Check-in link</Label><Input id="new-url" type="url" placeholder="https://…" value={f.url} onChange={(e) => setF({ ...f, url: e.target.value })} /></div>
      <Button disabled={busy}><Plus /> Add airline</Button>
    </form>
  );
}
