import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ExternalLink, ImageUp, Plus, Smartphone, Trash2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { CountryPicker } from "@/components/ws/CountryPicker";
import { countryName, flag } from "@/lib/countries";
import { OFFER_KINDS, validateOffer, type OfferInput, type OfferKind } from "@/lib/sponsor-offers";
import { flyerUrl, sponsorOffersQuery } from "@/lib/sponsor-offers.functions";
import { prepareImage } from "@/lib/image-upload";
import { SITE_MEDIA_BUCKET } from "@/lib/site-images";

type Row = OfferInput & { id: string; flyer_path: string | null; is_active: boolean; sort_order: number; clicks: number };
type Res = PromiseLike<{ data: unknown; error: { message: string } | null }>;
// esim_offers (0014) and visa_agencies (0015) are newer than the generated database types; this is the slice we use.
type OffersTable = {
  select: (c: string) => { order: (c: string) => PromiseLike<{ data: Row[] | null; error: { message: string } | null }> };
  insert: (row: OfferInput & { flyer_path: string | null; sort_order: number }) => Res;
  update: (row: Partial<Row> & { updated_at: string }) => { eq: (c: "id", v: string) => Res };
  delete: () => { eq: (c: "id", v: string) => Res };
};
const tableFor = (kind: OfferKind) => (supabase as unknown as { from: (t: string) => OffersTable }).from(OFFER_KINDS[kind].table);
const bucket = () => supabase.storage.from(SITE_MEDIA_BUCKET);

async function uploadFlyer(kind: OfferKind, file: File) {
  if (!file.type.startsWith("image/")) throw new Error("Choose an image file");
  const path = `${OFFER_KINDS[kind].folder}/${Date.now()}.jpg`;
  const up = await bucket().upload(path, await prepareImage(file, 1600), { contentType: "image/jpeg", cacheControl: "31536000", upsert: false });
  if (up.error) throw new Error(up.error.message);
  return path;
}

