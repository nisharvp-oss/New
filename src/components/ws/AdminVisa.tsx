import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ExternalLink, Plus, Search, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { AdminSponsorOffers } from "@/components/ws/AdminSponsorOffers";
import { CountryPicker } from "@/components/ws/CountryPicker";
import { countryName, flag } from "@/lib/countries";
import { validateVisaPage, type VisaPage } from "@/lib/visa";
import { visaPagesQuery } from "@/lib/visa.functions";

type Row = VisaPage & { is_active: boolean };
type Res = PromiseLike<{ data: unknown; error: { message: string } | null }>;
// visa_pages (migration 0015) is newer than the generated database types; this is the slice we use.
type VisaTable = {
  select: (c: string) => { order: (c: string) => PromiseLike<{ data: Row[] | null; error: { message: string } | null }> };
  insert: (row: VisaPage) => Res;
  update: (row: Partial<Row> & { updated_at: string }) => { eq: (c: "code", v: string) => Res };
  delete: () => { eq: (c: "code", v: string) => Res };
};
const table = () => (supabase as unknown as { from: (t: "visa_pages") => VisaTable }).from("visa_pages");
const adminQueryKey = ["admin-visa-pages"];

/** Admin → Visa: official visa pages per destination, and the sponsored visa agencies under them. */
export function AdminVisa() {
  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <h3 className="text-lg font-bold">Official visa pages</h3>
        <VisaPages />
      </section>
      <section className="space-y-4">
        <h3 className="text-lg font-bold">Visa agencies (sponsors)</h3>
        <AdminSponsorOffers kind="visa" intro="Visa agencies appear in Tools → Visa under the official link, for the destinations they cover." />
      </section>
    </div>
  );
}

function VisaPages() {
  const qc = useQueryClient();
  const [query, setQuery] = useState("");
  const rows = useQuery({
    queryKey: adminQueryKey,
    queryFn: async () => {
      const { data, error } = await table().select("code,url,note,is_active").order("code");
      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });
  const refresh = () => {
    qc.invalidateQueries({ queryKey: adminQueryKey });
    qc.invalidateQueries({ queryKey: visaPagesQuery.queryKey });
  };
  const list = [...(rows.data ?? [])].sort((a, b) => countryName(a.code).localeCompare(countryName(b.code)));
  const q = query.trim().toLowerCase();
  const shown = q ? list.filter((r) => r.code.toLowerCase() === q || countryName(r.code).toLowerCase().includes(q)) : list;

  return (
    <div className="space-y-4">
      <p className="max-w-2xl text-sm text-muted-foreground">
        Where "Apply for a visa" sends travelers for each destination. Use the government's own visa or immigration page. Schengen countries without a page here use the EU visa page; other countries fall back to a web search.
      </p>
      <AddPage existing={list} onAdded={refresh} />
      <div className="relative w-full max-w-xs">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input className="pl-9" placeholder="Search countries" value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>
      {rows.isLoading ? (
        <div className="h-40 animate-pulse rounded-2xl bg-muted" />
      ) : rows.isError ? (
        <p className="rounded-2xl border border-destructive/40 bg-destructive/5 p-4 text-sm">Visa pages didn't load: {(rows.error as Error).message}. If this is a new install, the visa database update may not be applied yet.</p>
      ) : (
        <ul className="divide-y overflow-hidden rounded-2xl border bg-card shadow-card">
          {shown.map((r) => <PageRow key={`${r.code}:${r.url}:${r.note}`} row={r} onChanged={refresh} />)}
          {shown.length === 0 && <li className="p-6 text-center text-sm text-muted-foreground">No countries match "{query}".</li>}
        </ul>
      )}
    </div>
  );
}

function PageRow({ row, onChanged }: { row: Row; onChanged: () => void }) {
  const [f, setF] = useState<VisaPage>({ code: row.code, url: row.url, note: row.note });
  const [busy, setBusy] = useState(false);
  const dirty = f.url !== row.url || f.note !== row.note;
  const run = async (op: () => Res, ok: string) => {
    setBusy(true);
    const { error } = await op();
    setBusy(false);
    if (error) toast.error(error.message); else { toast.success(ok); onChanged(); }
  };
  const name = countryName(row.code);
  const save = () => {
    const { value, error } = validateVisaPage(f);
    if (error) { toast.error(error); return; }
    run(() => table().update({ url: value.url, note: value.note, updated_at: new Date().toISOString() }).eq("code", row.code), `${name} saved`);
  };
  return (
    <li className="grid gap-3 p-4 lg:grid-cols-[12rem_2fr_1.3fr_auto] lg:items-end">
      <p className="flex items-center gap-2 font-semibold"><span className="text-2xl" aria-hidden>{flag(row.code)}</span>{name}</p>
      <div><Label className="text-xs" htmlFor={`vu-${row.code}`}>Official link</Label><Input id={`vu-${row.code}`} type="url" value={f.url} onChange={(e) => setF({ ...f, url: e.target.value })} /></div>
      <div><Label className="text-xs" htmlFor={`vn-${row.code}`}>Who runs it</Label><Input id={`vn-${row.code}`} value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} /></div>
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" variant="outline" asChild><a href={f.url} target="_blank" rel="noopener noreferrer">Test <ExternalLink /></a></Button>
        <Button size="sm" disabled={!dirty || busy} onClick={save}>Save</Button>
        <label className="flex items-center gap-2 text-sm"><Switch checked={row.is_active} disabled={busy} onCheckedChange={(v) => run(() => table().update({ is_active: v, updated_at: new Date().toISOString() }).eq("code", row.code), v ? `${name} shown` : `${name} hidden`)} />Shown</label>
        <Button size="icon" variant="ghost" aria-label={`Delete ${name}`} disabled={busy} onClick={() => window.confirm(`Delete the ${name} visa page?`) && run(() => table().delete().eq("code", row.code), `${name} deleted`)}><Trash2 /></Button>
      </div>
    </li>
  );
}

function AddPage({ existing, onAdded }: { existing: Row[]; onAdded: () => void }) {
  const empty = { code: "", url: "", note: "" };
  const [f, setF] = useState<VisaPage>(empty);
  const [busy, setBusy] = useState(false);
  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    const { value, error } = validateVisaPage(f);
    if (error) { toast.error(error); return; }
    if (existing.some((r) => r.code === value.code)) { toast.error(`${countryName(value.code)} is already listed. Edit it below instead.`); return; }
    setBusy(true);
    const res = await table().insert(value);
    setBusy(false);
    if (res.error) { toast.error(res.error.message); return; }
    toast.success(`${countryName(value.code)} added`);
    setF(empty);
    onAdded();
  };
  return (
    <form onSubmit={add} className="grid gap-3 rounded-2xl border border-dashed bg-card p-4 lg:grid-cols-[14rem_2fr_1.3fr_auto] lg:items-end">
      <div><Label className="text-xs">Country</Label><CountryPicker selected={f.code ? [f.code] : []} onToggle={(code) => setF({ ...f, code })} className="mt-1 h-10 rounded-lg text-sm" /></div>
      <div><Label className="text-xs" htmlFor="new-visa-url">Official link</Label><Input id="new-visa-url" type="url" placeholder="https://…" value={f.url} onChange={(e) => setF({ ...f, url: e.target.value })} /></div>
      <div><Label className="text-xs" htmlFor="new-visa-note">Who runs it</Label><Input id="new-visa-note" placeholder="Ministry of Foreign Affairs" value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} /></div>
      <Button disabled={busy}><Plus /> Add country</Button>
    </form>
  );
}