/** Super admins manage sponsored offers (eSIM providers, visa agencies) shown in Tools per destination country. */
export function AdminSponsorOffers({ kind, intro }: { kind: OfferKind; intro: string }) {
  const qc = useQueryClient();
  const adminQueryKey = ["admin-offers", kind];
  const table = () => tableFor(kind);
  const rows = useQuery({
    queryKey: adminQueryKey,
    queryFn: async () => {
      const { data, error } = await table().select("id,provider,headline,url,flyer_path,countries,is_active,sort_order,clicks").order("sort_order");
      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });
  const refresh = () => {
    qc.invalidateQueries({ queryKey: adminQueryKey });
    qc.invalidateQueries({ queryKey: sponsorOffersQuery(kind).queryKey });
  };
  const list = rows.data ?? [];

  return (
    <div className="space-y-4">
      <p className="max-w-2xl text-sm text-muted-foreground">
        {intro} Leave countries empty for a worldwide sponsor; country sponsors show first. Each flyer opens the sponsor's link, and clicks are counted here. Flyers show at 4:3 (landscape), e.g. 1200 × 900 px.
      </p>
      <OfferForm kind={kind} key={list.length} nextOrder={(list.at(-1)?.sort_order ?? 0) + 1} onSaved={refresh} />
      {rows.isLoading ? (
        <div className="h-40 animate-pulse rounded-2xl bg-muted" />
      ) : rows.isError ? (
        <p className="rounded-2xl border border-destructive/40 bg-destructive/5 p-4 text-sm">Sponsors didn't load: {(rows.error as Error).message}. If this is a new install, the database update for this list may not be applied yet.</p>
      ) : list.length === 0 ? (
        <p className="rounded-2xl border bg-card p-6 text-center text-sm text-muted-foreground">No sponsors yet. Add your first one above.</p>
      ) : (
        <ul className="grid gap-3 lg:grid-cols-2">{list.map((r) => <li key={`${r.id}:${r.flyer_path}`}><OfferForm kind={kind} row={r} onSaved={refresh} /></li>)}</ul>
      )}
    </div>
  );
}

/** Adds an offer, or edits one when `row` is given. */
function OfferForm({ kind, row, nextOrder = 0, onSaved }: { kind: OfferKind; row?: Row; nextOrder?: number; onSaved: () => void }) {
  const table = () => tableFor(kind);
  const [f, setF] = useState<OfferInput>({ provider: row?.provider ?? "", headline: row?.headline ?? "", url: row?.url ?? "", countries: row?.countries ?? [] });
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const local = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  useEffect(() => () => { if (local) URL.revokeObjectURL(local); }, [local]);
  const preview = local ?? flyerUrl(row?.flyer_path ?? null);
  const dirty = !row || file !== null || f.provider !== row.provider || f.headline !== row.headline || f.url !== row.url || f.countries.join() !== row.countries.join();
  const toggle = (c: string) => setF({ ...f, countries: f.countries.includes(c) ? f.countries.filter((x) => x !== c) : [...f.countries, c].sort() });

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const { value, error } = validateOffer(f);
    if (error) { toast.error(error); return; }
    setBusy(true);
    let path: string | null = null;
    try {
      if (file) path = await uploadFlyer(kind, file);
      const res = row
        ? await table().update({ ...value, ...(path ? { flyer_path: path } : {}), updated_at: new Date().toISOString() }).eq("id", row.id)
        : await table().insert({ ...value, flyer_path: path, sort_order: nextOrder });
      if (res.error) throw new Error(res.error.message);
      if (path && row?.flyer_path) await bucket().remove([row.flyer_path]);
      toast.success(row ? `${value.provider} saved` : `${value.provider} added`);
      setFile(null);
      onSaved();
    } catch (err) {
      if (path) await bucket().remove([path]);
      toast.error("Offer wasn't saved", { description: (err as Error).message });
    } finally {
      setBusy(false);
    }
  };

  const run = async (op: () => Res, ok: string, after?: () => Promise<unknown>) => {
    setBusy(true);
    const { error } = await op();
    if (!error) await after?.();
    setBusy(false);
    if (error) toast.error(error.message); else { toast.success(ok); onSaved(); }
  };
  const remove = () => {
    if (!row || !window.confirm(`Delete the ${row.provider} offer? You can hide it instead.`)) return;
    run(() => table().delete().eq("id", row.id), `${row.provider} deleted`, async () => row.flyer_path && bucket().remove([row.flyer_path]));
  };

  return (
    <form onSubmit={save} className={row ? "grid h-full gap-4 rounded-2xl border bg-card p-4 shadow-card sm:grid-cols-[11rem_1fr]" : "grid gap-4 rounded-2xl border border-dashed bg-card p-4 sm:grid-cols-[11rem_1fr]"}>
      <div className="space-y-2">
        <button type="button" onClick={() => input.current?.click()} className="relative grid aspect-[4/3] w-full place-items-center overflow-hidden rounded-xl bg-muted text-muted-foreground hover:bg-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label="Choose flyer image">
          {preview ? <img src={preview} alt="" className="absolute inset-0 h-full w-full object-cover" /> : <span className="flex flex-col items-center gap-1 text-xs"><ImageUp className="h-6 w-6" />Flyer</span>}
        </button>
        <input ref={input} type="file" accept="image/*" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        {row && <p className="text-center text-xs text-muted-foreground">{row.clicks} click{row.clicks === 1 ? "" : "s"}</p>}
      </div>
      <div className="min-w-0 space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <div><Label className="text-xs" htmlFor={`p-${kind}-${row?.id ?? "new"}`}>Provider</Label><Input id={`p-${kind}-${row?.id ?? "new"}`} placeholder={kind === "visa" ? "Atlas Visa Services" : "Airalo"} value={f.provider} onChange={(e) => setF({ ...f, provider: e.target.value })} /></div>
          <div><Label className="text-xs" htmlFor={`h-${kind}-${row?.id ?? "new"}`}>Offer line</Label><Input id={`h-${kind}-${row?.id ?? "new"}`} placeholder={kind === "visa" ? "Fast UAE & Schengen visas" : "10% off with WANDER10"} value={f.headline} onChange={(e) => setF({ ...f, headline: e.target.value })} /></div>
        </div>
        <div><Label className="text-xs" htmlFor={`u-${kind}-${row?.id ?? "new"}`}>Sponsor link</Label><Input id={`u-${kind}-${row?.id ?? "new"}`} type="url" placeholder="https://… (your affiliate or sponsor link)" value={f.url} onChange={(e) => setF({ ...f, url: e.target.value })} /></div>
        <div>
          <Label className="text-xs">Countries</Label>
          <CountryPicker multiple selected={f.countries} onToggle={toggle} placeholder="Worldwide (all countries)" className="mt-1 h-11 rounded-xl text-sm" />
          {f.countries.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {f.countries.map((c) => (
                <button key={c} type="button" onClick={() => toggle(c)} className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-medium hover:bg-muted/70" aria-label={`Remove ${countryName(c)}`}>
                  {flag(c)} {countryName(c)} <X className="h-3 w-3" />
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {row ? (
            <>
              <Button size="sm" disabled={!dirty || busy}>Save</Button>
              <Button size="sm" variant="outline" type="button" asChild><a href={f.url} target="_blank" rel="noopener noreferrer">Test <ExternalLink /></a></Button>
              <label className="flex items-center gap-2 text-sm"><Switch checked={row.is_active} disabled={busy} onCheckedChange={(v) => run(() => table().update({ is_active: v, updated_at: new Date().toISOString() }).eq("id", row.id), v ? `${row.provider} shown` : `${row.provider} hidden`)} />Shown</label>
              <Button size="icon" variant="ghost" type="button" className="ml-auto" aria-label={`Delete ${row.provider}`} disabled={busy} onClick={remove}><Trash2 /></Button>
            </>
          ) : (
            <Button disabled={busy}>{busy ? <Smartphone className="animate-pulse" /> : <Plus />} Add {OFFER_KINDS[kind].noun}</Button>
          )}
        </div>
      </div>
    </form>
  );
}
